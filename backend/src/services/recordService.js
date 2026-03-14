// backend/services/recordService.js
import { db } from "../db/db.js"

class RecordService {

    static async list(entityId) {
        const entity = await db("Entity").where({ id: entityId }).first();
        if (!entity) throw new Error("Entity not found");
        
        return db("Record")
            .where({ entityId })
            .orderBy('createdAt', 'desc');
    }

    static async get(entityId, recordId) {
        const entity = await db("Entity").where({ id: entityId }).first();
        if (!entity) throw new Error("Entity not found");
        
        return db("Record")
            .where({ 
                id: recordId,
                entityId 
            })
            .first();
    }

    static async create(entityId, data, userId = 1) {
        const entity = await db("Entity").where({ id: entityId }).first();
        if (!entity) throw new Error("Entity not found");
        
        const fields = await db("Field").where({ entityId });
        for (const field of fields) {
            if (field.required && (data[field.slug] === undefined || data[field.slug] === null)) {
                throw new Error(`${field.slug} is required`);
            }
        }

        const [id] = await db("Record").insert({
            entityId,
            dataJson: JSON.stringify(data),
            createdById: userId,
            updatedById: userId,
            createdAt: db.fn.now(),
            updatedAt: db.fn.now()
        });

        // Log attività - DOPO la creazione
        await db("ActivityLog").insert({
            userId,
            action: 'CREATE',
            entityId,
            recordId: id,
            createdAt: db.fn.now()
        });

        return id;
    }

    static async update(entityId, recordId, data, userId = 1) {
        const entity = await db("Entity").where({ id: entityId }).first();
        if (!entity) throw new Error("Entity not found");
        
        const oldRecord = await db("Record")
            .where({ id: recordId, entityId })
            .first();
        
        if (oldRecord) {
            await db("RecordVersion").insert({
                recordId,
                entityId,
                dataJson: oldRecord.dataJson,
                createdById: userId,
                createdAt: db.fn.now()
            });
        }

        await db("Record")
            .where({ 
                id: recordId,
                entityId 
            })
            .update({
                dataJson: JSON.stringify(data),
                updatedAt: db.fn.now(),
                updatedById: userId
            });

        // Log attività - DOPO l'update
        await db("ActivityLog").insert({
            userId,
            action: 'UPDATE',
            entityId,
            recordId,
            createdAt: db.fn.now()
        });
    }

    static async delete(entityId, recordId, userId = 1) {
        const entity = await db("Entity").where({ id: entityId }).first();
        if (!entity) throw new Error("Entity not found");
        
        // 1. PRIMA inserisci il log
        await db("ActivityLog").insert({
            userId,
            action: 'DELETE',
            entityId,
            recordId,
            createdAt: db.fn.now()
        });

        // 2. POI elimina le dipendenze
        await db("RecordVersion").where({ 
            recordId,
            entityId 
        }).delete();

        await db("RecordTag").where({ recordId }).delete();

        // 3. INFINE elimina il record
        await db("Record")
            .where({ 
                id: recordId,
                entityId 
            })
            .delete();
    }

    static async getVersions(entityId, recordId) {
        return db("RecordVersion")
            .where({ entityId, recordId })
            .orderBy('createdAt', 'desc');
    }
}

export default RecordService;