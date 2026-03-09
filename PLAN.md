# AlphaLoops Freight SDK — Implementation Plan

## Overview

Build a dual-language SDK (Python + TypeScript) for the AlphaLoops FMCSA API (`https://api.runalphaloops.com`), modeled after the `featrixsphere` package patterns. The SDK will be the first consumer of the future `alphaloops` CLI shell (separate project, modeled on `ffs-ai-shell`).

---

## 1. Repository Structure

```
freight-sdk/
├── python/
│   ├── pyproject.toml
│   ├── alphaloops/
│   │   ├── __init__.py              # Exports: AlphaLoops, APIObject, exceptions
│   │   ├── client.py                # Main client class
│   │   ├── http_client.py           # HTTP layer: retries, rate-limit handling
│   │   ├── api_object.py            # Dynamic dict wrapper with dot-access
│   │   ├── config.py                # Config file + env var resolution
│   │   ├── exceptions.py            # AlphaLoopsAuthError, RateLimitError, etc.
│   │   └── resources/
│   │       ├── __init__.py
│   │       ├── carriers.py          # Carrier profile, search, field projection
│   │       ├── fleet.py             # Trucks + trailers
│   │       ├── inspections.py       # Inspections + violations
│   │       ├── crashes.py           # Crash history
│   │       └── contacts.py          # Contact search + enrichment
│   └── tests/
│       ├── test_client.py
│       ├── test_carriers.py
│       ├── test_fleet.py
│       ├── test_inspections.py
│       ├── test_contacts.py
│       └── conftest.py              # Shared fixtures, mock server
│
├── typescript/
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts                 # Exports
│   │   ├── client.ts                # Main client class
│   │   ├── http-client.ts           # Fetch-based HTTP layer
│   │   ├── config.ts                # Config resolution
│   │   ├── errors.ts                # Error classes
│   │   └── resources/
│   │       ├── carriers.ts
│   │       ├── fleet.ts
│   │       ├── inspections.ts
│   │       ├── crashes.ts
│   │       └── contacts.ts
│   └── tests/
│       └── ...
│
├── .gitignore
├── LICENSE
├── README.md
└── PLAN.md
```

---

## 2. Data Model — Schema-Free `APIObject`

All API responses are returned as `APIObject` — a thin `dict` subclass with dot-access. No rigid dataclasses. The schema can evolve server-side without requiring SDK patches.

```python
class APIObject(dict):
    """Dict with attribute access. No schema to maintain."""
    def __getattr__(self, key):
        try:
            return self[key]
        except KeyError:
            raise AttributeError(f"No field '{key}'")

    def __setattr__(self, key, value):
        self[key] = value

    @classmethod
    def from_response(cls, data):
        """Recursively wrap dicts so nested dot-access works."""
        if isinstance(data, list):
            return [cls.from_response(item) for item in data]
        if isinstance(data, dict):
            return cls({k: cls.from_response(v) for k, v in data.items()})
        return data
```

**Usage:**
```python
carrier = al.carriers.get("2247505")

carrier["legal_name"]                   # dict-style — always works
carrier.legal_name                      # dot-style — convenience
carrier.physical_address.city           # nested dot-access
carrier.keys()                          # explore what came back
json.dumps(carrier)                     # just works — it's a dict

# New fields added server-side? Already there. No SDK update needed.
carrier.some_new_field_from_next_release
```

**TypeScript equivalent** — loose interfaces over `Record<string, any>`:
```typescript
// Known fields documented, unknown fields pass through
export interface Carrier extends Record<string, any> {
  dot_number: string;
  legal_name: string;
  mc_number?: string;
  // ... document common ones, don't block unknowns
}
```

**Why not dataclasses:**
- The carrier profile alone has 200+ fields that evolve
- New endpoints and fields get added regularly
- A rigid schema means shipping a patch for every API change
- `APIObject` gives dot-access ergonomics with zero maintenance burden

---

## 3. Python SDK Design

### 3.1 Client Class — `AlphaLoops`

