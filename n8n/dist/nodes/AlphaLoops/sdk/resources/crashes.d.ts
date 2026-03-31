import type { HTTPClient } from "../http-client";
import type { APIObject } from "../api-object";
export declare class CrashesResource {
    private http;
    constructor(http: HTTPClient);
    list(dotNumber: string, options?: {
        startDate?: string;
        endDate?: string;
        severity?: string;
        page?: number;
        limit?: number;
    }): Promise<APIObject>;
}
