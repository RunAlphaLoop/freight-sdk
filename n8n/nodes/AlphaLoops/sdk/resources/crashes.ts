import type { HTTPClient } from "../http-client";
import type { APIObject } from "../api-object";

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

}
