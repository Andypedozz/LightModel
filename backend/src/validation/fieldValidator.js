async function validate(entityId, data) {

    const fields = await db("Field").where({ entityId })

    for (const field of fields) {

        if (field.required && data[field.slug] === undefined) {
            throw new Error(`${field.slug} is required`)
        }

    }
}