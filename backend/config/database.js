import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Configurazione pool di connessioni
const poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'portfolio_db',
    waitForConnections: true,
    // Massimo 10 connessioni simultanee
    connectionLimit: 10,
    queueLimit: 0,
    // 60 secondi timeout
    acquireTimeout: 60000,
    charset: 'utf8mb4',
    // UTC
    timezone: '+00:00',
    // Opzioni per prestazioni e sicurezza
    supportBigNumbers: true,
    bigNumberStrings: true,
    dateStrings: false,
    debug: process.env.NODE_ENV === 'development' ? false : false
};

// Creazione del pool
const pool = mysql.createPool(poolConfig);

// Funzione per testare la connessione
export const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Database connected successfully');

        // Test query
        const [rows] = await connection.execute('SELECT 1 + 1 AS result');
        console.log('Database test query result:', rows[0].result);

        connection.release();
        return true;
    } catch (error) {
        console.error('Database connection failed:', error.message);
        return false;
    }
};

// Funzione helper per eseguire query con error handling
export const executeQuery = async (sql, params = []) => {
    try {
        const [results] = await pool.execute(sql, params);
        return { success: true, data: results };
    } catch (error) {
        console.error('Database query error:', error.message);
        return {
            success: false,
            error: error.message,
            code: error.code
        };
    }
};

// Funzione per transazioni
export const executeTransaction = async (queries) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const results = [];
        for (const { sql, params } of queries) {
            const [result] = await connection.execute(sql, params);
            results.push(result);
        }

        await connection.commit();
        connection.release();

        return { success: true, data: results };
    } catch (error) {
        await connection.rollback();
        connection.release();

        console.error('Transaction error:', error.message);
        return {
            success: false,
            error: error.message,
            code: error.code
        };
    }
};

// Funzione per chiudere il pool (utile per testing)
export const closePool = async () => {
    try {
        await pool.end();
        console.log('Database pool closed');
    } catch (error) {
        console.error('Error closing database pool:', error.message);
    }
};

// Export del pool per usi avanzati
export { pool };

// Default export
export default {
    pool,
    testConnection,
    executeQuery,
    executeTransaction,
    closePool
};