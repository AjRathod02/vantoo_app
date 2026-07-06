import { buildApp } from "./app.js";
import { loadEnv } from "./config/env.js";
import { getPool, closePool } from "./db/pool.js";
async function main() {
    const env = loadEnv();
    await getPool().query("SELECT 1");
    const app = await buildApp();
    await app.listen({ port: env.PORT, host: env.HOST });
    console.log(`Catalog service listening on ${env.HOST}:${env.PORT}`);
    const shutdown = async () => {
        await app.close();
        await closePool();
        process.exit(0);
    };
    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
