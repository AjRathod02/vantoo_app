import { ErrorCodes } from "@vantoo/shared";
export class AppError extends Error {
    code;
    statusCode;
    constructor(code, message, statusCode = 400) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
    }
    static forbidden(msg = "Forbidden") {
        return new AppError(ErrorCodes.FORBIDDEN, msg, 403);
    }
}
