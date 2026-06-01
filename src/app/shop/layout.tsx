import type { ReactNode } from "react";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { CursorGlow } from "@/components/CursorGlow";

export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <CursorGlow />
      <SiteHeader />
      <main className="relative z-10 flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
