import app from './src/app.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║     CMS Headless Backend - Server Avviato  ║
╠════════════════════════════════════════════╣
║  🚀 Porta: ${PORT}                          ║
║  📦 Database: SQLite                        ║
║  🔧 Ambiente: ${process.env.NODE_ENV || 'development'}            ║
║                                            ║
║  📍 Endpoints:                              ║
║     - Admin API: http://localhost:${PORT}/api/admin/resources ║
║     - Content API: http://localhost:${PORT}/api/:resource      ║
║     - Health: http://localhost:${PORT}/api/health              ║
╚════════════════════════════════════════════╝
  `);
});