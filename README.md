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
    print(truck.vin, truck.vehicle_make)

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
  console.log(truck.vin, truck.vehicle_make);
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
json.dumps(dict(carrier))    # serialize
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

## Learn More

- **API Documentation** — [runalphaloops.com/fmcsa-api/docs](https://runalphaloops.com/fmcsa-api/docs)
- **Get an API Key** — [runalphaloops.com](https://runalphaloops.com/)
- **AlphaLoops** — Freight intelligence infrastructure for the modern supply chain

## License

MIT — see [LICENSE](LICENSE) for details.
