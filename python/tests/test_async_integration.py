"""Async integration tests -- hit the live AlphaLoops API.

Requires a valid API key in ~/.alphaloops (ALPHALOOPS_API_KEY=...).
Primary test carrier: DOT 80806 (J B Hunt Transport Inc).
"""

import pytest
import pytest_asyncio

from alphaloops.freight import (
    AsyncAlphaLoops,
    APIObject,
    AlphaLoopsError,
    AlphaLoopsNotFoundError,
)

DOT = "80806"


@pytest_asyncio.fixture(loop_scope="session", scope="session")
async def al():
    async with AsyncAlphaLoops() as client:
        yield client


@pytest.mark.asyncio(loop_scope="session")
async def test_get_carrier_by_dot(al):
    carrier = await al.carriers.get(DOT)
    assert isinstance(carrier, APIObject)
    assert "J B HUNT" in carrier.legal_name.upper()
    assert carrier.dot_number == "80806"
    assert isinstance(carrier.power_units, int)
    assert isinstance(carrier.drivers, int)
    assert isinstance(carrier.physical_address, dict)
    assert isinstance(carrier.physical_address["city"], str)


@pytest.mark.asyncio(loop_scope="session")
async def test_search_carriers(al):
    results = await al.carriers.search("JB Hunt")
    assert isinstance(results, APIObject)
    result_list = results.get("results", [])
    assert len(result_list) > 0
    assert isinstance(result_list[0].confidence, (int, float))


@pytest.mark.asyncio(loop_scope="session")
async def test_authority_history(al):
    resp = await al.carriers.authority(DOT)
    assert isinstance(resp, APIObject)
    assert resp.total_records > 0
    assert isinstance(resp.authority_history[0].docket_number, str)


@pytest.mark.asyncio(loop_scope="session")
async def test_news(al):
    resp = await al.carriers.news(DOT)
    assert isinstance(resp, APIObject)
    assert len(resp.articles) > 0
    assert isinstance(resp.articles[0].title, str)


@pytest.mark.asyncio(loop_scope="session")
async def test_timeline(al):
    resp = await al.carriers.timeline(DOT)
    assert isinstance(resp, APIObject)
    assert resp.total > 0
    events = resp.events
    assert len(events) > 0
    assert isinstance(events[0].detected_at, str)
    assert isinstance(events[0].category, str)


@pytest.mark.asyncio(loop_scope="session")
async def test_insurance(al):
    resp = await al.carriers.insurance(DOT)
    assert isinstance(resp, APIObject)
    assert resp.total_policies > 0
    records = resp.insurance
    assert len(records) > 0
    assert isinstance(records[0].insurance_type, dict)
    assert isinstance(records[0].insurance_company_name, str)


@pytest.mark.asyncio(loop_scope="session")
async def test_insurance_by_mc(al):
    resp = await al.carriers.insurance_by_mc("116505")
    assert isinstance(resp, APIObject)
    assert resp.total_policies > 0
    assert isinstance(resp.insurance[0].insurance_type, dict)


@pytest.mark.asyncio(loop_scope="session")
async def test_trucks(al):
    resp = await al.fleet.trucks(DOT, limit=5)
    assert isinstance(resp, APIObject)
    assert resp.total_trucks > 0
    assert isinstance(resp.trucks[0].vin, str)
    assert isinstance(resp.trucks[0].make, str)


@pytest.mark.asyncio(loop_scope="session")
async def test_trailers(al):
    resp = await al.fleet.trailers(DOT, limit=5)
    assert isinstance(resp, APIObject)
    assert resp.total_trailers > 0
    assert isinstance(resp.trailers[0].vin, str)


@pytest.mark.asyncio(loop_scope="session")
async def test_list_inspections(al):
    resp = await al.inspections.list(DOT, limit=5)
    assert isinstance(resp, APIObject)
    assert resp.total_inspections > 0
    assert isinstance(resp.inspections[0].report_number, str)
    assert isinstance(resp.inspections[0].date, str)


@pytest.mark.asyncio(loop_scope="session")
async def test_list_crashes(al):
    resp = await al.crashes.list(DOT, limit=5)
    assert isinstance(resp, APIObject)
    assert resp.total_crashes > 0
    assert isinstance(resp.crashes[0].crash_id, str)
    assert isinstance(resp.crashes[0].severity, str)


@pytest.mark.asyncio(loop_scope="session")
async def test_contacts_search(al):
    resp = await al.contacts.search(dot_number=DOT, limit=5)
    assert isinstance(resp, APIObject)
    assert resp.total_contacts > 0
    assert isinstance(resp.contacts[0].full_name, str)


@pytest.mark.asyncio(loop_scope="session")
async def test_invalid_dot_raises_error(al):
    with pytest.raises((AlphaLoopsNotFoundError, AlphaLoopsError)):
        await al.carriers.get("0000000")
