import { describe, it, expect } from "vitest";
import { contactSchema } from "./validation";

describe("contactSchema", () => {
  const valid = {
    name: "Jordan Reeve",
    email: "jordan@example.com",
    message: "I love the green diptych — is it still available?",
  };

  it("accepts a well-formed enquiry and defaults optional fields", () => {
    const r = contactSchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.artwork).toBe("");
      expect(r.data.company).toBe("");
    }
  });

  it("trims and keeps an artwork reference", () => {
    const r = contactSchema.safeParse({
      ...valid,
      artwork: "  Untitled No. 03 ",
    });
    expect(r.success && r.data.artwork).toBe("Untitled No. 03");
  });

  it("rejects an invalid email", () => {
    expect(
      contactSchema.safeParse({ ...valid, email: "not-an-email" }).success,
    ).toBe(false);
  });

  it("rejects an empty name", () => {
    expect(contactSchema.safeParse({ ...valid, name: "   " }).success).toBe(
      false,
    );
  });

  it("requires a message of at least 10 characters", () => {
    expect(contactSchema.safeParse({ ...valid, message: "hi" }).success).toBe(
      false,
    );
  });

  it("caps the message length", () => {
    expect(
      contactSchema.safeParse({ ...valid, message: "x".repeat(4001) }).success,
    ).toBe(false);
  });

  it("accepts the honeypot field (the route, not the schema, drops bots)", () => {
    // The schema must not reject a filled honeypot — that would signal the bot.
    // The /api/contact route silently returns fake success when it's non-empty.
    expect(
      contactSchema.safeParse({ ...valid, company: "spambot" }).success,
    ).toBe(true);
  });

  it("rejects unknown keys (no mass assignment)", () => {
    expect(contactSchema.safeParse({ ...valid, isAdmin: true }).success).toBe(
      false,
    );
  });
});
