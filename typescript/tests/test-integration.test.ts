import { describe, it, expect, beforeAll } from "vitest";
import {
  AlphaLoops,
  AlphaLoopsError,
  AlphaLoopsAuthError,
  AlphaLoopsNotFoundError,
  AlphaLoopsRateLimitError,
  AlphaLoopsPaymentError,
  AlphaLoopsPendingError,
  AlphaLoopsAPIError,
} from "../src/index.js";
import { wrapResponse } from "../src/api-object.js";

const DOT = "80806";

let al: AlphaLoops;

beforeAll(() => {
  al = new AlphaLoops();
});

// ---------------------------------------------------------------------------
// Non-API unit tests
// ---------------------------------------------------------------------------

describe("Error classes", () => {
  it("AlphaLoopsError", () => {
    const e = new AlphaLoopsError("boom");
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("AlphaLoopsError");
    expect(e.message).toBe("boom");
  });

  it("AlphaLoopsAuthError with default message", () => {
    const e = new AlphaLoopsAuthError();
    expect(e).toBeInstanceOf(AlphaLoopsError);
    expect(e.message).toContain("Authentication");
  });

  it("AlphaLoopsNotFoundError", () => {
    const e = new AlphaLoopsNotFoundError("gone");
    expect(e.name).toBe("AlphaLoopsNotFoundError");
    expect(e.message).toBe("gone");
  });

  it("AlphaLoopsRateLimitError with retryAfter", () => {
    const e = new AlphaLoopsRateLimitError("slow down", 30);
    expect(e.retryAfter).toBe(30);
  });

  it("AlphaLoopsPaymentError", () => {
    const e = new AlphaLoopsPaymentError();
    expect(e.message).toContain("credits");
  });

  it("AlphaLoopsPendingError with retryAfter", () => {
    const e = new AlphaLoopsPendingError("wait", 5);
    expect(e.retryAfter).toBe(5);
  });

  it("AlphaLoopsAPIError", () => {
    const e = new AlphaLoopsAPIError(500, "InternalError", "oops");
    expect(e.statusCode).toBe(500);
    expect(e.error).toBe("InternalError");
    expect(e.message).toContain("500");
  });
});

describe("wrapResponse", () => {
  it("wraps a plain object", () => {
    const obj = wrapResponse({ a: 1, b: { c: 2 } });
    expect(obj.a).toBe(1);
    expect(obj.b.c).toBe(2);
  });

  it("wraps an array", () => {
    const arr = wrapResponse([{ x: 1 }, { x: 2 }]);
    expect(Array.isArray(arr)).toBe(true);
    expect(arr[0].x).toBe(1);
  });

  it("passes through primitives", () => {
    expect(wrapResponse(42)).toBe(42);
    expect(wrapResponse("hello")).toBe("hello");
    expect(wrapResponse(null)).toBe(null);
  });
});

// ---------------------------------------------------------------------------
// Live API integration tests
// ---------------------------------------------------------------------------

describe("carriers.get", () => {
  it("returns carrier data with legal_name", async () => {
    const carrier = await al.carriers.get(DOT);
    expect(carrier).toBeDefined();
    expect(carrier.legal_name).toBeDefined();
    expect(typeof carrier.legal_name).toBe("string");
    expect(carrier.legal_name.toUpperCase()).toContain("HUNT");
    expect(carrier.dot_number).toBeDefined();
  });

  it("supports field projection", async () => {
    const carrier = await al.carriers.get(DOT, "legal_name,dot_number");
    expect(carrier).toBeDefined();
    expect(typeof carrier.legal_name).toBe("string");
    expect(carrier.dot_number).toBeDefined();
  });
});

describe("carriers.search", () => {
  it("returns search results for JB Hunt", async () => {
    const result = await al.carriers.search("JB Hunt", { limit: 5 });
    expect(result).toBeDefined();
    expect(result.results).toBeDefined();
    expect(Array.isArray(result.results)).toBe(true);
    expect(result.results.length).toBeGreaterThan(0);
    expect(result.pagination).toBeDefined();
  });
});

describe("carriers.authority", () => {
  it("returns authority history", async () => {
    const result = await al.carriers.authority(DOT);
    expect(result).toBeDefined();
    expect(result.authority_history).toBeDefined();
    expect(Array.isArray(result.authority_history)).toBe(true);
    expect(result.authority_history.length).toBeGreaterThan(0);
    expect(result.total_records).toBeGreaterThan(0);
  });
});

describe("carriers.news", () => {
  it("returns news articles", async () => {
    const result = await al.carriers.news(DOT);
    expect(result).toBeDefined();
    expect(result.articles).toBeDefined();
    expect(Array.isArray(result.articles)).toBe(true);
    expect(result.articles.length).toBeGreaterThan(0);
    expect(result.pagination).toBeDefined();
  });
});

describe("fleet.trucks", () => {
  it("returns truck fleet data", async () => {
    const result = await al.fleet.trucks(DOT, { limit: 5 });
    expect(result).toBeDefined();
    expect(result.trucks).toBeDefined();
    expect(Array.isArray(result.trucks)).toBe(true);
    expect(result.trucks.length).toBeGreaterThan(0);
  });
});

describe("fleet.trailers", () => {
  it("returns trailer fleet data", async () => {
    const result = await al.fleet.trailers(DOT, { limit: 5 });
    expect(result).toBeDefined();
    expect(result.trailers).toBeDefined();
    expect(Array.isArray(result.trailers)).toBe(true);
    expect(result.trailers.length).toBeGreaterThan(0);
  });
});

describe("inspections.list", () => {
  it("returns inspection history", async () => {
    const result = await al.inspections.list(DOT, { limit: 5 });
    expect(result).toBeDefined();
    expect(result.inspections).toBeDefined();
    expect(Array.isArray(result.inspections)).toBe(true);
    expect(result.inspections.length).toBeGreaterThan(0);
  });
});

describe("crashes.list", () => {
  it("returns crash history", async () => {
    const result = await al.crashes.list(DOT, { limit: 5 });
    expect(result).toBeDefined();
    expect(result.crashes).toBeDefined();
    expect(Array.isArray(result.crashes)).toBe(true);
    expect(result.crashes.length).toBeGreaterThan(0);
  });
});

describe("contacts.search", () => {
  it("returns contacts data (handles 202 retry)", async () => {
    const result = await al.contacts.search({ dotNumber: DOT, limit: 5 });
    expect(result).toBeDefined();
    expect(typeof result).toBe("object");
    const contacts = result.contacts ?? [];
    expect(Array.isArray(contacts)).toBe(true);
    expect(contacts.length).toBeGreaterThan(0);
  });
});

describe("async iterators", () => {
  it("trucksIter yields truck records", async () => {
    const items: any[] = [];
    for await (const truck of al.fleet.trucksIter(DOT, { limit: 5 })) {
      items.push(truck);
      if (items.length >= 3) break;
    }
    expect(items.length).toBe(3);
    expect(typeof items[0]).toBe("object");
  });

  it("searchIter yields carrier search results", async () => {
    const results: any[] = [];
    for await (const item of al.carriers.searchIter("JB Hunt", { limit: 3 })) {
      results.push(item);
      if (results.length >= 3) break;
    }
    expect(results.length).toBeGreaterThan(0);
  });
});

describe("error handling", () => {
  it("throws on invalid DOT number", async () => {
    await expect(al.carriers.get("0000000")).rejects.toThrow();
  });
});
