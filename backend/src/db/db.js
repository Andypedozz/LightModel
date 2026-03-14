// backend/db/db.js
import knex from 'knex'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const db = knex({
  client: 'better-sqlite3',
  connection: {
    filename: join(__dirname, 'db.sqlite')
  },
  useNullAsDefault: true
})

// Non creiamo più tabelle entity_* ma usiamo la tabella Record esistente
export async function ensureEntityTables() {
    // Verifichiamo che le tabelle esistano (dovrebbero già esistere)
    const hasEntityTable = await db.schema.hasTable('Entity');
    const hasRecordTable = await db.schema.hasTable('Record');
    const hasFieldTable = await db.schema.hasTable('Field');
    
    if (!hasEntityTable || !hasRecordTable || !hasFieldTable) {
        throw new Error('Database tables missing. Please run migrations first.');
    }
    
    console.log('✅ Database tables verified');
}

export { db }