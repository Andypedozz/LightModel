// Tipi di campo supportati
export const FIELD_TYPES = [
  { value: 'string', label: 'Testo (breve)', icon: '📝' },
  { value: 'text', label: 'Testo (lungo)', icon: '📄' },
  { value: 'richtext', label: 'Rich Text', icon: '🔤' },
  { value: 'integer', label: 'Numero intero', icon: '🔢' },
  { value: 'decimal', label: 'Numero decimale', icon: '🔢' },
  { value: 'boolean', label: 'Booleano', icon: '✓' },
  { value: 'date', label: 'Data', icon: '📅' },
  { value: 'datetime', label: 'Data e ora', icon: '📅' },
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'url', label: 'URL', icon: '🔗' },
  { value: 'uid', label: 'UID (slug)', icon: '🔤' },
  { value: 'relation', label: 'Relazione', icon: '🔗' },
];

// Stati di pubblicazione
export const PUBLICATION_STATES = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
};

// Ruoli utente
export const USER_ROLES = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  AUTHOR: 'author',
  VIEWER: 'viewer',
};

// Opzioni di ordinamento
export const SORT_OPTIONS = [
  { value: 'created_at:desc', label: 'Più recenti' },
  { value: 'created_at:asc', label: 'Meno recenti' },
  { value: 'updated_at:desc', label: 'Ultimo aggiornamento' },
  { value: 'name:asc', label: 'Nome (A-Z)' },
  { value: 'name:desc', label: 'Nome (Z-A)' },
];

// Messaggi di errore comuni
export const ERROR_MESSAGES = {
  REQUIRED: 'Questo campo è obbligatorio',
  INVALID_EMAIL: 'Inserisci un indirizzo email valido',
  INVALID_URL: 'Inserisci un URL valido',
  MIN_LENGTH: (min) => `Deve essere almeno ${min} caratteri`,
  MAX_LENGTH: (max) => `Non può superare ${max} caratteri`,
  UNIQUE: 'Questo valore deve essere unico',
};

// Configurazione di default per nuove risorse
export const DEFAULT_RESOURCE_CONFIG = {
  name: '',
  pluralName: '',
  displayName: '',
  description: '',
  fields: [],
  options: {
    draftAndPublish: true,
    versioning: false,
  },
};

// HTTP Status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
};

// Route paths
export const ROUTES = {
  HOME: '/',
  RESOURCES: '/resources',
  RESOURCE_NEW: '/resources/new',
  RESOURCE_EDIT: (name) => `/resources/${name}/edit`,
  CONTENT: (resourceName) => `/content/${resourceName}`,
  CONTENT_NEW: (resourceName) => `/content/${resourceName}/new`,
  CONTENT_EDIT: (resourceName, id) => `/content/${resourceName}/${id}`,
  SETTINGS: '/settings',
};

// Nomi tabella database per definizioni
export const TABLE_NAMES = {
  RESOURCE_DEFINITIONS: 'resource_definitions',
  USERS: 'users',
  SESSIONS: 'sessions',
};