```python
from alphaloops import AlphaLoops

al = AlphaLoops(api_key="ak_...")
# or — resolved from env/config file
al = AlphaLoops()
```

**Constructor:**
```python
class AlphaLoops:
    def __init__(
        self,
        api_key: str | None = None,
        base_url: str = "https://api.runalphaloops.com",
        timeout: int = 30,
        max_retries: int = 3,
        retry_base_delay: float = 1.0,
    )
```

**Resource access (property-based):**
```python
al.carriers         # CarriersResource
al.fleet            # FleetResource
al.inspections      # InspectionsResource
al.crashes          # CrashesResource
al.contacts         # ContactsResource
```

### 3.2 Authentication & Config

Layered config resolution (following `featrixsphere`):

1. **Explicit `api_key=` parameter** (highest priority)
2. **`ALPHALOOPS_API_KEY` env var**
3. **Config file `~/.alphaloops`** (JSON or key=value format)
4. Raise `AlphaLoopsAuthError` with setup instructions

Also support `ALPHALOOPS_BASE_URL` env var for the base URL.

### 3.3 HTTP Client Layer

- **Retry with exponential backoff** on 500/502/503/504, ConnectionError, Timeout
- **No retry on 401** — raise `AlphaLoopsAuthError` immediately
- **Rate limit handling**: On 429, read `Retry-After` header, sleep and retry
- **User-Agent header**: `AlphaLoops-Python/{version}`
- **Auth header**: `Authorization: Bearer {api_key}`

### 3.4 Error Handling

```python
class AlphaLoopsError(Exception):
    """Base exception."""

class AlphaLoopsAuthError(AlphaLoopsError):
    """401 — invalid or missing API key."""

class AlphaLoopsNotFoundError(AlphaLoopsError):
    """404 — carrier/resource not found."""

class AlphaLoopsRateLimitError(AlphaLoopsError):
    """429 — rate limit exceeded."""

class AlphaLoopsPaymentError(AlphaLoopsError):
    """402 — enrichment credits exhausted."""

class AlphaLoopsPendingError(AlphaLoopsError):
    """202 — resource being fetched asynchronously (contacts)."""

class AlphaLoopsAPIError(AlphaLoopsError):
    """Generic API error with status_code and message."""
    def __init__(self, status_code: int, error: str, message: str): ...
```

---

## 4. SDK Functions — Complete Reference

All methods return `APIObject` (or list of `APIObject`). The raw JSON from the API is what you get — no transformation, no field filtering, no schema enforcement.

### 4.1 `al.carriers` — Carrier Profiles & Search

| Method | API Endpoint | Description |
|--------|-------------|-------------|
| `get(dot_number, fields=None)` | `GET /v1/carriers/{dot_number}` | Full carrier profile (200+ fields). Optional `fields` param for projection. |
| `get_by_mc(mc_number, fields=None)` | `GET /v1/carriers/mc/{mc_number}` | Same profile, looked up by MC/MX docket number. |
| `search(company_name, domain=None, state=None, city=None, page=1, limit=10)` | `GET /v1/carriers/search` | Fuzzy match company to carrier. Returns ranked results with confidence scores. |
| `authority(dot_number, limit=50, offset=0)` | `GET /v1/carriers/{dot_number}/authority` | Authority history — grants, revocations, reinstatements. |
| `news(dot_number, start_date=None, end_date=None, page=1, limit=25)` | `GET /v1/carriers/{dot_number}/news` | Recent news articles and press mentions. |

### 4.2 `al.fleet` — Trucks & Trailers

| Method | API Endpoint | Description |
|--------|-------------|-------------|
| `trucks(dot_number, limit=50, offset=0)` | `GET /v1/carriers/{dot_number}/trucks` | Registered truck fleet — VIN, make, model, engine specs, weight. |
| `trailers(dot_number, limit=50, offset=0)` | `GET /v1/carriers/{dot_number}/trailers` | Registered trailer fleet — VIN, manufacturer, type, reefer status. |

### 4.3 `al.inspections` — Inspections & Violations

