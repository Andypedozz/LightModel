# Architettura Generale del Sistema

## 1. Progettazione del Database per i Metadati
Il cuore del sistema è una tabella che memorizza la definizione delle risorse.
Invece di creare codice fisso per ogni modello, si salva la struttura in JSON.

TABELLA resource_definitions
```sql
CREATE TABLE resource_definitions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,          -- Nome singolare: "article"
  plural_name VARCHAR(255) NOT NULL,   -- Nome plurale: "articles"
  display_name VARCHAR(255) NOT NULL,  -- Nome in dashboard: "Articolo"
  fields JSON NOT NULL,                 -- Array di campi
  options JSON,                         -- Opzioni extra
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Struttura del campo fields (JSON)
Ogni volta che definiamo una risorsa dalla GUI, generiamo un JSON come questo:
```json
[
    {
        "name": "title",
        "label": "Titolo",
        "type": "string",
        "required": true,
        "unique": false,
        "default": null,
        "minLength": 3,
        "maxLenght": 100
    },
    {
        "name": "body",
        "label": "Contenuto",
        "type": "richtext",
        "required": false
    },
    {
        "name": "author",
        "label": "Autore",
        "type": "relation",
        "relationType": "manyToOne",
        "target": "users"
    },
    {
        "name": "published",
        "label": "Pubblicato",
        "type": "boolean",
        "default": false
    },
    {
        "name": "slug",
        "label": "Slug",
        "type": "uid",
        "targetField": "title"
    }
]
```
## 2. Backend Express: Il Cuore del Gestore
### 2.1 API per la definizione delle risorse (Model Builder)
Questi endpoint vengono chiamati dalla GUI del "Model Builder" per creare nuove risorse.

```js
router.post("/api/admin/resources", async (req, res) => {
    const { name, pluralName, displayName, fields } = req.body;

    // 1. Salva la definizione nel DB (tabella resource_definitions)
    const definition = await ResourceDefinition.create({
        name, plural_name: pluralName, display_name: displayName, fields
    })

    // 2. AZIONE FISICA: crea la tabella nel database
    await createDatabaseTable(pluralName, fields);

    // 3. (Opzionale) genera file di configurazione
    await generateAPIConfiguration(name, fields);

    res.json(definition);
})
```

### 2.2 Il Generatore di Tabelle
La funzione createDatabaseTable deve tradurre i tipi astratti in tipi SQL

```js
async function createDatabaseTable(tableName, fields) {
  const knex = require('knex')(dbConfig);
  
  const tableExists = await knex.schema.hasTable(tableName);
  if (!tableExists) {
    await knex.schema.createTable(tableName, (table) => {
      // ID standard per tutte le risorse
      table.increments('id').primary();
      
      // Per ogni campo definito dall'utente
      fields.forEach(field => {
        switch(field.type) {
          case 'string':
            table.string(field.name, field.maxLength || 255);
            break;
          case 'text':
          case 'richtext':
            table.text(field.name);
            break;
          case 'integer':
            table.integer(field.name);
            break;
          case 'boolean':
            table.boolean(field.name).defaultTo(field.default || false);
            break;
          case 'relation':
            // Crea chiave esterna: author_id -> users.id
            table.integer(`${field.name}_id`)
                 .unsigned()
                 .references('id')
                 .inTable(field.target);
            break;
          case 'uid':
            table.string(field.name).unique();
            break;
        }
        
        // Applica vincoli
        if (field.required) {
          // Con Knex si imposta dopo, o con .notNullable()
        }
        if (field.unique) {
          table.unique(field.name);
        }
      });
      
      // Timestamps standard per tutte le risorse
      table.timestamps(true, true);
    });
  }
}
```

### 2.3 API CRUD Universali (Endpoint dinamici)
Questo è il vero motore del CMS: un unico set di route che servono tutte le risorse definite dinamicamente.

```js
// routes/api/dynamic.js

// Middleware per caricare la definizione della risorsa
router.use('/api/:resource', async (req, res, next) => {
  const { resource } = req.params;  // "articles"
  
  // Cerca la definizione nel DB usando plural_name
  const definition = await ResourceDefinition.findOne({
    where: { plural_name: resource }
  });
  
  if (!definition) {
    return res.status(404).json({ error: 'Resource not found' });
  }
  
  // Attacca la definizione alla request per usarla dopo
  req.resourceDefinition = definition;
  req.tableName = resource; // Nome tabella = plural_name
  next();
});

