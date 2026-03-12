import type { HTTPClient } from "../http-client.js";
import type { APIObject } from "../api-object.js";

export class CarriersResource {
  constructor(private http: HTTPClient) {}

  async get(dotNumber: string, fields?: string): Promise<APIObject> {
    const params: Record<string, any> = {};
    if (fields !== undefined) params.fields = fields;
    return this.http.get(`/v1/carriers/${dotNumber}`, Object.keys(params).length ? params : undefined);
  }

  async getByMc(mcNumber: string, fields?: string): Promise<APIObject> {
    const params: Record<string, any> = {};
    if (fields !== undefined) params.fields = fields;
    return this.http.get(`/v1/carriers/mc/${mcNumber}`, Object.keys(params).length ? params : undefined);
  }

  async search(
    companyName: string,
    options: { domain?: string; state?: string; city?: string; page?: number; limit?: number } = {}
  ): Promise<APIObject> {
    const { domain, state, city, page = 1, limit = 10 } = options;
    const params: Record<string, any> = { company_name: companyName, page, limit };
    if (domain !== undefined) params.domain = domain;
    if (state !== undefined) params.state = state;
    if (city !== undefined) params.city = city;
    return this.http.get("/v1/carriers/search", params);
  }

  async *searchIter(
    companyName: string,
    options: { domain?: string; state?: string; city?: string; limit?: number } = {}
  ): AsyncGenerator<APIObject> {
    const { limit = 10, ...rest } = options;
    let page = 1;
    while (true) {
      const resp = await this.search(companyName, { ...rest, page, limit });
      const results = resp.results ?? [];
      if (!results.length) return;
      yield* results;
      const totalPages = resp.pagination?.total_pages ?? page;
      if (page >= totalPages) return;
      page++;
    }
  }

  async authority(
    dotNumber: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<APIObject> {
    const { limit = 50, offset = 0 } = options;
    return this.http.get(`/v1/carriers/${dotNumber}/authority`, { limit, offset });
  }

  async *authorityIter(
    dotNumber: string,
    options: { limit?: number } = {}
  ): AsyncGenerator<APIObject> {
    const { limit = 50 } = options;
    let offset = 0;
    while (true) {
      const resp = await this.authority(dotNumber, { limit, offset });
      const records = resp.authority_history ?? [];
      if (!records.length) return;
      yield* records;
      offset += records.length;
      if (offset >= (resp.total_records ?? 0)) return;
    }
  }

  async filteredQuery(
    include: Record<string, any>,
    options: {
      exclude?: Record<string, any>;
      sortBy?: string;
      sortOrder?: string;
      page?: number;
      limit?: number;
      fields?: string;
    } = {}
  ): Promise<APIObject> {
    const { exclude, sortBy, sortOrder, page = 1, limit = 25, fields } = options;
    const body: Record<string, any> = { include, page, limit };
    if (exclude !== undefined) body.exclude = exclude;
    if (sortBy !== undefined) body.sort_by = sortBy;
    if (sortOrder !== undefined) body.sort_order = sortOrder;
    if (fields !== undefined) body.fields = fields;
    return this.http.post("/v1/carriers/query", body);
  }

  async *filteredQueryIter(
    include: Record<string, any>,
    options: {
      exclude?: Record<string, any>;
      sortBy?: string;
      sortOrder?: string;
      limit?: number;
      fields?: string;
    } = {}
  ): AsyncGenerator<APIObject> {
    const { limit = 25, ...rest } = options;
    let page = 1;
    while (true) {
      const resp = await this.filteredQuery(include, { ...rest, page, limit });
      const results = resp.results ?? [];
      if (!results.length) return;
      yield* results;
      const totalPages = resp.pagination?.total_pages ?? page;
      if (page >= totalPages) return;
      page++;
    }
  }

  async news(
    dotNumber: string,
    options: { startDate?: string; endDate?: string; page?: number; limit?: number } = {}
  ): Promise<APIObject> {
    const { startDate, endDate, page = 1, limit = 25 } = options;
    const params: Record<string, any> = { page, limit };
    if (startDate !== undefined) params.start_date = startDate;
    if (endDate !== undefined) params.end_date = endDate;
    return this.http.get(`/v1/carriers/${dotNumber}/news`, params);
  }

  async *newsIter(
    dotNumber: string,
    options: { startDate?: string; endDate?: string; limit?: number } = {}
  ): AsyncGenerator<APIObject> {
    const { limit = 25, ...rest } = options;
    let page = 1;
    while (true) {
      const resp = await this.news(dotNumber, { ...rest, page, limit });
      const articles = resp.articles ?? [];
      if (!articles.length) return;
      yield* articles;
      const total = resp.total_results ?? 0;
      if (page * limit >= total) return;
      page++;
    }
  }
}
