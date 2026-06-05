import type { ReactNode } from "react";
import { SiteHeader, SiteFooter } from "./SiteChrome";

/** Shared storefront chrome (header + footer) for /shop and /cart. */
export function StoreShell({
  children,
  cartCount,
}: {
  children: ReactNode;
  cartCount: number;
}) {
  return (
    <>
      <SiteHeader cartCount={cartCount} />
      <main className="relative z-10 flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
