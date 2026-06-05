import Link from "next/link";

// The full portfolio home lands in Phase 3; for now this is an on-brand
// entry point that routes visitors into the shop. A composed editorial cover:
// oversized serif name on warm paper, framed and staggered in on load.
export default function Home() {
  return (
    <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <p
        className="eyebrow hero-rise text-[var(--accent-text)]"
        style={{ animationDelay: "0ms" }}
      >
        Painter &amp; Printmaker
      </p>

      <h1
        className="display text-text hero-rise mt-7 text-[3.25rem] leading-[0.92] sm:text-[6.5rem]"
        style={{ animationDelay: "90ms" }}
      >
        Anna Barnett
      </h1>

      <span
        className="hero-rise mt-9 block h-px w-14 bg-[var(--text)] opacity-30"
        style={{ animationDelay: "180ms" }}
        aria-hidden
      />

      <p
        className="text-muted hero-rise mt-9 max-w-sm text-base leading-relaxed text-balance"
        style={{ animationDelay: "240ms" }}
      >
        Original paintings and fine-art prints, made by hand in the United
        Kingdom. The full portfolio is on its way; the shop is open to browse
        now.
      </p>

      <div className="hero-rise mt-11" style={{ animationDelay: "330ms" }}>
        <Link href="/shop" className="btn btn-primary">
          View the collection
        </Link>
      </div>

      <nav className="text-muted mt-16 flex gap-7 text-[0.7rem] tracking-[0.2em] uppercase">
        <Link href="/privacy" className="wipe-underline hover:text-text">
          Privacy
        </Link>
        <Link href="/terms" className="wipe-underline hover:text-text">
          Terms
        </Link>
      </nav>
    </main>
  );
}
