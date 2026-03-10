import type { HTTPClient } from "../http-client.js";
import type { APIObject } from "../api-object.js";

export class InspectionsResource {
  constructor(private http: HTTPClient) {}

  async list(
    dotNumber: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<APIObject> {
    const { limit = 50, offset = 0 } = options;
    return this.http.get(`/v1/carriers/${dotNumber}/inspections`, { limit, offset });
  }

  async *listIter(
    dotNumber: string,
    options: { limit?: number } = {}
  ): AsyncGenerator<APIObject> {
    const { limit = 200 } = options;
    let offset = 0;
    while (true) {
      const resp = await this.list(dotNumber, { limit, offset });
      const inspections = resp.inspections ?? [];
      if (!inspections.length) return;
      yield* inspections;
      offset += inspections.length;
      if (offset >= (resp.total_results ?? resp.total_inspections ?? 0)) return;
    }
  }

  async violations(
    inspectionId: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<APIObject> {
    const { page = 1, limit = 25 } = options;
    return this.http.get(`/v1/inspections/${inspectionId}/violations`, { page, limit });
  }

  async *violationsIter(
    inspectionId: string,
    options: { limit?: number } = {}
  ): AsyncGenerator<APIObject> {
    const { limit = 25 } = options;
    let page = 1;
    while (true) {
      const resp = await this.violations(inspectionId, { page, limit });
      const violations = resp.violations ?? [];
      if (!violations.length) return;
      yield* violations;
      const totalPages = resp.pagination?.total_pages ?? page;
      if (page >= totalPages) return;
      page++;
    }
  }
}
