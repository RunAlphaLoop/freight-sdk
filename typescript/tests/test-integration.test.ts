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
  it("returns carrier data with expected fields", async () => {
    const carrier = await al.carriers.get(DOT);
    expect(carrier).toBeDefined();
    expect(carrier.legal_name.toUpperCase()).toContain("HUNT");
    expect(carrier.dot_number).toBe("80806");
    expect(typeof carrier.dba_name).toBe("string");
    expect(typeof carrier.carrier_operation).toBe("string");
    expect(typeof carrier.phone).toBe("string");
    expect(typeof carrier.power_units).toBe("number");
    expect(typeof carrier.drivers).toBe("number");
    expect(typeof carrier.safety_rating).toBe("string");
    expect(carrier.physical_address).toBeDefined();
    expect(typeof carrier.physical_address.street).toBe("string");
    expect(typeof carrier.physical_address.city).toBe("string");
    expect(typeof carrier.physical_address.state).toBe("string");
    expect(typeof carrier.physical_address.zip).toBe("string");
  });

  it("supports field projection", async () => {
    const carrier = await al.carriers.get(DOT, "legal_name,dot_number");
    expect(carrier).toBeDefined();
    expect(typeof carrier.legal_name).toBe("string");
    expect(carrier.dot_number).toBeDefined();
  });
});

describe("carriers.search", () => {
  it("returns search results with expected fields", async () => {
    const result = await al.carriers.search("JB Hunt", { limit: 5 });
    expect(result.results.length).toBeGreaterThan(0);
    expect(result.pagination).toBeDefined();
    expect(result.pagination.total_results).toBeGreaterThan(0);
    const first = result.results[0];
    expect(typeof first.dot_number).toBe("string");
    expect(typeof first.legal_name).toBe("string");
    expect(typeof first.confidence).toBe("number");
  });
});

describe("carriers.authority", () => {
  it("returns authority history with expected fields", async () => {
    const result = await al.carriers.authority(DOT);
    expect(result.authority_history.length).toBeGreaterThan(0);
    expect(result.total_records).toBeGreaterThan(0);
    const first = result.authority_history[0];
    expect(typeof first.docket_number).toBe("string");
    expect(typeof first.authority_type).toBe("string");
    expect(typeof first.original_action).toBe("string");
    expect(typeof first.original_served_date).toBe("string");
  });
});

describe("carriers.news", () => {
  it("returns news articles with expected fields", async () => {
    const result = await al.carriers.news(DOT);
    expect(result.articles.length).toBeGreaterThan(0);
    expect(result.pagination).toBeDefined();
    const article = result.articles[0];
    expect(typeof article.id).toBe("string");
    expect(typeof article.title).toBe("string");
    expect(typeof article.source).toBe("string");
    expect(typeof article.date).toBe("string");
    expect(typeof article.sentiment).toBe("string");
    expect(typeof article.url).toBe("string");
  });
});

describe("fleet.trucks", () => {
  it("returns truck fleet data with expected fields", async () => {
    const result = await al.fleet.trucks(DOT, { limit: 5 });
    expect(result.total_trucks).toBeGreaterThan(0);
    expect(result.trucks.length).toBeGreaterThan(0);
    const truck = result.trucks[0];
    expect(typeof truck.vin).toBe("string");
    expect(typeof truck.make).toBe("string");
    expect(typeof truck.model).toBe("string");
    expect(typeof truck.model_year).toBe("string");
    expect(typeof truck.cab_type).toBe("string");
    expect(typeof truck.gross_weight).toBe("string");
    expect(typeof truck.body_type).toBe("string");
    expect(typeof truck.engine_type).toBe("string");
  });
});

