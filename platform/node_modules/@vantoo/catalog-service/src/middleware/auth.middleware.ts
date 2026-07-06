import type { FastifyRequest, FastifyReply } from "fastify";
import { loadEnv } from "../config/env.js";
import { AppError } from "../utils/errors.js";

declare module "fastify" {
  interface FastifyRequest {
    userId?: string;
  }
}

export async function internalAuth(request: FastifyRequest, _reply: FastifyReply) {
  const key = request.headers["x-internal-key"];
  if (key !== loadEnv().INTERNAL_SERVICE_KEY) {
    throw AppError.forbidden("Invalid internal service key");
  }
  const userId = request.headers["x-user-id"];
  if (typeof userId === "string" && userId.length > 0) {
    request.userId = userId;
  }
}

export function requireUser(request: FastifyRequest) {
  if (!request.userId) {
    throw AppError.forbidden("User ID required");
  }
  return request.userId;
}
