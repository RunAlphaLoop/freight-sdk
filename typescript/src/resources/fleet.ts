import type { HTTPClient } from "../http-client.js";
import type { APIObject } from "../api-object.js";

export class FleetResource {
  constructor(private http: HTTPClient) {}

  async trucks(
    dotNumber: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<APIObject> {
    const { limit = 50, offset = 0 } = options;
    return this.http.get(`/v1/carriers/${dotNumber}/trucks`, { limit, offset });
  }

  async *trucksIter(
    dotNumber: string,
    options: { limit?: number } = {}
  ): AsyncGenerator<APIObject> {
    const { limit = 200 } = options;
    let offset = 0;
    while (true) {
      const resp = await this.trucks(dotNumber, { limit, offset });
      const trucks = resp.trucks ?? [];
      if (!trucks.length) return;
      yield* trucks;
      offset += trucks.length;
      if (offset >= (resp.total_results ?? resp.total_trucks ?? 0)) return;
    }
  }

  async trailers(
    dotNumber: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<APIObject> {
    const { limit = 50, offset = 0 } = options;
    return this.http.get(`/v1/carriers/${dotNumber}/trailers`, { limit, offset });
  }

  async *trailersIter(
    dotNumber: string,
    options: { limit?: number } = {}
  ): AsyncGenerator<APIObject> {
    const { limit = 200 } = options;
    let offset = 0;
    while (true) {
      const resp = await this.trailers(dotNumber, { limit, offset });
      const trailers = resp.trailers ?? [];
      if (!trailers.length) return;
      yield* trailers;
      offset += trailers.length;
      if (offset >= (resp.total_results ?? resp.total_trailers ?? 0)) return;
    }
  }
}
