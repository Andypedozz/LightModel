import express from "express"
import { registerEntityRoutes } from "./entities/entityRoutes.js";

const PORT = 3000;

const app = express();

app.use(express.json());

await registerEntityRoutes(app);

app.listen(PORT, () => console.log("SERVER: LightModel active at http://localhost:"+PORT));