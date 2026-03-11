"""Async HTTP client with retries, rate-limit handling, and error mapping."""

import asyncio

import httpx

from .api_object import APIObject
from .exceptions import (
    AlphaLoopsAPIError,
    AlphaLoopsAuthError,
    AlphaLoopsNotFoundError,
    AlphaLoopsPaymentError,
    AlphaLoopsRateLimitError,
)

# Status codes that trigger automatic retry
_RETRYABLE = {500, 502, 503, 504}


class AsyncHTTPClient:
    def __init__(self, base_url, api_key, timeout, max_retries, retry_base_delay, version):
        self._base_url = base_url.rstrip("/")
        self._timeout = timeout
        self._max_retries = max_retries
        self._retry_base_delay = retry_base_delay

        self._client = httpx.AsyncClient(
            headers={
                "Authorization": f"Bearer {api_key}",
                "User-Agent": f"AlphaLoops-Python/{version}",
                "Accept": "application/json",
            },
            timeout=timeout,
        )

    async def close(self):
        await self._client.aclose()

    async def get(self, path, params=None):
        """GET request → APIObject (or list of APIObject)."""
        resp = await self._request_raw("GET", path, params=params)
        self._raise_for_status(resp)
        data = resp.json()
        return APIObject.from_response(data)

    async def get_raw(self, path, params=None):
        """GET request → raw httpx.Response (for status code inspection)."""
        return await self._request_raw("GET", path, params=params)

    async def _request_raw(self, method, path, **kwargs):
        url = f"{self._base_url}{path}"
        last_exc = None

        for attempt in range(self._max_retries + 1):
            try:
                resp = await self._client.request(method, url, **kwargs)
            except (httpx.ConnectError, httpx.TimeoutException) as exc:
                last_exc = exc
                if attempt < self._max_retries:
                    await asyncio.sleep(self._retry_base_delay * (2 ** attempt))
                    continue
                raise AlphaLoopsAPIError(0, "ConnectionError", str(exc)) from exc

            if resp.status_code == 401:
                self._raise_for_status(resp)

            if resp.status_code == 429:
                if attempt < self._max_retries:
                    retry_after = _parse_retry_after(resp)
                    await asyncio.sleep(retry_after)
                    continue
                self._raise_for_status(resp)

            if resp.status_code in _RETRYABLE:
                if attempt < self._max_retries:
                    await asyncio.sleep(self._retry_base_delay * (2 ** attempt))
                    continue
                self._raise_for_status(resp)

            return resp

        if last_exc:
            raise AlphaLoopsAPIError(0, "ConnectionError", str(last_exc)) from last_exc
        raise AlphaLoopsAPIError(0, "UnknownError", "Request failed after retries")

    def _raise_for_status(self, resp):
        if resp.status_code < 400:
            return

        try:
            body = resp.json()
        except Exception:
            body = {}

        error = body.get("error", "")
        message = body.get("message", resp.text)

        if resp.status_code == 401:
            raise AlphaLoopsAuthError(message)
        elif resp.status_code == 402:
            raise AlphaLoopsPaymentError(message)
        elif resp.status_code == 404:
            raise AlphaLoopsNotFoundError(message)
        elif resp.status_code == 429:
            raise AlphaLoopsRateLimitError(
                message, retry_after=_parse_retry_after(resp)
            )
        else:
            raise AlphaLoopsAPIError(resp.status_code, error, message)


def _parse_retry_after(resp):
    """Parse Retry-After header, default to 2 seconds."""
    try:
        return int(resp.headers.get("Retry-After", 2))
    except (ValueError, TypeError):
        return 2
