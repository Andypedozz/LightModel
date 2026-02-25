import { query as queryUtils } from '../db/db_utils.js';
import { db } from '../config/database.js';

/**
 * Middleware per validare i dati in ingresso contro la definizione della risorsa
 */
export async function validateResource(req, res, next) {
  try {
    // Se non c'è definizione della risorsa, continua
    if (!req.resourceDefinition) {
      return next();
    }

    const { resourceDefinition } = req;
    const method = req.method;
    const data = method === 'GET' ? req.query : req.body;

    // Per GET, validiamo solo i parametri di query
    if (method === 'GET') {
      return validateQueryParams(req, res, next);
    }

    // Validazione per POST/PUT
    const errors = [];

    // 1. Verifica campi obbligatori
    for (const field of resourceDefinition.fields) {
      if (field.required && (data[field.name] === undefined || data[field.name] === null || data[field.name] === '')) {
        errors.push({
          field: field.name,
          message: `Il campo ${field.label || field.name} è obbligatorio`
        });
      }
    }

    // 2. Validazione tipo e formato per ogni campo presente
    for (const field of resourceDefinition.fields) {
      const value = data[field.name];
      
      // Salta se non presente e non required
      if (value === undefined || value === null) {
        continue;
      }

      // Validazione per tipo
      const typeError = validateFieldType(field, value);
      if (typeError) {
        errors.push({
          field: field.name,
          message: typeError
        });
        continue;
      }

      // Validazioni specifiche per tipo
      switch (field.type) {
        case 'string':
        case 'text':
        case 'richtext':
          if (field.minLength && value.length < field.minLength) {
            errors.push({
              field: field.name,
              message: `${field.label || field.name} deve essere almeno ${field.minLength} caratteri`
            });
          }
          if (field.maxLength && value.length > field.maxLength) {
            errors.push({
              field: field.name,
              message: `${field.label || field.name} non può superare ${field.maxLength} caratteri`
            });
          }
          break;

        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errors.push({
              field: field.name,
              message: `${field.label || field.name} deve essere un indirizzo email valido`
            });
          }
          break;

        case 'url':
          try {
            new URL(value);
          } catch {
            errors.push({
              field: field.name,
              message: `${field.label || field.name} deve essere un URL valido`
            });
          }
          break;

        case 'integer':
          if (!Number.isInteger(Number(value))) {
            errors.push({
              field: field.name,
              message: `${field.label || field.name} deve essere un numero intero`
            });
          }
          break;

        case 'decimal':
          if (isNaN(parseFloat(value)) || !isFinite(value)) {
            errors.push({
              field: field.name,
              message: `${field.label || field.name} deve essere un numero valido`
            });
          }
          break;

        case 'date':
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            errors.push({
              field: field.name,
              message: `${field.label || field.name} deve essere una data valida`
            });
          }
          break;

        case 'boolean':
          if (typeof value !== 'boolean' && value !== 0 && value !== 1 && value !== '0' && value !== '1') {
            errors.push({
              field: field.name,
              message: `${field.label || field.name} deve essere un booleano`
            });
          }
          break;

        case 'relation':
          // Verifica che l'ID della relazione esista
          if (value && !isNaN(parseInt(value))) {
            try {
              const relatedTable = field.target;
              const exists = await queryUtils(db, `
                SELECT id FROM ${relatedTable} WHERE id = ?
              `, [value]);
              
              if (exists.length === 0) {
                errors.push({
                  field: field.name,
                  message: `${field.label || field.name} fa riferimento a un elemento inesistente`
                });
              }
            } catch (error) {
              console.error(`Errore verifica relazione ${field.name}:`, error);
            }
          }
          break;
      }
    }

    // 3. Verifica campi extra non definiti
    const definedFieldNames = resourceDefinition.fields.map(f => f.name);
    const extraFields = Object.keys(data).filter(key => 
      !definedFieldNames.includes(key) && 
      !['id', 'created_at', 'updated_at'].includes(key)
    );

    if (extraFields.length > 0) {
      errors.push({
        field: extraFields[0],
        message: `Campo non definito nella risorsa: ${extraFields.join(', ')}`
      });
    }

    // 4. Verifica unicità per campi unique
    if (method === 'POST' || method === 'PUT') {
      const uniqueFields = resourceDefinition.fields.filter(f => f.unique);
      
      for (const field of uniqueFields) {
        const value = data[field.name];
        if (value !== undefined && value !== null) {
          let sql = `SELECT id FROM ${req.tableName} WHERE ${field.name} = ?`;
          const params = [value];
          
          // In caso di PUT, escludi l'elemento corrente
          if (method === 'PUT' && req.params.id) {
            sql += ` AND id != ?`;
            params.push(req.params.id);
          }
          
          const existing = await queryUtils(db, sql, params);
          
          if (existing.length > 0) {
            errors.push({
              field: field.name,
              message: `Il valore ${value} per ${field.label || field.name} esiste già`
            });
          }
        }
      }
    }

    // Se ci sono errori, rispondi con 400
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Errore di validazione',
        details: errors
      });
    }

    // Tutto ok, continua
    next();

  } catch (error) {
    console.error('Errore in validateResource:', error);
    next(error);
  }
}

