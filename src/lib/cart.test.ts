import { describe, it, expect } from "vitest";
import {
  addItem,
  removeItem,
  setQuantity,
  cartCount,
  serializeCart,
  parseCart,
  EMPTY_CART,
  MAX_QUANTITY,
  type Cart,
} from "./cart";

const SECRET = "test-secret";
const A = { productId: "p1", variantId: null };
const B = { productId: "p2", variantId: "v9" };

describe("cart mutations", () => {
  it("adds a new line", () => {
    const c = addItem(EMPTY_CART, { ...A, quantity: 1 });
    expect(c.items).toEqual([{ ...A, quantity: 1 }]);
  });

  it("increments an existing line instead of duplicating", () => {
    let c = addItem(EMPTY_CART, { ...A, quantity: 1 });
    c = addItem(c, { ...A, quantity: 2 });
    expect(c.items).toEqual([{ ...A, quantity: 3 }]);
  });

  it("treats different variants as different lines", () => {
    let c = addItem(EMPTY_CART, { ...A, quantity: 1 });
    c = addItem(c, { ...B, quantity: 1 });
    expect(c.items).toHaveLength(2);
  });

  it("clamps quantity to MAX_QUANTITY", () => {
    const c = addItem(EMPTY_CART, { ...A, quantity: 999 });
    expect(c.items[0].quantity).toBe(MAX_QUANTITY);
  });

  it("setQuantity to 0 removes the line", () => {
    let c = addItem(EMPTY_CART, { ...A, quantity: 3 });
    c = setQuantity(c, A, 0);
    expect(c.items).toHaveLength(0);
  });

  it("removeItem drops the matching line only", () => {
    let c = addItem(EMPTY_CART, { ...A, quantity: 1 });
    c = addItem(c, { ...B, quantity: 1 });
    c = removeItem(c, A);
    expect(c.items).toEqual([{ ...B, quantity: 1 }]);
  });

  it("cartCount sums units", () => {
    let c = addItem(EMPTY_CART, { ...A, quantity: 2 });
    c = addItem(c, { ...B, quantity: 3 });
    expect(cartCount(c)).toBe(5);
  });
});

describe("signed cookie round-trip", () => {
  it("serialises and parses back to the same cart", () => {
    const cart: Cart = {
      items: [
        { ...A, quantity: 2 },
        { ...B, quantity: 1 },
      ],
    };
    const cookie = serializeCart(cart, SECRET);
    expect(parseCart(cookie, SECRET)).toEqual(cart);
  });

  it("rejects a tampered payload (returns empty cart)", () => {
    const cookie = serializeCart({ items: [{ ...A, quantity: 1 }] }, SECRET);
    const tampered = cookie.replace(/^./, (ch) => (ch === "a" ? "b" : "a"));
    expect(parseCart(tampered, SECRET)).toEqual(EMPTY_CART);
  });

  it("rejects a cookie signed with a different secret", () => {
    const cookie = serializeCart({ items: [{ ...A, quantity: 1 }] }, SECRET);
    expect(parseCart(cookie, "other-secret")).toEqual(EMPTY_CART);
  });

  it("returns empty for undefined/garbage", () => {
    expect(parseCart(undefined, SECRET)).toEqual(EMPTY_CART);
    expect(parseCart("not-a-cookie", SECRET)).toEqual(EMPTY_CART);
  });

  it("drops malformed line entries on parse", () => {
    // Hand-craft a validly-signed payload with junk items.
    const bad = {
      items: [{ productId: 123 }, { productId: "ok", quantity: 2 }],
    };
    const cookie = serializeCart(bad as unknown as Cart, SECRET);
    expect(parseCart(cookie, SECRET)).toEqual({
      items: [{ productId: "ok", variantId: null, quantity: 2 }],
    });
  });
});
