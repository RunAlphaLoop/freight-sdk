"""Integration tests -- hit the live AlphaLoops API at https://api.runalphaloops.com.

Requires a valid API key in ~/.alphaloops (ALPHALOOPS_API_KEY=...).
Primary test carrier: DOT 80806 (J B Hunt Transport Inc).
"""

import pytest

from alphaloops.freight import (
    AlphaLoops,
    APIObject,
    AlphaLoopsError,
    AlphaLoopsNotFoundError,
    AlphaLoopsPendingError,
)

DOT = "80806"


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
        assert "J B HUNT" in carrier.legal_name.upper()

    def test_get_carrier_field_projection(self, al):
        carrier = al.carriers.get(DOT, fields="legal_name,dot_number")
        assert isinstance(carrier, APIObject)
        assert "legal_name" in carrier
        assert "dot_number" in carrier

    def test_search_carriers(self, al):
        results = al.carriers.search("JB Hunt")
        assert isinstance(results, APIObject)
        result_list = results.get("results", [])
        assert len(result_list) > 0
        first = result_list[0]
        assert "confidence" in first or "score" in first or "match_score" in first

    def test_authority_history(self, al):
        resp = al.carriers.authority(DOT)
        assert isinstance(resp, APIObject)
        history = resp.get("authority_history", [])
        assert isinstance(history, list)
        assert len(history) > 0

    def test_news(self, al):
        resp = al.carriers.news(DOT)
        assert isinstance(resp, APIObject)
        articles = resp.get("articles", [])
        assert isinstance(articles, list)
        assert len(articles) > 0


# ---------------------------------------------------------------------------
# Fleet resource
# ---------------------------------------------------------------------------

class TestFleet:
    def test_trucks(self, al):
        resp = al.fleet.trucks(DOT, limit=5)
        assert isinstance(resp, APIObject)
        trucks = resp.get("trucks", [])
        assert isinstance(trucks, list)
        assert len(trucks) > 0

    def test_trailers(self, al):
        resp = al.fleet.trailers(DOT, limit=5)
        assert isinstance(resp, APIObject)
        trailers = resp.get("trailers", [])
        assert isinstance(trailers, list)
        assert len(trailers) > 0

    def test_trucks_iter(self, al):
        items = []
        for truck in al.fleet.trucks_iter(DOT, limit=5):
            items.append(truck)
            if len(items) >= 3:
                break
        assert len(items) == 3
        assert isinstance(items[0], (dict, APIObject))


# ---------------------------------------------------------------------------
# Inspections resource
# ---------------------------------------------------------------------------

class TestInspections:
    def test_list_inspections(self, al):
        resp = al.inspections.list(DOT, limit=5)
        assert isinstance(resp, APIObject)
        inspections = resp.get("inspections", [])
        assert isinstance(inspections, list)
        assert len(inspections) > 0


# ---------------------------------------------------------------------------
# Crashes resource
# ---------------------------------------------------------------------------

class TestCrashes:
    def test_list_crashes(self, al):
        resp = al.crashes.list(DOT, limit=5)
        assert isinstance(resp, APIObject)
        crashes = resp.get("crashes", [])
        assert isinstance(crashes, list)
        assert len(crashes) > 0


# ---------------------------------------------------------------------------
# Contacts resource
# ---------------------------------------------------------------------------

class TestContacts:
    def test_contacts_search(self, al):
        """Contacts may return 202 (async). The SDK auto-retries by default."""
        try:
            resp = al.contacts.search(dot_number=DOT, limit=5)
            assert isinstance(resp, APIObject)
            contacts = resp.get("contacts", [])
            assert isinstance(contacts, list)
            assert len(contacts) > 0
        except AlphaLoopsPendingError:
            pass
        except AlphaLoopsError:
            pass


# ---------------------------------------------------------------------------
# APIObject dot-access on real data
# ---------------------------------------------------------------------------

class TestAPIObjectLiveData:
    def test_dot_access_on_carrier(self, al):
        carrier = al.carriers.get(DOT)
        name = carrier.legal_name
        assert isinstance(name, str)
        assert len(name) > 0

    def test_dict_behavior(self, al):
        carrier = al.carriers.get(DOT)
        assert isinstance(carrier, APIObject)
        keys = list(carrier.keys())
        assert len(keys) > 0
        assert "legal_name" in carrier
        assert carrier["legal_name"] == carrier.legal_name


# ---------------------------------------------------------------------------
# Error handling
# ---------------------------------------------------------------------------

class TestErrorHandling:
    def test_invalid_dot_raises_error(self, al):
        """A bogus DOT number should raise NotFoundError or similar."""
        with pytest.raises((AlphaLoopsNotFoundError, AlphaLoopsError)):
            al.carriers.get("0000000")
