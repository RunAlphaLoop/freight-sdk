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
        assert "J B HUNT" in carrier.legal_name.upper()
        assert carrier.dot_number == "80806"
        assert isinstance(carrier.dba_name, str)
        assert isinstance(carrier.carrier_operation, str)
        assert isinstance(carrier.phone, str)
        assert isinstance(carrier.power_units, int)
        assert isinstance(carrier.drivers, int)
        assert isinstance(carrier.safety_rating, str)
        assert isinstance(carrier.physical_address, dict)
        assert isinstance(carrier.physical_address["street"], str)
        assert isinstance(carrier.physical_address["city"], str)
        assert isinstance(carrier.physical_address["state"], str)
        assert isinstance(carrier.physical_address["zip"], str)

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
        assert isinstance(first.dot_number, str)
        assert isinstance(first.legal_name, str)
        assert isinstance(first.confidence, (int, float))

    def test_authority_history(self, al):
        resp = al.carriers.authority(DOT)
        assert isinstance(resp, APIObject)
        assert resp.total_records > 0
        history = resp.authority_history
        assert len(history) > 0
        first = history[0]
        assert isinstance(first.docket_number, str)
        assert isinstance(first.authority_type, str)
        assert isinstance(first.original_action, str)
        assert isinstance(first.original_served_date, str)

    def test_news(self, al):
        resp = al.carriers.news(DOT)
        assert isinstance(resp, APIObject)
        articles = resp.articles
        assert len(articles) > 0
        article = articles[0]
        assert isinstance(article.id, str)
        assert isinstance(article.title, str)
        assert isinstance(article.source, str)
        assert isinstance(article.date, str)
        assert isinstance(article.sentiment, str)
        assert isinstance(article.url, str)


# ---------------------------------------------------------------------------
# Fleet resource
# ---------------------------------------------------------------------------

class TestFleet:
    def test_trucks(self, al):
        resp = al.fleet.trucks(DOT, limit=5)
        assert isinstance(resp, APIObject)
        assert resp.total_trucks > 0
        trucks = resp.trucks
        assert len(trucks) > 0
        truck = trucks[0]
        assert isinstance(truck.vin, str)
        assert isinstance(truck.make, str)
        assert isinstance(truck.model, str)
        assert isinstance(truck.model_year, str)
        assert isinstance(truck.cab_type, str)
        assert isinstance(truck.gross_weight, str)
        assert isinstance(truck.body_type, str)
        assert isinstance(truck.engine_type, str)

    def test_trailers(self, al):
        resp = al.fleet.trailers(DOT, limit=5)
        assert isinstance(resp, APIObject)
        assert resp.total_trailers > 0
        trailers = resp.trailers
        assert len(trailers) > 0
        trailer = trailers[0]
        assert isinstance(trailer.vin, str)
        assert isinstance(trailer.manufacturer, str)
        assert isinstance(trailer.model_year, str)
        assert isinstance(trailer.trailer_type, str)
        assert isinstance(trailer.reefer, bool)

    def test_trucks_iter(self, al):
        items = []
        for truck in al.fleet.trucks_iter(DOT, limit=5):
            items.append(truck)
            if len(items) >= 3:
                break
        assert len(items) == 3
        assert isinstance(items[0].vin, str)
        assert isinstance(items[0].make, str)
        assert isinstance(items[0].model_year, str)


# ---------------------------------------------------------------------------
# Inspections resource
# ---------------------------------------------------------------------------

class TestInspections:
    def test_list_inspections(self, al):
        resp = al.inspections.list(DOT, limit=5)
        assert isinstance(resp, APIObject)
        assert resp.total_inspections > 0
        inspections = resp.inspections
        assert len(inspections) > 0
        insp = inspections[0]
        assert isinstance(insp.inspection_id, int)
        assert isinstance(insp.report_number, str)
        assert isinstance(insp.date, str)
        assert isinstance(insp.state, str)
        assert isinstance(insp.level, int)
        assert isinstance(insp.violations_total, int)
        assert isinstance(insp.oos_total, int)
        assert isinstance(insp.oos_driver, bool)
        assert isinstance(insp.oos_vehicle, bool)


# ---------------------------------------------------------------------------
# Crashes resource
# ---------------------------------------------------------------------------

class TestCrashes:
    def test_list_crashes(self, al):
        resp = al.crashes.list(DOT, limit=5)
        assert isinstance(resp, APIObject)
        assert resp.total_crashes > 0
        crashes = resp.crashes
        assert len(crashes) > 0
        crash = crashes[0]
        assert isinstance(crash.crash_id, str)
        assert isinstance(crash.report_number, str)
        assert isinstance(crash.date, str)
        assert isinstance(crash.state, str)
        assert isinstance(crash.fatalities, int)
        assert isinstance(crash.injuries, int)
        assert isinstance(crash.severity, str)
        assert isinstance(crash.tow_away, bool)
        assert isinstance(crash.weather_condition, str)
        assert isinstance(crash.road_surface_condition, str)


# ---------------------------------------------------------------------------
# Contacts resource
# ---------------------------------------------------------------------------

class TestContacts:
    def test_contacts_search(self, al):
        """Contacts may return 202 (async). The SDK auto-retries by default."""
        resp = al.contacts.search(dot_number=DOT, limit=5)
        assert isinstance(resp, APIObject)
        assert resp.total_contacts > 0
        contacts = resp.contacts
        assert len(contacts) > 0
        contact = contacts[0]
        assert isinstance(contact.id, str)
        assert isinstance(contact.full_name, str)
        assert isinstance(contact.first_name, str)
        assert isinstance(contact.last_name, str)
        assert isinstance(contact.job_title, str)
        assert isinstance(contact.job_title_levels, list)
        assert isinstance(contact.linkedin_url, str)


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

    def test_to_dict(self, al):
        carrier = al.carriers.get(DOT)
        d = carrier.to_dict()
        assert isinstance(d, dict)
        assert not isinstance(d, APIObject)
        assert d["legal_name"] == carrier.legal_name
        # Nested objects should be plain dicts too
        assert isinstance(d["physical_address"], dict)
        assert not isinstance(d["physical_address"], APIObject)

    def test_to_json(self, al):
        carrier = al.carriers.get(DOT)
        j = carrier.to_json()
        assert isinstance(j, str)
        import json
        parsed = json.loads(j)
        assert parsed["legal_name"] == carrier.legal_name
        assert isinstance(parsed["physical_address"], dict)


# ---------------------------------------------------------------------------
# Error handling
# ---------------------------------------------------------------------------

class TestErrorHandling:
    def test_invalid_dot_raises_error(self, al):
        """A bogus DOT number should raise NotFoundError or similar."""
        with pytest.raises((AlphaLoopsNotFoundError, AlphaLoopsError)):
            al.carriers.get("0000000")
