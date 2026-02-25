import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// Percorso del database (nella root del progetto)
const DB_PATH = path.join(process.cwd(), 'db.sqlite');

// Inizializza il database
function initDatabase() {
    console.log('Inizializzazione database SQLite...');
    
    try {
        // Crea/apri il database
        const db = new Database(DB_PATH);
        
        // Configurazioni consigliate
        db.pragma('journal_mode = WAL');
        db.pragma('foreign_keys = ON');
        db.pragma('encoding = "UTF-8"');
        
        console.log(`Database creato/aperto: ${DB_PATH}`);
        
        // Crea le tabelle se non esistono
        createTables(db);
        
        return db;
    } catch (error) {
        console.error('Errore durante l\'inizializzazione del database:', error);
        throw error;
    }
}

// Crea le tabelle necessarie
function createTables(db) {
    // Tabella Progetti
    db.exec(`
        CREATE TABLE IF NOT EXISTS Progetto (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            descrizione TEXT,
            anno INTEGER,
            copertina TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    // Aggiungi altre tabelle qui se necessario
    // db.exec(`CREATE TABLE IF NOT EXISTS ...`);
    
    console.log('Tabelle verificate/creato con successo');
}

// Esporta l'istanza del database
const db = initDatabase();

export { db };