import { verifyAccessToken } from "../services/token.service.js";
import { sessionService } from "../services/session.service.js";
import { AppError } from "../utils/errors.js";
import { ErrorCodes } from "@vantoo/shared";
export async function authenticate(request, _reply) {
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
export function requirePermission(...permissions) {
    return async (request, _reply) => {
        if (!request.user) {
            throw AppError.unauthorized();
        }
        if (request.user.roles.includes("super_admin"))
            return;
        const hasPermission = permissions.some((p) => request.user.permissions.includes(p));
        if (!hasPermission) {
            throw AppError.forbidden("Insufficient permissions");
        }
    };
}
export function requireRole(...roles) {
    return async (request, _reply) => {
        if (!request.user) {
            throw AppError.unauthorized();
        }
        const hasRole = roles.some((r) => request.user.roles.includes(r));
        if (!hasRole) {
            throw AppError.forbidden("Insufficient role");
        }
    };
}
export function getRequestContext(request) {
    return {
        ipAddress: request.ip,
        userAgent: request.headers["user-agent"],
    };
}
