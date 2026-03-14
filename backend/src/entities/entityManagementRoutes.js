// backend/entities/entityManagementRoutes.js
import { db } from "../db/db.js"
import { registerEntityRoutesFor } from "./entityRoutes.js"

export function registerEntityManagementRoutes(app) {
    
    // GET all entities with their fields
    app.get("/api/entities", async (req, res) => {
        try {
            const entities = await db("Entity").orderBy('createdAt', 'desc');
            
            const entitiesWithFields = await Promise.all(
                entities.map(async (entity) => {
                    const fields = await db("Field")
                        .where({ entityId: entity.id })
                        .orderBy('position');
                    
                    const stats = await getEntityStats(entity);
                    
                    return {
                        ...entity,
                        fields,
                        stats
                    };
                })
            );
            
            res.json(entitiesWithFields);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // CREATE new entity
    app.post("/api/entities", async (req, res) => {
        try {
            const { name, slug, tableName, fields } = req.body;

            if (!name || !slug) {
                return res.status(400).json({ error: "Name and slug are required" });
            }

            const existing = await db("Entity").where({ slug }).first();
            if (existing) {
                return res.status(400).json({ error: "Entity with this slug already exists" });
            }

            const [entityId] = await db("Entity").insert({
                name,
                slug,
                tableName: tableName || slug,
                createdAt: db.fn.now()
            });

            if (fields && fields.length > 0) {
                const fieldsToInsert = fields.map((field, index) => ({
                    entityId,
                    name: field.name,
                    slug: field.slug || field.name.toLowerCase().replace(/\s+/g, '_'),
                    type: field.type,
                    required: field.required || false,
                    uniqueField: field.unique || false,
                    position: index + 1
                }));
                
                await db("Field").insert(fieldsToInsert);
            }

            const newEntity = await db("Entity").where({ id: entityId }).first();
            const entityFields = await db("Field")
                .where({ entityId })
                .orderBy('position');

            await registerEntityRoutesFor(newEntity, app);

            // Log attività - DOPO la creazione
            await db("ActivityLog").insert({
                userId: req.user?.id || 1,
                action: 'CREATE_ENTITY',
                entityId: entityId,
                createdAt: db.fn.now()
            });

            res.json({
                ...newEntity,
                fields: entityFields
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // UPDATE entity
    app.patch("/api/entities/:id", async (req, res) => {
        try {
            const { id } = req.params;
            const { name, slug, fields } = req.body;

            await db("Entity")
                .where({ id })
                .update({
                    name,
                    slug,
                    updatedAt: db.fn.now()
                });

            if (fields) {
                await db("Field").where({ entityId: id }).delete();
                
                const fieldsToInsert = fields.map((field, index) => ({
                    entityId: id,
                    name: field.name,
                    slug: field.slug || field.name.toLowerCase().replace(/\s+/g, '_'),
                    type: field.type,
                    required: field.required || false,
                    uniqueField: field.unique || false,
                    position: index + 1
                }));
                
                await db("Field").insert(fieldsToInsert);
            }

            // Log attività - DOPO l'update
            await db("ActivityLog").insert({
                userId: req.user?.id || 1,
                action: 'UPDATE_ENTITY',
                entityId: id,
                createdAt: db.fn.now()
            });

            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // DELETE entity (CORRETTO)
    app.delete("/api/entities/:id", async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user?.id || 1;

            // 1. PRIMA inserisci il log (l'entità esiste ancora)
            await db("ActivityLog").insert({
                userId: userId,
                action: 'DELETE_ENTITY',
                entityId: id,
                createdAt: db.fn.now()
            });

            // 2. POI elimina tutti i record associati e le loro dipendenze
            const records = await db("Record").where({ entityId: id });
            
            for (const record of records) {
                await db("RecordVersion").where({ recordId: record.id }).delete();
                await db("RecordTag").where({ recordId: record.id }).delete();
            }
            
            await db("Record").where({ entityId: id }).delete();
            
            // 3. Elimina i campi
            await db("Field").where({ entityId: id }).delete();
            
            // 4. Elimina le relazioni
            await db("Relation").where({ targetEntityId: id }).delete();
            
            // 5. Elimina i permessi
            await db("Permission").where({ entityId: id }).delete();
            
            // 6. INFINE elimina l'entità
            await db("Entity").where({ id }).delete();

            res.json({ success: true });
        } catch (error) {
            console.error('Delete entity error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // GET fields for an entity
    app.get("/api/entities/:id/fields", async (req, res) => {
        try {
            const fields = await db("Field")
                .where({ entityId: req.params.id })
                .orderBy('position');
            res.json(fields);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // GET relations for an entity
    app.get("/api/entities/:id/relations", async (req, res) => {
        try {
            const relations = await db("Relation")
                .where({ targetEntityId: req.params.id })
                .orWhereIn('fieldId', 
                    db("Field").select('id').where({ entityId: req.params.id })
                );
            res.json(relations);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
}

// Funzione helper per ottenere statistiche dell'entità
async function getEntityStats(entity) {
    try {
        const count = await db("Record")
            .where({ entityId: entity.id })
            .count('* as count')
            .first();
        
        const lastRecord = await db("Record")
            .where({ entityId: entity.id })
            .orderBy('createdAt', 'desc')
            .first();
        
        return {
            recordsCount: count?.count || 0,
            lastRecord: lastRecord?.createdAt || null
        };
    } catch (error) {
        return { recordsCount: 0, lastRecord: null };
    }
}