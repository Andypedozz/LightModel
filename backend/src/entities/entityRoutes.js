import { db } from "../db/db.js"

export async function registerEntityRoutes(app) {

    const entities = await db("Entity")

    for (const entity of entities) {

        const basePath = `/api/${entity.slug}`

        // LIST
        app.get(basePath, async (req, res) => {

            const records = await db("Record")
                .where({ entityId: entity.id })

            res.json(records.map(r => ({
                id: r.id,
                ...JSON.parse(r.dataJson)
            })))
        })

        // GET ONE
        app.get(`${basePath}/:id`, async (req, res) => {

            const record = await db("Record")
                .where({
                    id: req.params.id,
                    entityId: entity.id
                })
                .first()

            if (!record) return res.status(404).json({ error: "Not found" })

            res.json({
                id: record.id,
                ...JSON.parse(record.dataJson)
            })
        })

        // CREATE
        app.post(basePath, async (req, res) => {

            const id = await db("Record").insert({
                entityId: entity.id,
                dataJson: JSON.stringify(req.body)
            })

            res.json({ id })
        })

        // UPDATE
        app.patch(`${basePath}/:id`, async (req, res) => {

            await db("Record")
                .where({
                    id: req.params.id,
                    entityId: entity.id
                })
                .update({
                    dataJson: JSON.stringify(req.body),
                    updatedAt: db.fn.now()
                })

            res.json({ success: true })
        })

        // DELETE
        app.delete(`${basePath}/:id`, async (req, res) => {

            await db("Record")
                .where({
                    id: req.params.id,
                    entityId: entity.id
                })
                .delete()

            res.json({ success: true })
        })

    }
}