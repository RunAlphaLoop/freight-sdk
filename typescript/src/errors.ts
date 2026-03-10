export class AlphaLoopsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AlphaLoopsError";
  }
}

export class AlphaLoopsAuthError extends AlphaLoopsError {
  constructor(message?: string) {
    super(
      message ??
        "Authentication failed. Set ALPHALOOPS_API_KEY or create ~/.alphaloops"
    );
    this.name = "AlphaLoopsAuthError";
  }
}

export class AlphaLoopsNotFoundError extends AlphaLoopsError {
  constructor(message?: string) {
    super(message ?? "Not found");
    this.name = "AlphaLoopsNotFoundError";
  }
}

export class AlphaLoopsRateLimitError extends AlphaLoopsError {
  retryAfter: number | undefined;

  constructor(message?: string, retryAfter?: number) {
    super(message ?? "Rate limit exceeded");
    this.name = "AlphaLoopsRateLimitError";
    this.retryAfter = retryAfter;
  }
}

export class AlphaLoopsPaymentError extends AlphaLoopsError {
  constructor(message?: string) {
    super(message ?? "Enrichment credits exhausted");
    this.name = "AlphaLoopsPaymentError";
  }
}

export class AlphaLoopsPendingError extends AlphaLoopsError {
  retryAfter: number | undefined;

  constructor(message?: string, retryAfter?: number) {
    super(message ?? "Resource is being fetched asynchronously");
    this.name = "AlphaLoopsPendingError";
    this.retryAfter = retryAfter;
  }
}

export class AlphaLoopsAPIError extends AlphaLoopsError {
  statusCode: number;
  error: string;

  constructor(statusCode: number, error = "", message = "") {
    super(
      message
        ? `HTTP ${statusCode}: ${error} — ${message}`
        : `HTTP ${statusCode}: ${error}`
    );
    this.name = "AlphaLoopsAPIError";
    this.statusCode = statusCode;
    this.error = error;
  }
}
