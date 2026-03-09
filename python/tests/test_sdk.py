#!/usr/bin/env python3
"""Self-contained unit tests for the AlphaLoops SDK.

Run:  python3 tests/test_sdk.py
No pytest, no dependencies beyond the stdlib + requests (for the mock server).
"""

import json
import sys
import os
import threading
import traceback
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Make sure we import from the local package, not an installed one
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from alphaloops import AlphaLoops, APIObject
from alphaloops.config import resolve_config, _read_config_file
from alphaloops.exceptions import (
    AlphaLoopsAuthError,
    AlphaLoopsNotFoundError,
    AlphaLoopsRateLimitError,
    AlphaLoopsPaymentError,
    AlphaLoopsPendingError,
    AlphaLoopsAPIError,
)

# ---------------------------------------------------------------------------
# Fake API server
# ---------------------------------------------------------------------------

FAKE_CARRIER = {
    "dot_number": "2247505",
    "legal_name": "SWIFT TRANSPORTATION CO OF ARIZONA LLC",
    "dba_name": "SWIFT TRANSPORTATION",
    "mc_number": "MC-728261",
    "operating_authority_status": "AUTHORIZED",
    "phone": "+1 800-800-2200",
    "physical_address": {"street": "2200 S 75TH AVE", "city": "PHOENIX", "state": "AZ", "zip": "85043"},
    "power_units": 18643,
    "drivers": 22891,
}

FAKE_SEARCH = {
    "total_results": 2,
    "results": [
        {"dot_number": "2247505", "legal_name": "SWIFT TRANSPORTATION CO OF ARIZONA LLC", "confidence": 0.95},
        {"dot_number": "1156843", "legal_name": "SWIFT TRANSPORTATION SERVICES LLC", "confidence": 0.82},
    ],
    "pagination": {"page": 1, "limit": 10, "total_results": 2, "total_pages": 1},
}

FAKE_TRUCKS = {
    "dot_number": "2247505",
    "total_trucks": 2,
    "trucks": [
        {"vin": "1XKYD49X0MJ441234", "make": "KENWORTH", "model": "T680", "model_year": 2022},
        {"vin": "3AKJHHDR5NSNA5678", "make": "FREIGHTLINER", "model": "CASCADIA", "model_year": 2023},
    ],
    "limit": 50, "offset": 0, "total_results": 2,
}

FAKE_TRAILERS = {
    "dot_number": "2247505",
    "total_trailers": 1,
    "trailers": [{"vin": "1JJV532D8ML920456", "manufacturer": "WABASH", "trailer_type": "VAN/ENCLOSED BOX", "reefer": False}],
    "limit": 50, "offset": 0, "total_results": 1,
}

FAKE_INSPECTIONS = {
    "dot_number": "2247505",
    "total_inspections": 1,
    "inspections": [{"inspection_id": "AZ2024061512345", "date": "2024-06-15", "state": "AZ", "level": 1, "violations_total": 2}],
    "limit": 50, "offset": 0, "total_results": 1,
}

FAKE_VIOLATIONS = {
    "inspection_id": "AZ2024061512345",
    "total_violations": 1,
    "violations": [{"violation_code": "393.100", "description": "ADB - No or Defective ABS", "oos": True, "basic_category": "Vehicle Maintenance"}],
    "pagination": {"page": 1, "limit": 25, "total_results": 1, "total_pages": 1},
}

FAKE_CRASHES = {
    "dot_number": "2247505",
    "total_crashes": 1,
    "crashes": [{"crash_id": "TX20240322-0041", "date": "2024-03-22", "state": "TX", "severity": "INJURY", "fatalities": 0, "injuries": 1}],
    "pagination": {"page": 1, "limit": 25, "total_results": 1, "total_pages": 1},
}

FAKE_AUTHORITY = {
    "dot_number": "2247505",
    "total_records": 1,
    "authority_history": [{"docket_number": "MC-728261", "authority_type": "COMMON", "original_action": "GRANT"}],
    "limit": 50, "offset": 0,
}

FAKE_NEWS = {
    "dot_number": "2247505",
    "total_results": 1,
    "articles": [{"id": "abc123", "title": "Trucking News", "sentiment": "neutral", "source": "example.com"}],
}

FAKE_CONTACTS = {
    "dot_number": "90849",
    "total_contacts": 1,
    "contacts": [{"id": "PEK_0000", "full_name": "John Doe", "job_title": "VP Operations", "job_title_levels": ["vp"]}],
    "pagination": {"page": 1, "limit": 25, "total_results": 1, "total_pages": 1},
}

