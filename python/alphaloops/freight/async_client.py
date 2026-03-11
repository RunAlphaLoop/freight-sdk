"""AlphaLoops SDK — async client class."""

from .config import resolve_config
from .exceptions import AlphaLoopsAuthError
from .async_http_client import AsyncHTTPClient
from .resources.async_carriers import AsyncCarriersResource
from .resources.async_contacts import AsyncContactsResource
from .resources.async_crashes import AsyncCrashesResource
from .resources.async_fleet import AsyncFleetResource
from .resources.async_inspections import AsyncInspectionsResource

__all__ = ["AsyncAlphaLoops"]


class AsyncAlphaLoops:
    """Async client for the AlphaLoops FMCSA carrier data API.

    Usage:
        from alphaloops.freight import AsyncAlphaLoops

        async with AsyncAlphaLoops(api_key="ak_...") as al:
            carrier = await al.carriers.get("2247505")
            print(carrier.legal_name)
    """

    def __init__(
        self,
        api_key=None,
        base_url=None,
        timeout=30,
        max_retries=3,
        retry_base_delay=1.0,
    ):
        from . import __version__

        resolved_key, resolved_url = resolve_config(api_key, base_url)

        if not resolved_key:
            raise AlphaLoopsAuthError()

        self._http = AsyncHTTPClient(
            base_url=resolved_url,
            api_key=resolved_key,
            timeout=timeout,
            max_retries=max_retries,
            retry_base_delay=retry_base_delay,
            version=__version__,
        )

        self._carriers = None
        self._fleet = None
        self._inspections = None
        self._crashes = None
        self._contacts = None

    async def close(self):
        """Close the underlying HTTP client."""
        await self._http.close()

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()

    @property
    def carriers(self):
        if self._carriers is None:
            self._carriers = AsyncCarriersResource(self._http)
        return self._carriers

    @property
    def fleet(self):
        if self._fleet is None:
            self._fleet = AsyncFleetResource(self._http)
        return self._fleet

    @property
    def inspections(self):
        if self._inspections is None:
            self._inspections = AsyncInspectionsResource(self._http)
        return self._inspections

    @property
    def crashes(self):
        if self._crashes is None:
            self._crashes = AsyncCrashesResource(self._http)
        return self._crashes

    @property
    def contacts(self):
        if self._contacts is None:
            self._contacts = AsyncContactsResource(self._http)
        return self._contacts
