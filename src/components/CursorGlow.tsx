"use client";

import { useEffect, useRef } from "react";

/**
 * Soft accent glow that trails the pointer (DESIGN.md §3, desktop only).
 *
 * Disabled entirely when the device has no fine pointer (touch) or the user
 * prefers reduced motion — both checked before any listener is attached. Uses a
 * single fixed element animated with `transform` only (no layout thrash) and is
 * purely decorative (aria-hidden), so it never affects content or a11y.
 */
export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!finePointer || reduced) return;

    const el = ref.current;
    if (!el) return;

    let raf = 0;
    let tx = 0;
    let ty = 0;
    let x = 0;
    let y = 0;

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      el.style.opacity = "1";
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const tick = () => {
      // ease toward the target so the glow trails rather than snaps
      x += (tx - x) * 0.18;
      y += (ty - y) * 0.18;
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      raf =
        Math.abs(tx - x) + Math.abs(ty - y) > 0.5
          ? requestAnimationFrame(tick)
          : 0;
    };
    const onLeave = () => {
      el.style.opacity = "0";
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerout", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerout", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "420px",
        height: "420px",
        borderRadius: "9999px",
        pointerEvents: "none",
        zIndex: 0,
        opacity: 0,
        background:
          "radial-gradient(circle, var(--accent-soft), transparent 65%)",
        transition: "opacity 400ms ease",
        filter: "blur(8px)",
      }}
    />
  );
}
