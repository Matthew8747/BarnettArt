import Link from "next/link";

/** Shared header. Restrained, uppercase nav (DESIGN.md §4). */
export function SiteHeader({ cartCount = 0 }: { cartCount?: number }) {
  return (
    <header className="border-border/60 sticky top-0 z-20 border-b bg-[var(--bg)]/80 backdrop-blur">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between px-6 py-4">
        <Link href="/" className="display text-text text-lg">
          Anna Barnett
        </Link>
        <nav className="text-muted flex items-center gap-7 text-xs tracking-[0.18em] uppercase">
          <Link href="/shop" className="hover:text-text transition-colors">
            Shop
          </Link>
          <Link href="/" className="hover:text-text transition-colors">
            Portfolio
          </Link>
          <Link
            href="/cart"
            className="hover:text-text transition-colors"
            aria-label={`Cart, ${cartCount} item${cartCount === 1 ? "" : "s"}`}
          >
            Cart{cartCount > 0 ? ` (${cartCount})` : ""}
          </Link>
        </nav>
      </div>
    </header>
  );
}

/** Shared footer. */
export function SiteFooter() {
  return (
    <footer className="border-border/60 mt-24 border-t">
      <div className="text-muted mx-auto flex max-w-[1180px] flex-col gap-2 px-6 py-10 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Anna Barnett. All rights reserved.</p>
        <nav className="flex gap-6">
          <Link href="/privacy" className="hover:text-text">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-text">
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  );
}
