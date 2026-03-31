import type { HTTPClient } from "../http-client";
import type { APIObject } from "../api-object";
export declare class FleetResource {
    private http;
    constructor(http: HTTPClient);
    trucks(dotNumber: string, options?: {
        limit?: number;
        offset?: number;
    }): Promise<APIObject>;
    trailers(dotNumber: string, options?: {
        limit?: number;
        offset?: number;
    }): Promise<APIObject>;
}
