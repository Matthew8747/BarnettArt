import "server-only";
import { env } from "@/lib/env";
import { formatMoney } from "./money";

/**
 * Transactional email via Resend's REST API (no SDK dependency).
 *
 * Without RESEND_API_KEY/EMAIL_FROM (local dev) it logs and no-ops, so the
 * checkout flow is fully exercisable offline. Sending is best-effort and never
 * throws into the webhook: a failed email must not cause Stripe to retry an
 * already-fulfilled order.
 */

type OrderLine = {
  titleSnapshot: string;
  unitPriceCents: number;
  quantity: number;
};

export async function sendOrderConfirmation(params: {
  to: string;
  orderId: string;
  lines: OrderLine[];
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  currency: string;
}): Promise<void> {
  const { to, orderId, lines, currency } = params;

  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    console.info(
      `[email] (dev no-op) order ${orderId} confirmation to ${to} — ` +
        `${lines.length} line(s), total ${formatMoney(params.totalCents, currency)}`,
    );
    return;
  }

  const rows = lines
    .map(
      (l) =>
        `<tr><td>${escapeHtml(l.titleSnapshot)} × ${l.quantity}</td>` +
        `<td align="right">${formatMoney(l.unitPriceCents * l.quantity, currency)}</td></tr>`,
    )
    .join("");

  const html = `
    <h2>Thank you for your order</h2>
    <p>Order reference: <strong>${escapeHtml(orderId)}</strong></p>
    <table style="width:100%;max-width:480px;border-collapse:collapse">
      ${rows}
      <tr><td>Shipping</td><td align="right">${formatMoney(params.shippingCents, currency)}</td></tr>
      <tr><td><strong>Total</strong></td><td align="right"><strong>${formatMoney(params.totalCents, currency)}</strong></td></tr>
    </table>
    <p>We'll be in touch when your piece is on its way.</p>
    <p>— Anna Barnett</p>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to,
        subject: "Your Anna Barnett order",
        html,
      }),
    });
    if (!res.ok) {
      console.error(
        `[email] Resend failed for order ${orderId}: ${res.status} ${await res.text()}`,
      );
    }
  } catch (err) {
    console.error(`[email] Resend error for order ${orderId}:`, err);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
