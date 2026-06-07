"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

type Status = "idle" | "sending" | "sent" | "error";

/**
 * The "contact Anna" form. Posts JSON to /api/contact (validated + rate-limited
 * + emailed server-side). Pre-fills the artwork reference from `?artwork=` when
 * a visitor arrives via an "Enquire about this piece" link. Includes a hidden
 * honeypot field (`company`) for spam bots.
 */
export function ContactForm() {
  const artwork = useSearchParams().get("artwork") ?? "";
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = (await res.json().catch(() => ({}))) as {
        issues?: string[];
        error?: string;
      };
      if (res.ok) {
        setStatus("sent");
        form.reset();
        return;
      }
      if (res.status === 429) {
        setError(
          "Too many messages just now — please try again a little later.",
        );
      } else {
        setError(body.issues?.[0] ?? "Something went wrong. Please try again.");
      }
      setStatus("error");
    } catch {
      setError("Network error. Please try again.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="border-border bg-panel rounded-[3px] border p-8">
        <p className="display text-text text-3xl">Thank you.</p>
        <p className="text-muted mt-3 leading-relaxed">
          Your message is on its way to Anna. She reads every enquiry herself
          and will reply by email — usually within a few days.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="link-accent mt-5 text-[0.72rem] tracking-[0.18em] uppercase"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      {artwork && (
        <p className="text-muted text-sm">
          Enquiry about{" "}
          <span className="text-[var(--accent-text)]">{artwork}</span>.
        </p>
      )}
      <input type="hidden" name="artwork" defaultValue={artwork} />

      {/* Honeypot — visually hidden, off the tab order. Bots fill it; people don't. */}
      <div aria-hidden className="absolute h-0 w-0 overflow-hidden">
        <label>
          Company
          <input name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <Field label="Your name" htmlFor="name">
        <input
          id="name"
          name="name"
          required
          maxLength={120}
          autoComplete="name"
          className="field"
        />
      </Field>

      <Field label="Email" htmlFor="email">
        <input
          id="email"
          name="email"
          type="email"
          required
          maxLength={200}
          autoComplete="email"
          className="field"
        />
      </Field>

      <Field label="Message" htmlFor="message">
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          maxLength={4000}
          placeholder="Tell Anna what you have in mind — a piece you love, a commission, a print, or a question."
          className="field resize-y"
        />
      </Field>

      {error && <p className="text-sm text-[#b42318]">{error}</p>}

      <button
        type="submit"
        disabled={status === "sending"}
        className="btn btn-primary self-start"
      >
        {status === "sending" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="flex flex-col gap-2">
      <span className="eyebrow">{label}</span>
      {children}
    </label>
  );
}
