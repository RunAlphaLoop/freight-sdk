"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlphaLoops = void 0;
const client_1 = require("./sdk/client");
class AlphaLoops {
    description = {
        displayName: 'AlphaLoops',
        name: 'alphaLoops',
        icon: 'file:alphaloops.svg',
        group: ['transform'],
        version: 1,
        subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
        description: 'FMCSA carrier data — profiles, fleet, inspections, crashes, authority, news, contacts',
        defaults: {
            name: 'AlphaLoops',
        },
        inputs: ['main'],
        outputs: ['main'],
        credentials: [
            {
                name: 'alphaLoopsApi',
                required: true,
            },
        ],
        properties: [
            // ── Resource ──
            {
                displayName: 'Resource',
                name: 'resource',
                type: 'options',
                noDataExpression: true,
                options: [
                    { name: 'Carrier', value: 'carrier' },
                    { name: 'Contacts', value: 'contacts' },
                    { name: 'Crashes', value: 'crashes' },
                    { name: 'Fleet', value: 'fleet' },
                    { name: 'Inspections', value: 'inspections' },
                ],
                default: 'carrier',
            },
            // ── Carrier Operations ──
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: { show: { resource: ['carrier'] } },
                options: [
                    { name: 'Get by DOT', value: 'get', description: 'Get carrier profile by USDOT number', action: 'Get carrier by DOT number' },
                    { name: 'Get by MC', value: 'getByMc', description: 'Get carrier profile by MC/MX docket number', action: 'Get carrier by MC number' },
                    { name: 'Search', value: 'search', description: 'Fuzzy search carriers by name', action: 'Search carriers by name' },
                    { name: 'Filtered Query', value: 'filteredQuery', description: 'Query carriers with include/exclude filters', action: 'Query carriers with filters' },
                    { name: 'Get Authority', value: 'authority', description: 'Get authority history for a carrier', action: 'Get carrier authority history' },
                    { name: 'Get News', value: 'news', description: 'Get news articles about a carrier', action: 'Get carrier news' },
                ],
                default: 'get',
            },
            // ── Fleet Operations ──
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: { show: { resource: ['fleet'] } },
                options: [
                    { name: 'Get Trucks', value: 'trucks', description: 'Get registered trucks for a carrier', action: 'Get carrier trucks' },
                    { name: 'Get Trailers', value: 'trailers', description: 'Get registered trailers for a carrier', action: 'Get carrier trailers' },
                ],
                default: 'trucks',
            },
            // ── Inspections Operations ──
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: { show: { resource: ['inspections'] } },
                options: [
                    { name: 'List', value: 'list', description: 'List roadside inspections for a carrier', action: 'List carrier inspections' },
                    { name: 'Get Violations', value: 'violations', description: 'Get violations for a specific inspection', action: 'Get inspection violations' },
                ],
                default: 'list',
            },
            // ── Crashes Operations ──
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: { show: { resource: ['crashes'] } },
                options: [
                    { name: 'List', value: 'list', description: 'List crash records for a carrier', action: 'List carrier crashes' },
                ],
                default: 'list',
            },
            // ── Contacts Operations ──
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: { show: { resource: ['contacts'] } },
                options: [
                    { name: 'Search', value: 'search', description: 'Find people at a carrier or company', action: 'Search contacts' },
                    { name: 'Enrich', value: 'enrich', description: 'Get verified emails and phones for a contact', action: 'Enrich a contact' },
                ],
                default: 'search',
            },
            // ═══════════════════════════════════════
            // Input Fields
            // ═══════════════════════════════════════
            // ── DOT Number (shared across many operations) ──
            {
                displayName: 'DOT Number',
                name: 'dotNumber',
                type: 'string',
                required: true,
                default: '',
                placeholder: '80806',
                description: 'USDOT number of the carrier',
                displayOptions: {
                    show: {
                        resource: ['carrier'],
                        operation: ['get', 'authority', 'news'],
                    },
                },
            },
            {
                displayName: 'DOT Number',
                name: 'dotNumber',
                type: 'string',
                required: true,
                default: '',
                placeholder: '80806',
                description: 'USDOT number of the carrier',
                displayOptions: {
                    show: {
                        resource: ['fleet'],
                        operation: ['trucks', 'trailers'],
                    },
                },
            },
            {
                displayName: 'DOT Number',
                name: 'dotNumber',
                type: 'string',
                required: true,
                default: '',
                placeholder: '80806',
                description: 'USDOT number of the carrier',
                displayOptions: {
                    show: {
                        resource: ['inspections'],
                        operation: ['list'],
                    },
                },
            },
            {
                displayName: 'DOT Number',
                name: 'dotNumber',
                type: 'string',
                required: true,
                default: '',
                placeholder: '80806',
                description: 'USDOT number of the carrier',
                displayOptions: {
                    show: {
                        resource: ['crashes'],
                        operation: ['list'],
                    },
                },
            },
            // ── MC Number ──
            {
                displayName: 'MC Number',
                name: 'mcNumber',
                type: 'string',
                required: true,
                default: '',
                placeholder: '116851',
                description: 'MC/MX docket number',
                displayOptions: {
                    show: {
                        resource: ['carrier'],
                        operation: ['getByMc'],
                    },
                },
            },
            // ── Fields projection ──
            {
                displayName: 'Fields',
                name: 'fields',
                type: 'string',
                default: '',
                placeholder: 'legal_name,power_units,drivers',
                description: 'Comma-separated field names to return (leave empty for all 200+ fields)',
                displayOptions: {
                    show: {
                        resource: ['carrier'],
                        operation: ['get', 'getByMc'],
                    },
                },
            },
            // ── Search: Company Name ──
            {
                displayName: 'Company Name',
                name: 'companyName',
                type: 'string',
                required: true,
                default: '',
                placeholder: 'JB Hunt',
                description: 'Company name to search for (fuzzy matching)',
                displayOptions: {
                    show: {
                        resource: ['carrier'],
                        operation: ['search'],
                    },
                },
            },
            // ── Search: Additional filters ──
            {
                displayName: 'Additional Fields',
                name: 'searchOptions',
                type: 'collection',
                placeholder: 'Add Field',
                default: {},
                displayOptions: {
                    show: {
                        resource: ['carrier'],
                        operation: ['search'],
                    },
                },
                options: [
                    {
                        displayName: 'State',
                        name: 'state',
                        type: 'string',
                        default: '',
                        placeholder: 'TX',
                        description: 'Filter by state (2-letter code)',
                    },
                    {
                        displayName: 'City',
                        name: 'city',
                        type: 'string',
                        default: '',
                        description: 'Filter by city name',
                    },
                    {
                        displayName: 'Domain',
                        name: 'domain',
                        type: 'string',
                        default: '',
                        placeholder: 'jbhunt.com',
                        description: 'Filter by website domain',
                    },
                ],
            },
            // ── Filtered Query: Include ──
            {
                displayName: 'Include Filters (JSON)',
                name: 'includeFilters',
                type: 'json',
                required: true,
                default: '{\n  "state": "TX",\n  "has_common_authority": true,\n  "power_units": { "min": 5 }\n}',
                description: 'JSON object of include conditions. Supports text, range, boolean, array, and geo-radius filters.',
                displayOptions: {
                    show: {
                        resource: ['carrier'],
                        operation: ['filteredQuery'],
                    },
                },
            },
            // ── Filtered Query: Exclude ──
            {
                displayName: 'Exclude Filters (JSON)',
                name: 'excludeFilters',
                type: 'json',
                default: '',
                description: 'JSON object of exclude conditions (optional)',
                displayOptions: {
                    show: {
                        resource: ['carrier'],
                        operation: ['filteredQuery'],
                    },
                },
            },
            // ── Filtered Query: Sort ──
            {
                displayName: 'Additional Fields',
                name: 'filteredQueryOptions',
                type: 'collection',
                placeholder: 'Add Field',
                default: {},
                displayOptions: {
                    show: {
                        resource: ['carrier'],
                        operation: ['filteredQuery'],
                    },
                },
                options: [
                    {
                        displayName: 'Sort By',
                        name: 'sortBy',
                        type: 'string',
                        default: '',
                        placeholder: 'power_units',
                        description: 'Field to sort results by',
                    },
                    {
                        displayName: 'Sort Order',
                        name: 'sortOrder',
                        type: 'options',
                        options: [
                            { name: 'Ascending', value: 'asc' },
                            { name: 'Descending', value: 'desc' },
                        ],
                        default: 'desc',
                    },
                    {
                        displayName: 'Fields',
                        name: 'fields',
                        type: 'string',
                        default: '',
                        placeholder: 'legal_name,power_units',
                        description: 'Comma-separated field projection',
                    },
                ],
            },
            // ── News: Date filters ──
            {
                displayName: 'Additional Fields',
                name: 'newsOptions',
                type: 'collection',
                placeholder: 'Add Field',
                default: {},
                displayOptions: {
                    show: {
                        resource: ['carrier'],
                        operation: ['news'],
                    },
                },
                options: [
                    {
                        displayName: 'Start Date',
                        name: 'startDate',
                        type: 'string',
                        default: '',
                        placeholder: '2024-01-01',
                        description: 'Filter news from this date (YYYY-MM-DD)',
                    },
                    {
                        displayName: 'End Date',
                        name: 'endDate',
                        type: 'string',
                        default: '',
                        placeholder: '2024-12-31',
                        description: 'Filter news until this date (YYYY-MM-DD)',
                    },
                ],
            },
            // ── Crashes: Filters ──
            {
                displayName: 'Additional Fields',
                name: 'crashOptions',
                type: 'collection',
                placeholder: 'Add Field',
                default: {},
                displayOptions: {
                    show: {
                        resource: ['crashes'],
                        operation: ['list'],
                    },
                },
                options: [
                    {
                        displayName: 'Severity',
                        name: 'severity',
                        type: 'options',
                        options: [
                            { name: 'All', value: '' },
                            { name: 'Fatal', value: 'FATAL' },
                            { name: 'Injury', value: 'INJURY' },
                            { name: 'Tow', value: 'TOW' },
                        ],
                        default: '',
                        description: 'Filter by crash severity',
                    },
                    {
                        displayName: 'Start Date',
                        name: 'startDate',
                        type: 'string',
                        default: '',
                        placeholder: '2024-01-01',
                    },
                    {
                        displayName: 'End Date',
                        name: 'endDate',
                        type: 'string',
                        default: '',
                        placeholder: '2024-12-31',
                    },
                ],
            },
            // ── Inspection ID (for violations) ──
            {
                displayName: 'Inspection ID',
                name: 'inspectionId',
                type: 'string',
                required: true,
                default: '',
                description: 'The inspection ID to get violations for',
                displayOptions: {
                    show: {
                        resource: ['inspections'],
                        operation: ['violations'],
                    },
                },
            },
            // ── Contacts: Search fields ──
            {
                displayName: 'DOT Number',
                name: 'dotNumber',
                type: 'string',
                default: '',
                placeholder: '80806',
                description: 'USDOT number (provide DOT number and/or company name)',
                displayOptions: {
                    show: {
                        resource: ['contacts'],
                        operation: ['search'],
                    },
                },
            },
            {
                displayName: 'Additional Fields',
                name: 'contactSearchOptions',
                type: 'collection',
                placeholder: 'Add Field',
                default: {},
                displayOptions: {
                    show: {
                        resource: ['contacts'],
                        operation: ['search'],
                    },
                },
                options: [
                    {
                        displayName: 'Company Name',
                        name: 'companyName',
                        type: 'string',
                        default: '',
                        description: 'Search by company name instead of DOT number',
                    },
                    {
                        displayName: 'Job Title',
                        name: 'jobTitle',
                        type: 'string',
                        default: '',
                        placeholder: 'Safety Director',
                        description: 'Filter by job title keyword',
                    },
                    {
                        displayName: 'Job Title Levels',
                        name: 'jobTitleLevels',
                        type: 'string',
                        default: '',
                        placeholder: 'c_suite,vp,director',
                        description: 'Comma-separated seniority levels: c_suite, vp, director, manager, staff',
                    },
                ],
            },
            // ── Contacts: Enrich ──
            {
                displayName: 'Contact ID',
                name: 'contactId',
                type: 'string',
                required: true,
                default: '',
                description: 'The contact ID to enrich (1 credit per new lookup, cached lookups are free)',
                displayOptions: {
                    show: {
                        resource: ['contacts'],
                        operation: ['enrich'],
                    },
                },
            },
            // ── Shared: Limit ──
            {
                displayName: 'Limit',
                name: 'limit',
                type: 'number',
                default: 25,
                description: 'Max number of results to return',
                typeOptions: { minValue: 1, maxValue: 200 },
                displayOptions: {
                    hide: {
                        operation: ['get', 'getByMc', 'enrich'],
                    },
                },
            },
        ],
    };
    async execute() {
        const credentials = await this.getCredentials('alphaLoopsApi');
        const al = new client_1.AlphaLoops({ apiKey: credentials.apiKey });
        const items = this.getInputData();
        const returnData = [];
        for (let i = 0; i < items.length; i++) {
            const resource = this.getNodeParameter('resource', i);
            const operation = this.getNodeParameter('operation', i);
            let result;
            // ── Carrier ──
            if (resource === 'carrier') {
                if (operation === 'get') {
                    const dot = this.getNodeParameter('dotNumber', i);
                    const fields = this.getNodeParameter('fields', i, '');
                    result = await al.carriers.get(dot, fields || undefined);
                }
                else if (operation === 'getByMc') {
                    const mc = this.getNodeParameter('mcNumber', i);
                    const fields = this.getNodeParameter('fields', i, '');
                    result = await al.carriers.getByMc(mc, fields || undefined);
                }
                else if (operation === 'search') {
                    const name = this.getNodeParameter('companyName', i);
                    const limit = this.getNodeParameter('limit', i, 25);
                    const opts = this.getNodeParameter('searchOptions', i, {});
                    result = await al.carriers.search(name, {
                        limit,
                        ...(opts.state ? { state: opts.state } : {}),
                        ...(opts.city ? { city: opts.city } : {}),
                        ...(opts.domain ? { domain: opts.domain } : {}),
                    });
                }
                else if (operation === 'filteredQuery') {
                    const includeRaw = this.getNodeParameter('includeFilters', i);
                    const include = typeof includeRaw === 'string' ? JSON.parse(includeRaw) : includeRaw;
                    const excludeRaw = this.getNodeParameter('excludeFilters', i, '');
                    let exclude;
                    if (excludeRaw && typeof excludeRaw === 'string' && excludeRaw.trim()) {
                        exclude = JSON.parse(excludeRaw);
                    }
                    else if (excludeRaw && typeof excludeRaw === 'object' && Object.keys(excludeRaw).length > 0) {
                        exclude = excludeRaw;
                    }
                    const limit = this.getNodeParameter('limit', i, 25);
                    const opts = this.getNodeParameter('filteredQueryOptions', i, {});
                    result = await al.carriers.filteredQuery(include, {
                        limit,
                        exclude,
                        ...(opts.sortBy ? { sortBy: opts.sortBy } : {}),
                        ...(opts.sortOrder ? { sortOrder: opts.sortOrder } : {}),
                        ...(opts.fields ? { fields: opts.fields } : {}),
                    });
                }
                else if (operation === 'authority') {
                    const dot = this.getNodeParameter('dotNumber', i);
                    const limit = this.getNodeParameter('limit', i, 50);
                    result = await al.carriers.authority(dot, { limit });
                }
                else if (operation === 'news') {
                    const dot = this.getNodeParameter('dotNumber', i);
                    const limit = this.getNodeParameter('limit', i, 25);
                    const opts = this.getNodeParameter('newsOptions', i, {});
                    result = await al.carriers.news(dot, {
                        limit,
                        ...(opts.startDate ? { startDate: opts.startDate } : {}),
                        ...(opts.endDate ? { endDate: opts.endDate } : {}),
                    });
                }
            }
            // ── Fleet ──
            else if (resource === 'fleet') {
                const dot = this.getNodeParameter('dotNumber', i);
                const limit = this.getNodeParameter('limit', i, 50);
                if (operation === 'trucks') {
                    result = await al.fleet.trucks(dot, { limit });
                }
                else if (operation === 'trailers') {
                    result = await al.fleet.trailers(dot, { limit });
                }
            }
            // ── Inspections ──
            else if (resource === 'inspections') {
                if (operation === 'list') {
                    const dot = this.getNodeParameter('dotNumber', i);
                    const limit = this.getNodeParameter('limit', i, 50);
                    result = await al.inspections.list(dot, { limit });
                }
                else if (operation === 'violations') {
                    const inspId = this.getNodeParameter('inspectionId', i);
                    const limit = this.getNodeParameter('limit', i, 25);
                    result = await al.inspections.violations(inspId, { limit });
                }
            }
            // ── Crashes ──
            else if (resource === 'crashes') {
                const dot = this.getNodeParameter('dotNumber', i);
                const limit = this.getNodeParameter('limit', i, 25);
                const opts = this.getNodeParameter('crashOptions', i, {});
                result = await al.crashes.list(dot, {
                    limit,
                    ...(opts.severity ? { severity: opts.severity } : {}),
                    ...(opts.startDate ? { startDate: opts.startDate } : {}),
                    ...(opts.endDate ? { endDate: opts.endDate } : {}),
                });
            }
            // ── Contacts ──
            else if (resource === 'contacts') {
                if (operation === 'search') {
                    const dot = this.getNodeParameter('dotNumber', i, '');
                    const limit = this.getNodeParameter('limit', i, 25);
                    const opts = this.getNodeParameter('contactSearchOptions', i, {});
                    result = await al.contacts.search({
                        limit,
                        ...(dot ? { dotNumber: dot } : {}),
                        ...(opts.companyName ? { companyName: opts.companyName } : {}),
                        ...(opts.jobTitle ? { jobTitle: opts.jobTitle } : {}),
                        ...(opts.jobTitleLevels ? { jobTitleLevels: opts.jobTitleLevels } : {}),
                    });
                }
                else if (operation === 'enrich') {
                    const contactId = this.getNodeParameter('contactId', i);
                    result = await al.contacts.enrich(contactId);
                }
            }
            // Wrap result — if it's an array-like response with results, output each as separate item
            if (result !== undefined) {
                returnData.push({ json: result });
            }
        }
        return [returnData];
    }
}
exports.AlphaLoops = AlphaLoops;
