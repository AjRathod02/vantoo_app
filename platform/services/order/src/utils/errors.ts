import { ErrorCodes, type ErrorCode } from "@vantoo/shared";

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
  }

  static notFound(msg = "Not found") { return new AppError(ErrorCodes.NOT_FOUND, msg, 404); }
  static forbidden(msg = "Forbidden") { return new AppError(ErrorCodes.FORBIDDEN, msg, 403); }
  static validation(msg: string) { return new AppError(ErrorCodes.VALIDATION_ERROR, msg, 400); }
  static conflict(msg: string) { return new AppError(ErrorCodes.CONFLICT, msg, 409); }
}
