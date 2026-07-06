import { loadEnv } from "../config/env.js";
import { AppError } from "../utils/errors.js";
export async function internalAuth(request, _reply) {
    const key = request.headers["x-internal-key"];
    if (key !== loadEnv().INTERNAL_SERVICE_KEY) {
        throw AppError.forbidden("Invalid internal service key");
    }
    const userId = request.headers["x-user-id"];
    if (typeof userId === "string" && userId.length > 0) {
        request.userId = userId;
    }
}
export function requireUser(request) {
    if (!request.userId) {
        throw AppError.forbidden("User ID required");
    }
    return request.userId;
}
