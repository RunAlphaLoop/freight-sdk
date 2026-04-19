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

  async timeline(
    dotNumber: string,
    options: { startDate?: string; endDate?: string; category?: string; limit?: number; offset?: number } = {}
  ): Promise<APIObject> {
    const { startDate, endDate, category, limit = 50, offset = 0 } = options;
    const params: Record<string, any> = { limit, offset };
    if (startDate !== undefined) params.start_date = startDate;
    if (endDate !== undefined) params.end_date = endDate;
    if (category !== undefined) params.category = category;
    return this.http.get(`/v1/carriers/${dotNumber}/timeline`, params);
  }

  async *timelineIter(
    dotNumber: string,
    options: { startDate?: string; endDate?: string; category?: string; limit?: number } = {}
  ): AsyncGenerator<APIObject> {
    const { limit = 50, ...rest } = options;
    let offset = 0;
    while (true) {
      const resp = await this.timeline(dotNumber, { ...rest, limit, offset });
      const events = resp.events ?? [];
      if (!events.length) return;
      yield* events;
      offset += events.length;
      if (offset >= (resp.total ?? 0)) return;
    }
  }

  async insurance(
    dotNumber: string,
    options: { coverageType?: string; status?: string; page?: number; limit?: number } = {}
  ): Promise<APIObject> {
    const { coverageType, status, page = 1, limit = 50 } = options;
    const params: Record<string, any> = { page, limit };
    if (coverageType !== undefined) params.coverage_type = coverageType;
    if (status !== undefined) params.status = status;
    return this.http.get(`/v1/carriers/${dotNumber}/insurance`, params);
  }

  async *insuranceIter(
    dotNumber: string,
    options: { coverageType?: string; status?: string; limit?: number } = {}
  ): AsyncGenerator<APIObject> {
    const { limit = 50, ...rest } = options;
    let page = 1;
    while (true) {
      const resp = await this.insurance(dotNumber, { ...rest, page, limit });
      const records = resp.insurance ?? [];
      if (!records.length) return;
      yield* records;
      const totalPages = resp.pagination?.total_pages ?? page;
      if (page >= totalPages) return;
      page++;
    }
  }

  async insuranceByMc(
    mcNumber: string,
    options: { coverageType?: string; status?: string; page?: number; limit?: number } = {}
  ): Promise<APIObject> {
    const { coverageType, status, page = 1, limit = 50 } = options;
    const params: Record<string, any> = { page, limit };
    if (coverageType !== undefined) params.coverage_type = coverageType;
    if (status !== undefined) params.status = status;
    return this.http.get(`/v1/carriers/mc/${mcNumber}/insurance`, params);
  }

  async *insuranceByMcIter(
    mcNumber: string,
    options: { coverageType?: string; status?: string; limit?: number } = {}
  ): AsyncGenerator<APIObject> {
    const { limit = 50, ...rest } = options;
    let page = 1;
    while (true) {
      const resp = await this.insuranceByMc(mcNumber, { ...rest, page, limit });
      const records = resp.insurance ?? [];
      if (!records.length) return;
      yield* records;
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
