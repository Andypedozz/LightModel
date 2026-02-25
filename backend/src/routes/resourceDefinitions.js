import express from 'express';
import * as controller from '../controllers/resourceDefinitions.js';
import { resourceDefinitionValidators, validate } from '../utils/validators.js';

const router = express.Router();

// Rotta pubblica per test
router.get('/test', (req, res) => {
  res.json({ message: 'API risorse funzionante' });
});

// CRUD per definizioni risorse
router.get('/', controller.getAllDefinitions);
router.get('/:name', controller.getDefinition);
router.post('/', resourceDefinitionValidators, validate, controller.createDefinition);
router.put('/:name', resourceDefinitionValidators, validate, controller.updateDefinition);
router.delete('/:name', controller.deleteDefinition);

export default router;