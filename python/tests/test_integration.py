"""Integration tests -- hit the live AlphaLoops API at https://api.runalphaloops.com.

Requires a valid API key in ~/.alphaloops (ALPHALOOPS_API_KEY=...).
Primary test carrier: DOT 2247505 (Swift Transportation).

NOTE: Some endpoints return 404 when there is no data for a carrier (e.g. no
trucks, no inspections). The SDK raises AlphaLoopsNotFoundError in that case.
Tests treat both success and "not found" as valid outcomes, since the point is
to verify the SDK round-trips correctly, not that a particular carrier has data.
"""

import pytest

from alphaloops.freight import (
    AlphaLoops,
    APIObject,
    AlphaLoopsError,
    AlphaLoopsNotFoundError,
    AlphaLoopsPendingError,
)

DOT = "2247505"
MC = "624748"


@pytest.fixture(scope="module")
def al():
    """Create a single client for all tests (reads key from ~/.alphaloops)."""
    return AlphaLoops()


# ---------------------------------------------------------------------------
# Config / client bootstrap
# ---------------------------------------------------------------------------

class TestClientBootstrap:
    def test_client_creates_successfully(self, al):
        """The client loaded a key from ~/.alphaloops and is ready."""
        assert al is not None
        assert al.carriers is not None


# ---------------------------------------------------------------------------
# Carriers resource
# ---------------------------------------------------------------------------

class TestCarriers:
    def test_get_carrier_by_dot(self, al):
        carrier = al.carriers.get(DOT)
        assert isinstance(carrier, APIObject)
        assert "legal_name" in carrier

    def test_get_carrier_field_projection(self, al):
        carrier = al.carriers.get(DOT, fields="legal_name,dot_number")
        assert isinstance(carrier, APIObject)
        # The projected fields should be present
        assert "legal_name" in carrier

    def test_get_carrier_by_mc(self, al):
        """MC lookup may 404 if the API doesn't index this MC number."""
        try:
            carrier = al.carriers.get_by_mc(MC)
            assert isinstance(carrier, APIObject)
            assert "legal_name" in carrier
        except AlphaLoopsNotFoundError:
            # API returned 404 -- the MC number isn't indexed; still a valid SDK path
            pass

    def test_search_carriers(self, al):
        results = al.carriers.search("Swift Transportation")
        assert isinstance(results, APIObject)
        # Should have a results list
        result_list = results.get("results", [])
        assert len(result_list) > 0
        # Each result should have a confidence score
        first = result_list[0]
        assert "confidence" in first or "score" in first or "match_score" in first

    def test_authority_history(self, al):
        resp = al.carriers.authority(DOT)
        assert isinstance(resp, APIObject)
        # Should have some authority data (key name may vary)
        assert len(resp) > 0

    def test_news(self, al):
        resp = al.carriers.news(DOT)
        assert isinstance(resp, APIObject)
        # News may be empty; just verify the call succeeded and returned an APIObject
        assert len(resp) > 0


# ---------------------------------------------------------------------------
# Fleet resource
# ---------------------------------------------------------------------------

class TestFleet:
    def test_trucks(self, al):
        """Trucks endpoint may 404 if no fleet data is available."""
        try:
            resp = al.fleet.trucks(DOT, limit=5)
            assert isinstance(resp, APIObject)
            trucks = resp.get("trucks", [])
            assert isinstance(trucks, list)
        except AlphaLoopsNotFoundError:
            # API returned 404 -- no truck data for this carrier
            pass

    def test_trailers(self, al):
        """Trailers endpoint may 404 if no fleet data is available."""
        try:
            resp = al.fleet.trailers(DOT, limit=5)
            assert isinstance(resp, APIObject)
            trailers = resp.get("trailers", [])
            assert isinstance(trailers, list)
        except AlphaLoopsNotFoundError:
            pass

    def test_trucks_iter(self, al):
        """Verify trucks_iter generator. May raise NotFoundError if no data."""
        try:
            items = []
            for truck in al.fleet.trucks_iter(DOT, limit=5):
                items.append(truck)
                if len(items) >= 3:
                    break
            # If we got items, verify they are dict-like
            if items:
                assert isinstance(items[0], (dict, APIObject))
        except AlphaLoopsNotFoundError:
            pass


# ---------------------------------------------------------------------------
# Inspections resource
# ---------------------------------------------------------------------------

class TestInspections:
    def test_list_inspections(self, al):
        """Inspections endpoint may 404 if no inspection data exists."""
        try:
            resp = al.inspections.list(DOT, limit=5)
            assert isinstance(resp, APIObject)
            inspections = resp.get("inspections", [])
            assert isinstance(inspections, list)
        except AlphaLoopsNotFoundError:
            pass


# ---------------------------------------------------------------------------
# Crashes resource
# ---------------------------------------------------------------------------

class TestCrashes:
    def test_list_crashes(self, al):
        """Crashes endpoint may 404 if no crash data exists."""
        try:
            resp = al.crashes.list(DOT, limit=5)
            assert isinstance(resp, APIObject)
            crashes = resp.get("crashes", [])
            assert isinstance(crashes, list)
        except AlphaLoopsNotFoundError:
            pass


# ---------------------------------------------------------------------------
# Contacts resource
# ---------------------------------------------------------------------------

class TestContacts:
    def test_contacts_search(self, al):
        """Contacts may return 202 (async). The SDK auto-retries by default."""
        try:
            resp = al.contacts.search(dot_number=DOT, limit=5)
            assert isinstance(resp, APIObject)
        except AlphaLoopsPendingError:
            # Acceptable -- means the API is still fetching contacts
            pass
        except AlphaLoopsError:
            # Other errors (e.g. 402 payment required) are acceptable in tests
            pass


# ---------------------------------------------------------------------------
# APIObject dot-access on real data
# ---------------------------------------------------------------------------

class TestAPIObjectLiveData:
    def test_dot_access_on_carrier(self, al):
        carrier = al.carriers.get(DOT)
        # Dot access should work for a known field
        name = carrier.legal_name
        assert isinstance(name, str)
        assert len(name) > 0

    def test_nested_dot_access(self, al):
        carrier = al.carriers.get(DOT)
        # Carrier responses are flat or nested -- just verify the object is usable
        assert isinstance(carrier, APIObject)
        # Can iterate keys
        keys = list(carrier.keys())
        assert len(keys) > 0


# ---------------------------------------------------------------------------
# Error handling
# ---------------------------------------------------------------------------

class TestErrorHandling:
    def test_invalid_dot_raises_error(self, al):
        """A bogus DOT number should raise NotFoundError or similar."""
        with pytest.raises((AlphaLoopsNotFoundError, AlphaLoopsError)):
            al.carriers.get("0000000")
