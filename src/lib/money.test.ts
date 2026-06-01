import { describe, it, expect } from "vitest";
import { formatMoney, sumLineItems, DEFAULT_CURRENCY } from "./money";

describe("formatMoney", () => {
  it("formats whole pounds from integer pence", () => {
    expect(formatMoney(4500)).toBe("£45.00");
  });

  it("formats sub-pound amounts without float drift", () => {
    expect(formatMoney(199)).toBe("£1.99");
  });

  it("formats zero", () => {
    expect(formatMoney(0)).toBe("£0.00");
  });

  it("defaults to GBP", () => {
    expect(DEFAULT_CURRENCY).toBe("GBP");
  });
});

describe("sumLineItems", () => {
  it("returns 0 for an empty cart", () => {
    expect(sumLineItems([])).toBe(0);
  });

  it("multiplies unit price by quantity and stays in integer pence", () => {
    const total = sumLineItems([
      { unitPriceCents: 4500, quantity: 2 },
      { unitPriceCents: 199, quantity: 3 },
    ]);
    expect(total).toBe(9597);
    expect(Number.isInteger(total)).toBe(true);
  });
});
