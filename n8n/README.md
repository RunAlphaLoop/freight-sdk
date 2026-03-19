# n8n-nodes-alphaloops-freight

This is an [n8n](https://n8n.io/) community node for the [AlphaLoops FMCSA API](https://runalphaloops.com/fmcsa-api/docs). It lets you access US trucking carrier data — profiles, fleet, inspections, crashes, authority history, news, and contacts — directly inside your n8n workflows.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Prerequisites

You need an AlphaLoops API key. Sign up at [runalphaloops.com](https://runalphaloops.com) to get one, regardless of which installation path you take.

## Installation (n8n Hosted)

Unfortunately, n8n does not allow installation of packages. However, you can call [AlphaLoops' MCP server](https://mcp-freight.runalphaloops.com/) or [REST API](https://runalphaloops.com/fmcsa-api) from n8n.

## Installation (Self Hosted n8n)

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation. There are two approaches, one for Docker and one for non-Docker; but both boil down to 

`npm install n8n-nodes-alphaloops-freight`

Once you've restarted n8n with the `n8n-nodes-alphaloops-freight` package installed:

1. Open your desired workflow and go to the `Credentials` tab:

<p>
    <img src="./../readme_images/alphaloops-n8n-ss-1.png" width="50%"/>
</p>

2. You'll see `AlphaLoops` as an option, click the triple dots to `open`:

<p>
    <img src="./../readme_images/alphaloops-n8n-ss-2.png" width="50%"/>
</p>

3. Enter your API key and save it.

4. At this point, you can inset AlphaLoops calls into your n8n workflows:

<p>
    <img src="./../readme_images/alphaloops-n8n-ss-3.png" width="50%"/>
</p>


## Resources and Operations

### Carrier

| Operation | Description |
|---|---|
| **Get by DOT** | Get a carrier profile by USDOT number (200+ fields, optional field projection) |
| **Get by MC** | Get a carrier profile by MC/MX docket number |
| **Search** | Fuzzy search carriers by name, with optional state/city/domain filters |
| **Filtered Query** | Query carriers with include/exclude JSON filters (supports range, boolean, array, geo-radius) |
| **Get Authority** | Get operating authority history for a carrier |
| **Get News** | Get news articles about a carrier, with optional date filters |

### Fleet

| Operation | Description |
|---|---|
| **Get Trucks** | List registered trucks for a carrier by DOT number |
| **Get Trailers** | List registered trailers for a carrier by DOT number |

### Inspections

| Operation | Description |
|---|---|
| **List** | List roadside inspection records for a carrier |
| **Get Violations** | Get violations for a specific inspection by ID |

### Crashes

| Operation | Description |
|---|---|
| **List** | List crash records for a carrier, with optional severity and date filters |

### Contacts

| Operation | Description |
|---|---|
| **Search** | Find people at a carrier or company (by DOT, company name, job title, seniority level) |
| **Enrich** | Get verified emails and phone numbers for a contact (1 credit per new lookup, cached free) |

## Example Usage

### Look up a carrier and get their fleet

1. Add an **AlphaLoops** node, set Resource to **Carrier**, Operation to **Get by DOT**, and enter a DOT number (e.g. `80806`)
2. Chain a second **AlphaLoops** node, set Resource to **Fleet**, Operation to **Get Trucks**, and wire the DOT number from the first node's output

### Find carriers in Texas with 5+ trucks

1. Add an **AlphaLoops** node, set Resource to **Carrier**, Operation to **Filtered Query**
2. In the Include Filters field, enter:
   ```json
   {
     "state": "TX",
     "has_common_authority": true,
     "power_units": { "min": 5 }
   }
   ```

### Search for contacts at a carrier

1. Add an **AlphaLoops** node, set Resource to **Contacts**, Operation to **Search**
2. Enter a DOT number and optionally filter by job title or seniority level
3. Chain an **Enrich** operation to get verified contact details

## API Documentation

Full API docs: [runalphaloops.com/fmcsa-api/docs](https://runalphaloops.com/fmcsa-api/docs)

## License

[MIT](https://github.com/RunAlphaLoop/freight-sdk/blob/main/LICENSE)
