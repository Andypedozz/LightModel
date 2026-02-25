export function errorHandler(err, req, res, next) {
  console.error('❌ Errore:', err);
  
  // Errore di validazione
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Errore di validazione',
      details: err.errors
    });
  }
  
  // Errore di unique constraint in SQLite
  if (err.message && err.message.includes('UNIQUE constraint failed')) {
    return res.status(409).json({
      error: 'Violazione vincolo di unicità',
      details: err.message
    });
  }
  
  // Errore generico
  res.status(500).json({
    error: 'Errore interno del server',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
}