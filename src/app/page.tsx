import Link from "next/link";

// The full portfolio home lands in Phase 3; for now this is an on-brand
// entry point that routes visitors into the Phase 1 shop.
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <p className="eyebrow mb-4">Original art &amp; prints</p>
      <h1 className="display text-text text-5xl sm:text-7xl">Anna Barnett</h1>
      <p className="text-muted mt-5 max-w-xl text-lg">
        A collection of original artwork and fine-art prints. The full portfolio
        is on its way — the shop is open to browse now.
      </p>
      <div className="mt-10 flex items-center gap-5">
        <Link
          href="/shop"
          className="rounded-full bg-[var(--accent)] px-7 py-3 text-sm font-medium text-[#15151d] transition-transform hover:scale-[1.03]"
        >
          Enter the shop
        </Link>
      </div>
      <nav className="text-muted mt-12 flex gap-6 text-sm">
        <Link href="/privacy" className="hover:text-text">
          Privacy
        </Link>
        <Link href="/terms" className="hover:text-text">
          Terms
        </Link>
      </nav>
    </main>
  );
}