// GET /api/articles
router.get('/api/:resource', async (req, res) => {
  const { tableName, resourceDefinition } = req;
  const fields = resourceDefinition.fields;
  
  // Costruisci query selettiva sui campi richiesti
  const query = knex(tableName).select('*');
  
  // Applica filtri dai query params
  Object.keys(req.query).forEach(param => {
    if (param !== 'page' && param !== 'limit') {
      query.where(param, req.query[param]);
    }
  });
  
  const results = await query;
  res.json(results);
});

// POST /api/articles
router.post('/api/:resource', async (req, res) => {
  const { tableName, resourceDefinition } = req;
  const fields = resourceDefinition.fields;
  const data = req.body;
  
  // VALIDAZIONE DINAMICA basata sulla definizione
  const errors = [];
  fields.forEach(field => {
    if (field.required && !data[field.name]) {
      errors.push(`${field.name} is required`);
    }
    if (field.type === 'string' && field.minLength && 
        data[field.name]?.length < field.minLength) {
      errors.push(`${field.name} must be at least ${field.minLength} chars`);
    }
  });
  
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }
  
  // Auto-genera UID se necessario
  const uidFields = fields.filter(f => f.type === 'uid');
  uidFields.forEach(uidField => {
    if (uidField.targetField && data[uidField.targetField]) {
      data[uidField.name] = generateSlug(data[uidField.targetField]);
    }
  });
  
  // Inserisci nel database
  const [id] = await knex(tableName).insert({
    ...data,
    created_at: new Date(),
    updated_at: new Date()
  });
  
  const newEntry = await knex(tableName).where('id', id).first();
  res.status(201).json(newEntry);
});

// PUT /api/articles/:id
router.put('/api/:resource/:id', async (req, res) => {
  const { tableName, resourceDefinition } = req;
  const { id } = req.params;
  
  await knex(tableName)
    .where('id', id)
    .update({
      ...req.body,
      updated_at: new Date()
    });
  
  const updated = await knex(tableName).where('id', id).first();
  res.json(updated);
});

