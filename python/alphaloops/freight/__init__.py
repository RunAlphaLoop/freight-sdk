"""AlphaLoops Freight SDK — Python client for the FMCSA carrier data API."""

__version__ = "0.2.1"
__author__ = "AlphaLoops, Inc."

from .api_object import APIObject
from .client import AlphaLoops
from .exceptions import (
    AlphaLoopsAPIError,
    AlphaLoopsAuthError,
    AlphaLoopsError,
    AlphaLoopsNotFoundError,
    AlphaLoopsPaymentError,
    AlphaLoopsPendingError,
    AlphaLoopsRateLimitError,
)


def __getattr__(name):
    if name == "AsyncAlphaLoops":
        from .async_client import AsyncAlphaLoops
        return AsyncAlphaLoops
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")


__all__ = [
    "AlphaLoops",
    "AsyncAlphaLoops",
    "APIObject",
    "AlphaLoopsError",
    "AlphaLoopsAuthError",
    "AlphaLoopsNotFoundError",
    "AlphaLoopsRateLimitError",
    "AlphaLoopsPaymentError",
    "AlphaLoopsPendingError",
    "AlphaLoopsAPIError",
]
