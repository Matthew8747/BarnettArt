"use client";

import { useState } from "react";

/**
 * Starts checkout: POSTs to /api/checkout (which prices the cart server-side and
 * creates a Stripe Checkout Session) then redirects to Stripe's hosted page.
 */
export function CheckoutButton({
  disabled,
  demo,
}: {
  disabled?: boolean;
  demo?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (demo) {
    return (
      <div className="text-right">
        <button
          type="button"
          disabled
          className="border-border text-text w-full cursor-not-allowed rounded-full border bg-[var(--accent-soft)] px-7 py-3 text-sm font-medium opacity-80 sm:w-auto"
        >
          Checkout (disabled in preview)
        </button>
        <p className="text-muted mt-2 text-xs">
          This is a preview — payments are switched off.
        </p>
      </div>
    );
  }

  async function start() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error ?? "Something went wrong. Please try again.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={start}
        disabled={disabled || loading}
        className="w-full rounded-full bg-[var(--accent)] px-7 py-3 text-sm font-medium text-[#15151d] transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {loading ? "Redirecting…" : "Proceed to secure checkout"}
      </button>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </div>
  );
}
