import type { HTTPClient } from "../http-client";
import type { APIObject } from "../api-object";
export declare class ContactsResource {
    private http;
    constructor(http: HTTPClient);
    search(options?: {
        dotNumber?: string;
        companyName?: string;
        jobTitle?: string;
        jobTitleLevels?: string;
        page?: number;
        limit?: number;
        autoRetry?: boolean;
        maxRetries?: number;
    }): Promise<APIObject>;
    enrich(contactId: string): Promise<APIObject>;
}