| Method | API Endpoint | Description |
|--------|-------------|-------------|
| `list(dot_number, limit=50, offset=0)` | `GET /v1/carriers/{dot_number}/inspections` | Roadside inspection history — metadata, OOS counts. |
| `violations(inspection_id, page=1, limit=25)` | `GET /v1/inspections/{inspection_id}/violations` | Violations for a specific inspection — codes, descriptions, BASIC categories. |

### 4.4 `al.crashes` — Crash History

| Method | API Endpoint | Description |
|--------|-------------|-------------|
| `list(dot_number, start_date=None, end_date=None, severity=None, page=1, limit=25)` | `GET /v1/carriers/{dot_number}/crashes` | Reported crashes — severity, fatalities, injuries, road/weather conditions. `severity` filter: `FATAL`, `INJURY`, `TOW`, `PROPERTY_DAMAGE`. |

### 4.5 `al.contacts` — People Search & Enrichment

| Method | API Endpoint | Description |
|--------|-------------|-------------|
| `search(dot_number=None, company_name=None, job_title=None, job_title_levels=None, page=1, limit=25, auto_retry=True)` | `GET /v1/contacts/search` | Find people at a carrier/company. Returns name, title, seniority, social profiles. Auto-retries on 202 (async fetch). `job_title_levels`: `vp`, `director`, `manager`, `c_suite`. |
| `enrich(contact_id)` | `GET /v1/contacts/{contact_id}/enrich` | Verified emails, phone numbers, skills, work history, education. Costs 1 enrichment credit (cached results free). |

### 4.6 Pagination Helpers

```python
# Manual pagination — you control it
page1 = al.carriers.search("Swift", page=1, limit=10)
page2 = al.carriers.search("Swift", page=2, limit=10)

# Auto-pagination generators — iterate all results
for carrier in al.carriers.search_iter("Swift", limit=50):
    print(carrier.legal_name)

for truck in al.fleet.trucks_iter("2247505", limit=200):
    print(truck.vin)

for inspection in al.inspections.list_iter("2247505", limit=200):
    print(inspection.inspection_id)
```

Each `*_iter()` method is a generator that yields `APIObject` items, automatically fetching the next page/offset when exhausted. Uses `page`/`limit` or `offset`/`limit` depending on the endpoint's pagination style.

### 4.7 Contacts 202 Auto-Retry

The `/v1/contacts/search` endpoint may return HTTP 202 when contacts are being fetched asynchronously. By default the SDK handles this transparently:

```python
# Auto-retry (default) — sleeps per Retry-After header, up to 6 attempts
results = al.contacts.search(dot_number="90849")

# Opt out — raises AlphaLoopsPendingError on 202
results = al.contacts.search(dot_number="90849", auto_retry=False)
```

---

## 5. TypeScript SDK Design

Mirror the Python SDK's API surface exactly, using TypeScript idioms.

```typescript
import { AlphaLoops } from 'alphaloops';

const al = new AlphaLoops({ apiKey: 'ak_...' });

const carrier = await al.carriers.get('2247505');
const results = await al.carriers.search({ companyName: 'Swift' });
const trucks = await al.fleet.trucks('2247505');
```

**Key differences from Python:**
- All methods return `Promise<T>` (async/await native)
- Uses `fetch` API (Node 18+, Deno, Bun, browsers)
- Config: `ALPHALOOPS_API_KEY` env → `~/.alphaloops` file (Node only) → error
- No config file in browser — must pass `apiKey` explicitly
- Loose interfaces with `Record<string, any>` escape hatch (no rigid types)

---

## 6. Design Principles

| Pattern | featrixsphere | AlphaLoops SDK |
|---------|---------------|----------------|
| Single entry-point class | `FeatrixSphere` | `AlphaLoops` |
| Resource access | Methods on client | Properties returning resource objects |
| Auth resolution | env → config file → error | Same (`ALPHALOOPS_API_KEY` → `~/.alphaloops` → error) |
| Config file | `~/.featrix` (JSON or k=v) | `~/.alphaloops` (JSON or k=v) |
| HTTP retries | Exponential backoff, skip 401 | Same |
| Data models | `@dataclass` with `to_dict()` | **`APIObject` dict wrapper — schema-free** |
| Lazy client init | Yes (in ffs shell) | Yes |
| Error hierarchy | `FeatrixAuthenticationError` | `AlphaLoopsAuthError`, etc. |
| User-Agent | `FeatrixSphere {version}` | `AlphaLoops-Python/{version}` |