FAKE_ENRICH = {
    "id": "PEK_0000",
    "full_name": "John Doe",
    "work_email": "john@example.com",
    "phone_numbers": ["+1 555-0100"],
    "skills": ["logistics", "supply chain"],
    "credits": {"remaining": 49, "total": 50, "used": 1},
}

# Track how many times contacts/search has been called (for 202 retry test)
_contacts_search_call_count = 0


class FakeHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # silence logs

    def do_GET(self):
        global _contacts_search_call_count
        parsed = urlparse(self.path)
        path = parsed.path
        params = parse_qs(parsed.query)

        # Auth check
        auth = self.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            self._respond(401, {"error": "Unauthorized", "message": "Missing API key"})
            return

        if auth == "Bearer bad_key":
            self._respond(401, {"error": "Unauthorized", "message": "Invalid API key"})
            return

        # Route matching
        if path == "/v1/carriers/2247505":
            # Check field projection
            fields = params.get("fields", [None])[0]
            if fields:
                projected = {k: v for k, v in FAKE_CARRIER.items() if k in fields.split(",")}
                self._respond(200, projected)
            else:
                self._respond(200, FAKE_CARRIER)
        elif path == "/v1/carriers/mc/MC-728261":
            self._respond(200, FAKE_CARRIER)
        elif path == "/v1/carriers/search":
            self._respond(200, FAKE_SEARCH)
        elif path == "/v1/carriers/2247505/authority":
            self._respond(200, FAKE_AUTHORITY)
        elif path == "/v1/carriers/2247505/news":
            self._respond(200, FAKE_NEWS)
        elif path == "/v1/carriers/2247505/trucks":
            self._respond(200, FAKE_TRUCKS)
        elif path == "/v1/carriers/2247505/trailers":
            self._respond(200, FAKE_TRAILERS)
        elif path == "/v1/carriers/2247505/inspections":
            self._respond(200, FAKE_INSPECTIONS)
        elif path == "/v1/inspections/AZ2024061512345/violations":
            self._respond(200, FAKE_VIOLATIONS)
        elif path == "/v1/carriers/2247505/crashes":
            self._respond(200, FAKE_CRASHES)
        elif path == "/v1/contacts/search":
            _contacts_search_call_count += 1
            if _contacts_search_call_count <= 2:
                # First 2 calls return 202
                self.send_response(202)
                self.send_header("Content-Type", "application/json")
                self.send_header("Retry-After", "0")  # immediate retry in tests
                self.end_headers()
                body = {"status": "pending", "message": "Contacts being fetched", "retry_after": 0}
                self.wfile.write(json.dumps(body).encode())
            else:
                self._respond(200, FAKE_CONTACTS)
        elif path.startswith("/v1/contacts/") and path.endswith("/enrich"):
            self._respond(200, FAKE_ENRICH)
        elif path == "/v1/carriers/9999999":
            self._respond(404, {"error": "Not Found", "message": "Carrier does not exist"})
        elif path == "/v1/carriers/ratelimited":
            self.send_response(429)
            self.send_header("Content-Type", "application/json")
            self.send_header("Retry-After", "0")
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Rate Limited", "message": "Too many requests"}).encode())
        elif path == "/v1/carriers/payment":
            self._respond(402, {"error": "Payment Required", "message": "Credits exhausted"})
        else:
            self._respond(404, {"error": "Not Found", "message": f"Unknown path: {path}"})

    def _respond(self, status, data):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())


def start_fake_server():
    server = HTTPServer(("127.0.0.1", 0), FakeHandler)
    port = server.server_address[1]
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server, port


# ---------------------------------------------------------------------------
# Test runner
# ---------------------------------------------------------------------------

_passed = 0
_failed = 0
_errors = []


def test(name):
    """Decorator that registers and runs a test function."""
    def decorator(fn):
        global _passed, _failed
        try:
            fn()
            _passed += 1
            print(f"  PASS  {name}")
        except Exception as e:
            _failed += 1
            tb = traceback.format_exc()
            _errors.append((name, tb))
            print(f"  FAIL  {name}\n        {e}")
        return fn
    return decorator


def assert_eq(a, b, msg=""):
    if a != b:
        raise AssertionError(f"{msg}: {a!r} != {b!r}" if msg else f"{a!r} != {b!r}")


def assert_true(val, msg=""):
    if not val:
        raise AssertionError(msg or f"Expected truthy, got {val!r}")


