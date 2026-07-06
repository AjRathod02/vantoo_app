import { buildApp } from "./app.js";
import { loadEnv } from "./config/env.js";
import { getPool, closePool } from "./db/pool.js";

async function main() {
  const env = loadEnv();
  await getPool().query("SELECT 1");
  const app = await buildApp();
  await app.listen({ port: env.PORT, host: env.HOST });
  console.log(`Rider service listening on ${env.HOST}:${env.PORT}`);
  process.on("SIGTERM", async () => { await app.close(); await closePool(); process.exit(0); });
}

main().catch((err) => { console.error(err); process.exit(1); });