// DELETE /api/articles/:id
router.delete('/api/:resource/:id', async (req, res) => {
  const { tableName } = req;
  await knex(tableName).where('id', req.params.id).del();
  res.status(204).send();
});
```

## 3. Frontend React: Dashboard Auto-generata
### 3.1 Model Builder (GUI per definire le risorse)
```jsx
// ModelBuilder.jsx
function ModelBuilder() {
  const [resourceName, setResourceName] = useState('');
  const [fields, setFields] = useState([]);
  
  const addField = () => {
    setFields([...fields, { 
      name: '', 
      type: 'string', 
      required: false,
      // Altri attributi
    }]);
  };
  
  const saveResource = async () => {
    await axios.post('/api/admin/resources', {
      name: resourceName.toLowerCase(),
      pluralName: `${resourceName.toLowerCase()}s`,
      displayName: resourceName,
      fields
    });
    alert('Risorsa creata!');
  };
  
  return (
    <div>
      <h1>Crea nuova risorsa</h1>
      <input 
        placeholder="Nome (es. Articolo)" 
        value={resourceName}
        onChange={e => setResourceName(e.target.value)}
      />
      
      <h2>Campi</h2>
      {fields.map((field, index) => (
        <FieldEditor 
          key={index}
          field={field}
          onChange={(updated) => {
            const newFields = [...fields];
            newFields[index] = updated;
            setFields(newFields);
          }}
        />
      ))}
      
      <button onClick={addField}>Aggiungi campo</button>
      <button onClick={saveResource}>Salva risorsa</button>
    </div>
  );
}
```

### 3.2 Content Manager (CRUD Generico)
```jsx
// ResourceList.jsx - Componente riutilizzabile per qualsiasi risorsa
function ResourceList({ resourceName }) {
  const [items, setItems] = useState([]);
  const [resourceDef, setResourceDef] = useState(null);
  
  useEffect(() => {
    // Carica la definizione e i dati
    const load = async () => {
      // Le definizioni sono accessibili?
      const def = await axios.get(`/api/admin/resources/${resourceName}`);
      setResourceDef(def.data);
      
      const data = await axios.get(`/api/${resourceName}s`);
      setItems(data.data);
    };
    load();
  }, [resourceName]);
  
  if (!resourceDef) return <div>Loading...</div>;
  
  // Estrai i nomi dei campi da mostrare in tabella
  const columns = resourceDef.fields
    .filter(f => f.type !== 'richtext') // Non mostrare testi lunghi in lista
    .map(f => f.name);
  
  return (
    <div>
      <h1>{resourceDef.displayName}</h1>
      <Link to={`/admin/${resourceName}/new`}>Nuovo</Link>
      
      <table>
        <thead>
          <tr>
            {columns.map(col => <th key={col}>{col}</th>)}
            <th>Azioni</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              {columns.map(col => (
                <td key={col}>{item[col]}</td>
              ))}
              <td>
                <Link to={`/admin/${resourceName}/${item.id}`}>Modifica</Link>
                <button>Elimina</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```
```jsx
// ResourceForm.jsx - Form auto-generato
function ResourceForm({ resourceName, id }) {
  const [formData, setFormData] = useState({});
  const [resourceDef, setResourceDef] = useState(null);
  
  useEffect(() => {
    const load = async () => {
      const def = await axios.get(`/api/admin/resources/${resourceName}`);
      setResourceDef(def.data);
      
      if (id) {
        const data = await axios.get(`/api/${resourceName}s/${id}`);
        setFormData(data.data);
      }
    };
    load();
  }, [resourceName, id]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (id) {
      await axios.put(`/api/${resourceName}s/${id}`, formData);
    } else {
      await axios.post(`/api/${resourceName}s`, formData);
    }
    // Redirect alla lista
  };
  
  if (!resourceDef) return <div>Loading...</div>;
  
  // Per ogni campo nella definizione, renderizza l'input appropriato
  return (
    <form onSubmit={handleSubmit}>
      {resourceDef.fields.map(field => (
        <div key={field.name}>
          <label>{field.label || field.name}</label>
          
          {field.type === 'string' && (
            <input
              type="text"
              value={formData[field.name] || ''}
              onChange={e => setFormData({
                ...formData,
                [field.name]: e.target.value
              })}
              required={field.required}
            />
          )}
          
          {field.type === 'richtext' && (
            <RichTextEditor
              value={formData[field.name] || ''}
              onChange={value => setFormData({
                ...formData,
                [field.name]: value
              })}
            />
          )}
          
          {field.type === 'boolean' && (
            <input
              type="checkbox"
              checked={formData[field.name] || false}
              onChange={e => setFormData({
                ...formData,
                [field.name]: e.target.checked
              })}
            />
          )}
          
          {field.type === 'relation' && (
            <select
              value={formData[`${field.name}_id`] || ''}
              onChange={e => setFormData({
                ...formData,
                [`${field.name}_id`]: e.target.value
              })}
            >
              <option value="">Seleziona...</option>
              {/* Carica dinamicamente le opzioni dal target */}
              <RelationOptions target={field.target} />
            </select>
          )}
        </div>
      ))}
      
      <button type="submit">Salva</button>
    </form>
  );
}
```
## 4. Considerazioni Avanzate
### Gestione delle Relazioni
Le relazioni sono la parte più complessa. Dobbiamo:
1. Nella definizione: permettere di creare campi di tipo "relation" specificando il target
2. Nel DB: creare colonne target_id con foreign key
3. Nel form: mostrare select/dropdown popolate con dati della risorsa collegata
4. Nelle API: popolare le relazioni con ?populate=author

### versionamento e Migrazioni
Quando modifichi una definizione (es. aggiungi un campo), dobbiamo:
1. Aggiungere colonna alla tabella esistente (ALTER TABLE)
2. Gestire valori di default per record esistenti
```js
async function updateTableSchema(tableName, oldFields, newFields) {
  // Trova campi aggiunti
  const addedFields = newFields.filter(
    nf => !oldFields.some(of => of.name === nf.name)
  );
  
  for (const field of addedFields) {
    await knex.schema.alterTable(tableName, table => {
      // Aggiungi colonna
      if (field.type === 'string') {
        table.string(field.name);
      }
      // ecc...
    });
  }
}
```

### Bozze e Pubblicazione
Se vogliamo il sistema "draft/publish" come Strapi, aggiungiamo:
* Colonna published_at in ogni tabella
* Filtro ?published=true nelle API
* Interfaccia con toggle "Pubblica/Bozza"

## 5. Stack Tecnologico
────────────────────────────────────────────────────────────────────────────────────────
Livello             Tecnologia                          Perché
────────────────────────────────────────────────────────────────────────────────────────
Backend             Express + Knex (o Sequelize)        Knex permette di creare tabelle
                                                        dinamicamente via codice
────────────────────────────────────────────────────────────────────────────────────────
Database            PostgreSQL (o MySQL)
────────────────────────────────────────────────────────────────────────────────────────
Frontend            React + React Router
────────────────────────────────────────────────────────────────────────────────────────
State               React Context o Redux
────────────────────────────────────────────────────────────────────────────────────────
UI Library          Material-UI o Ant Design
────────────────────────────────────────────────────────────────────────────────────────

