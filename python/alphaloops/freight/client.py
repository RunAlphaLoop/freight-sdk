"""AlphaLoops SDK — main client class."""

from .config import resolve_config
from .exceptions import AlphaLoopsAuthError
from .http_client import HTTPClient
from .resources.carriers import CarriersResource
from .resources.contacts import ContactsResource
from .resources.crashes import CrashesResource
from .resources.fleet import FleetResource
from .resources.inspections import InspectionsResource

__all__ = ["AlphaLoops"]


class AlphaLoops:
    """Client for the AlphaLoops FMCSA carrier data API.

    Usage:
        from alphaloops import AlphaLoops

        al = AlphaLoops(api_key="ak_...")
        carrier = al.carriers.get("2247505")
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

        self._http = HTTPClient(
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

    @property
    def carriers(self):
        """Carrier profiles, search, authority history, and news."""
        if self._carriers is None:
            self._carriers = CarriersResource(self._http)
        return self._carriers

    @property
    def fleet(self):
        """Truck and trailer fleet data."""
        if self._fleet is None:
            self._fleet = FleetResource(self._http)
        return self._fleet

    @property
    def inspections(self):
        """Roadside inspections and violation details."""
        if self._inspections is None:
            self._inspections = InspectionsResource(self._http)
        return self._inspections

    @property
    def crashes(self):
        """Carrier crash history."""
        if self._crashes is None:
            self._crashes = CrashesResource(self._http)
        return self._crashes

    @property
    def contacts(self):
        """Contact search and enrichment."""
        if self._contacts is None:
            self._contacts = ContactsResource(self._http)
        return self._contacts
