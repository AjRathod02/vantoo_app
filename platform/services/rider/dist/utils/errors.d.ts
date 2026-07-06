export declare class AppError extends Error {
    readonly code: string;
    readonly statusCode: number;
    constructor(code: string, message: string, statusCode?: number);
    static notFound(msg?: string): AppError;
    static forbidden(msg?: string): AppError;
    static conflict(msg: string): AppError;
    static validation(msg: string): AppError;
}
export declare function slugify(text: string): string;
