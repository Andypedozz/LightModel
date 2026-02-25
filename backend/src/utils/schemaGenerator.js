import slugify from 'slugify';

export function generateSlug(text, options = {}) {
  return slugify(text, {
    lower: true,
    strict: true,
    trim: true,
    ...options
  });
}

export function validateFieldValue(field, value) {
  const errors = [];

  // Required check
  if (field.required && (value === undefined || value === null || value === '')) {
    errors.push(`${field.name} è obbligatorio`);
    return errors;
  }

  // Se il valore è undefined/null e non required, è valido
  if (value === undefined || value === null || value === '') {
    return errors;
  }

  // Type-specific validation
  switch (field.type) {
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errors.push(`${field.name} deve essere un indirizzo email valido`);
      }
      break;

    case 'url':
      try {
        new URL(value);
      } catch {
        errors.push(`${field.name} deve essere un URL valido`);
      }
      break;

    case 'integer':
      if (!Number.isInteger(Number(value))) {
        errors.push(`${field.name} deve essere un numero intero`);
      }
      break;

    case 'decimal':
      if (isNaN(parseFloat(value)) || !isFinite(value)) {
        errors.push(`${field.name} deve essere un numero valido`);
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean' && value !== 0 && value !== 1) {
        errors.push(`${field.name} deve essere un booleano`);
      }
      break;

    case 'date':
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        errors.push(`${field.name} deve essere una data valida`);
      }
      break;

    case 'string':
    case 'text':
    case 'richtext':
      if (field.minLength && value.length < field.minLength) {
        errors.push(`${field.name} deve essere almeno ${field.minLength} caratteri`);
      }
      if (field.maxLength && value.length > field.maxLength) {
        errors.push(`${field.name} non può superare ${field.maxLength} caratteri`);
      }
      break;
  }

  // Unique check sarà fatto a livello di database

  return errors;
}

export function processFieldValue(field, value) {
  if (value === undefined || value === null || value === '') {
    return field.default !== undefined ? field.default : null;
  }

  switch (field.type) {
    case 'integer':
      return parseInt(value, 10);
    case 'decimal':
      return parseFloat(value);
    case 'boolean':
      return value ? 1 : 0;
    case 'date':
    case 'datetime':
      return new Date(value).toISOString();
    case 'uid':
      // Se è UID e non c'è valore, genera dal targetField
      if (!value && field.targetField) {
        return generateSlug(String(value || ''));
      }
      return generateSlug(String(value));
    default:
      return value;
  }
}