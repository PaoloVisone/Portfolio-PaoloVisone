import { BaseModel } from './BaseModel.js';

export class PageView extends BaseModel {
    constructor() {
        super('page_views');
        this.fillable = [
            'page_type', 'page_identifier', 'ip_address', 'user_agent', 'referer'
        ];
        this.timestamps = false; // Usa solo created_at
    }

    /**
     * Registra visualizzazione pagina
     * @param {Object} viewData - Dati visualizzazione
     * @returns {Object} Result object
     */
    async track(viewData) {
        const data = {
            ...viewData,
            created_at: new Date()
        };

        const sql = `
            INSERT INTO ${this.tableName} (page_type, page_identifier, ip_address, user_agent, referer, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        const values = [
            data.page_type,
            data.page_identifier || null,
            data.ip_address || null,
            data.user_agent || null,
            data.referer || null,
            data.created_at
        ];

        return await this.query(sql, values);
    }

    /**
     * Ottieni statistiche visualizzazioni
     * @param {Object} options - Opzioni (date_from, date_to, page_type)
     * @returns {Object} Result object
     */
    async getStats(options = {}) {
        let sql = `
            SELECT 
                page_type,
                COUNT(*) as views,
                COUNT(DISTINCT ip_address) as unique_visitors,
                DATE(created_at) as date
            FROM ${this.tableName}
        `;

        const conditions = [];
        const params = [];

        if (options.date_from) {
            conditions.push('created_at >= ?');
            params.push(options.date_from);
        }

        if (options.date_to) {
            conditions.push('created_at <= ?');
            params.push(options.date_to);
        }

        if (options.page_type) {
            conditions.push('page_type = ?');
            params.push(options.page_type);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' GROUP BY page_type, DATE(created_at) ORDER BY created_at DESC';

        return await this.query(sql, params);
    }

    /**
     * Ottieni progetti più visualizzati
     * @param {number} limit - Numero risultati
     * @param {Object} options - Opzioni periodo
     * @returns {Object} Result object
     */
    async getTopProjects(limit = 10, options = {}) {
        let sql = `
            SELECT 
                page_identifier as project_slug,
                COUNT(*) as views,
                COUNT(DISTINCT ip_address) as unique_visitors
            FROM ${this.tableName}
            WHERE page_type = 'project_detail' AND page_identifier IS NOT NULL
        `;

        const params = [];

        if (options.date_from) {
            sql += ' AND created_at >= ?';
            params.push(options.date_from);
        }

        if (options.date_to) {
            sql += ' AND created_at <= ?';
            params.push(options.date_to);
        }

        sql += ' GROUP BY page_identifier ORDER BY views DESC LIMIT ?';
        params.push(limit);

        return await this.query(sql, params);
    }
}
