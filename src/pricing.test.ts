import { describe, it, expect } from "vitest";
import { calculatePrice } from "./pricing";
import type { Product } from "./types";

// Helper to build a product with defaults
function makeProduct(overrides: Partial<Product> & { sku: string }): Product {
  return {
    name: "Test Product",
    myPrice: 100000,
    minPrice: 50000,
    maxPrice: 150000,
    step: 10,
    competitors: [],
    ...overrides,
  };
}

describe("calculatePrice", () => {
  // ─── Data-driven cases matching products.json / expected.json ───────────────

  it("IPH15: UNDERCUT — floor(384990-10)=384980 in [370000,420000]", () => {
    const product = makeProduct({
      sku: "IPH15-128-BLK",
      myPrice: 389990,
      minPrice: 370000,
      maxPrice: 420000,
      step: 10,
      competitors: [
        { seller: "TechnoMarket", price: 384990, inStock: true },
        { seller: "GadgetKZ", price: 379990, inStock: false }, // ignored
        { seller: "AlmatyPhone", price: 386500, inStock: true },
      ],
    });
    const result = calculatePrice(product);
    expect(result).toEqual({
      sku: "IPH15-128-BLK",
      oldPrice: 389990,
      newPrice: 384980,
      reason: "UNDERCUT",
    });
  });

  it("SAM-A55: AT_MIN — candidate=174900 < minPrice=180000", () => {
    const product = makeProduct({
      sku: "SAM-A55-256",
      myPrice: 189000,
      minPrice: 180000,
      maxPrice: 210000,
      step: 100,
      competitors: [{ seller: "MobiStore", price: 175000, inStock: true }],
    });
    const result = calculatePrice(product);
    expect(result).toEqual({
      sku: "SAM-A55-256",
      oldPrice: 189000,
      newPrice: 180000,
      reason: "AT_MIN",
    });
  });

  it("XIA-RN13: NO_COMPETITORS — all competitors out of stock", () => {
    const product = makeProduct({
      sku: "XIA-RN13-128",
      myPrice: 89990,
      minPrice: 80000,
      maxPrice: 99990,
      step: 50,
      competitors: [{ seller: "Shop1", price: 85000, inStock: false }],
    });
    const result = calculatePrice(product);
    expect(result).toEqual({
      sku: "XIA-RN13-128",
      oldPrice: 89990,
      newPrice: 99990,
      reason: "NO_COMPETITORS",
    });
  });

  it("AIRPODS-PRO2: AT_MAX — candidate=149999 > maxPrice=125000", () => {
    const product = makeProduct({
      sku: "AIRPODS-PRO2",
      myPrice: 119990,
      minPrice: 100000,
      maxPrice: 125000,
      step: 1,
      competitors: [{ seller: "EarShop", price: 150000, inStock: true }],
    });
    const result = calculatePrice(product);
    expect(result).toEqual({
      sku: "AIRPODS-PRO2",
      oldPrice: 119990,
      newPrice: 125000,
      reason: "AT_MAX",
    });
  });

  it("DYSON-V15: UNDERCUT — fractional step: floor(349999.9-0.5)=349999", () => {
    const product = makeProduct({
      sku: "DYSON-V15",
      myPrice: 359000,
      minPrice: 330000,
      maxPrice: 380000,
      step: 0.5,
      competitors: [{ seller: "HomeTech", price: 349999.9, inStock: true }],
    });
    const result = calculatePrice(product);
    expect(result).toEqual({
      sku: "DYSON-V15",
      oldPrice: 359000,
      newPrice: 349999,
      reason: "UNDERCUT",
    });
  });

  it("JBL-FLIP6: NO_COMPETITORS — empty competitors array", () => {
    const product = makeProduct({
      sku: "JBL-FLIP6",
      myPrice: 54990,
      minPrice: 45000,
      maxPrice: 60000,
      step: 10,
      competitors: [],
    });
    const result = calculatePrice(product);
    expect(result).toEqual({
      sku: "JBL-FLIP6",
      oldPrice: 54990,
      newPrice: 60000,
      reason: "NO_COMPETITORS",
    });
  });

  // ─── Edge cases ──────────────────────────────────────────────────────────────

  it("step=0: candidate equals best competitor price (floored)", () => {
    const product = makeProduct({
      sku: "EDGE-STEP0",
      myPrice: 10000,
      minPrice: 5000,
      maxPrice: 15000,
      step: 0,
      competitors: [{ seller: "A", price: 9500, inStock: true }],
    });
    const result = calculatePrice(product);
    // candidate = floor(9500 - 0) = 9500, in [5000,15000]
    expect(result).toEqual({ sku: "EDGE-STEP0", oldPrice: 10000, newPrice: 9500, reason: "UNDERCUT" });
  });

  it("exact boundary: candidate === minPrice → UNDERCUT (not AT_MIN)", () => {
    const product = makeProduct({
      sku: "EDGE-AT-MIN-BOUNDARY",
      myPrice: 10000,
      minPrice: 9490,
      maxPrice: 15000,
      step: 10,
      competitors: [{ seller: "A", price: 9500, inStock: true }],
    });
    // candidate = floor(9500 - 10) = 9490 = minPrice → UNDERCUT (>= minPrice, <= maxPrice)
    const result = calculatePrice(product);
    expect(result).toEqual({ sku: "EDGE-AT-MIN-BOUNDARY", oldPrice: 10000, newPrice: 9490, reason: "UNDERCUT" });
  });

  it("exact boundary: candidate === maxPrice → UNDERCUT (not AT_MAX)", () => {
    const product = makeProduct({
      sku: "EDGE-AT-MAX-BOUNDARY",
      myPrice: 10000,
      minPrice: 5000,
      maxPrice: 9490,
      step: 10,
      competitors: [{ seller: "A", price: 9500, inStock: true }],
    });
    // candidate = floor(9500 - 10) = 9490 = maxPrice → UNDERCUT
    const result = calculatePrice(product);
    expect(result).toEqual({ sku: "EDGE-AT-MAX-BOUNDARY", oldPrice: 10000, newPrice: 9490, reason: "UNDERCUT" });
  });

  it("picks the cheapest in-stock competitor when multiple are in stock", () => {
    const product = makeProduct({
      sku: "EDGE-MULTI",
      myPrice: 50000,
      minPrice: 30000,
      maxPrice: 70000,
      step: 5,
      competitors: [
        { seller: "A", price: 45000, inStock: true },
        { seller: "B", price: 40000, inStock: true },  // cheapest in-stock
        { seller: "C", price: 35000, inStock: false },  // ignored
      ],
    });
    // best = 40000, candidate = floor(40000 - 5) = 39995
    const result = calculatePrice(product);
    expect(result).toEqual({ sku: "EDGE-MULTI", oldPrice: 50000, newPrice: 39995, reason: "UNDERCUT" });
  });

  it("fractional step: floor is applied before comparison", () => {
    const product = makeProduct({
      sku: "EDGE-FRAC",
      myPrice: 10000,
      minPrice: 5000,
      maxPrice: 15000,
      step: 0.3,
      competitors: [{ seller: "A", price: 9000.9, inStock: true }],
    });
    // candidate = floor(9000.9 - 0.3) = floor(9000.6) = 9000
    const result = calculatePrice(product);
    expect(result).toEqual({ sku: "EDGE-FRAC", oldPrice: 10000, newPrice: 9000, reason: "UNDERCUT" });
  });
});
