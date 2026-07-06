export declare const ErrorCodes: {
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly UNAUTHORIZED: "UNAUTHORIZED";
    readonly FORBIDDEN: "FORBIDDEN";
    readonly NOT_FOUND: "NOT_FOUND";
    readonly CONFLICT: "CONFLICT";
    readonly RATE_LIMITED: "RATE_LIMITED";
    readonly ACCOUNT_LOCKED: "ACCOUNT_LOCKED";
    readonly ACCOUNT_SUSPENDED: "ACCOUNT_SUSPENDED";
    readonly INVALID_CREDENTIALS: "INVALID_CREDENTIALS";
    readonly INVALID_OTP: "INVALID_OTP";
    readonly OTP_EXPIRED: "OTP_EXPIRED";
    readonly OTP_MAX_ATTEMPTS: "OTP_MAX_ATTEMPTS";
    readonly TOKEN_EXPIRED: "TOKEN_EXPIRED";
    readonly TOKEN_INVALID: "TOKEN_INVALID";
    readonly SESSION_REVOKED: "SESSION_REVOKED";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
};
export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