/**
 * Valida i parametri di query per le richieste GET
 */
function validateQueryParams(req, res, next) {
  const { resourceDefinition } = req;
  const { sort, page, limit, ...filters } = req.query;
  const errors = [];

  // Validazione pagina e limit
  if (page && (isNaN(parseInt(page)) || parseInt(page) < 1)) {
    errors.push({
      field: 'page',
      message: 'page deve essere un numero positivo'
    });
  }

  if (limit && (isNaN(parseInt(limit)) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
    errors.push({
      field: 'limit',
      message: 'limit deve essere un numero tra 1 e 100'
    });
  }

  // Validazione sort
  if (sort) {
    const [field, order] = sort.split(':');
    const validField = resourceDefinition.fields.find(f => f.name === field) || field === 'id' || field === 'created_at' || field === 'updated_at';
    
    if (!validField) {
      errors.push({
        field: 'sort',
        message: `Campo di ordinamento non valido: ${field}`
      });
    }
    
    if (order && !['asc', 'desc'].includes(order)) {
      errors.push({
        field: 'sort',
        message: `Ordine deve essere 'asc' o 'desc'`
      });
    }
  }

  // Validazione filtri
  Object.keys(filters).forEach(key => {
    const field = resourceDefinition.fields.find(f => f.name === key);
    if (!field) {
      errors.push({
        field: key,
        message: `Campo di filtro non valido: ${key}`
      });
    }
  });

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Errore di validazione parametri',
      details: errors
    });
  }

  next();
}

/**
 * Valida il tipo di un campo
 */
function validateFieldType(field, value) {
  if (value === null || value === '') return null;

  switch (field.type) {
    case 'integer':
      if (isNaN(parseInt(value)) || !Number.isInteger(Number(value))) {
        return `${field.label || field.name} deve essere un numero intero`;
      }
      break;

    case 'decimal':
      if (isNaN(parseFloat(value))) {
        return `${field.label || field.name} deve essere un numero`;
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean' && value !== 0 && value !== 1 && value !== '0' && value !== '1') {
        return `${field.label || field.name} deve essere un booleano (true/false)`;
      }
      break;

    case 'date':
    case 'datetime':
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return `${field.label || field.name} deve essere una data valida`;
      }
      break;

    case 'email':
      if (typeof value !== 'string') {
        return `${field.label || field.name} deve essere una stringa`;
      }
      break;

    case 'url':
      if (typeof value !== 'string') {
        return `${field.label || field.name} deve essere una stringa`;
      }
      break;

    case 'relation':
      if (value && isNaN(parseInt(value))) {
        return `${field.label || field.name} deve essere un ID valido`;
      }
      break;

    default:
      if (typeof value !== 'string' && field.type !== 'text' && field.type !== 'richtext') {
        return `${field.label || field.name} deve essere una stringa`;
      }
  }

  return null;
}

/**
 * Middleware per validare l'esistenza di una risorsa
 */
export async function validateResourceExists(req, res, next) {
  try {
    const { resource } = req.params;
    
    const definitions = await queryUtils(db, `
      SELECT * FROM resource_definitions WHERE plural_name = ? OR name = ?
    `, [resource, resource]);
    
    if (definitions.length === 0) {
      return res.status(404).json({ 
        error: 'Risorsa non trovata',
        details: `La risorsa '${resource}' non esiste`
      });
    }
    
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware per validare l'esistenza di un elemento specifico
 */
export async function validateItemExists(req, res, next) {
  try {
    const { tableName } = req;
    const { id } = req.params;
    
    const item = await queryUtils(db, `
      SELECT id FROM ${tableName} WHERE id = ?
    `, [id]);
    
    if (item.length === 0) {
      return res.status(404).json({ 
        error: 'Elemento non trovato',
        details: `Elemento con ID ${id} non esiste`
      });
    }
    
    next();
  } catch (error) {
    next(error);
  }
}

export default {
  validateResource,
  validateResourceExists,
  validateItemExists
};