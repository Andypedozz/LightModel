// backend/entities/entityRoutes.js
import { db } from "../db/db.js"

export async function registerEntityRoutes(app) {
    const entities = await db("Entity")

    for (const entity of entities) {
        await registerEntityRoutesFor(entity, app);
    }
}

// Funzione esportata per registrare route per una nuova entità
export async function registerEntityRoutesFor(entity, app) {
    const basePath = `/api/${entity.slug}`

    // LIST - GET all records
    app.get(basePath, async (req, res) => {
        try {
            const records = await db("Record")
                .where({ entityId: entity.id })
                .orderBy('createdAt', 'desc');

            res.json(records.map(r => ({
                id: r.id,
                ...JSON.parse(r.dataJson || '{}'),
                status: r.status,
                createdAt: r.createdAt,
                updatedAt: r.updatedAt,
                createdById: r.createdById,
                updatedById: r.updatedById
            })));
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // GET ONE - Get single record
    app.get(`${basePath}/:id`, async (req, res) => {
        try {
            const record = await db("Record")
                .where({
                    id: req.params.id,
                    entityId: entity.id
                })
                .first();

            if (!record) return res.status(404).json({ error: "Not found" });

            res.json({
                id: record.id,
                ...JSON.parse(record.dataJson || '{}'),
                status: record.status,
                createdAt: record.createdAt,
                updatedAt: record.updatedAt
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // CREATE - Create new record
    app.post(basePath, async (req, res) => {
        try {
            // Validazione campi
            const fields = await db("Field").where({ entityId: entity.id });
            for (const field of fields) {
                if (field.required && (req.body[field.slug] === undefined || req.body[field.slug] === null)) {
                    return res.status(400).json({ error: `${field.slug} is required` });
                }
            }

            const [id] = await db("Record").insert({
                entityId: entity.id,
                dataJson: JSON.stringify(req.body),
                status: req.body.status || 'draft',
                createdById: req.user?.id || 1,
                updatedById: req.user?.id || 1,
                createdAt: db.fn.now(),
                updatedAt: db.fn.now()
            });

            res.json({ id, success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // UPDATE - Update record
    app.patch(`${basePath}/:id`, async (req, res) => {
        try {
            await db("Record")
                .where({
                    id: req.params.id,
                    entityId: entity.id
                })
                .update({
                    dataJson: JSON.stringify(req.body),
                    updatedAt: db.fn.now(),
                    updatedById: req.user?.id || 1,
                    status: req.body.status || 'draft'
                });

            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // DELETE - Delete record (con debug)
    app.delete(`${basePath}/:id`, async (req, res) => {
        try {
            const recordId = req.params.id;
            const entityId = entity.id;

            console.log(`Attempting to delete record ${recordId} from entity ${entityId}`);

            // Verifica dipendenze
            const versions = await db("RecordVersion").where({ recordId, entityId });
            const tags = await db("RecordTag").where({ recordId });

            // 2. Elimina le versioni
            if (versions.length > 0) {
                await db("RecordVersion").where({ recordId, entityId }).delete();
                console.log('Deleted versions');
            }

            // 3. Elimina i tag
            if (tags.length > 0) {
                await db("RecordTag").where({ recordId }).delete();
                console.log('Deleted tags');
            }

            // 4. Ora prova a eliminare il record
            const deleted = await db("Record")
                .where({
                    id: recordId,
                    entityId: entityId
                })
                .delete();

            console.log(`Record deleted: ${deleted}`);

            res.json({ success: true, deleted });
        } catch (error) {
            console.error('Delete record error:', error);

            // Prova a capire quale dipendenza sta causando il problema
            try {
                const fkCheck = await db.raw('PRAGMA foreign_key_check;');
                console.log('Foreign key violations:', fkCheck);
            } catch (e) {
                console.log('Could not check foreign keys');
            }

            res.status(500).json({ error: error.message });
        }
    });

    console.log(`✅ Routes registered for entity: ${entity.name} at ${basePath}`);
}