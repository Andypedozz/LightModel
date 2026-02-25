import { db, tableExists, createResourceTable, alterResourceTable } from '../config/database.js';
import { query as queryUtils } from '../db/db_utils.js';

// Tabella per memorizzare le definizioni delle risorse
const DEFINITIONS_TABLE = 'resource_definitions';

// Assicurati che la tabella delle definizioni esista
async function ensureDefinitionsTable() {
  if (!await tableExists(db, DEFINITIONS_TABLE)) {
    await queryUtils(db, `
      CREATE TABLE ${DEFINITIONS_TABLE} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        plural_name TEXT NOT NULL,
        display_name TEXT NOT NULL,
        description TEXT,
        fields TEXT NOT NULL,
        options TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Tabella resource_definitions creata');
  }
}

// Inizializza
await ensureDefinitionsTable();

// GET /api/admin/resources
export async function getAllDefinitions(req, res, next) {
  try {
    const results = await queryUtils(db, `
      SELECT * FROM ${DEFINITIONS_TABLE} 
      ORDER BY created_at DESC
    `);
    
    // Parsing JSON fields
    const definitions = results.map(row => ({
      ...row,
      fields: JSON.parse(row.fields),
      options: row.options ? JSON.parse(row.options) : null
    }));
    
    res.json(definitions);
  } catch (error) {
    next(error);
  }
}

// GET /api/admin/resources/:name
export async function getDefinition(req, res, next) {
  try {
    const { name } = req.params;
    
    const results = await queryUtils(db, `
      SELECT * FROM ${DEFINITIONS_TABLE} 
      WHERE name = ?
    `, [name]);
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Risorsa non trovata' });
    }
    
    const definition = {
      ...results[0],
      fields: JSON.parse(results[0].fields),
      options: results[0].options ? JSON.parse(results[0].options) : null
    };
    
    res.json(definition);
  } catch (error) {
    next(error);
  }
}

// POST /api/admin/resources
export async function createDefinition(req, res, next) {
  try {
    const { name, pluralName, displayName, description, fields, options } = req.body;
    
    // Verifica se esiste già
    const existing = await queryUtils(db, `
      SELECT id FROM ${DEFINITIONS_TABLE} WHERE name = ? OR plural_name = ?
    `, [name, pluralName]);
    
    if (existing.length > 0) {
      return res.status(409).json({ 
        error: 'Esiste già una risorsa con questo nome o nome plurale' 
      });
    }
    
    // Crea la tabella fisica
    await createResourceTable(pluralName, fields);
    
    // Salva la definizione
    const result = await queryUtils(db, `
      INSERT INTO ${DEFINITIONS_TABLE} 
      (name, plural_name, display_name, description, fields, options)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      name,
      pluralName,
      displayName,
      description || null,
      JSON.stringify(fields),
      options ? JSON.stringify(options) : null
    ]);
    
    const newDefinition = await queryUtils(db, `
      SELECT * FROM ${DEFINITIONS_TABLE} WHERE id = ?
    `, [result.lastInsertRowid]);
    
    res.status(201).json({
      ...newDefinition[0],
      fields: JSON.parse(newDefinition[0].fields),
      options: newDefinition[0].options ? JSON.parse(newDefinition[0].options) : null
    });
  } catch (error) {
    next(error);
  }
}

// PUT /api/admin/resources/:name
export async function updateDefinition(req, res, next) {
  try {
    const { name } = req.params;
    const { pluralName, displayName, description, fields, options } = req.body;
    
    // Recupera definizione esistente
    const existing = await queryUtils(db, `
      SELECT * FROM ${DEFINITIONS_TABLE} WHERE name = ?
    `, [name]);
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Risorsa non trovata' });
    }
    
    const oldDefinition = {
      ...existing[0],
      fields: JSON.parse(existing[0].fields)
    };
    
    // Aggiorna struttura tabella se necessario
    if (pluralName !== oldDefinition.plural_name) {
      return res.status(400).json({ 
        error: 'Non è possibile modificare il nome plurale di una risorsa esistente' 
      });
    }
    
    // Confronta campi per modifiche strutturali
    const oldFields = oldDefinition.fields;
    const newFields = fields;
    
    await alterResourceTable(pluralName, oldFields, newFields);
    
    // Aggiorna definizione
    await queryUtils(db, `
      UPDATE ${DEFINITIONS_TABLE}
      SET display_name = ?, description = ?, fields = ?, options = ?, updated_at = CURRENT_TIMESTAMP
      WHERE name = ?
    `, [
      displayName,
      description || null,
      JSON.stringify(fields),
      options ? JSON.stringify(options) : null,
      name
    ]);
    
    const updated = await queryUtils(db, `
      SELECT * FROM ${DEFINITIONS_TABLE} WHERE name = ?
    `, [name]);
    
    res.json({
      ...updated[0],
      fields: JSON.parse(updated[0].fields),
      options: updated[0].options ? JSON.parse(updated[0].options) : null
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/admin/resources/:name
export async function deleteDefinition(req, res, next) {
  try {
    const { name } = req.params;
    
    // Recupera definizione
    const existing = await queryUtils(db, `
      SELECT * FROM ${DEFINITIONS_TABLE} WHERE name = ?
    `, [name]);
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Risorsa non trovata' });
    }
    
    const definition = existing[0];
    
    // Drop della tabella fisica (opzionale, potresti voler mantenere i dati)
    // await queryUtils(db, `DROP TABLE IF EXISTS ${definition.plural_name}`);
    
    // Elimina definizione
    await queryUtils(db, `
      DELETE FROM ${DEFINITIONS_TABLE} WHERE name = ?
    `, [name]);
    
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}