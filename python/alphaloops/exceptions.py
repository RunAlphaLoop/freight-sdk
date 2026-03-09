"""AlphaLoops SDK exceptions."""


class AlphaLoopsError(Exception):
    """Base exception for all SDK errors."""


class AlphaLoopsAuthError(AlphaLoopsError):
    """401 — invalid or missing API key."""

    def __init__(self, message=None):
        super().__init__(
            message
            or "Authentication failed. Set ALPHALOOPS_API_KEY or create ~/.alphaloops"
        )


class AlphaLoopsNotFoundError(AlphaLoopsError):
    """404 — carrier or resource not found."""


class AlphaLoopsRateLimitError(AlphaLoopsError):
    """429 — rate limit exceeded."""

    def __init__(self, message=None, retry_after=None):
        self.retry_after = retry_after
        super().__init__(message or "Rate limit exceeded")


class AlphaLoopsPaymentError(AlphaLoopsError):
    """402 — enrichment credits exhausted."""


class AlphaLoopsPendingError(AlphaLoopsError):
    """202 — resource being fetched asynchronously (contacts)."""

    def __init__(self, message=None, retry_after=None):
        self.retry_after = retry_after
        super().__init__(message or "Resource is being fetched asynchronously")


class AlphaLoopsAPIError(AlphaLoopsError):
    """Generic API error with status code and message."""

    def __init__(self, status_code, error="", message=""):
        self.status_code = status_code
        self.error = error
        super().__init__(f"HTTP {status_code}: {error} — {message}" if message else f"HTTP {status_code}: {error}")
