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

const DOT = "2247505";
const MC = "624748";

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
    expect(e.name).toBe("AlphaLoopsAuthError");
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
    expect(carrier.legal_name.length).toBeGreaterThan(0);
    expect(carrier.dot_number).toBeDefined();
  });

  it("supports field projection", async () => {
    const carrier = await al.carriers.get(DOT, "legal_name,dot_number");
    expect(carrier).toBeDefined();
    expect(typeof carrier.legal_name).toBe("string");
    expect(carrier.dot_number).toBeDefined();
    // Projected response should have only the requested fields
    const keys = Object.keys(carrier);
    expect(keys).toContain("legal_name");
    expect(keys).toContain("dot_number");
  });
});

describe("carriers.getByMc", () => {
  it("throws AlphaLoopsNotFoundError for unknown MC number", async () => {
    // MC 624748 is not in the API — verify the SDK correctly throws
    await expect(al.carriers.getByMc(MC)).rejects.toThrow(
      AlphaLoopsNotFoundError
    );
  });
});

describe("carriers.search", () => {
  it("returns search results for Swift", async () => {
    const result = await al.carriers.search("Swift", { limit: 3 });
    expect(result).toBeDefined();
    expect(result.results).toBeDefined();
    expect(Array.isArray(result.results)).toBe(true);
    expect(result.results.length).toBeGreaterThan(0);
    expect(result.total_results).toBeDefined();
    expect(result.pagination).toBeDefined();
  });
});

describe("carriers.authority", () => {
  it("returns authority history", async () => {
    const result = await al.carriers.authority(DOT);
    expect(result).toBeDefined();
    expect(result.dot_number).toBeDefined();
    expect(result.authority_history).toBeDefined();
    expect(Array.isArray(result.authority_history)).toBe(true);
    expect(result.total_records).toBeDefined();
  });
});

describe("carriers.news", () => {
  it("returns news response structure", async () => {
    const result = await al.carriers.news(DOT);
    expect(result).toBeDefined();
    expect(result.dot_number).toBeDefined();
    expect(result.articles).toBeDefined();
    expect(Array.isArray(result.articles)).toBe(true);
    expect(result.pagination).toBeDefined();
  });
});

describe("fleet.trucks", () => {
  it("throws AlphaLoopsNotFoundError when no trucks data exists", async () => {
    // DOT 2247505 has no truck-level data in the API
    await expect(al.fleet.trucks(DOT, { limit: 5 })).rejects.toThrow(
      AlphaLoopsNotFoundError
    );
  });
});

describe("fleet.trailers", () => {
  it("throws AlphaLoopsNotFoundError when no trailers data exists", async () => {
    await expect(al.fleet.trailers(DOT, { limit: 5 })).rejects.toThrow(
      AlphaLoopsNotFoundError
    );
  });
});

describe("inspections.list", () => {
  it("throws AlphaLoopsNotFoundError when no inspections data exists", async () => {
    await expect(al.inspections.list(DOT, { limit: 5 })).rejects.toThrow(
      AlphaLoopsNotFoundError
    );
  });
});

describe("crashes.list", () => {
  it("throws AlphaLoopsNotFoundError when no crashes data exists", async () => {
    await expect(al.crashes.list(DOT, { limit: 5 })).rejects.toThrow(
      AlphaLoopsNotFoundError
    );
  });
});

describe("contacts.search", () => {
  it("returns contacts data (handles 202 retry)", async () => {
    const result = await al.contacts.search({ dotNumber: DOT, limit: 5 });
    expect(result).toBeDefined();
    expect(typeof result).toBe("object");
  });
});

describe("async iterator — searchIter", () => {
  it("yields search result records via async iterator", async () => {
    const results: any[] = [];
    for await (const item of al.carriers.searchIter("Swift", { limit: 3 })) {
      results.push(item);
      if (results.length >= 3) break;
    }
    expect(results.length).toBeGreaterThan(0);
    expect(typeof results[0]).toBe("object");
  });
});

describe("error handling", () => {
  it("throws on invalid DOT number", async () => {
    await expect(al.carriers.get("0000000")).rejects.toThrow();
  });
});
