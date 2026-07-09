import { spawn } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import net from "node:net";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const SERVICE_PORTS = [4001, 4002, 4003, 4004, 4005, 4009, 4010];

const DEV_DEFAULTS = {
  JWT_SECRET: "dev_jwt_secret_change_in_production_min_32_chars",
  REDIS_URL: "redis://localhost:6379",
  INTERNAL_SERVICE_KEY: "dev_internal_key_change_in_production",
  PLATFORM_DATABASE_URL:
    "postgresql://vantoo:vantoo_dev_password@localhost:5432/vantoo_platform",
};

function parseEnvFile(path) {
  const vars = {};
  if (!existsSync(path)) return vars;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key) vars[key] = value;
  }
  return vars;
}

function loadPlatformEnv() {
  const env = { ...process.env, ...parseEnvFile(join(root, ".env")) };
  Object.assign(env, parseEnvFile(join(root, ".env.local")));

  for (const [key, value] of Object.entries(DEV_DEFAULTS)) {
    if (!env[key]) env[key] = value;
  }

  // Microservices read DATABASE_URL; keep Supabase URL if set, else local platform DB.
  if (!env.DATABASE_URL) {
    env.DATABASE_URL = env.PLATFORM_DATABASE_URL;
  }

  return env;
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.once("error", () => resolve(false));
    server.listen({ port, host: "0.0.0.0" }, () => {
      server.close(() => resolve(true));
    });
  });
}

async function findBusyPorts() {
  const busy = [];
  for (const port of SERVICE_PORTS) {
    if (!(await isPortFree(port))) busy.push(port);
  }
  return busy;
}

function run(name, script, env) {
  const child = spawn(script, {
    shell: true,
    cwd: root,
    env,
    stdio: "inherit",
  });
  child.on("exit", (code) => {
    if (code && code !== 0) console.error(`${name} exited with code ${code}`);
  });
  return child;
}

const services = [
  ["auth", "npm run platform:dev:auth"],
  ["catalog", "npm run platform:dev:catalog"],
  ["order", "npm run platform:dev:order"],
  ["vendor", "npm run platform:dev:vendor"],
  ["rider", "npm run platform:dev:rider"],
  ["notification", "npm run platform:dev:notification"],
  ["tracking", "npm run platform:dev:tracking"],
];

const env = loadPlatformEnv();
const busyPorts = await findBusyPorts();

if (busyPorts.length > 0) {
  console.error(`\nCannot start — port(s) already in use: ${busyPorts.join(", ")}`);
  console.error("Another platform:dev:all or Docker stack may still be running.");
  console.error("\nFix options:");
  console.error("  1. Stop the other terminal (Ctrl+C) where services are running");
  console.error("  2. npm run platform:docker:down");
  console.error("  3. Windows — find PID: netstat -ano | findstr :4002");
  console.error("     Then kill: taskkill /PID <pid> /F\n");
  process.exit(1);
}

console.log("Starting all platform services...");
console.log("  auth :4001 | catalog :4002 | order :4003 | vendor :4004");
console.log("  rider :4005 | notification :4009 | tracking :4010");
if (!process.env.JWT_SECRET && env.JWT_SECRET === DEV_DEFAULTS.JWT_SECRET) {
  console.log("  (using dev JWT_SECRET — set JWT_SECRET in .env.local for production)");
}
console.log("Press Ctrl+C to stop all.\n");

const children = services.map(([name, script]) => run(name, script, env));

function shutdown() {
  children.forEach((child) => child.kill());
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
