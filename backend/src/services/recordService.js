class RecordService {

    static async list(entityId) {
        return db("Record").where({ entityId })
    }

    static async create(entityId, data) {
        return db("Record").insert({
            entityId,
            dataJson: JSON.stringify(data)
        })
    }
}