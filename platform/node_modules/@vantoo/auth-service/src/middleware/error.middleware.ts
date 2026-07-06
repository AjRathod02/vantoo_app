import type { FastifyInstance, FastifyError } from "fastify";
import { AppError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error: FastifyError | AppError, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      });
    }

    if (error.validation) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: error.validation,
        },
      });
    }

    logger.error({ err: error, url: request.url, method: request.method }, "Unhandled error");

    return reply.status(error.statusCode ?? 500).send({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    });
  });
}
