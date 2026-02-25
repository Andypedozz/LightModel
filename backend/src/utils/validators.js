import { body, param, validationResult } from 'express-validator';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const resourceDefinitionValidators = [
  body('name')
    .matches(/^[a-z][a-z0-9_]*$/)
    .withMessage('Il nome deve iniziare con una lettera e contenere solo lettere minuscole, numeri e underscore')
    .isLength({ min: 2, max: 50 }),
  
  body('pluralName')
    .matches(/^[a-z][a-z0-9_]*$/)
    .withMessage('Il nome plurale deve iniziare con una lettera e contenere solo lettere minuscole, numeri e underscore'),
  
  body('displayName')
    .isString()
    .notEmpty()
    .withMessage('Il nome visualizzato è obbligatorio'),
  
  body('fields')
    .isArray()
    .withMessage('fields deve essere un array')
    .custom((fields) => {
      // Verifica che i nomi dei campi siano unici
      const names = fields.map(f => f.name);
      const uniqueNames = new Set(names);
      if (names.length !== uniqueNames.size) {
        throw new Error('I nomi dei campi devono essere unici');
      }
      
      // Verifica che ci sia almeno un campo
      if (fields.length === 0) {
        throw new Error('Devi definire almeno un campo');
      }
      
      return true;
    }),
];

export const resourceParamValidator = [
  param('resource')
    .matches(/^[a-z][a-z0-9_]*$/)
    .withMessage('Nome risorsa non valido'),
];

export const idParamValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID deve essere un numero intero positivo'),
];