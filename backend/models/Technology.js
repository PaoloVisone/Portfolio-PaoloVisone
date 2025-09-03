import { BaseModel } from './BaseModel.js';

export class Technology extends BaseModel {
    constructor() {
        super('technologies');
        this.fillable = [
            'name', 'slug', 'category', 'color', 'icon_class',
            'description', 'official_website', 'documentation_url', 'is_active'
        ];
    }

    /**
     * Trova tecnologie per progetto
     * ID progetto
     * @param {number} projectId
     * Result object
     * @returns {Object} 
     */
    async findByProject(projectId) {
        const sql = `
            SELECT 
                t.*,
                pt.usage_type,
                pt.proficiency_shown
            FROM ${this.tableName} t
            INNER JOIN project_technologies pt ON t.id = pt.technology_id
            WHERE pt.project_id = ? AND t.is_active = 1
            ORDER BY pt.usage_type ASC, t.name ASC
        `;

        return await this.query(sql, [projectId]);
    }

    /**
     * Trova tecnologie attive raggruppate per categoria
     * Result object
     * @returns {Object} 
     */
    async findActiveGrouped() {
        const sql = `
            SELECT * FROM ${this.tableName}
            WHERE is_active = 1
            ORDER BY category ASC, name ASC
        `;

        const result = await this.query(sql);

        if (result.success) {
            // Raggruppa per categoria
            const grouped = {};
            result.data.forEach(tech => {
                const category = tech.category || 'other';
                if (!grouped[category]) {
                    grouped[category] = {
                        name: category,
                        technologies: []
                    };
                }
                grouped[category].technologies.push(tech);
            });

            return {
                success: true,
                data: Object.values(grouped)
            };
        }

        return result;
    }

    /**
     * Collega tecnologia a progetto
     * ID progetto
     * @param {number} projectId 
     * ID tecnologia
     * @param {number} technologyId 
     * Tipo utilizzo ('primary', 'secondary', 'tool')
     * @param {string} usageType 
     * Livello competenza mostrata
     * @param {string} proficiency 
     * Result object
     * @returns {Object} 
     */
    async linkToProject(projectId, technologyId, usageType = 'secondary', proficiency = 'intermediate') {
        const sql = `
            INSERT INTO project_technologies (project_id, technology_id, usage_type, proficiency_shown)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                usage_type = VALUES(usage_type),
                proficiency_shown = VALUES(proficiency_shown)
        `;

        return await this.query(sql, [projectId, technologyId, usageType, proficiency]);
    }

    /**
     * Scollega tecnologia da progetto
     * ID progetto
     * @param {number} projectId 
     * ID tecnologia
     * @param {number} technologyId 
     * Result object
     * @returns {Object} 
     */
    async unlinkFromProject(projectId, technologyId) {
        const sql = `DELETE FROM project_technologies WHERE project_id = ? AND technology_id = ?`;
        return await this.query(sql, [projectId, technologyId]);
    }
}
