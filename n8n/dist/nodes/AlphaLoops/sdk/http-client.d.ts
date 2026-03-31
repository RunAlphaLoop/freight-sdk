export interface HTTPClientOptions {
    baseUrl: string;
    apiKey: string;
    timeout: number;
    maxRetries: number;
    retryBaseDelay: number;
    version: string;
}
export declare class HTTPClient {
    private baseUrl;
    private timeout;
    private maxRetries;
    private retryBaseDelay;
    private headers;
    constructor(opts: HTTPClientOptions);
    get(path: string, params?: Record<string, any>): Promise<any>;
    post(path: string, body?: any): Promise<any>;
    getRaw(path: string, params?: Record<string, any>): Promise<{
        status: number;
        headers: Headers;
        body: any;
    }>;
    private requestRaw;
    private requestRawWithBody;
    raiseForStatus(status: number, body: any): void;
}
