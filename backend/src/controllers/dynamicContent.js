import { db, query, tableExists } from '../config/database.js';
import { query as queryUtils } from '../db/db_utils.js';
import { validateFieldValue, processFieldValue } from '../utils/schemaGenerator.js';

// Middleware per caricare la definizione della risorsa
export async function loadResourceDefinition(req, res, next) {
  try {
    const { resource } = req.params;
    
    // Cerca definizione nel database
    const definitions = await queryUtils(db, `
      SELECT * FROM resource_definitions WHERE plural_name = ?
    `, [resource]);
    
    if (definitions.length === 0) {
      return res.status(404).json({ error: 'Risorsa non trovata' });
    }
    
    const definition = {
      ...definitions[0],
      fields: JSON.parse(definitions[0].fields)
    };
    
    req.resourceDefinition = definition;
    req.tableName = resource;
    
    next();
  } catch (error) {
    next(error);
  }
}

// GET /api/:resource
export async function getAll(req, res, next) {
  try {
    const { tableName, resourceDefinition } = req;
    const { page = 1, limit = 10, sort, ...filters } = req.query;
    
    // Costruisci query base
    let sql = `SELECT * FROM ${tableName}`;
    const values = [];
    
    // Applica filtri
    const whereConditions = [];
    Object.keys(filters).forEach(key => {
      // Verifica che il campo esista nella definizione
      const field = resourceDefinition.fields.find(f => f.name === key);
      if (field) {
        whereConditions.push(`${key} = ?`);
        values.push(filters[key]);
      }
    });
    
    if (whereConditions.length > 0) {
      sql += ' WHERE ' + whereConditions.join(' AND ');
    }
    
    // Applica ordinamento
    if (sort) {
      const [field, order] = sort.split(':');
      sql += ` ORDER BY ${field} ${order === 'asc' ? 'ASC' : 'DESC'}`;
    } else {
      sql += ' ORDER BY created_at DESC';
    }
    
    // Paginazione
    const offset = (parseInt(page) - 1) * parseInt(limit);
    sql += ' LIMIT ? OFFSET ?';
    values.push(parseInt(limit), offset);
    
    // Esegui query
    const results = await queryUtils(db, sql, values);
    
    // Conteggio totale
    const countResult = await queryUtils(db, `
      SELECT COUNT(*) as total FROM ${tableName}
    `);
    
    res.json({
      data: results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/:resource/:id
export async function getOne(req, res, next) {
  try {
    const { tableName, resourceDefinition } = req;
    const { id } = req.params;
    
    const results = await queryUtils(db, `
      SELECT * FROM ${tableName} WHERE id = ?
    `, [id]);
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Contenuto non trovato' });
    }
    
    res.json(results[0]);
  } catch (error) {
    next(error);
  }
}

// POST /api/:resource
export async function create(req, res, next) {
  try {
    const { tableName, resourceDefinition } = req;
    const data = req.body;
    
    // Valida campi
    const errors = [];
    const processedData = {};
    
    for (const field of resourceDefinition.fields) {
      const value = data[field.name];
      
      // Valida
      const fieldErrors = validateFieldValue(field, value);
      errors.push(...fieldErrors);
      
      // Processa valore
      processedData[field.name] = processFieldValue(field, value);
    }
    
    // Gestisci UID fields che dipendono da altri campi
    const uidFields = resourceDefinition.fields.filter(f => f.type === 'uid' && f.targetField);
    for (const uidField of uidFields) {
      if (!processedData[uidField.name] && data[uidField.targetField]) {
        const { generateSlug } = await import('../utils/schemaGenerator.js');
        processedData[uidField.name] = generateSlug(String(data[uidField.targetField]));
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }
    
    // Costruisci INSERT
    const columns = Object.keys(processedData);
    const placeholders = columns.map(() => '?').join(', ');
    const values = columns.map(col => processedData[col]);
    
    const sql = `
      INSERT INTO ${tableName} 
      (${columns.join(', ')})
      VALUES (${placeholders})
    `;
    
    const result = await queryUtils(db, sql, values);
    
    // Recupera l'elemento creato
    const newItem = await queryUtils(db, `
      SELECT * FROM ${tableName} WHERE id = ?
    `, [result.lastInsertRowid]);
    
    res.status(201).json(newItem[0]);
  } catch (error) {
    next(error);
  }
}

// PUT /api/:resource/:id
export async function update(req, res, next) {
  try {
    const { tableName, resourceDefinition } = req;
    const { id } = req.params;
    const data = req.body;
    
    // Verifica esistenza
    const existing = await queryUtils(db, `
      SELECT * FROM ${tableName} WHERE id = ?
    `, [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Contenuto non trovato' });
    }
    
    // Valida campi
    const errors = [];
    const processedData = {};
    
    for (const field of resourceDefinition.fields) {
      // Usa il valore inviato o mantieni quello esistente
      const value = data.hasOwnProperty(field.name) ? data[field.name] : existing[0][field.name];
      
      const fieldErrors = validateFieldValue(field, value);
      errors.push(...fieldErrors);
      
      processedData[field.name] = processFieldValue(field, value);
    }
    
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }
    
    // Costruisci UPDATE
    const setClause = Object.keys(processedData)
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = [...Object.values(processedData), id];
    
    const sql = `
      UPDATE ${tableName}
      SET ${setClause}
      WHERE id = ?
    `;
    
    await queryUtils(db, sql, values);
    
    // Recupera elemento aggiornato
    const updated = await queryUtils(db, `
      SELECT * FROM ${tableName} WHERE id = ?
    `, [id]);
    
    res.json(updated[0]);
  } catch (error) {
    next(error);
  }
}

// DELETE /api/:resource/:id
export async function remove(req, res, next) {
  try {
    const { tableName } = req;
    const { id } = req.params;
    
    const result = await queryUtils(db, `
      DELETE FROM ${tableName} WHERE id = ?
    `, [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Contenuto non trovato' });
    }
    
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}