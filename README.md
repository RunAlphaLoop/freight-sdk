# AlphaLoops Freight SDK

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![PyPI](https://img.shields.io/pypi/v/alphaloops-freight-sdk)](https://pypi.org/project/alphaloops-freight-sdk/)
[![npm](https://img.shields.io/npm/v/alphaloops-freight-sdk)](https://www.npmjs.com/package/alphaloops-freight-sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-blue.svg)](https://www.typescriptlang.org/)

The official Python and TypeScript SDKs for the [AlphaLoops FMCSA API](https://runalphaloops.com/fmcsa-api/docs).

Look up any carrier in the United States by DOT or MC number and get back 200+ fields of structured data: carrier profiles, fleet composition, inspection history, crash records, authority status, news, and contact intelligence. One API key, one line of code, every carrier in the FMCSA database.

## What you get

| Resource | What's in it |
|----------|-------------|
| **Carrier Profiles** | Legal name, address, insurance, safety rating, power units, drivers, operation type, cargo carried, and 200+ more fields |
| **Fleet Data** | Every registered truck and trailer — VIN, make, model year, weight class, engine specs, reefer status |
| **Inspections** | Full roadside inspection history with out-of-service counts, violation codes, and BASIC categories |
| **Crashes** | Reported crash records — severity, fatalities, injuries, road and weather conditions |
| **Authority** | Complete authority history — grants, revocations, reinstatements, pending applications |
| **News** | Recent news articles and press mentions for any carrier |
| **Contacts** | Decision-makers at carriers — names, titles, seniority levels, verified emails and phone numbers |

## Installation

**Python:**
```bash
pip install alphaloops-freight-sdk
```

**TypeScript / JavaScript:**
```bash
npm install alphaloops-freight-sdk
```

## Quick Start

### Python

```python
from alphaloops.freight import AlphaLoops

al = AlphaLoops(api_key="ak_...")

# Look up a carrier by DOT number
carrier = al.carriers.get("80806")
print(carrier.legal_name, carrier.power_units)
# J B HUNT TRANSPORT INC 25280

# Search for carriers by name
results = al.carriers.search("JB Hunt")
for r in results.results:
    print(r.legal_name, r.dot_number, r.confidence)

# Fleet data
trucks = al.fleet.trucks("80806")
for truck in trucks.trucks:
    print(truck.vin, truck.make)

# Inspections, crashes, authority, news — it's all there
inspections = al.inspections.list("80806")
crashes = al.crashes.list("80806", severity="FATAL")
authority = al.carriers.authority("80806")
news = al.carriers.news("80806")

# Find decision-makers and get their contact info
contacts = al.contacts.search(dot_number="80806", job_title_levels=["c_suite", "vp"])
enriched = al.contacts.enrich(contacts.contacts[0].id)
print(enriched.email, enriched.phone)
```

### TypeScript

```typescript
import { AlphaLoops } from 'alphaloops-freight-sdk';

const al = new AlphaLoops({ apiKey: 'ak_...' });

// Look up a carrier by DOT number
const carrier = await al.carriers.get('80806');
console.log(carrier.legal_name, carrier.power_units);

// Search for carriers by name
const results = await al.carriers.search('JB Hunt', { limit: 5 });
for (const r of results.results) {
  console.log(r.legal_name, r.dot_number, r.confidence);
}

// Fleet data
const trucks = await al.fleet.trucks('80806');
for (const truck of trucks.trucks) {
  console.log(truck.vin, truck.make);
}

// Inspections, crashes, authority, news
const inspections = await al.inspections.list('80806');
const crashes = await al.crashes.list('80806', { severity: 'FATAL' });
const authority = await al.carriers.authority('80806');
const news = await al.carriers.news('80806');

// Find decision-makers
const contacts = await al.contacts.search({ dotNumber: '80806', jobTitleLevels: 'c_suite' });
const enriched = await al.contacts.enrich(contacts.contacts[0].id);
console.log(enriched.email, enriched.phone);
```

## Authentication

The SDK resolves your API key in this order:

1. **Explicit parameter** — `AlphaLoops(api_key="ak_...")` / `new AlphaLoops({ apiKey: 'ak_...' })`
2. **Environment variable** — `ALPHALOOPS_API_KEY`
3. **Config file** — `~/.alphaloops`

```bash
# Option 1: environment variable
export ALPHALOOPS_API_KEY=ak_your_key_here

# Option 2: config file
echo "api_key=ak_your_key_here" > ~/.alphaloops
```

Get your API key at [runalphaloops.com](https://runalphaloops.com/).

## API Reference

### Carriers — `al.carriers`

| Method | Description |
|--------|-------------|
| `get(dot_number)` | Full carrier profile by USDOT number (200+ fields) |
| `get(dot_number, fields="legal_name,power_units")` | Field projection — only fetch what you need |
| `get_by_mc(mc_number)` | Carrier profile by MC/MX docket number |
| `search(company_name, state=, city=, domain=)` | Fuzzy search with confidence scoring |
| `filtered_query(include, exclude=, sort_by=, ...)` | Query with include/exclude filters, geo radius, pagination |
| `authority(dot_number)` | Authority history — grants, revocations, reinstatements |
| `news(dot_number, start_date=, end_date=)` | News articles and press mentions |

### Fleet — `al.fleet`

| Method | Description |
|--------|-------------|
| `trucks(dot_number)` | Registered truck fleet — VIN, make, model, engine, weight |
| `trailers(dot_number)` | Registered trailers — VIN, manufacturer, type, reefer status |

### Inspections — `al.inspections`

| Method | Description |
|--------|-------------|
| `list(dot_number)` | Roadside inspection history |
| `violations(inspection_id)` | Violation details for a specific inspection |

### Crashes — `al.crashes`

| Method | Description |
|--------|-------------|
| `list(dot_number, severity=, start_date=, end_date=)` | Crash history — severity, fatalities, injuries, conditions |

### Contacts — `al.contacts`

| Method | Description |
|--------|-------------|
| `search(dot_number=, company_name=, job_title_levels=)` | Find people at a carrier or company |
| `enrich(contact_id)` | Verified emails, phones, work history (1 credit per new lookup) |

## Filtered Query

Build targeted carrier lists with include/exclude condition blocks and optional geo-radius search.

**Python:**
```python
# Find large Texas carriers with active authority, excluding high-risk
results = al.carriers.filtered_query(
    include={
        "state": "TX",
        "has_common_authority": True,
        "power_units": {"min": 5},
    },
    exclude={"overall_risk_level": "HIGH"},
    sort_by="power_units",
    sort_order="desc",
    limit=25,
)
for carrier in results.results:
    print(carrier.dot_number, carrier.legal_name, carrier.power_units)

# Geo-radius search — carriers within 25 miles of Dallas
results = al.carriers.filtered_query(
    include={
        "location": {"latitude": 32.7767, "longitude": -96.797, "radius_miles": 25},
        "power_units": {"min": 10},
    },
    sort_by="distance",
)
for carrier in results.results:
    print(carrier.legal_name, f"{carrier.distance_miles:.1f} mi")

# Auto-paginate all results
for carrier in al.carriers.filtered_query_iter(include={"state": "CA", "cargo": "General Freight"}):
    print(carrier.legal_name)
```

**TypeScript:**
```typescript
const results = await al.carriers.filteredQuery(
  { state: 'TX', has_common_authority: true, power_units: { min: 5 } },
  { exclude: { overall_risk_level: 'HIGH' }, sortBy: 'power_units', sortOrder: 'desc' }
);

// Geo-radius
const nearby = await al.carriers.filteredQuery(
  { location: { latitude: 32.7767, longitude: -96.797, radius_miles: 25 } },
  { sortBy: 'distance' }
);

// Auto-paginate
for await (const carrier of al.carriers.filteredQueryIter({ state: 'CA' })) {
  console.log(carrier.legal_name);
}
```

### Filter types

| Type | Fields | Values |
|------|--------|--------|
| **Text exact** | `state`, `operating_authority_status`, `safety_rating`, `status`, `overall_risk_level`, `fraud_confidence`, `mc_number` | String or array of strings |
| **Text partial** | `city`, `carrier_operation`, `authority_based_carrier_type`, `business_type`, `bipd_primary_insurer`, `cargo_insurer`, `top_truckstop_brand`, `domain` | Case-insensitive partial match |
| **Name search** | `name` | Fuzzy match on legal_name/dba_name |
| **Array contains** | `carrier_type`, `cargo`, `cargo_type`, `services`, `telematics`, `tms`, `fuel_card` | String or array |
| **Range** | `power_units`, `drivers`, `estimated_employees`, `annual_revenue`, `total_accidents`, `total_inspections`, `avg_truck_age_years`, `distinct_states_served`, `total_trailers`, `bipd_total_coverage`, `founded_year` | `{"min": N}` and/or `{"max": N}` |
| **Boolean** | `has_bipd_coverage`, `has_cargo_coverage`, `has_bond_coverage`, `hazmat_threshold`, `property`, `passenger`, `household_goods` | `true` / `false` |
| **Authority** | `has_common_authority`, `has_contract_authority`, `has_broker_authority` | `true` (checks for active authority) |
| **Location** | `location` (include only) | `{"latitude": N, "longitude": N, "radius_miles": N}` (max 500 mi) |

## Async Client (Python)

For asyncio/aiohttp applications, use `AsyncAlphaLoops`:

```bash
pip install alphaloops-freight-sdk[async]
```

```python
from alphaloops.freight import AsyncAlphaLoops

async with AsyncAlphaLoops(api_key="ak_...") as al:
    carrier = await al.carriers.get("80806")
    print(carrier.legal_name)

    results = await al.carriers.filtered_query(
        include={"state": "TX", "power_units": {"min": 50}}
    )

    async for truck in al.fleet.trucks_iter("80806"):
        print(truck.vin, truck.make)
```

Same API surface as the sync client — every method is just `await`-able. The `async with` context manager handles connection cleanup.

## Pagination

All list endpoints support manual pagination:

```python
page1 = al.carriers.search("JB Hunt", page=1, limit=10)
page2 = al.carriers.search("JB Hunt", page=2, limit=10)
```

Auto-pagination iterators handle paging automatically:

**Python:**
```python
for truck in al.fleet.trucks_iter("80806", limit=200):
    print(truck.vin)
```

**TypeScript:**
```typescript
for await (const truck of al.fleet.trucksIter('80806', { limit: 200 })) {
  console.log(truck.vin);
}
```

## Schema-Free Responses

Both SDKs return schema-free response objects. No rigid types to maintain — the data you get is exactly what the API returns, with dot-access for convenience.

**Python — `APIObject` (dict subclass):**
```python
carrier = al.carriers.get("80806")
carrier.legal_name           # dot-access
carrier["legal_name"]        # dict access
"power_units" in carrier     # membership test
list(carrier.keys())         # all fields
carrier.to_dict()            # plain dict (recursively unwraps nested objects)
carrier.to_json(indent=2)    # JSON string
```

**TypeScript — plain objects:**
```typescript
const carrier = await al.carriers.get('80806');
carrier.legal_name           // dot-access
carrier['legal_name']        // bracket access
Object.keys(carrier)         // all fields
JSON.stringify(carrier)      // serialize
```

## Error Handling

Both SDKs share the same error hierarchy:

| Error | HTTP Status | When |
|-------|-------------|------|
| `AlphaLoopsAuthError` | 401 | Invalid or missing API key |
| `AlphaLoopsNotFoundError` | 404 | Carrier or resource not found |
| `AlphaLoopsRateLimitError` | 429 | Rate limit exceeded (auto-retried) |
| `AlphaLoopsPaymentError` | 402 | Enrichment credits exhausted |
| `AlphaLoopsPendingError` | 202 | Contacts still being fetched (auto-retried) |
| `AlphaLoopsAPIError` | Other | Generic API error with status code |

The SDK automatically retries on transient errors (5xx, timeouts, connection errors) with exponential backoff. Rate limit (429) responses are retried after the `Retry-After` delay. You almost never need to handle these yourself.

## Configuration

**Python:**
```python
al = AlphaLoops(
    api_key="ak_...",
    base_url="https://api.runalphaloops.com",
    timeout=30,
    max_retries=3,
    retry_base_delay=1.0,
)
```

**TypeScript:**
```typescript
const al = new AlphaLoops({
  apiKey: 'ak_...',
  baseUrl: 'https://api.runalphaloops.com',
  timeout: 30,
  maxRetries: 3,
  retryBaseDelay: 1.0,
});
```

## n8n Community Node

Use AlphaLoops in your n8n workflows with our community node: [n8n-nodes-alphaloops-freight](https://github.com/RunAlphaLoop/n8n-nodes-alphaloops-freight)

## Learn More

- **API Documentation** — [runalphaloops.com/fmcsa-api/docs](https://runalphaloops.com/fmcsa-api/docs)
- **Get an API Key** — [runalphaloops.com](https://runalphaloops.com/)
- **AlphaLoops** — Freight intelligence infrastructure for the modern supply chain

## License

MIT — see [LICENSE](LICENSE) for details.
