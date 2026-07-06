import type { FastifyRequest, FastifyReply } from "fastify";
import { verifyAccessToken } from "../services/token.service.js";
import { sessionService } from "../services/session.service.js";
import { AppError } from "../utils/errors.js";
import { ErrorCodes } from "@vantoo/shared";
import type { JwtPayload } from "@vantoo/shared";

declare module "fastify" {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}

export async function authenticate(request: FastifyRequest, _reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw AppError.unauthorized("Missing or invalid authorization header");
  }

  const token = authHeader.slice(7);
  const payload = await verifyAccessToken(token);

  const isValid = await sessionService.validateSession(payload.sessionId);
  if (!isValid) {
    throw new AppError(ErrorCodes.SESSION_REVOKED, "Session has been revoked", 401);
  }

  request.user = payload;
}

export function requirePermission(...permissions: string[]) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    if (!request.user) {
      throw AppError.unauthorized();
    }

    if (request.user.roles.includes("super_admin")) return;

    const hasPermission = permissions.some((p) => request.user!.permissions.includes(p));
    if (!hasPermission) {
      throw AppError.forbidden("Insufficient permissions");
    }
  };
}

export function requireRole(...roles: string[]) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    if (!request.user) {
      throw AppError.unauthorized();
    }

    const hasRole = roles.some((r) => request.user!.roles.includes(r));
    if (!hasRole) {
      throw AppError.forbidden("Insufficient role");
    }
  };
}

export function getRequestContext(request: FastifyRequest) {
  return {
    ipAddress: request.ip,
    userAgent: request.headers["user-agent"],
  };
}
