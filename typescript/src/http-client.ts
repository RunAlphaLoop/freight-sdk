import { wrapResponse } from "./api-object.js";
import {
  AlphaLoopsAPIError,
  AlphaLoopsAuthError,
  AlphaLoopsNotFoundError,
  AlphaLoopsPaymentError,
  AlphaLoopsRateLimitError,
} from "./errors.js";

const RETRYABLE = new Set([500, 502, 503, 504]);

export interface HTTPClientOptions {
  baseUrl: string;
  apiKey: string;
  timeout: number;
  maxRetries: number;
  retryBaseDelay: number;
  version: string;
}

export class HTTPClient {
  private baseUrl: string;
  private timeout: number;
  private maxRetries: number;
  private retryBaseDelay: number;
  private headers: Record<string, string>;

  constructor(opts: HTTPClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/+$/, "");
    this.timeout = opts.timeout;
    this.maxRetries = opts.maxRetries;
    this.retryBaseDelay = opts.retryBaseDelay;
    this.headers = {
      Authorization: `Bearer ${opts.apiKey}`,
      "User-Agent": `AlphaLoops-TypeScript/${opts.version}`,
      Accept: "application/json",
    };
  }

  async get(path: string, params?: Record<string, any>): Promise<any> {
    const resp = await this.requestRaw("GET", path, params);
    this.raiseForStatus(resp.status, resp.body);
    return wrapResponse(resp.body);
  }

  async getRaw(
    path: string,
    params?: Record<string, any>
  ): Promise<{ status: number; headers: Headers; body: any }> {
    return this.requestRaw("GET", path, params);
  }

  private async requestRaw(
    method: string,
    path: string,
    params?: Record<string, any>
  ): Promise<{ status: number; headers: Headers; body: any }> {
    let url = `${this.baseUrl}${path}`;
    if (params) {
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null) qs.set(k, String(v));
      }
      const s = qs.toString();
      if (s) url += `?${s}`;
    }

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      let resp: Response;
      try {
        resp = await fetch(url, {
          method,
          headers: this.headers,
          signal: AbortSignal.timeout(this.timeout * 1000),
        });
      } catch (err) {
        lastError = err as Error;
        if (attempt < this.maxRetries) {
          await sleep(this.retryBaseDelay * 2 ** attempt);
          continue;
        }
        throw new AlphaLoopsAPIError(0, "ConnectionError", String(err));
      }

      // 401 — never retry
      if (resp.status === 401) {
        const body = await safeJson(resp);
        this.raiseForStatus(resp.status, body);
      }

      // 429 — rate limited
      if (resp.status === 429) {
        if (attempt < this.maxRetries) {
          const retryAfter = parseRetryAfter(resp.headers);
          await sleep(retryAfter);
          continue;
        }
        const body = await safeJson(resp);
        this.raiseForStatus(resp.status, body);
      }

      // 5xx — retryable
      if (RETRYABLE.has(resp.status)) {
        if (attempt < this.maxRetries) {
          await sleep(this.retryBaseDelay * 2 ** attempt);
          continue;
        }
        const body = await safeJson(resp);
        this.raiseForStatus(resp.status, body);
      }

      const body = await safeJson(resp);
      return { status: resp.status, headers: resp.headers, body };
    }

    throw new AlphaLoopsAPIError(
      0,
      "ConnectionError",
      lastError ? String(lastError) : "Request failed after retries"
    );
  }

  raiseForStatus(status: number, body: any): void {
    if (status < 400) return;

    const error = body?.error ?? "";
    const message = body?.message ?? "";

    if (status === 401) throw new AlphaLoopsAuthError(message || undefined);
    if (status === 402)
      throw new AlphaLoopsPaymentError(message || undefined);
    if (status === 404)
      throw new AlphaLoopsNotFoundError(message || undefined);
    if (status === 429)
      throw new AlphaLoopsRateLimitError(message || undefined);
    throw new AlphaLoopsAPIError(status, error, message);
  }
}

function parseRetryAfter(headers: Headers): number {
  const val = headers.get("Retry-After");
  if (val) {
    const n = parseInt(val, 10);
    if (!isNaN(n)) return n;
  }
  return 2;
}

async function safeJson(resp: Response): Promise<any> {
  try {
    return await resp.json();
  } catch {
    return {};
  }
}

function sleep(seconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}
