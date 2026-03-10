# AlphaLoops Freight SDK

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![PyPI](https://img.shields.io/pypi/v/alphaloops-freight-sdk)](https://pypi.org/project/alphaloops-freight-sdk/)

The official Python SDK for the [AlphaLoops FMCSA API](https://runalphaloops.com/fmcsa-api/docs) — access carrier profiles, fleet data, inspections, crash history, contacts, and more.

## Installation

```bash
pip install alphaloops-freight-sdk
```

## Quick Start

```python
from alphaloops.freight import AlphaLoops

al = AlphaLoops(api_key="ak_...")

# Look up a carrier by DOT number
carrier = al.carriers.get("2247505")
print(carrier.legal_name, carrier.total_trucks)

# Search for carriers by name
results = al.carriers.search("Swift Transportation")
for r in results.results:
    print(r.legal_name, r.dot_number, r.confidence)

# Fleet data
trucks = al.fleet.trucks("2247505")
for truck in trucks.results:
    print(truck.vin, truck.make, truck.model_year)
```

## Authentication

The SDK resolves your API key in this order:

1. **Explicit parameter** — `AlphaLoops(api_key="ak_...")`
2. **Environment variable** — `ALPHALOOPS_API_KEY`
3. **Config file** — `~/.alphaloops`

To set up via environment variable:

```bash
export ALPHALOOPS_API_KEY=ak_your_key_here
```

Or create a config file at `~/.alphaloops`:

```
api_key=ak_your_key_here
```

Get your API key at [runalphaloops.com](https://runalphaloops.com/).

## Resources

### Carriers — `al.carriers`

```python
# Full carrier profile (200+ fields)
carrier = al.carriers.get("2247505")

# Look up by MC number
carrier = al.carriers.get_by_mc("624748")

# Field projection — only fetch what you need
carrier = al.carriers.get("2247505", fields=["legal_name", "total_trucks", "total_drivers"])

# Fuzzy search with confidence scoring
results = al.carriers.search("JB Hunt", state="AR", limit=5)

# Authority history
history = al.carriers.authority("2247505")

# News and press mentions
news = al.carriers.news("2247505", start_date="2025-01-01")
```

### Fleet — `al.fleet`

```python
trucks = al.fleet.trucks("2247505", limit=100)
trailers = al.fleet.trailers("2247505", limit=100)
```

### Inspections — `al.inspections`

```python
inspections = al.inspections.list("2247505")

# Violations for a specific inspection
violations = al.inspections.violations("INS-12345")
```

### Crashes — `al.crashes`

```python
crashes = al.crashes.list("2247505", severity="FATAL", start_date="2024-01-01")
```

### Contacts — `al.contacts`

```python
# Find people at a carrier
contacts = al.contacts.search(dot_number="2247505", job_title_levels=["c_suite", "vp"])

# Enrich a contact (1 credit per new lookup, cached results are free)
enriched = al.contacts.enrich("contact_id_here")
print(enriched.email, enriched.phone)
```

## Pagination

All list endpoints support manual pagination:

```python
page1 = al.carriers.search("Swift", page=1, limit=10)
page2 = al.carriers.search("Swift", page=2, limit=10)
```

Auto-pagination iterators handle paging for you:

```python
for truck in al.fleet.trucks_iter("2247505", limit=200):
    print(truck.vin)

for inspection in al.inspections.list_iter("2247505"):
    print(inspection.inspection_id)
```

## The `APIObject`

All SDK methods return an `APIObject` — a lightweight dict wrapper that gives you attribute-style access to API responses without enforcing a rigid schema. The data you get is exactly what the API returns.

```python
carrier = al.carriers.get("2247505")

# Attribute access
carrier.legal_name        # "SWIFT TRANSPORTATION CO OF ARIZONA LLC"
carrier.total_trucks      # 18752

# Dict access
carrier["dot_number"]     # "2247505"

# Check for fields
"safety_rating" in carrier  # True

# Serialize to JSON
import json
json.dumps(carrier.to_dict())
```

## Error Handling

```python
from alphaloops.freight import (
    AlphaLoops,
    AlphaLoopsAuthError,
    AlphaLoopsNotFoundError,
    AlphaLoopsRateLimitError,
    AlphaLoopsPaymentError,
)

al = AlphaLoops()

try:
    carrier = al.carriers.get("0000000")
except AlphaLoopsNotFoundError:
    print("Carrier not found")
except AlphaLoopsAuthError:
    print("Invalid API key")
except AlphaLoopsRateLimitError:
    print("Rate limit exceeded — the SDK auto-retries on 429, so this is rare")
except AlphaLoopsPaymentError:
    print("Enrichment credits exhausted")
```

The SDK automatically retries on transient errors (5xx, timeouts, connection errors) with exponential backoff. Rate limit (429) responses are retried after the `Retry-After` delay.

## Configuration

```python
al = AlphaLoops(
    api_key="ak_...",                                  # API key
    base_url="https://api.runalphaloops.com",          # API base URL
    timeout=30,                                        # Request timeout (seconds)
    max_retries=3,                                     # Max retry attempts
    retry_base_delay=1.0,                              # Base delay for exponential backoff
)
```

The base URL can also be set via the `ALPHALOOPS_BASE_URL` environment variable.

## API Documentation

Full API reference and endpoint details: [runalphaloops.com/fmcsa-api/docs](https://runalphaloops.com/fmcsa-api/docs)

## License

MIT — see [LICENSE](LICENSE) for details.
