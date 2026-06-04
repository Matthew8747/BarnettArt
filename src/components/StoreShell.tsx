import type { ReactNode } from "react";
import { SiteHeader, SiteFooter } from "./SiteChrome";
import { CursorGlow } from "./CursorGlow";

/** Shared storefront chrome (header + footer + cursor glow) for /shop and /cart. */
export function StoreShell({
  children,
  cartCount,
}: {
  children: ReactNode;
  cartCount: number;
}) {
  return (
    <>
      <CursorGlow />
      <SiteHeader cartCount={cartCount} />
      <main className="relative z-10 flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
