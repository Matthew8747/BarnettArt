import { NextResponse } from "next/server";
import { limiters, clientIp } from "@/lib/rate-limit";
import { parseJsonRequest, contactSchema } from "@/lib/validation";
import { sendContactMessage } from "@/lib/email";

/**
 * Receive a "contact Anna" enquiry and email it to her.
 *
 * Defence in depth:
 *  - Rate limited per IP (anti-spam).
 *  - Same-origin guard (no cross-site POST).
 *  - Zod-validated, length-bounded, `.strict()` body (no mass assignment).
 *  - Honeypot field (`company`) must be empty — silently accepted if a bot
 *    fills it, so we don't teach scrapers what tripped the filter.
 *  - HTML-escaped before it ever reaches an email body.
 */
export async function POST(req: Request) {
  const { success } = await limiters.contact.limit(clientIp(req));
  if (!success) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(req.url).host) {
    return NextResponse.json({ error: "bad_origin" }, { status: 403 });
  }

  const parsed = await parseJsonRequest(req, contactSchema);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error, issues: parsed.issues },
      { status: parsed.status },
    );
  }

  // Honeypot tripped: pretend success so bots get no signal. Nothing is sent.
  if (parsed.data.company) {
    return NextResponse.json({ ok: true, delivered: false });
  }

  const { delivered } = await sendContactMessage({
    name: parsed.data.name,
    email: parsed.data.email,
    message: parsed.data.message,
    artwork: parsed.data.artwork || undefined,
  });

  return NextResponse.json({ ok: true, delivered });
}
