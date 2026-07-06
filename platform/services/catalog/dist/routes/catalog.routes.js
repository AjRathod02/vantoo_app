import { productListQuerySchema, addressSchema } from "@vantoo/shared";
import { productService } from "../services/product.service.js";
import { categoryService, addressService } from "../services/category.service.js";
import { internalAuth, requireUser } from "../middleware/auth.middleware.js";
import { AppError } from "../utils/errors.js";
import { ErrorCodes } from "@vantoo/shared";
export async function catalogRoutes(app) {
    app.get("/v1/catalog/products", async (request, reply) => {
        const query = productListQuerySchema.parse(request.query);
        const brands = query.brands?.split(",").filter(Boolean);
        const result = await productService.list({ ...query, brands });
        return reply.send({
            success: true,
            data: result.items,
            meta: { total: result.total, page: query.page, limit: query.limit },
        });
    });
    app.get("/v1/catalog/products/:id", async (request, reply) => {
        const { id } = request.params;
        const product = await productService.getById(id);
        return reply.send({ success: true, data: product });
    });
    app.get("/v1/catalog/categories", async (request, reply) => {
        const { service } = request.query;
        const categories = await categoryService.list(service);
        return reply.send({ success: true, data: categories });
    });
    app.get("/v1/catalog/addresses", { preHandler: internalAuth }, async (request, reply) => {
        const userId = requireUser(request);
        const addresses = await addressService.list(userId);
        return reply.send({ success: true, data: addresses });
    });
    app.post("/v1/catalog/addresses", { preHandler: internalAuth }, async (request, reply) => {
        const userId = requireUser(request);
        const input = addressSchema.parse(request.body);
        const address = await addressService.create(userId, input);
        return reply.status(201).send({ success: true, data: address });
    });
    app.patch("/v1/catalog/addresses/:id", { preHandler: internalAuth }, async (request, reply) => {
        const userId = requireUser(request);
        const { id } = request.params;
        const input = addressSchema.partial().parse(request.body);
        const address = await addressService.update(userId, id, input);
        return reply.send({ success: true, data: address });
    });
    app.delete("/v1/catalog/addresses/:id", { preHandler: internalAuth }, async (request, reply) => {
        const userId = requireUser(request);
        const { id } = request.params;
        await addressService.remove(userId, id);
        return reply.send({ success: true, data: { message: "Address deleted" } });
    });
    app.post("/v1/catalog/stock/check", { preHandler: internalAuth }, async (request, reply) => {
        const { items } = request.body;
        const available = await productService.checkStock(items);
        return reply.send({ success: true, data: { available } });
    });
    app.get("/health", async (_request, reply) => {
        return reply.send({ status: "ok", service: "catalog-service", timestamp: new Date().toISOString() });
    });
    app.setErrorHandler((error, _request, reply) => {
        if (error instanceof AppError) {
            return reply.status(error.statusCode).send({
                success: false,
                error: { code: error.code, message: error.message },
            });
        }
        return reply.status(500).send({
            success: false,
            error: { code: ErrorCodes.INTERNAL_ERROR, message: "Internal error" },
        });
    });
}
