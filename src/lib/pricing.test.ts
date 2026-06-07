import { describe, it, expect } from "vitest";
import {
  priceCart,
  computeShippingCents,
  FLAT_SHIPPING_CENTS,
  FREE_SHIPPING_THRESHOLD_CENTS,
  type PriceableProduct,
  type PriceableVariant,
  type PricedLine,
} from "./pricing";

const original: PriceableProduct = {
  id: "orig-1",
  title: "Tidal Bloom",
  type: "original",
  basePriceCents: 145000,
  currency: "GBP",
  status: "available",
};

const printProduct: PriceableProduct = {
  id: "print-1",
  title: "Violet Field",
  type: "print",
  basePriceCents: 6500,
  currency: "GBP",
  status: "available",
};

const variant: PriceableVariant = {
  id: "var-1",
  productId: "print-1",
  name: "A2 / Oak frame",
  priceCents: 16500,
  stockQty: 3,
};

function data(products: PriceableProduct[], variants: PriceableVariant[] = []) {
  return {
    products: new Map(products.map((p) => [p.id, p])),
    variants: new Map(variants.map((v) => [v.id, v])),
  };
}

describe("priceCart", () => {
  it("prices an original at the server base price, quantity forced to 1", () => {
    const result = priceCart(
      [{ productId: "orig-1", variantId: null, quantity: 5 }],
      data([original]),
    );
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].quantity).toBe(1);
    expect(result.lines[0].unitPriceCents).toBe(145000);
    expect(result.subtotalCents).toBe(145000);
    expect(result.totalCents).toBe(145000);
  });

  it("prices a print variant from the variant, not the cart", () => {
    const result = priceCart(
      [{ productId: "print-1", variantId: "var-1", quantity: 2 }],
      data([printProduct], [variant]),
    );
    expect(result.lines[0].unitPriceCents).toBe(16500);
    expect(result.lines[0].lineTotalCents).toBe(33000);
    expect(result.lines[0].titleSnapshot).toBe("Violet Field — A2 / Oak frame");
  });

  it("ignores any price the client might try to inject", () => {
    // The cart type carries no price; a malicious extra field is simply absent
    // from the computation. This test documents the invariant.
    const result = priceCart(
      [
        {
          productId: "orig-1",
          variantId: null,
          quantity: 1,
          // @ts-expect-error price is not part of CartItem and is ignored
          unitPriceCents: 1,
        },
      ],
      data([original]),
    );
    expect(result.totalCents).toBe(145000);
  });

  it("flags a sold original as unavailable and excludes it", () => {
    const sold = { ...original, status: "sold" as const };
    const result = priceCart(
      [{ productId: "orig-1", variantId: null, quantity: 1 }],
      data([sold]),
    );
    expect(result.lines).toHaveLength(0);
    expect(result.issues).toEqual([
      { productId: "orig-1", variantId: null, reason: "unavailable" },
    ]);
  });

  it("caps print quantity at available stock and flags the shortfall", () => {
    const result = priceCart(
      [{ productId: "print-1", variantId: "var-1", quantity: 10 }],
      data([printProduct], [variant]),
    );
    expect(result.lines[0].quantity).toBe(3);
    expect(result.issues).toContainEqual({
      productId: "print-1",
      variantId: "var-1",
      reason: "insufficient_stock",
    });
  });

  it("flags an out-of-stock variant", () => {
    const result = priceCart(
      [{ productId: "print-1", variantId: "var-1", quantity: 1 }],
      data([printProduct], [{ ...variant, stockQty: 0 }]),
    );
    expect(result.lines).toHaveLength(0);
    expect(result.issues[0].reason).toBe("unavailable");
  });

  it("flags unknown products and a variant that belongs to another product", () => {
    const result = priceCart(
      [
        { productId: "ghost", variantId: null, quantity: 1 },
        { productId: "print-1", variantId: "var-1", quantity: 1 },
      ],
      data([printProduct], [{ ...variant, productId: "someone-else" }]),
    );
    expect(result.issues.map((i) => i.reason)).toEqual([
      "not_found",
      "not_found",
    ]);
    expect(result.lines).toHaveLength(0);
  });

  it("sums a mixed cart correctly", () => {
    const result = priceCart(
      [
        { productId: "orig-1", variantId: null, quantity: 1 },
        { productId: "print-1", variantId: "var-1", quantity: 2 },
      ],
      data([original, printProduct], [variant]),
    );
    expect(result.subtotalCents).toBe(145000 + 33000);
    expect(result.shippingCents).toBe(0); // over the free-shipping threshold
    expect(result.totalCents).toBe(178000);
  });
});

describe("computeShippingCents", () => {
  function line(lineTotalCents: number): PricedLine {
    return {
      productId: "p",
      variantId: null,
      titleSnapshot: "x",
      unitPriceCents: lineTotalCents,
      quantity: 1,
      lineTotalCents,
    };
  }

  it("charges the flat fee below the free-shipping threshold", () => {
    expect(
      computeShippingCents([line(FREE_SHIPPING_THRESHOLD_CENTS - 1)]),
    ).toBe(FLAT_SHIPPING_CENTS);
  });

  it("is free exactly at the threshold", () => {
    expect(computeShippingCents([line(FREE_SHIPPING_THRESHOLD_CENTS)])).toBe(0);
  });

  it("is free above the threshold", () => {
    expect(
      computeShippingCents([line(FREE_SHIPPING_THRESHOLD_CENTS + 5000)]),
    ).toBe(0);
  });

  it("sums multiple lines toward the threshold", () => {
    const half = Math.floor(FREE_SHIPPING_THRESHOLD_CENTS / 2);
    // Two half-threshold lines reach the threshold → free.
    expect(computeShippingCents([line(half), line(half)])).toBe(0);
  });

  it("charges nothing for an empty cart", () => {
    expect(computeShippingCents([])).toBe(0);
  });
});
