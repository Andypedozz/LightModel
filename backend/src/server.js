// backend/server.js
import express from "express"
import cors from "cors"
import { registerEntityRoutes } from "./entities/entityRoutes.js"
import { registerEntityManagementRoutes } from "./entities/entityManagementRoutes.js"
import { ensureEntityTables } from "./db/db.js"

const PORT = 3000;

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
    res.json({ 
        status: "ok", 
        timestamp: new Date().toISOString(),
        tables: ["Entity", "Field", "Record", "User", "Role", "Media", "ApiToken", "WebHook", "ActivityLog"]
    });
});

// Route per la gestione delle entità (deve venire prima delle route dinamiche)
registerEntityManagementRoutes(app);

// Route dinamiche per le entità esistenti
await registerEntityRoutes(app);

// Avvio server
app.listen(PORT, async () => {
    try {
        await ensureEntityTables();
        console.log("🚀 SERVER: LightModel CMS active at http://localhost:" + PORT);
        console.log("📊 API Documentation: http://localhost:" + PORT + "/api/health");
    } catch (error) {
        console.error("❌ Database error:", error.message);
        process.exit(1);
    }
});