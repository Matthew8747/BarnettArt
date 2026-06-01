import type { z } from "zod";

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