def assert_raises(exc_type, fn):
    try:
        fn()
    except exc_type:
        return
    except Exception as e:
        raise AssertionError(f"Expected {exc_type.__name__}, got {type(e).__name__}: {e}")
    raise AssertionError(f"Expected {exc_type.__name__}, nothing was raised")


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def main():
    global _contacts_search_call_count

    print("\n=== AlphaLoops SDK Tests ===\n")

    # Start fake server
    server, port = start_fake_server()
    base = f"http://127.0.0.1:{port}"

    # Create client pointing at fake server
    al = AlphaLoops(api_key="ak_test_key", base_url=base)

    # -- APIObject tests --

    @test("APIObject: dot-access on flat dict")
    def _():
        obj = APIObject.from_response({"name": "Alice", "age": 30})
        assert_eq(obj.name, "Alice")
        assert_eq(obj.age, 30)
        assert_eq(obj["name"], "Alice")

    @test("APIObject: nested dot-access")
    def _():
        obj = APIObject.from_response({"address": {"city": "Phoenix", "state": "AZ"}})
        assert_eq(obj.address.city, "Phoenix")
        assert_eq(obj.address.state, "AZ")

    @test("APIObject: list wrapping")
    def _():
        result = APIObject.from_response([{"a": 1}, {"a": 2}])
        assert_eq(len(result), 2)
        assert_eq(result[0].a, 1)
        assert_eq(result[1].a, 2)

    @test("APIObject: json.dumps round-trip")
    def _():
        original = {"x": 1, "nested": {"y": 2}}
        obj = APIObject.from_response(original)
        dumped = json.dumps(obj)
        loaded = json.loads(dumped)
        assert_eq(loaded, original)

    @test("APIObject: .keys(), .get(), 'in' operator")
    def _():
        obj = APIObject.from_response({"a": 1, "b": 2})
        assert_eq(set(obj.keys()), {"a", "b"})
        assert_eq(obj.get("a"), 1)
        assert_eq(obj.get("missing", "default"), "default")
        assert_true("a" in obj)
        assert_true("z" not in obj)

    @test("APIObject: missing attr raises AttributeError")
    def _():
        obj = APIObject.from_response({"a": 1})
        assert_raises(AttributeError, lambda: obj.no_such_field)

    @test("APIObject: repr is compact")
    def _():
        obj = APIObject.from_response({"a": 1})
        r = repr(obj)
        assert_true("APIObject" in r)
        assert_true("a=1" in r)

    # -- Config tests --

    @test("Config: explicit args take priority")
    def _():
        key, url = resolve_config(api_key="ak_explicit", base_url="http://custom")
        assert_eq(key, "ak_explicit")
        assert_eq(url, "http://custom")

    @test("Config: default base_url when none provided")
    def _():
        key, url = resolve_config(api_key="ak_x")
        assert_eq(url, "https://api.runalphaloops.com")

    @test("Config: env var resolution")
    def _():
        os.environ["ALPHALOOPS_API_KEY"] = "ak_from_env"
        os.environ["ALPHALOOPS_BASE_URL"] = "http://env-server"
        try:
            key, url = resolve_config()
            assert_eq(key, "ak_from_env")
            assert_eq(url, "http://env-server")
        finally:
            del os.environ["ALPHALOOPS_API_KEY"]
            del os.environ["ALPHALOOPS_BASE_URL"]

    # -- Auth tests --

    @test("Client: missing API key raises AlphaLoopsAuthError")
    def _():
        # Clear env to ensure no key is found
        old = os.environ.pop("ALPHALOOPS_API_KEY", None)
        try:
            assert_raises(AlphaLoopsAuthError, lambda: AlphaLoops())
        finally:
            if old is not None:
                os.environ["ALPHALOOPS_API_KEY"] = old

    # -- Carriers --

    @test("carriers.get: returns full profile with dot-access")
    def _():
        c = al.carriers.get("2247505")
        assert_eq(c.dot_number, "2247505")
        assert_eq(c.legal_name, "SWIFT TRANSPORTATION CO OF ARIZONA LLC")
        assert_eq(c.physical_address.city, "PHOENIX")
        assert_eq(c.power_units, 18643)

    @test("carriers.get: field projection")
    def _():
        c = al.carriers.get("2247505", fields="legal_name,power_units")
        assert_eq(c.legal_name, "SWIFT TRANSPORTATION CO OF ARIZONA LLC")
        assert_eq(c.power_units, 18643)
        # Should NOT have fields we didn't ask for
        assert_true("phone" not in c)

    @test("carriers.get_by_mc: lookup by MC number")
    def _():
        c = al.carriers.get_by_mc("MC-728261")
        assert_eq(c.dot_number, "2247505")

    @test("carriers.search: returns results with confidence")
    def _():
        r = al.carriers.search("Swift")
        assert_eq(r.total_results, 2)
        assert_eq(len(r.results), 2)
        assert_eq(r.results[0].confidence, 0.95)
        assert_eq(r.pagination.total_pages, 1)

    @test("carriers.search_iter: yields individual results")
    def _():
        results = list(al.carriers.search_iter("Swift"))
        assert_eq(len(results), 2)
        assert_eq(results[0].dot_number, "2247505")

    @test("carriers.authority: returns history")
    def _():
        r = al.carriers.authority("2247505")
        assert_eq(r.total_records, 1)
        assert_eq(r.authority_history[0].authority_type, "COMMON")

    @test("carriers.news: returns articles")
    def _():
        r = al.carriers.news("2247505")
        assert_eq(r.total_results, 1)
        assert_eq(r.articles[0].title, "Trucking News")

    # -- Fleet --

    @test("fleet.trucks: returns truck list")
    def _():
        r = al.fleet.trucks("2247505")
        assert_eq(r.total_trucks, 2)
        assert_eq(r.trucks[0].make, "KENWORTH")
        assert_eq(r.trucks[1].model, "CASCADIA")

    @test("fleet.trucks_iter: yields individual trucks")
    def _():
        trucks = list(al.fleet.trucks_iter("2247505"))
        assert_eq(len(trucks), 2)
        assert_eq(trucks[0].vin, "1XKYD49X0MJ441234")

    @test("fleet.trailers: returns trailer list")
    def _():
        r = al.fleet.trailers("2247505")
        assert_eq(r.total_trailers, 1)
        assert_eq(r.trailers[0].manufacturer, "WABASH")
        assert_eq(r.trailers[0].reefer, False)

    # -- Inspections --

    @test("inspections.list: returns inspection history")
    def _():
        r = al.inspections.list("2247505")
        assert_eq(r.total_inspections, 1)
        assert_eq(r.inspections[0].inspection_id, "AZ2024061512345")

    @test("inspections.violations: returns violation details")
    def _():
        r = al.inspections.violations("AZ2024061512345")
        assert_eq(r.total_violations, 1)
        assert_eq(r.violations[0].violation_code, "393.100")
        assert_eq(r.violations[0].oos, True)

    # -- Crashes --

    @test("crashes.list: returns crash history")
    def _():
        r = al.crashes.list("2247505")
        assert_eq(r.total_crashes, 1)
        assert_eq(r.crashes[0].severity, "INJURY")
        assert_eq(r.crashes[0].fatalities, 0)

    # -- Contacts --

    @test("contacts.search: auto-retries 202 then succeeds")
    def _():
        _contacts_search_call_count = 0  # noqa — reset global
        # Will get 202 twice (call 1, 2), then 200 on call 3
        # Need to reset the global in FakeHandler
        globals()["_contacts_search_call_count"] = 0
        r = al.contacts.search(dot_number="90849")
        assert_eq(r.total_contacts, 1)
        assert_eq(r.contacts[0].full_name, "John Doe")
        assert_eq(r.contacts[0].job_title_levels, ["vp"])

    @test("contacts.search: auto_retry=False raises PendingError on 202")
    def _():
        globals()["_contacts_search_call_count"] = 0
        assert_raises(AlphaLoopsPendingError, lambda: al.contacts.search(dot_number="90849", auto_retry=False))

    @test("contacts.enrich: returns enriched profile")
    def _():
        r = al.contacts.enrich("PEK_0000")
        assert_eq(r.full_name, "John Doe")
        assert_eq(r.work_email, "john@example.com")
        assert_eq(r.skills, ["logistics", "supply chain"])
        assert_eq(r.credits.remaining, 49)

    # -- Error handling --

    @test("404: raises AlphaLoopsNotFoundError")
    def _():
        assert_raises(AlphaLoopsNotFoundError, lambda: al.carriers.get("9999999"))

    @test("402: raises AlphaLoopsPaymentError")
    def _():
        assert_raises(AlphaLoopsPaymentError, lambda: al.carriers.get("payment"))

    @test("401: bad key raises AlphaLoopsAuthError")
    def _():
        bad_al = AlphaLoops(api_key="bad_key", base_url=base)
        assert_raises(AlphaLoopsAuthError, lambda: bad_al.carriers.get("2247505"))

    @test("429: rate limit is retried then raises")
    def _():
        # Our fake server always returns 429 for this path, so after max_retries it raises
        limited_al = AlphaLoops(api_key="ak_test_key", base_url=base, max_retries=1)
        assert_raises(AlphaLoopsRateLimitError, lambda: limited_al.carriers.get("ratelimited"))

    # -- Summary --
    print(f"\n{'='*40}")
    print(f"  {_passed} passed, {_failed} failed")
    if _errors:
        print(f"\nFailure details:")
        for name, tb in _errors:
            print(f"\n--- {name} ---")
            print(tb)
    print()

    server.shutdown()
    sys.exit(1 if _failed else 0)


if __name__ == "__main__":
    main()
