import { db } from '../db/db.js';
import { query, tableExists } from '../db/db_utils.js';

// Ri-esporta le funzioni per comodità
export { db, query, tableExists };

// Funzioni helper specifiche per il CMS
export async function createResourceTable(tableName, fields) {
  console.log(`Creazione tabella: ${tableName}`);
  
  const tableExistss = await tableExists(db, tableName);
  if (tableExistss) {
    console.log(`Tabella ${tableName} già esistente`);
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

  // Crea indici per campi unici
  const uniqueFields = fields.filter(f => f.unique);
  for (const field of uniqueFields) {
    const indexSQL = `CREATE UNIQUE INDEX IF NOT EXISTS idx_${tableName}_${field.name} 
                     ON ${tableName}(${field.name});`;
    await query(db, indexSQL);
  }

  // Esegui creazione tabella
  await query(db, createTableSQL);
  
  // Crea trigger per aggiornare updated_at
  const triggerSQL = `
    CREATE TRIGGER IF NOT EXISTS update_${tableName}_timestamp 
    AFTER UPDATE ON ${tableName}
    BEGIN
      UPDATE ${tableName} SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `;
  
  try {
    await query(db, triggerSQL);
  } catch (error) {
    console.log(`Trigger già esistente o non supportato: ${error.message}`);
  }

  console.log(`Tabella ${tableName} creata con successo`);
}

export async function alterResourceTable(tableName, oldFields, newFields) {
  console.log(`Aggiornamento tabella: ${tableName}`);

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
      await query(db, alterSQL);
      console.log(`Campo ${field.name} aggiunto a ${tableName}`);
    } catch (error) {
      console.error(`Errore aggiunta campo ${field.name}:`, error.message);
    }
  }

  // Gestisci rimozione campi (SQLite non supporta DROP COLUMN direttamente)
  // Dovremmo ricreare la tabella, ma per ora saltiamo
}