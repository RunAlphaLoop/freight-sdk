import type { HTTPClient } from "../http-client";
import type { APIObject } from "../api-object";

export class InspectionsResource {
  constructor(private http: HTTPClient) {}

  async list(
    dotNumber: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<APIObject> {
    const { limit = 50, offset = 0 } = options;
    return this.http.get(`/v1/carriers/${dotNumber}/inspections`, { limit, offset });
  }


  async violations(
    inspectionId: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<APIObject> {
    const { page = 1, limit = 25 } = options;
    return this.http.get(`/v1/inspections/${inspectionId}/violations`, { page, limit });
  }

}
