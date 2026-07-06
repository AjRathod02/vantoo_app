import { ErrorCodes } from "@vantoo/shared";
export class AppError extends Error {
    code;
    statusCode;
    constructor(code, message, statusCode = 400) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
    }
    static notFound(msg = "Not found") { return new AppError(ErrorCodes.NOT_FOUND, msg, 404); }
    static forbidden(msg = "Forbidden") { return new AppError(ErrorCodes.FORBIDDEN, msg, 403); }
    static conflict(msg) { return new AppError(ErrorCodes.CONFLICT, msg, 409); }
    static validation(msg) { return new AppError(ErrorCodes.VALIDATION_ERROR, msg, 400); }
}
export function slugify(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
