export declare class AlphaLoopsError extends Error {
    constructor(message: string);
}
export declare class AlphaLoopsAuthError extends AlphaLoopsError {
    constructor(message?: string);
}
export declare class AlphaLoopsNotFoundError extends AlphaLoopsError {
    constructor(message?: string);
}
export declare class AlphaLoopsRateLimitError extends AlphaLoopsError {
    retryAfter: number | undefined;
    constructor(message?: string, retryAfter?: number);
}
export declare class AlphaLoopsPaymentError extends AlphaLoopsError {
    constructor(message?: string);
}
export declare class AlphaLoopsPendingError extends AlphaLoopsError {
    retryAfter: number | undefined;
    constructor(message?: string, retryAfter?: number);
}
export declare class AlphaLoopsAPIError extends AlphaLoopsError {
    statusCode: number;
    error: string;
    constructor(statusCode: number, error?: string, message?: string);
}