---

## 7. Future CLI Shell Considerations

The `alphaloops` CLI (separate repo, modeled on `ffs-ai-shell`) will be the first consumer of this SDK:

- **JSON-serializable by default**: `APIObject` is a dict — `json.dumps()` just works, enabling `--json` output
- **Lazy client init**: Import SDK without triggering auth until a command needs it
- **Config file compatibility**: CLI `login` writes `~/.alphaloops`, SDK reads it
- **Clean error hierarchy**: CLI catches specific exceptions, formats for humans vs agents
- **Resource-oriented API maps to CLI subcommands:**
  - `al carriers get 2247505` → `al.carriers.get("2247505")`
  - `al fleet trucks 2247505` → `al.fleet.trucks("2247505")`
  - `al contacts search --company "Swift"` → `al.contacts.search(company_name="Swift")`
  - `al contacts enrich {id}` → `al.contacts.enrich(id)`

---

## 8. Implementation Order

### Phase 1 — Python SDK Core
1. `api_object.py` — `APIObject` dict wrapper
2. `config.py` — credential resolution
3. `exceptions.py` — error classes
4. `http_client.py` — HTTP layer with retries + rate-limit handling
5. `client.py` — `AlphaLoops` class with resource properties
6. `resources/carriers.py` — carrier lookup, search, authority, news

### Phase 2 — Python SDK Full Coverage
7. `resources/fleet.py` — trucks + trailers
8. `resources/inspections.py` — inspections + violations
9. `resources/crashes.py` — crash history
10. `resources/contacts.py` — search + enrich (with 202 retry)
11. Pagination iterators (`search_iter`, `trucks_iter`, etc.)

### Phase 3 — Tests
12. Unit tests with mocked HTTP (pytest + responses or pytest-httpserver)
13. Integration test suite (optional, requires API key)

### Phase 4 — TypeScript SDK
14. HTTP client (fetch-based)
15. Client class + resources (mirror Python API surface)
16. Tests (vitest)

### Phase 5 — Packaging & Docs
17. Python: pyproject.toml, PyPI publish config
18. TypeScript: package.json, npm publish config
19. README with quickstart examples for both languages

---

## 9. API Endpoints Summary

| Endpoint | Method | Status | SDK Method |
|----------|--------|--------|------------|
| `/v1/carriers/{dot}` | GET | Live | `carriers.get()` |
| `/v1/carriers/mc/{mc}` | GET | Live | `carriers.get_by_mc()` |
| `/v1/carriers/search` | GET | Live | `carriers.search()` |
| `/v1/carriers/{dot}/safety` | GET | Coming Soon | — |
| `/v1/carriers/{dot}/authority` | GET | Live | `carriers.authority()` |
| `/v1/carriers/{dot}/trucks` | GET | Live | `fleet.trucks()` |
| `/v1/carriers/{dot}/trailers` | GET | Live | `fleet.trailers()` |
| `/v1/carriers/{dot}/inspections` | GET | Live | `inspections.list()` |
| `/v1/inspections/{id}/violations` | GET | Live | `inspections.violations()` |
| `/v1/carriers/{dot}/crashes` | GET | Live | `crashes.list()` |
| `/v1/carriers/{dot}/news` | GET | Live | `carriers.news()` |
| `/v1/contacts/search` | GET | Live | `contacts.search()` |
| `/v1/contacts/{id}/enrich` | GET | Live | `contacts.enrich()` |
| `/v1/intent` | GET | Coming Soon | — |
| `/v1/carriers/{dot}/transactions` | GET | Coming Soon | — |
| `/v1/graph/{dot}` | GET | Coming Soon | — |
