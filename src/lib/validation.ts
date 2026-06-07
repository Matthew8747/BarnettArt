import { z } from "zod";

/**
 * Contact / enquiry form payload. `.strict()` rejects unknown keys (no mass
 * assignment); every field is length-bounded so a single request can't carry a
 * huge body past the size cap. `artwork` is an optional reference to the piece
 * the visitor is enquiring about (a product slug), pre-filled from the URL.
 */
export const contactSchema = z
  .object({
    name: z.string().trim().min(1, "Please enter your name").max(120),
    email: z.string().trim().email("Enter a valid email").max(200),
    message: z
      .string()
      .trim()
      .min(10, "Please write a little more")
      .max(4000, "Message is too long"),
    artwork: z.string().trim().max(160).optional().default(""),
    // Honeypot: a hidden field real users never see. Accepted by the schema so a
    // bot gets no validation signal; the ROUTE checks it and silently drops the
    // message (returns a fake success) when it's non-empty.
    company: z.string().max(200).optional().default(""),
  })
  .strict();

export type ContactInput = z.infer<typeof contactSchema>;

/**
 * Safe request-body parsing for API routes — the single front door for every
 * piece of user-supplied JSON in the app.
 *
 * It enforces, in order:
 *  1. A hard size cap (defence against memory-exhaustion / oversized payloads),
 *     checked both via the Content-Length header (fast reject) and the actual
 *     decoded byte length (the header can lie).
 *  2. Well-formed JSON (malformed input is rejected, never thrown to the client
 *     as a stack trace).
 *  3. A Zod schema. Use `.strict()` schemas so unknown keys are rejected — this
 *     removes the mass-assignment surface (e.g. a client smuggling `isAdmin`).
 *
 * Returns a discriminated result rather than throwing, so callers translate it
 * into a clean HTTP response with the right status and no internal detail leak.
 */

/** Default maximum accepted JSON body: 100 KB. Generous for our payloads. */
export const MAX_JSON_BYTES = 100 * 1024;

export type ParseSuccess<T> = { ok: true; data: T };
export type ParseFailure = {
  ok: false;
  status: 400 | 413;
  error: string;
  issues?: string[];
};
export type ParseResult<T> = ParseSuccess<T> | ParseFailure;

export async function parseJsonRequest<T extends z.ZodTypeAny>(
  req: Request,
  schema: T,
  opts: { maxBytes?: number } = {},
): Promise<ParseResult<z.infer<T>>> {
  const maxBytes = opts.maxBytes ?? MAX_JSON_BYTES;

  // 1a. Fast reject using the declared Content-Length, if present.
  const declared = req.headers.get("content-length");
  if (declared && Number(declared) > maxBytes) {
    return { ok: false, status: 413, error: "payload_too_large" };
  }

  const raw = await req.text();

  // 1b. Authoritative size check on the actual decoded bytes.
  if (new TextEncoder().encode(raw).length > maxBytes) {
    return { ok: false, status: 413, error: "payload_too_large" };
  }

  // 2. Well-formed JSON.
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, status: 400, error: "malformed_json" };
  }

  // 3. Schema validation + sanitisation.
  const result = schema.safeParse(parsed);
  if (!result.success) {
    return {
      ok: false,
      status: 400,
      error: "validation_failed",
      issues: result.error.issues.map(
        (i) => `${i.path.join(".") || "(root)"}: ${i.message}`,
      ),
    };
  }

  return { ok: true, data: result.data };
}
