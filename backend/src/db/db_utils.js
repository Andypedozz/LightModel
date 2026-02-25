/**
 * Esegue qualsiasi query SQL e restituisce un risultato appropriato
 * @param {Database} db - Istanza del database
 * @param {string} sql - Query SQL
 * @param {Array} values - Valori per i parametri (opzionale)
 * @returns {Array|Object} Risultato della query
 */
export function query(db, sql, values = []) {
    try {
        console.log('Esecuzione query:', sql, 'Values:', values);
        
        const stmt = db.prepare(sql);
        
        // Determina il tipo di query
        const queryType = sql.trim().toUpperCase().split(' ')[0];
        
        switch (queryType) {
            case 'SELECT':
                if (values.length > 0) {
                    return stmt.all(...values);
                }
                return stmt.all();
                
            case 'INSERT':
            case 'UPDATE':
            case 'DELETE':
            case 'REPLACE':
                const result = stmt.run(...values);
                return {
                    lastInsertRowid: result.lastInsertRowid,
                    changes: result.changes,
                    success: true,
                    queryType: queryType
                };
                
            case 'CREATE':
            case 'DROP':
            case 'ALTER':
            case 'PRAGMA':
                // Per query DDL o PRAGMA, usa run()
                const ddlResult = stmt.run(...values);
                return {
                    success: true,
                    queryType: queryType,
                    message: `Query ${queryType} eseguita con successo`
                };
                
            default:
                // Per altre query, prova all() se possibile, altrimenti run()
                try {
                    if (values.length > 0) {
                        return stmt.all(...values);
                    }
                    return stmt.all();
                } catch {
                    const runResult = stmt.run(...values);
                    return {
                        success: true,
                        queryType: 'UNKNOWN',
                        changes: runResult.changes,
                        lastInsertRowid: runResult.lastInsertRowid
                    };
                }
        }
    } catch (error) {
        console.error('Errore durante query:', error);
        throw error;
    }
}

/**
 * Versione async di query (wrapper opzionale)
 */
export async function queryAsync(db, sql, values = []) {
    return new Promise((resolve, reject) => {
        try {
            resolve(query(db, sql, values));
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Esegue una transazione con più query
 * @param {Database} db - Istanza del database
 * @param {Array} operations - Array di operazioni [{sql, values}]
 * @returns {Object} Risultato della transazione
 */
export function transaction(db, operations) {
    try {
        const transactionFn = db.transaction((ops) => {
            const results = [];
            ops.forEach(({ sql, values = [] }) => {
                const stmt = db.prepare(sql);
                const queryType = sql.trim().toUpperCase().split(' ')[0];
                
                if (queryType === 'SELECT') {
                    if (values.length > 0) {
                        results.push(stmt.all(...values));
                    } else {
                        results.push(stmt.all());
                    }
                } else {
                    results.push(stmt.run(...values));
                }
            });
            return results;
        });
        
        const results = transactionFn(operations);
        
        return {
            success: true,
            results: results,
            message: 'Transazione completata'
        };
    } catch (error) {
        console.error('Errore durante la transazione:', error);
        throw error;
    }
}

/**
 * Verifica se una tabella esiste
 * @param {Database} db - Istanza del database
 * @param {string} tableName - Nome della tabella
 * @returns {boolean} True se la tabella esiste
 */
export function tableExists(db, tableName) {
    try {
        const result = query(db, 
            `SELECT name FROM sqlite_master WHERE type='table' AND name=?`, 
            [tableName]
        );
        return Array.isArray(result) && result.length > 0;
    } catch (error) {
        console.error('Errore durante tableExists:', error);
        return false;
    }
}

// Export per retrocompatibilità
export default {
    query,
    queryAsync,
    transaction,
    tableExists
};