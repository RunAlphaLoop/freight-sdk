"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTPClient = void 0;
const api_object_1 = require("./api-object");
const errors_1 = require("./errors");
const RETRYABLE = new Set([500, 502, 503, 504]);
class HTTPClient {
    baseUrl;
    timeout;
    maxRetries;
    retryBaseDelay;
    headers;
    constructor(opts) {
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
    async get(path, params) {
        const resp = await this.requestRaw("GET", path, params);
        this.raiseForStatus(resp.status, resp.body);
        return (0, api_object_1.wrapResponse)(resp.body);
    }
    async post(path, body) {
        const resp = await this.requestRawWithBody("POST", path, body);
        this.raiseForStatus(resp.status, resp.body);
        return (0, api_object_1.wrapResponse)(resp.body);
    }
    async getRaw(path, params) {
        return this.requestRaw("GET", path, params);
    }
    async requestRaw(method, path, params) {
        let url = `${this.baseUrl}${path}`;
        if (params) {
            const qs = new URLSearchParams();
            for (const [k, v] of Object.entries(params)) {
                if (v !== undefined && v !== null)
                    qs.set(k, String(v));
            }
            const s = qs.toString();
            if (s)
                url += `?${s}`;
        }
        let lastError;
        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            let resp;
            try {
                resp = await fetch(url, {
                    method,
                    headers: this.headers,
                    signal: AbortSignal.timeout(this.timeout * 1000),
                });
            }
            catch (err) {
                lastError = err;
                if (attempt < this.maxRetries) {
                    await sleep(this.retryBaseDelay * 2 ** attempt);
                    continue;
                }
                throw new errors_1.AlphaLoopsAPIError(0, "ConnectionError", String(err));
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
        throw new errors_1.AlphaLoopsAPIError(0, "ConnectionError", lastError ? String(lastError) : "Request failed after retries");
    }
    async requestRawWithBody(method, path, jsonBody) {
        const url = `${this.baseUrl}${path}`;
        let lastError;
        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            let resp;
            try {
                resp = await fetch(url, {
                    method,
                    headers: { ...this.headers, "Content-Type": "application/json" },
                    body: jsonBody !== undefined ? JSON.stringify(jsonBody) : undefined,
                    signal: AbortSignal.timeout(this.timeout * 1000),
                });
            }
            catch (err) {
                lastError = err;
                if (attempt < this.maxRetries) {
                    await sleep(this.retryBaseDelay * 2 ** attempt);
                    continue;
                }
                throw new errors_1.AlphaLoopsAPIError(0, "ConnectionError", String(err));
            }
            if (resp.status === 401) {
                const body = await safeJson(resp);
                this.raiseForStatus(resp.status, body);
            }
            if (resp.status === 429) {
                if (attempt < this.maxRetries) {
                    const retryAfter = parseRetryAfter(resp.headers);
                    await sleep(retryAfter);
                    continue;
                }
                const body = await safeJson(resp);
                this.raiseForStatus(resp.status, body);
            }
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
        throw new errors_1.AlphaLoopsAPIError(0, "ConnectionError", lastError ? String(lastError) : "Request failed after retries");
    }
    raiseForStatus(status, body) {
        if (status < 400)
            return;
        const error = body?.error ?? "";
        const message = body?.message ?? "";
        if (status === 401)
            throw new errors_1.AlphaLoopsAuthError(message || undefined);
        if (status === 402)
            throw new errors_1.AlphaLoopsPaymentError(message || undefined);
        if (status === 404)
            throw new errors_1.AlphaLoopsNotFoundError(message || undefined);
        if (status === 429)
            throw new errors_1.AlphaLoopsRateLimitError(message || undefined);
        throw new errors_1.AlphaLoopsAPIError(status, error, message);
    }
}
exports.HTTPClient = HTTPClient;
function parseRetryAfter(headers) {
    const val = headers.get("Retry-After");
    if (val) {
        const n = parseInt(val, 10);
        if (!isNaN(n))
            return n;
    }
    return 2;
}
async function safeJson(resp) {
    try {
        return await resp.json();
    }
    catch {
        return {};
    }
}
function sleep(seconds) {
    return Promise.resolve();
}
