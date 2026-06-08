import type { ReactNode } from "react";
import { StoreShell } from "@/components/StoreShell";
import { readCart } from "@/lib/cart-cookie";
import { cartCount } from "@/lib/cart";

export default async function CollectionsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cart = await readCart();
  return <StoreShell cartCount={cartCount(cart)}>{children}</StoreShell>;
}
