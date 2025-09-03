import { BaseModel } from './BaseModel.js';

export class Skill extends BaseModel {
    constructor() {
        super('skills');
        this.fillable = [
            'name', 'category_id', 'proficiency_level', 'years_experience',
            'description', 'icon_class', 'is_featured', 'sort_order'
        ];
    }

    /**
     * Trova skills con categoria
     * Opzioni query
     * @param {Object} options 
     * Result object
     * @returns {Object} 
     */
    async findWithCategory(options = {}) {
        const sql = `
            SELECT 
                s.*,
                c.name as category_name,
                c.slug as category_slug,
                c.color as category_color
            FROM ${this.tableName} s
            LEFT JOIN categories c ON s.category_id = c.id
            ORDER BY ${options.orderBy || 's.sort_order ASC, s.name ASC'}
        `;

        return await this.query(sql);
    }

    /**
     * Trova skills in evidenza raggruppate per categoria
     * Result object
     * @returns {Object} 
     */
    async findFeaturedGrouped() {
        const sql = `
            SELECT 
                s.*,
                c.name as category_name,
                c.slug as category_slug,
                c.color as category_color
            FROM ${this.tableName} s
            LEFT JOIN categories c ON s.category_id = c.id
            WHERE s.is_featured = 1
            ORDER BY c.name ASC, s.sort_order ASC
        `;

        const result = await this.query(sql);

        if (result.success) {
            // Raggruppa per categoria
            const grouped = {};
            result.data.forEach(skill => {
                const categoryName = skill.category_name || 'Uncategorized';
                if (!grouped[categoryName]) {
                    grouped[categoryName] = {
                        name: categoryName,
                        slug: skill.category_slug,
                        color: skill.category_color,
                        skills: []
                    };
                }
                grouped[categoryName].skills.push(skill);
            });

            return {
                success: true,
                data: Object.values(grouped)
            };
        }

        return result;
    }
}