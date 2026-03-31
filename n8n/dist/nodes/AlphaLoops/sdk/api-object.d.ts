/**
 * Schema-free wrapper for API responses with dot-access via Proxy.
 *
 * Works like a plain object — JSON.stringify(), Object.keys(), `in` all work.
 * Nested objects are recursively wrapped so deep dot-access works:
 *   carrier.physical_address.city
 */
export type APIObject = Record<string, any>;
export declare function wrapResponse(data: unknown): any;
