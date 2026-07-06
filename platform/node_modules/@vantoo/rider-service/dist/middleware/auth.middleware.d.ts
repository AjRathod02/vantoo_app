import type { FastifyRequest } from "fastify";
export declare function internalAuth(request: FastifyRequest): Promise<void>;
export declare function requireUser(request: FastifyRequest): string;
