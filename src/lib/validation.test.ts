import { describe, it, expect } from "vitest";
import { z } from "zod";
import { parseJsonRequest, MAX_JSON_BYTES } from "./validation";

const schema = z
  .object({
    email: z.string().email(),
    quantity: z.number().int().positive(),
  })
  .strict(); // reject unknown keys — no mass-assignment surface

function jsonRequest(body: string, headers: Record<string, string> = {}) {
  return new Request("https://example.test/api", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body,
  });
}

describe("parseJsonRequest", () => {
  it("accepts a valid, well-formed payload and returns typed data", async () => {
    const req = jsonRequest(JSON.stringify({ email: "a@b.com", quantity: 2 }));
    const result = await parseJsonRequest(req, schema);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.email).toBe("a@b.com");
      expect(result.data.quantity).toBe(2);
    }
  });

  it("rejects malformed JSON with 400", async () => {
    const req = jsonRequest("{ not valid json ");
    const result = await parseJsonRequest(req, schema);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
  });

  it("rejects a payload that fails the schema with 400 and issues", async () => {
    const req = jsonRequest(
      JSON.stringify({ email: "not-an-email", quantity: -1 }),
    );
    const result = await parseJsonRequest(req, schema);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
      expect(result.issues && result.issues.length).toBeGreaterThan(0);
    }
  });

  it("rejects unknown/extra keys (no mass assignment)", async () => {
    const req = jsonRequest(
      JSON.stringify({ email: "a@b.com", quantity: 1, isAdmin: true }),
    );
    const result = await parseJsonRequest(req, schema);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
  });

  it("rejects an oversized body with 413 (actual bytes)", async () => {
    const big = "x".repeat(MAX_JSON_BYTES + 1);
    const req = jsonRequest(JSON.stringify({ email: big, quantity: 1 }));
    const result = await parseJsonRequest(req, schema);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(413);
  });

  it("fast-rejects when the Content-Length header exceeds the cap (413)", async () => {
    const req = jsonRequest(JSON.stringify({ email: "a@b.com", quantity: 1 }), {
      "content-length": String(MAX_JSON_BYTES + 1),
    });
    const result = await parseJsonRequest(req, schema);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(413);
  });

  it("honours a custom maxBytes cap", async () => {
    const req = jsonRequest(JSON.stringify({ email: "a@b.com", quantity: 1 }));
    const result = await parseJsonRequest(req, schema, { maxBytes: 5 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(413);
  });
});
