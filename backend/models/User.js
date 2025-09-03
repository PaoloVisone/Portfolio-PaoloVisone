import { BaseModel } from './BaseModel.js';
import bcrypt from 'bcryptjs';

export class User extends BaseModel {
    constructor() {
        super('users');
        this.fillable = [
            'username', 'email', 'password_hash', 'first_name', 'last_name', 'role'
        ];
        // Non esporre mai l'hash della password
        this.hidden = ['password_hash'];
    }

    /**
     * Crea utente con hash della password
     * Dati utente con password in chiaro
     * @param {Object} userData 
     * Result object
     * @returns {Object} 
     */
    async createWithPassword(userData) {
        const { password, ...otherData } = userData;

        if (!password) {
            return { success: false, error: 'Password is required' };
        }

        // Hash della password
        const saltRounds = 12;
        const password_hash = await bcrypt.hash(password, saltRounds);

        return await this.create({
            ...otherData,
            password_hash
        });
    }

    /**
     * Verifica password
     * Email utente
     * @param {string} email 
     * Password in chiaro
     * @param {string} password 
     * Result object con utente se valido
     * @returns {Object} 
     */
    async verifyPassword(email, password) {
        // Prima recuperiamo l'utente con la password hash (ignoriamo hidden temporaneamente)
        const sql = `SELECT * FROM ${this.tableName} WHERE email = ?`;
        const result = await this.query(sql, [email]);

        if (!result.success || result.data.length === 0) {
            return { success: false, error: 'User not found' };
        }

        const user = result.data[0];
        const isValid = await bcrypt.compare(password, user.password_hash);

        if (!isValid) {
            return { success: false, error: 'Invalid password' };
        }

        // Rimuovi password hash prima di restituire
        const { password_hash, ...userWithoutPassword } = user;

        return {
            success: true,
            data: userWithoutPassword
        };
    }

    /**
     * Aggiorna password
     * ID utente
     * @param {number} userId
     * Nuova password
     * @param {string} newPassword
     * Result object
     * @returns {Object} 
     */
    async updatePassword(userId, newPassword) {
        const saltRounds = 12;
        const password_hash = await bcrypt.hash(newPassword, saltRounds);

        const sql = `UPDATE ${this.tableName} SET password_hash = ?, updated_at = NOW() WHERE id = ?`;
        return await this.query(sql, [password_hash, userId]);
    }
}
