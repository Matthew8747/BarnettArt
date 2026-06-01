"use client";

import { useEffect, useRef } from "react";
import { clearCartAction } from "@/app/cart/actions";

/**
 * Fires the clear-cart server action once after the success page mounts. (Cookies
 * can't be written during a Server Component render, so this runs client-side.)
 */
export function ClearCartOnMount() {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    void clearCartAction();
  }, []);
  return null;
}
