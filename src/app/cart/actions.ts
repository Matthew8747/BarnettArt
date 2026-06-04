"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { readCart, writeCart, clearCart } from "@/lib/cart-cookie";
import { addItem, setQuantity, removeItem } from "@/lib/cart";

/**
 * Cart server actions. Form-driven so add/update/remove work without client JS
 * (progressive enhancement). The cart is the signed cookie; prices are never
 * touched here — they're recomputed from the DB at render and checkout.
 */

function key(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  const variantRaw = String(formData.get("variantId") ?? "");
  return { productId, variantId: variantRaw ? variantRaw : null };
}

export async function addToCartAction(formData: FormData) {
  const { productId, variantId } = key(formData);
  if (!productId) return;
  const quantity = Number(formData.get("quantity") ?? 1);
  const cart = await readCart();
  await writeCart(addItem(cart, { productId, variantId, quantity }));
  redirect("/cart");
}

export async function updateQtyAction(formData: FormData) {
  const { productId, variantId } = key(formData);
  if (!productId) return;
  const quantity = Number(formData.get("quantity") ?? 0);
  const cart = await readCart();
  await writeCart(setQuantity(cart, { productId, variantId }, quantity));
  revalidatePath("/cart");
}

export async function removeFromCartAction(formData: FormData) {
  const { productId, variantId } = key(formData);
  if (!productId) return;
  const cart = await readCart();
  await writeCart(removeItem(cart, { productId, variantId }));
  revalidatePath("/cart");
}

/** Empty the cart (called from the post-checkout success page). */
export async function clearCartAction() {
  await clearCart();
}
