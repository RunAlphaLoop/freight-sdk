import type { HTTPClient } from "../http-client";
import type { APIObject } from "../api-object";

export class FleetResource {
  constructor(private http: HTTPClient) {}

  async trucks(
    dotNumber: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<APIObject> {
    const { limit = 50, offset = 0 } = options;
    return this.http.get(`/v1/carriers/${dotNumber}/trucks`, { limit, offset });
  }


  async trailers(
    dotNumber: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<APIObject> {
    const { limit = 50, offset = 0 } = options;
    return this.http.get(`/v1/carriers/${dotNumber}/trailers`, { limit, offset });
  }

}
