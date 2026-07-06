import type { FastifyRequest } from "fastify";
import { loadEnv } from "../config/env.js";
import { AppError } from "../utils/errors.js";

export async function internalAuth(request: FastifyRequest) {
  const env = loadEnv();
  const key = request.headers["x-internal-key"];
  if (key !== env.INTERNAL_SERVICE_KEY) {
    throw AppError.forbidden("Invalid internal key");
  }
}

export function requireUser(request: FastifyRequest): string {
  const userId = request.headers["x-user-id"];
  if (!userId || typeof userId !== "string") {
    throw AppError.forbidden("User ID required");
  }
  return userId;
}
