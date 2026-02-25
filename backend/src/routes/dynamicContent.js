import express from 'express';
import * as controller from '../controllers/dynamicContent.js';
import { validateResource, validateResourceExists, validateItemExists } from '../middleware/validateResource.js';
import { resourceParamValidator, idParamValidator, validate } from '../utils/validators.js';

const router = express.Router();

// Rotte dinamiche per qualsiasi risorsa
router.get('/:resource', 
  resourceParamValidator, 
  validate,
  validateResourceExists,        // Verifica che la risorsa esista
  controller.loadResourceDefinition,
  validateResource,              // Valida parametri query
  controller.getAll
);

router.get('/:resource/:id', 
  resourceParamValidator, 
  idParamValidator, 
  validate,
  validateResourceExists,
  controller.loadResourceDefinition,
  validateItemExists,            // Verifica che l'elemento esista
  controller.getOne
);

router.post('/:resource', 
  resourceParamValidator, 
  validate,
  validateResourceExists,
  controller.loadResourceDefinition,
  validateResource,              // Valida i dati in ingresso
  controller.create
);

router.put('/:resource/:id', 
  resourceParamValidator, 
  idParamValidator, 
  validate,
  validateResourceExists,
  controller.loadResourceDefinition,
  validateItemExists,
  validateResource,              // Valida i dati in ingresso
  controller.update
);

router.delete('/:resource/:id', 
  resourceParamValidator, 
  idParamValidator, 
  validate,
  validateResourceExists,
  controller.loadResourceDefinition,
  validateItemExists,
  controller.remove
);

export default router;