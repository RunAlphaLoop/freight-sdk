import type { HTTPClient } from "../http-client";
import type { APIObject } from "../api-object";
export declare class InspectionsResource {
    private http;
    constructor(http: HTTPClient);
    list(dotNumber: string, options?: {
        limit?: number;
        offset?: number;
    }): Promise<APIObject>;
    violations(inspectionId: string, options?: {
        page?: number;
        limit?: number;
    }): Promise<APIObject>;
}
