// backend/routes/media.js
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurazione multer per l'upload dei file
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    let uploadPath = path.join(__dirname, '../uploads/media');
    
    // Crea directory se non esiste
    try {
      await fs.mkdir(uploadPath, { recursive: true });
    } catch (err) {
      console.error('Errore nella creazione della directory:', err);
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Genera nome file univoco
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

// Filtro per accettare solo determinati tipi di file
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/webm',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo di file non supportato'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limite massimo
  }
});

export function registerMediaManagementRoutes(app, db) {
  
  // GET all media
  app.get("/api/media", async (req, res) => {
    try {
      const media = await db('Media')
        .select(
          'Media.*',
          'User.name as uploadedByName',
          'User.email as uploadedByEmail'
        )
        .leftJoin('User', 'Media.uploadedById', 'User.id')
        .orderBy('Media.createdAt', 'desc');
      
      // Aggiungi URL completo per ogni media
      const mediaWithUrls = media.map(item => ({
        ...item,
        url: `/uploads/media/${item.filename}`,
        thumbnailUrl: item.mimeType.startsWith('image/') 
          ? `/uploads/media/${item.filename}` 
          : null
      }));
      
      res.json({
        success: true,
        data: mediaWithUrls,
        total: mediaWithUrls.length
      });
    } catch (error) {
      console.error('Errore nel recupero dei media:', error);
      res.status(500).json({
        success: false,
        error: 'Errore nel recupero dei media'
      });
    }
  });

  // POST new media (upload)
  app.post("/api/media", upload.single('file'), async (req, res) => {
    let uploadedFile = null;
    
    try {
      // Verifica che il file sia stato caricato
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Nessun file caricato'
        });
      }
      
      uploadedFile = req.file;
      
      // Ottieni i dati dal form
      const { name, altText, description } = req.body;
      
      // Ottieni l'ID dell'utente autenticato (dal middleware di autenticazione)
      const userId = req.user?.id || null;
      
      // Calcola la dimensione in byte
      const fileSize = uploadedFile.size;
      
      // Determina il percorso relativo
      const relativePath = `/uploads/media/${uploadedFile.filename}`;
      
      // Inserisci nel database
      const [mediaId] = await db('Media').insert({
        filename: uploadedFile.filename,
        originalName: name || uploadedFile.originalname,
        mimeType: uploadedFile.mimetype,
        size: fileSize,
        path: relativePath,
        altText: altText || null,
        description: description || null,
        uploadedById: userId,
        createdAt: new Date()
      });
      
      // Recupera il media appena creato
      const newMedia = await db('Media')
        .where({ id: mediaId })
        .first();
      
      // Log dell'attività (opzionale)
      await logActivity(db, {
        userId: userId,
        action: 'MEDIA_UPLOAD',
        entityType: 'Media',
        entityId: mediaId,
        details: { filename: uploadedFile.filename, size: fileSize }
      });
      
      res.status(201).json({
        success: true,
        data: {
          ...newMedia,
          url: relativePath,
          thumbnailUrl: newMedia.mimeType.startsWith('image/') ? relativePath : null
        },
        message: 'Media caricato con successo'
      });
      
    } catch (error) {
      console.error('Errore nell\'upload del media:', error);
      
      // Se c'è stato un errore e il file è stato caricato, cancellalo
      if (uploadedFile && uploadedFile.path) {
        try {
          await fs.unlink(uploadedFile.path);
        } catch (unlinkError) {
          console.error('Errore nella cancellazione del file:', unlinkError);
        }
      }
      
      res.status(500).json({
        success: false,
        error: 'Errore durante l\'upload del media: ' + error.message
      });
    }
  });

  // GET single media
  app.get("/api/media/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const media = await db('Media')
        .select(
          'Media.*',
          'User.name as uploadedByName',
          'User.email as uploadedByEmail'
        )
        .leftJoin('User', 'Media.uploadedById', 'User.id')
        .where('Media.id', id)
        .first();
      
      if (!media) {
        return res.status(404).json({
          success: false,
          error: 'Media non trovato'
        });
      }
      
      res.json({
        success: true,
        data: {
          ...media,
          url: `/uploads/media/${media.filename}`,
          thumbnailUrl: media.mimeType.startsWith('image/') 
            ? `/uploads/media/${media.filename}` 
            : null
        }
      });
    } catch (error) {
      console.error('Errore nel recupero del media:', error);
      res.status(500).json({
        success: false,
        error: 'Errore nel recupero del media'
      });
    }
  });

  // UPDATE media metadata
  app.put("/api/media/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { name, altText, description } = req.body;
      
      // Verifica che il media esista
      const existingMedia = await db('Media')
        .where({ id })
        .first();
      
      if (!existingMedia) {
        return res.status(404).json({
          success: false,
          error: 'Media non trovato'
        });
      }
      
      // Aggiorna i metadati
      await db('Media')
        .where({ id })
        .update({
          originalName: name || existingMedia.originalName,
          altText: altText || existingMedia.altText,
          description: description || existingMedia.description,
          updatedAt: new Date()
        });
      
      // Recupera il media aggiornato
      const updatedMedia = await db('Media')
        .where({ id })
        .first();
      
      res.json({
        success: true,
        data: {
          ...updatedMedia,
          url: `/uploads/media/${updatedMedia.filename}`,
          thumbnailUrl: updatedMedia.mimeType.startsWith('image/') 
            ? `/uploads/media/${updatedMedia.filename}` 
            : null
        },
        message: 'Media aggiornato con successo'
      });
      
    } catch (error) {
      console.error('Errore nell\'aggiornamento del media:', error);
      res.status(500).json({
        success: false,
        error: 'Errore nell\'aggiornamento del media'
      });
    }
  });

  // DELETE a media
  app.delete("/api/media/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verifica che il media esista
      const media = await db('Media')
        .where({ id })
        .first();
      
      if (!media) {
        return res.status(404).json({
          success: false,
          error: 'Media non trovato'
        });
      }
      
      // Cancella il file dal filesystem
      const filePath = path.join(__dirname, '../uploads/media', media.filename);
      try {
        await fs.unlink(filePath);
      } catch (unlinkError) {
        console.error('Errore nella cancellazione del file:', unlinkError);
        // Continua comunque con l'eliminazione dal database
      }
      
      // Cancella dal database
      await db('Media')
        .where({ id })
        .delete();
      
      // Log dell'attività
      await logActivity(db, {
        userId: req.user?.id || null,
        action: 'MEDIA_DELETE',
        entityType: 'Media',
        entityId: id,
        details: { filename: media.filename }
      });
      
      res.json({
        success: true,
        message: 'Media eliminato con successo'
      });
      
    } catch (error) {
      console.error('Errore nell\'eliminazione del media:', error);
      res.status(500).json({
        success: false,
        error: 'Errore nell\'eliminazione del media'
      });
    }
  });

  // GET media statistics
  app.get("/api/media/stats/summary", async (req, res) => {
    try {
      const stats = await db('Media')
        .select(
          db.raw('COUNT(*) as total'),
          db.raw('SUM(size) as totalSize'),
          db.raw('COUNT(CASE WHEN mimeType LIKE "image/%" THEN 1 END) as images'),
          db.raw('COUNT(CASE WHEN mimeType LIKE "video/%" THEN 1 END) as videos'),
          db.raw('COUNT(CASE WHEN mimeType LIKE "application/pdf" THEN 1 END) as documents')
        )
        .first();
      
      const recentUploads = await db('Media')
        .select('id', 'filename', 'mimeType', 'size', 'createdAt')
        .orderBy('createdAt', 'desc')
        .limit(10);
      
      res.json({
        success: true,
        data: {
          ...stats,
          totalSizeFormatted: formatBytes(stats.totalSize || 0),
          recentUploads
        }
      });
    } catch (error) {
      console.error('Errore nel recupero delle statistiche:', error);
      res.status(500).json({
        success: false,
        error: 'Errore nel recupero delle statistiche'
      });
    }
  });

  // POST bulk delete media
  app.post("/api/media/bulk-delete", async (req, res) => {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nessun ID specificato'
      });
    }
    
    try {
      // Recupera i media da eliminare
      const mediaToDelete = await db('Media')
        .whereIn('id', ids)
        .select('id', 'filename');
      
      // Cancella i file dal filesystem
      const deletePromises = mediaToDelete.map(async (media) => {
        const filePath = path.join(__dirname, '../uploads/media', media.filename);
        try {
          await fs.unlink(filePath);
        } catch (err) {
          console.error(`Errore nella cancellazione del file ${media.filename}:`, err);
        }
      });
      
      await Promise.all(deletePromises);
      
      // Cancella dal database
      const deletedCount = await db('Media')
        .whereIn('id', ids)
        .delete();
      
      res.json({
        success: true,
        message: `${deletedCount} media eliminati con successo`,
        data: {
          deleted: deletedCount,
          total: ids.length
        }
      });
      
    } catch (error) {
      console.error('Errore nell\'eliminazione bulk:', error);
      res.status(500).json({
        success: false,
        error: 'Errore nell\'eliminazione dei media'
      });
    }
  });
}

// Funzione di utilità per log delle attività
async function logActivity(db, { userId, action, entityType, entityId, details }) {
  try {
    await db('ActivityLog').insert({
      userId,
      action,
      entityType,
      entityId,
      details: JSON.stringify(details),
      createdAt: new Date()
    });
  } catch (error) {
    console.error('Errore nel logging attività:', error);
  }
}

// Funzione di utilità per formattare i bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}