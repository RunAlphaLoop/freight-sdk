# AlphaLoops Freight SDK for TypeScript

[![npm](https://img.shields.io/npm/v/alphaloops-freight-sdk)](https://www.npmjs.com/package/alphaloops-freight-sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-blue.svg)](https://www.typescriptlang.org/)
[![Node 18+](https://img.shields.io/badge/node-18+-green.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/RunAlphaLoop/freight-sdk/blob/main/LICENSE)

The official TypeScript SDK for the [AlphaLoops FMCSA API](https://runalphaloops.com/fmcsa-api/docs).

Look up any carrier in the United States by DOT or MC number and get back 200+ fields of structured data: carrier profiles, fleet composition, inspection history, crash records, authority status, news, and contact intelligence.

## Installation

```bash
npm install alphaloops-freight-sdk
```

Works with Node 18+, Deno, and Bun. Zero dependencies.

## Quick Start

```typescript
import { AlphaLoops } from 'alphaloops-freight-sdk';

const al = new AlphaLoops({ apiKey: 'ak_...' });

// Carrier profile — 200+ fields
const carrier = await al.carriers.get('80806');
console.log(carrier.legal_name, carrier.power_units);
// J B HUNT TRANSPORT INC 25280

// Fuzzy search with confidence scoring
const results = await al.carriers.search('JB Hunt', { limit: 5 });
for (const r of results.results) {
  console.log(r.legal_name, r.dot_number, r.confidence);
}

// Fleet data — every registered truck and trailer
const trucks = await al.fleet.trucks('80806');
for (const truck of trucks.trucks) {
  console.log(truck.vin, truck.make);
}

// Inspections, crashes, authority, news
const inspections = await al.inspections.list('80806');
const crashes = await al.crashes.list('80806', { severity: 'FATAL' });
const authority = await al.carriers.authority('80806');
const news = await al.carriers.news('80806');

// Find decision-makers and get their contact info
const contacts = await al.contacts.search({ dotNumber: '80806', jobTitleLevels: 'c_suite' });
const enriched = await al.contacts.enrich(contacts.contacts[0].id);
console.log(enriched.email, enriched.phone);
```

## Authentication

The SDK resolves your API key in this order:

1. **Explicit parameter** — `new AlphaLoops({ apiKey: 'ak_...' })`
2. **Environment variable** — `ALPHALOOPS_API_KEY`
3. **Config file** — `~/.alphaloops` (Node.js only)

```bash
# Option 1: environment variable
export ALPHALOOPS_API_KEY=ak_your_key_here

# Option 2: config file
echo "api_key=ak_your_key_here" > ~/.alphaloops
```

Get your API key at [runalphaloops.com](https://runalphaloops.com/).

## What You Get

| Resource | What's in it |
|----------|-------------|
| **Carrier Profiles** | Legal name, address, insurance, safety rating, power units, drivers, operation type, cargo, 200+ fields |
| **Fleet Data** | Every truck and trailer — VIN, make, model year, weight class, engine specs, reefer status |
| **Inspections** | Roadside inspection history with out-of-service counts, violation codes, BASIC categories |
| **Crashes** | Crash records — severity, fatalities, injuries, road and weather conditions |
| **Authority** | Authority history — grants, revocations, reinstatements, pending applications |
| **News** | Recent articles and press mentions |
| **Contacts** | Decision-makers — names, titles, seniority, verified emails and phone numbers |

## API Reference

### Carriers — `al.carriers`

```typescript
// Full profile by DOT number
const carrier = await al.carriers.get('80806');

// Field projection — only fetch what you need
const carrier = await al.carriers.get('80806', 'legal_name,power_units,drivers');

// Look up by MC number
const carrier = await al.carriers.getByMc('12345');

// Fuzzy search
const results = await al.carriers.search('JB Hunt', { state: 'AR', limit: 5 });

// Authority history
const authority = await al.carriers.authority('80806');

// News
const news = await al.carriers.news('80806', { startDate: '2025-01-01' });
```

### Fleet — `al.fleet`

```typescript
const trucks = await al.fleet.trucks('80806', { limit: 100 });
const trailers = await al.fleet.trailers('80806', { limit: 100 });
```

### Inspections — `al.inspections`

```typescript
const inspections = await al.inspections.list('80806');
const violations = await al.inspections.violations('87233627');
```

### Crashes — `al.crashes`

```typescript
const crashes = await al.crashes.list('80806', {
  severity: 'FATAL',
  startDate: '2024-01-01',
});
```

### Contacts — `al.contacts`

```typescript
// Find people at a carrier
const contacts = await al.contacts.search({
  dotNumber: '80806',
  jobTitleLevels: 'c_suite',
});

// Enrich — verified emails, phones, work history (1 credit per new lookup)
const enriched = await al.contacts.enrich('contact_id');
```

## Pagination

Manual pagination:

```typescript
const page1 = await al.carriers.search('JB Hunt', { page: 1, limit: 10 });
const page2 = await al.carriers.search('JB Hunt', { page: 2, limit: 10 });
```

Async iterators handle paging automatically:

```typescript
for await (const truck of al.fleet.trucksIter('80806', { limit: 200 })) {
  console.log(truck.vin);
}

for await (const inspection of al.inspections.listIter('80806')) {
  console.log(inspection.inspection_id);
}
```

## Error Handling

```typescript
import {
  AlphaLoops,
  AlphaLoopsAuthError,
  AlphaLoopsNotFoundError,
  AlphaLoopsRateLimitError,
  AlphaLoopsPaymentError,
} from 'alphaloops-freight-sdk';

try {
  const carrier = await al.carriers.get('0000000');
} catch (e) {
  if (e instanceof AlphaLoopsNotFoundError) console.log('Carrier not found');
  if (e instanceof AlphaLoopsAuthError) console.log('Invalid API key');
  if (e instanceof AlphaLoopsRateLimitError) console.log('Rate limited');
  if (e instanceof AlphaLoopsPaymentError) console.log('Credits exhausted');
}
```

The SDK automatically retries on transient errors (5xx, timeouts, network failures) with exponential backoff. Rate limit (429) responses are retried after the `Retry-After` delay.

## Configuration

```typescript
const al = new AlphaLoops({
  apiKey: 'ak_...',
  baseUrl: 'https://api.runalphaloops.com',
  timeout: 30,         // seconds
  maxRetries: 3,
  retryBaseDelay: 1.0, // seconds
});
```

## Learn More

- **API Documentation** — [runalphaloops.com/fmcsa-api/docs](https://runalphaloops.com/fmcsa-api/docs)
- **Get an API Key** — [runalphaloops.com](https://runalphaloops.com/)
- **Python SDK** — `pip install alphaloops-freight-sdk`

## License

MIT