describe("fleet.trailers", () => {
  it("returns trailer fleet data with expected fields", async () => {
    const result = await al.fleet.trailers(DOT, { limit: 5 });
    expect(result.total_trailers).toBeGreaterThan(0);
    expect(result.trailers.length).toBeGreaterThan(0);
    const trailer = result.trailers[0];
    expect(typeof trailer.vin).toBe("string");
    expect(typeof trailer.manufacturer).toBe("string");
    expect(typeof trailer.model_year).toBe("string");
    expect(typeof trailer.trailer_type).toBe("string");
    expect(typeof trailer.reefer).toBe("boolean");
  });
});

describe("inspections.list", () => {
  it("returns inspection history with expected fields", async () => {
    const result = await al.inspections.list(DOT, { limit: 5 });
    expect(result.total_inspections).toBeGreaterThan(0);
    expect(result.inspections.length).toBeGreaterThan(0);
    const insp = result.inspections[0];
    expect(typeof insp.inspection_id).toBe("number");
    expect(typeof insp.report_number).toBe("string");
    expect(typeof insp.date).toBe("string");
    expect(typeof insp.state).toBe("string");
    expect(typeof insp.level).toBe("number");
    expect(typeof insp.violations_total).toBe("number");
    expect(typeof insp.oos_total).toBe("number");
    expect(typeof insp.oos_driver).toBe("boolean");
    expect(typeof insp.oos_vehicle).toBe("boolean");
  });
});

describe("crashes.list", () => {
  it("returns crash history with expected fields", async () => {
    const result = await al.crashes.list(DOT, { limit: 5 });
    expect(result.total_crashes).toBeGreaterThan(0);
    expect(result.crashes.length).toBeGreaterThan(0);
    const crash = result.crashes[0];
    expect(typeof crash.crash_id).toBe("string");
    expect(typeof crash.report_number).toBe("string");
    expect(typeof crash.date).toBe("string");
    expect(typeof crash.state).toBe("string");
    expect(typeof crash.fatalities).toBe("number");
    expect(typeof crash.injuries).toBe("number");
    expect(typeof crash.severity).toBe("string");
    expect(typeof crash.tow_away).toBe("boolean");
    expect(typeof crash.weather_condition).toBe("string");
    expect(typeof crash.road_surface_condition).toBe("string");
  });
});

describe("contacts.search", () => {
  it("returns contacts with expected fields", async () => {
    const result = await al.contacts.search({ dotNumber: DOT, limit: 5 });
    expect(result.total_contacts).toBeGreaterThan(0);
    expect(result.contacts.length).toBeGreaterThan(0);
    const contact = result.contacts[0];
    expect(typeof contact.id).toBe("string");
    expect(typeof contact.full_name).toBe("string");
    expect(typeof contact.first_name).toBe("string");
    expect(typeof contact.last_name).toBe("string");
    expect(typeof contact.job_title).toBe("string");
    expect(Array.isArray(contact.job_title_levels)).toBe(true);
    expect(typeof contact.linkedin_url).toBe("string");
  });
});

describe("async iterators", () => {
  it("trucksIter yields truck records with expected fields", async () => {
    const items: any[] = [];
    for await (const truck of al.fleet.trucksIter(DOT, { limit: 5 })) {
      items.push(truck);
      if (items.length >= 3) break;
    }
    expect(items.length).toBe(3);
    expect(typeof items[0].vin).toBe("string");
    expect(typeof items[0].make).toBe("string");
    expect(typeof items[0].model_year).toBe("string");
  });

  it("searchIter yields carrier search results with expected fields", async () => {
    const results: any[] = [];
    for await (const item of al.carriers.searchIter("JB Hunt", { limit: 3 })) {
      results.push(item);
      if (results.length >= 3) break;
    }
    expect(results.length).toBeGreaterThan(0);
    expect(typeof results[0].dot_number).toBe("string");
    expect(typeof results[0].legal_name).toBe("string");
    expect(typeof results[0].confidence).toBe("number");
  });
});

describe("error handling", () => {
  it("throws on invalid DOT number", async () => {
    await expect(al.carriers.get("0000000")).rejects.toThrow();
  });
});
