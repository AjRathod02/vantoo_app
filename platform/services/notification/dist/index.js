import { buildApp } from "./app.js";
import { loadEnv } from "./config/env.js";
import { getPool, closeConnections } from "./db/pool.js";
async function main() {
    const env = loadEnv();
    await getPool().query("SELECT 1");
    const app = await buildApp();
    await app.listen({ port: env.PORT, host: env.HOST });
    console.log(`Notification service listening on ${env.HOST}:${env.PORT}`);
    process.on("SIGTERM", async () => { await app.close(); await closeConnections(); process.exit(0); });
}
main().catch((err) => { console.error(err); process.exit(1); });
