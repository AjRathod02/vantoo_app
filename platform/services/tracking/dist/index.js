import { buildApp } from "./app.js";
import { loadEnv } from "./config/env.js";
import { getRedis, closeRedis } from "./services/tracking.service.js";
async function main() {
    const env = loadEnv();
    await getRedis().connect();
    const app = await buildApp();
    await app.listen({ port: env.PORT, host: env.HOST });
    console.log(`Tracking service listening on ${env.HOST}:${env.PORT}`);
    process.on("SIGTERM", async () => { await app.close(); await closeRedis(); process.exit(0); });
}
main().catch((err) => { console.error(err); process.exit(1); });
