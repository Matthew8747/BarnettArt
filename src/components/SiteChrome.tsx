import Link from "next/link";

/** Shared header. Restrained, uppercase nav with a wipe-in underline (§3, §4). */
export function SiteHeader({ cartCount = 0 }: { cartCount?: number }) {
  return (
    <header className="border-border/70 sticky top-0 z-20 border-b bg-[var(--bg)]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between px-7 py-5 sm:px-9">
        <Link
          href="/"
          className="text-text text-[0.82rem] font-semibold tracking-[0.32em] uppercase"
        >
          Anna Barnett
        </Link>
        <nav className="text-muted flex items-center gap-6 text-[0.7rem] font-medium tracking-[0.2em] uppercase sm:gap-8">
          <Link href="/gallery" className="wipe-underline hover:text-text">
            Gallery
          </Link>
          <Link href="/collections" className="wipe-underline hover:text-text">
            Collections
          </Link>
          <Link href="/shop" className="wipe-underline hover:text-text">
            Shop
          </Link>
          <Link href="/contact" className="wipe-underline hover:text-text">
            Contact
          </Link>
          <Link
            href="/cart"
            className="wipe-underline hover:text-text"
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
    <footer className="border-border/70 relative z-10 mt-28 border-t">
      <div className="text-muted mx-auto flex max-w-[1180px] flex-col gap-3 px-7 py-12 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-9">
        <p className="text-text text-[0.78rem] font-semibold tracking-[0.3em] uppercase">
          Anna Barnett
        </p>
        <p className="order-3 sm:order-2">
          © {new Date().getFullYear()} Anna Barnett. All rights reserved.
        </p>
        <nav className="order-2 flex flex-wrap gap-x-6 gap-y-2 sm:order-3">
          <Link href="/gallery" className="hover:text-text transition-colors">
            Gallery
          </Link>
          <Link
            href="/collections"
            className="hover:text-text transition-colors"
          >
            Collections
          </Link>
          <Link href="/contact" className="hover:text-text transition-colors">
            Contact
          </Link>
          <Link href="/privacy" className="hover:text-text transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-text transition-colors">
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  );
}
