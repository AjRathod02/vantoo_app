import { loadEnv } from "../config/env.js";
import { AppError } from "../utils/errors.js";
export async function internalAuth(request) {
    if (request.headers["x-internal-key"] !== loadEnv().INTERNAL_SERVICE_KEY) {
        throw AppError.forbidden("Invalid internal service key");
    }
    const userId = request.headers["x-user-id"];
    if (typeof userId === "string" && userId.length > 0) {
        request.userId = userId;
    }
    const vendorId = request.headers["x-vendor-id"];
    if (typeof vendorId === "string" && vendorId.length > 0) {
        request.vendorId = vendorId;
    }
}
export function requireUser(request) {
    if (!request.userId)
        throw AppError.forbidden("User ID required");
    return request.userId;
}
