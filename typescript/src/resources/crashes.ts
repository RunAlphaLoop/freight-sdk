import type { HTTPClient } from "../http-client.js";
import type { APIObject } from "../api-object.js";

export class CrashesResource {
  constructor(private http: HTTPClient) {}

  async list(
    dotNumber: string,
    options: {
      startDate?: string;
      endDate?: string;
      severity?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<APIObject> {
    const { startDate, endDate, severity, page = 1, limit = 25 } = options;
    const params: Record<string, any> = { page, limit };
    if (startDate !== undefined) params.start_date = startDate;
    if (endDate !== undefined) params.end_date = endDate;
    if (severity !== undefined) params.severity = severity;
    return this.http.get(`/v1/carriers/${dotNumber}/crashes`, params);
  }

  async *listIter(
    dotNumber: string,
    options: { startDate?: string; endDate?: string; severity?: string; limit?: number } = {}
  ): AsyncGenerator<APIObject> {
    const { limit = 25, ...rest } = options;
    let page = 1;
    while (true) {
      const resp = await this.list(dotNumber, { ...rest, page, limit });
      const crashes = resp.crashes ?? [];
      if (!crashes.length) return;
      yield* crashes;
      const totalPages = resp.pagination?.total_pages ?? page;
      if (page >= totalPages) return;
      page++;
    }
  }
}
