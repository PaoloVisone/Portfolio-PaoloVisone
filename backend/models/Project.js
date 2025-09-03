import { BaseModel } from './BaseModel.js'; // Import necessario

export class Project extends BaseModel {
    constructor() {
        super('projects');
        this.fillable = [
            'title', 'slug', 'short_description', 'full_description',
            'featured_image', 'gallery_images', 'demo_url', 'github_url',
            'status', 'is_featured', 'is_published', 'start_date', 'end_date',
            'sort_order', 'meta_title', 'meta_description'
        ];
    }

    /**
     * Trova progetti pubblicati
     * @param {Object} options - Opzioni query
     * @returns {Object} Result object
     */
    async findPublished(options = {}) {
        const where = { is_published: 1, ...options.where };
        return await this.findAll({
            ...options,
            where,
            orderBy: options.orderBy || 'sort_order ASC, created_at DESC'
        });
    }

    /**
     * Trova progetti in evidenza
     * @param {number} limit - Numero massimo progetti
     * @returns {Object} Result object
     */
    async findFeatured(limit = 3) {
        return await this.findAll({
            where: { is_featured: 1, is_published: 1 },
            orderBy: 'sort_order ASC, created_at DESC',
            limit
        });
    }

    /**
     * Trova progetto con tecnologie
     * @param {string} slug - Slug del progetto
     * @returns {Object} Result object
     */
    async findBySlugWithTechnologies(slug) {
        const sql = `
            SELECT 
                p.*,
                GROUP_CONCAT(
                    JSON_OBJECT(
                        'id', t.id,
                        'name', t.name,
                        'slug', t.slug,
                        'category', t.category,
                        'color', t.color,
                        'icon_class', t.icon_class,
                        'usage_type', pt.usage_type,
                        'proficiency_shown', pt.proficiency_shown
                    )
                ) as technologies
            FROM ${this.tableName} p
            LEFT JOIN project_technologies pt ON p.id = pt.project_id
            LEFT JOIN technologies t ON pt.technology_id = t.id
            WHERE p.slug = ? AND p.is_published = 1
            GROUP BY p.id
        `;

        const result = await this.query(sql, [slug]);

        if (result.success && result.data.length > 0) {
            const project = result.data[0];

            // Parse technologies JSON
            if (project.technologies) {
                try {
                    project.technologies = project.technologies.split(',').map(tech => JSON.parse(tech));
                } catch (e) {
                    project.technologies = [];
                }
            } else {
                project.technologies = [];
            }

            // Parse gallery_images JSON se presente
            if (project.gallery_images) {
                try {
                    project.gallery_images = JSON.parse(project.gallery_images);
                } catch (e) {
                    project.gallery_images = [];
                }
            }

            return { success: true, data: project };
        }

        return { success: false, error: 'Project not found or not published' };
    }
}