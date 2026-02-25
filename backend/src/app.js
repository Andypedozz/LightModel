import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Configurazione
dotenv.config();

// Routes
import resourceDefinitionsRoutes from './routes/resourceDefinitions.js';
import dynamicContentRoutes from './routes/dynamicContent.js';

// Middleware
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Middleware globali
app.use(cors({
  origin: 'http://localhost:5173', // URL del frontend Vite
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging delle richieste (dev)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });
}

// Routes
app.use('/api/admin/resources', resourceDefinitionsRoutes);
app.use('/api', dynamicContentRoutes);

// Route di test
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: 'SQLite'
  });
});

// Gestione errori
app.use(errorHandler);

// Gestione 404
app.use((req, res) => {
  res.status(404).json({ error: 'Risorsa non trovata' });
});

export default app;