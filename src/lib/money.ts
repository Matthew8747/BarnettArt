/**
 * Money helpers. All amounts in the system are integer minor units (pence for
 * GBP). These helpers are the ONLY place pence ↔ display conversion happens, so
 * floating-point math never leaks into prices, totals, or the database.
 */

export const DEFAULT_CURRENCY = "GBP";

/** Format integer pence as a localised currency string, e.g. 4500 -> "£45.00". */
export function formatMoney(
  cents: number,
  currency: string = DEFAULT_CURRENCY,
  locale = "en-GB",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(cents / 100);
}

/** Sum line totals (unit price × quantity) in pence. Stays in integer space. */
export function sumLineItems(
  items: { unitPriceCents: number; quantity: number }[],
): number {
  return items.reduce((acc, i) => acc + i.unitPriceCents * i.quantity, 0);
}
