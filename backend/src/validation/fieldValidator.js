// backend/services/fieldValidator.js
import { db } from "../db/db.js"

async function validate(entityId, data) {
    const fields = await db("Field").where({ entityId })

    for (const field of fields) {
        if (field.required && (data[field.slug] === undefined || data[field.slug] === null)) {
            throw new Error(`${field.slug} is required`)
        }

        // Validazione tipo
        if (data[field.slug] !== undefined && data[field.slug] !== null) {
            validateType(field.type, data[field.slug], field.slug);
        }

        // Validazione unicità
        if (field.uniqueField && data[field.slug] !== undefined) {
            await checkUnique(entityId, field.slug, data[field.slug]);
        }
    }
}

function validateType(type, value, fieldName) {
    switch (type) {
        case 'number':
            if (isNaN(Number(value))) {
                throw new Error(`${fieldName} must be a number`);
            }
            break;
        case 'boolean':
            if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
                throw new Error(`${fieldName} must be a boolean`);
            }
            break;
        case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                throw new Error(`${fieldName} must be a valid email`);
            }
            break;
        case 'url':
            try {
                new URL(value);
            } catch {
                throw new Error(`${fieldName} must be a valid URL`);
            }
            break;
        case 'date':
            if (isNaN(Date.parse(value))) {
                throw new Error(`${fieldName} must be a valid date`);
            }
            break;
    }
}

async function checkUnique(entityId, fieldSlug, value, excludeRecordId = null) {
    const records = await db("Record").where({ entityId });
    
    for (const record of records) {
        if (excludeRecordId && record.id === excludeRecordId) continue;
        
        const data = JSON.parse(record.dataJson || '{}');
        if (data[fieldSlug] === value) {
            throw new Error(`${fieldSlug} must be unique`);
        }
    }
}

export default { validate, checkUnique };