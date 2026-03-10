/**
 * Schema-free wrapper for API responses with dot-access via Proxy.
 *
 * Works like a plain object — JSON.stringify(), Object.keys(), `in` all work.
 * Nested objects are recursively wrapped so deep dot-access works:
 *   carrier.physical_address.city
 */
export type APIObject = Record<string, any>;

export function wrapResponse(data: unknown): any {
  if (Array.isArray(data)) {
    return data.map(wrapResponse);
  }
  if (data !== null && typeof data === "object") {
    const wrapped: Record<string, any> = {};
    for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
      wrapped[k] = wrapResponse(v);
    }
    return wrapped;
  }
  return data;
}
