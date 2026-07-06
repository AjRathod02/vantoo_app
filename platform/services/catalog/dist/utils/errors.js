import { ErrorCodes } from "@vantoo/shared";
export class AppError extends Error {
    code;
    statusCode;
    details;
    constructor(code, message, statusCode = 400, details) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.name = "AppError";
    }
    static notFound(message = "Not found") {
        return new AppError(ErrorCodes.NOT_FOUND, message, 404);
    }
    static forbidden(message = "Forbidden") {
        return new AppError(ErrorCodes.FORBIDDEN, message, 403);
    }
    static validation(message) {
        return new AppError(ErrorCodes.VALIDATION_ERROR, message, 400);
    }
    static internal(message = "Internal server error") {
        return new AppError(ErrorCodes.INTERNAL_ERROR, message, 500);
    }
}
