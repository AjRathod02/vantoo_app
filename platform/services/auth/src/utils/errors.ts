import { ErrorCodes, type ErrorCode } from "@vantoo/shared";

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly statusCode: number = 400,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
  }

  static validation(message: string, details?: Record<string, unknown>) {
    return new AppError(ErrorCodes.VALIDATION_ERROR, message, 400, details);
  }

  static unauthorized(message = "Unauthorized") {
    return new AppError(ErrorCodes.UNAUTHORIZED, message, 401);
  }

  static forbidden(message = "Forbidden") {
    return new AppError(ErrorCodes.FORBIDDEN, message, 403);
  }

  static notFound(message = "Not found") {
    return new AppError(ErrorCodes.NOT_FOUND, message, 404);
  }

  static conflict(message: string) {
    return new AppError(ErrorCodes.CONFLICT, message, 409);
  }

  static rateLimited(message = "Too many requests") {
    return new AppError(ErrorCodes.RATE_LIMITED, message, 429);
  }

  static internal(message = "Internal server error") {
    return new AppError(ErrorCodes.INTERNAL_ERROR, message, 500);
  }
}
