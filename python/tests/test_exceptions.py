"""Tests for AlphaLoops exception hierarchy."""

import pytest

from alphaloops.freight.exceptions import (
    AlphaLoopsAPIError,
    AlphaLoopsAuthError,
    AlphaLoopsError,
    AlphaLoopsNotFoundError,
    AlphaLoopsPaymentError,
    AlphaLoopsPendingError,
    AlphaLoopsRateLimitError,
)


class TestHierarchy:
    def test_all_inherit_from_base(self):
        for exc_cls in [
            AlphaLoopsAuthError,
            AlphaLoopsNotFoundError,
            AlphaLoopsRateLimitError,
            AlphaLoopsPaymentError,
            AlphaLoopsPendingError,
            AlphaLoopsAPIError,
        ]:
            assert issubclass(exc_cls, AlphaLoopsError)

    def test_base_inherits_from_exception(self):
        assert issubclass(AlphaLoopsError, Exception)


class TestAuthError:
    def test_default_message(self):
        e = AlphaLoopsAuthError()
        assert "Authentication failed" in str(e)

    def test_custom_message(self):
        e = AlphaLoopsAuthError("Custom auth error")
        assert str(e) == "Custom auth error"


class TestRateLimitError:
    def test_default_message(self):
        e = AlphaLoopsRateLimitError()
        assert "Rate limit" in str(e)

    def test_retry_after_attribute(self):
        e = AlphaLoopsRateLimitError(retry_after=30)
        assert e.retry_after == 30

    def test_retry_after_default_none(self):
        e = AlphaLoopsRateLimitError()
        assert e.retry_after is None


class TestPendingError:
    def test_default_message(self):
        e = AlphaLoopsPendingError()
        assert "asynchronously" in str(e)

    def test_retry_after(self):
        e = AlphaLoopsPendingError(retry_after=5)
        assert e.retry_after == 5


class TestAPIError:
    def test_status_code_attribute(self):
        e = AlphaLoopsAPIError(500, "Internal Server Error")
        assert e.status_code == 500
        assert e.error == "Internal Server Error"

    def test_message_format_with_message(self):
        e = AlphaLoopsAPIError(422, "Validation Error", "Invalid DOT number")
        assert "HTTP 422" in str(e)
        assert "Invalid DOT number" in str(e)

    def test_message_format_without_message(self):
        e = AlphaLoopsAPIError(500, "Server Error")
        assert str(e) == "HTTP 500: Server Error"


class TestNotFoundError:
    def test_message(self):
        e = AlphaLoopsNotFoundError("Carrier not found")
        assert str(e) == "Carrier not found"


class TestPaymentError:
    def test_message(self):
        e = AlphaLoopsPaymentError("Credits exhausted")
        assert str(e) == "Credits exhausted"
