import { executeQuery, executeTransaction } from '../config/database.js';

/**
 * Base Model Class
 * Fornisce funzionalità comuni per tutti i modelli
 */
export class BaseModel {
    constructor(tableName) {
        this.tableName = tableName;
        // Campi che possono essere assegnati in massa
        this.fillable = [];
        // Campi da nascondere nelle risposte
        this.hidden = [];
        // Se la tabella ha created_at/updated_at
        this.timestamps = true;
    }

    /**
     * Trova tutti i record
     * Opzioni query (where, orderBy, limit, offset)
     * @param {Object} options 
     * Result object
     * @returns {Object} 
     */
    async findAll(options = {}) {
        const { where, orderBy, limit, offset, select } = options;

        let sql = `SELECT ${select || '*'} FROM ${this.tableName}`;
        const params = [];

        // Costruisce clausola WHERE
        if (where && Object.keys(where).length > 0) {
            const conditions = Object.keys(where).map(key => {
                params.push(where[key]);
                return `${key} = ?`;
            });
            sql += ` WHERE ${conditions.join(' AND ')}`;
        }

        // ORDER BY
        if (orderBy) {
            sql += ` ORDER BY ${orderBy}`;
        }

        // LIMIT e OFFSET
        if (limit) {
            sql += ` LIMIT ?`;
            params.push(parseInt(limit));
        }
        if (offset) {
            sql += ` OFFSET ?`;
            params.push(parseInt(offset));
        }

        const result = await executeQuery(sql, params);

        if (result.success) {
            return {
                success: true,
                data: this.hideFields(result.data)
            };
        }

        return result;
    }

    /**
     * Trova un record per ID
     * ID del record
     * @param {number} id 
     * Result object
     * @returns {Object}
     */
    async findById(id) {
        const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
        const result = await executeQuery(sql, [id]);

        if (result.success) {
            const data = result.data.length > 0 ? result.data[0] : null;
            return {
                success: true,
                data: data ? this.hideFields([data])[0] : null
            };
        }

        return result;
    }

    /**
     * Trova un record per campo specifico
     * Nome campo
     * @param {string} field
     * Valore da cercare
     * @param {any} value 
     * Result object
     * @returns {Object} 
     */
    async findBy(field, value) {
        const sql = `SELECT * FROM ${this.tableName} WHERE ${field} = ?`;
        const result = await executeQuery(sql, [value]);

        if (result.success) {
            const data = result.data.length > 0 ? result.data[0] : null;
            return {
                success: true,
                data: data ? this.hideFields([data])[0] : null
            };
        }

        return result;
    }

    /**
     * Crea un nuovo record
     * Dati da inserire
     * @param {Object} data 
     * Result object
     * @returns {Object} 
     */
    async create(data) {
        // Filtra solo i campi fillable
        const filteredData = this.filterFillable(data);

        // Aggiunge timestamp se abilitato
        if (this.timestamps) {
            filteredData.created_at = new Date();
            filteredData.updated_at = new Date();
        }

        const fields = Object.keys(filteredData);
        const placeholders = fields.map(() => '?').join(', ');
        const values = Object.values(filteredData);

        const sql = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
        const result = await executeQuery(sql, values);

        if (result.success) {
            // Recupera il record creato
            const newRecord = await this.findById(result.data.insertId);
            return {
                success: true,
                data: newRecord.data,
                insertId: result.data.insertId
            };
        }

        return result;
    }

    /**
     * Aggiorna un record
     * ID del record
     * @param {number} id 
     * Dati da aggiornare
     * @param {Object} data 
     * Result object
     * @returns {Object} 
     */
    async update(id, data) {
        // Filtra solo i campi fillable
        const filteredData = this.filterFillable(data);

        // Aggiunge updated_at se abilitato
        if (this.timestamps) {
            filteredData.updated_at = new Date();
        }

        const fields = Object.keys(filteredData);
        const setClause = fields.map(field => `${field} = ?`).join(', ');
        const values = [...Object.values(filteredData), id];

        const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;
        const result = await executeQuery(sql, values);

        if (result.success && result.data.affectedRows > 0) {
            // Recupera il record aggiornato
            const updatedRecord = await this.findById(id);
            return {
                success: true,
                data: updatedRecord.data,
                affectedRows: result.data.affectedRows
            };
        }

        return {
            success: false,
            error: 'Record not found or no changes made'
        };
    }

    /**
     * Elimina un record
     * ID del record
     * @param {number} id 
     * Result object
     * @returns {Object} 
     */
    async delete(id) {
        const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
        const result = await executeQuery(sql, [id]);

        if (result.success) {
            return {
                success: true,
                affectedRows: result.data.affectedRows
            };
        }

        return result;
    }

    /**
     * Conta i record
     * Condizioni WHERE
     * @param {Object} where 
     * Result object
     * @returns {Object} 
     */
    async count(where = {}) {
        let sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
        const params = [];

        if (Object.keys(where).length > 0) {
            const conditions = Object.keys(where).map(key => {
                params.push(where[key]);
                return `${key} = ?`;
            });
            sql += ` WHERE ${conditions.join(' AND ')}`;
        }

        const result = await executeQuery(sql, params);

        if (result.success) {
            return {
                success: true,
                count: result.data[0].count
            };
        }

        return result;
    }

    /**
     * Filtra i campi fillable
     * Dati originali
     * @param {Object} data
     * Dati filtrati 
     * @returns {Object} 
     */
    filterFillable(data) {
        if (this.fillable.length === 0) return data;

        const filtered = {};
        for (const field of this.fillable) {
            if (data.hasOwnProperty(field)) {
                filtered[field] = data[field];
            }
        }
        return filtered;
    }

    /**
     * Nasconde campi sensibili
     * Array di record
     * @param {Array} records 
     * Record con campi nascosti rimossi
     * @returns {Array} 
     */
    hideFields(records) {
        if (this.hidden.length === 0) return records;

        return records.map(record => {
            const cleaned = { ...record };
            for (const field of this.hidden) {
                delete cleaned[field];
            }
            return cleaned;
        });
    }

    /**
     * Esegue query personalizzata
     * Query SQL
     * @param {string} sql
     * Parametri
     * @param {Array} params 
     * Result object
     * @returns {Object} 
     */
    async query(sql, params = []) {
        return await executeQuery(sql, params);
    }
}