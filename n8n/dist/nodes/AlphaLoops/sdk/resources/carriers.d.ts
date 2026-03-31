import type { HTTPClient } from "../http-client";
import type { APIObject } from "../api-object";
export declare class CarriersResource {
    private http;
    constructor(http: HTTPClient);
    get(dotNumber: string, fields?: string): Promise<APIObject>;
    getByMc(mcNumber: string, fields?: string): Promise<APIObject>;
    search(companyName: string, options?: {
        domain?: string;
        state?: string;
        city?: string;
        page?: number;
        limit?: number;
    }): Promise<APIObject>;
    authority(dotNumber: string, options?: {
        limit?: number;
        offset?: number;
    }): Promise<APIObject>;
    filteredQuery(include: Record<string, any>, options?: {
        exclude?: Record<string, any>;
        sortBy?: string;
        sortOrder?: string;
        page?: number;
        limit?: number;
        fields?: string;
    }): Promise<APIObject>;
    news(dotNumber: string, options?: {
        startDate?: string;
        endDate?: string;
        page?: number;
        limit?: number;
    }): Promise<APIObject>;
}
