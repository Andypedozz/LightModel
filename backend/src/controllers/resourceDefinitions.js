import { db, query, tableExists as checkTableExists } from '../config/database.js';
import { query as queryUtils } from "../db/db_utils.js"

// Tabella per memorizzare le definizioni delle risorse
const DEFINITIONS_TABLE = 'resource_definitions';

// Assicurati che la tabella delle definizioni esista
async function ensureDefinitionsTable() {
  if (!await checkTableExists(db, DEFINITIONS_TABLE)) {
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
    console.log('✅ Tabella resource_definitions creata');
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
    
    console.log('📝 Creazione nuova risorsa:', { name, pluralName, displayName });
    
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
    console.error('❌ Errore creazione risorsa:', error);
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
    try {
      await queryUtils(db, `DROP TABLE IF EXISTS ${definition.plural_name}`);
      console.log(`🗑️ Tabella ${definition.plural_name} eliminata`);
    } catch (error) {
      console.warn(`⚠️ Impossibile eliminare tabella ${definition.plural_name}:`, error.message);
    }
    
    // Elimina definizione
    await queryUtils(db, `
      DELETE FROM ${DEFINITIONS_TABLE} WHERE name = ?
    `, [name]);
    
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

// Funzione helper per creare tabella risorsa
async function createResourceTable(tableName, fields) {
  console.log(`🏗️ Creazione tabella: ${tableName}`);
  
  const tableExists = await checkTableExists(db, tableName);
  if (tableExists) {
    console.log(`📌 Tabella ${tableName} già esistente`);
    return;
  }

  let createTableSQL = `CREATE TABLE IF NOT EXISTS ${tableName} (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  `;

  // Aggiungi campi definiti dall'utente
  fields.forEach(field => {
    const columnName = field.name;
    let columnDef = '';

    switch (field.type) {
      case 'string':
      case 'uid':
      case 'email':
      case 'url':
        columnDef = `TEXT`;
        break;
      case 'text':
      case 'richtext':
        columnDef = `TEXT`;
        break;
      case 'integer':
        columnDef = `INTEGER`;
        break;
      case 'decimal':
        columnDef = `REAL`;
        break;
      case 'boolean':
        columnDef = `INTEGER DEFAULT 0`;
        break;
      case 'date':
        columnDef = `TEXT`;
        break;
      case 'datetime':
        columnDef = `TEXT`;
        break;
      case 'relation':
        columnDef = `INTEGER`;
        break;
      default:
        columnDef = `TEXT`;
    }

    // Aggiungi vincoli
    if (field.required) {
      columnDef += ` NOT NULL`;
    }
    
    if (field.default !== undefined && field.default !== null) {
      const defaultValue = typeof field.default === 'string' 
        ? `'${field.default}'` 
        : field.default;
      columnDef += ` DEFAULT ${defaultValue}`;
    }

    createTableSQL += `,\n  ${columnName} ${columnDef}`;
  });

  createTableSQL += `\n);`;

  console.log('📝 SQL:', createTableSQL);

  // Esegui creazione tabella
  await queryUtils(db, createTableSQL);
  
  // Crea indici per campi unici
  const uniqueFields = fields.filter(f => f.unique);
  for (const field of uniqueFields) {
    try {
      const indexSQL = `CREATE UNIQUE INDEX IF NOT EXISTS idx_${tableName}_${field.name} 
                       ON ${tableName}(${field.name});`;
      await queryUtils(db, indexSQL);
      console.log(`🔍 Indice unico creato per ${field.name}`);
    } catch (error) {
      console.warn(`⚠️ Impossibile creare indice per ${field.name}:`, error.message);
    }
  }
  
  // Crea trigger per aggiornare updated_at
  try {
    const triggerSQL = `
      CREATE TRIGGER IF NOT EXISTS update_${tableName}_timestamp 
      AFTER UPDATE ON ${tableName}
      BEGIN
        UPDATE ${tableName} SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;
    `;
    await queryUtils(db, triggerSQL);
  } catch (error) {
    console.log(`ℹ️ Trigger già esistente o non supportato: ${error.message}`);
  }

  console.log(`✅ Tabella ${tableName} creata con successo`);
}

async function alterResourceTable(tableName, oldFields, newFields) {
  console.log(`🔄 Aggiornamento tabella: ${tableName}`);

  // Trova campi aggiunti
  const addedFields = newFields.filter(
    nf => !oldFields.some(of => of.name === nf.name)
  );

  for (const field of addedFields) {
    let columnDef = '';
    switch (field.type) {
      case 'string':
      case 'uid':
      case 'email':
      case 'url':
        columnDef = `TEXT`;
        break;
      case 'text':
      case 'richtext':
        columnDef = `TEXT`;
        break;
      case 'integer':
        columnDef = `INTEGER`;
        break;
      case 'boolean':
        columnDef = `INTEGER DEFAULT 0`;
        break;
      case 'date':
      case 'datetime':
        columnDef = `TEXT`;
        break;
      default:
        columnDef = `TEXT`;
    }

    const alterSQL = `ALTER TABLE ${tableName} ADD COLUMN ${field.name} ${columnDef};`;
    try {
      await queryUtils(db, alterSQL);
      console.log(`✅ Campo ${field.name} aggiunto a ${tableName}`);
    } catch (error) {
      console.error(`❌ Errore aggiunta campo ${field.name}:`, error.message);
    }
  }
}