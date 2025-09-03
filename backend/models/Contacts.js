import { BaseModel } from './BaseModel.js';

export class Contact extends BaseModel {
    constructor() {
        super('contacts');
        this.fillable = [
            'name', 'email', 'subject', 'message', 'status', 'ip_address', 'user_agent'
        ];
    }

    /**
     * Trova messaggi per stato
     * @param {string} status - Stato ('unread', 'read', 'replied', 'archived')
     * @param {Object} options - Opzioni query
     * @returns {Object} Result object
     */
    async findByStatus(status, options = {}) {
        return await this.findAll({
            where: { status },
            orderBy: options.orderBy || 'created_at DESC',
            ...options
        });
    }

    /**
     * Marca come letto
     * @param {number} contactId - ID contatto
     * @returns {Object} Result object
     */
    async markAsRead(contactId) {
        return await this.update(contactId, { status: 'read' });
    }

    /**
     * Marca come risposto con messaggio
     * @param {number} contactId - ID contatto
     * @param {string} replyMessage - Messaggio di risposta
     * @returns {Object} Result object
     */
    async markAsReplied(contactId, replyMessage) {
        return await this.update(contactId, {
            status: 'replied',
            reply_message: replyMessage,
            replied_at: new Date()
        });
    }

    /**
     * Archivia contatto
     * @param {number} contactId - ID contatto
     * @returns {Object} Result object
     */
    async archive(contactId) {
        return await this.update(contactId, { status: 'archived' });
    }

    /**
     * Statistiche contatti
     * @returns {Object} Result object con statistiche
     */
    async getStats() {
        const sql = `
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'unread' THEN 1 END) as unread,
                COUNT(CASE WHEN status = 'read' THEN 1 END) as read,
                COUNT(CASE WHEN status = 'replied' THEN 1 END) as replied,
                COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived,
                COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as last_week,
                COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as last_month
            FROM ${this.tableName}
        `;

        const result = await this.query(sql);

        if (result.success && result.data.length > 0) {
            return {
                success: true,
                data: result.data[0]
            };
        }

        return { success: false, error: 'Unable to get stats' };
    }
}
