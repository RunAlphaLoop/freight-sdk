"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlphaLoopsAPIError = exports.AlphaLoopsPendingError = exports.AlphaLoopsPaymentError = exports.AlphaLoopsRateLimitError = exports.AlphaLoopsNotFoundError = exports.AlphaLoopsAuthError = exports.AlphaLoopsError = void 0;
class AlphaLoopsError extends Error {
    constructor(message) {
        super(message);
        this.name = "AlphaLoopsError";
    }
}
exports.AlphaLoopsError = AlphaLoopsError;
class AlphaLoopsAuthError extends AlphaLoopsError {
    constructor(message) {
        super(message ??
            "Authentication failed. Set ALPHALOOPS_API_KEY or create ~/.alphaloops");
        this.name = "AlphaLoopsAuthError";
    }
}
exports.AlphaLoopsAuthError = AlphaLoopsAuthError;
class AlphaLoopsNotFoundError extends AlphaLoopsError {
    constructor(message) {
        super(message ?? "Not found");
        this.name = "AlphaLoopsNotFoundError";
    }
}
exports.AlphaLoopsNotFoundError = AlphaLoopsNotFoundError;
class AlphaLoopsRateLimitError extends AlphaLoopsError {
    retryAfter;
    constructor(message, retryAfter) {
        super(message ?? "Rate limit exceeded");
        this.name = "AlphaLoopsRateLimitError";
        this.retryAfter = retryAfter;
    }
}
exports.AlphaLoopsRateLimitError = AlphaLoopsRateLimitError;
class AlphaLoopsPaymentError extends AlphaLoopsError {
    constructor(message) {
        super(message ?? "Enrichment credits exhausted");
        this.name = "AlphaLoopsPaymentError";
    }
}
exports.AlphaLoopsPaymentError = AlphaLoopsPaymentError;
class AlphaLoopsPendingError extends AlphaLoopsError {
    retryAfter;
    constructor(message, retryAfter) {
        super(message ?? "Resource is being fetched asynchronously");
        this.name = "AlphaLoopsPendingError";
        this.retryAfter = retryAfter;
    }
}
exports.AlphaLoopsPendingError = AlphaLoopsPendingError;
class AlphaLoopsAPIError extends AlphaLoopsError {
    statusCode;
    error;
    constructor(statusCode, error = "", message = "") {
        super(message
            ? `HTTP ${statusCode}: ${error} — ${message}`
            : `HTTP ${statusCode}: ${error}`);
        this.name = "AlphaLoopsAPIError";
        this.statusCode = statusCode;
        this.error = error;
    }
}
exports.AlphaLoopsAPIError = AlphaLoopsAPIError;
