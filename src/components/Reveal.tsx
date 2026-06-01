"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Reveal-on-scroll wrapper (DESIGN.md §3). Adds `.is-visible` when the element
 * scrolls into view; the actual transition lives in globals.css and is disabled
 * under `prefers-reduced-motion`. Content is present in the DOM either way — we
 * never rely on motion to reveal it.
 *
 * `delay` staggers grid items (cards fade + rise in sequence).
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // If the browser lacks IntersectionObserver, start visible so content is never
  // trapped behind a reveal it can't trigger. (SSR renders hidden, then the
  // observer reveals on the client.)
  const [visible, setVisible] = useState(
    () =>
      typeof window !== "undefined" &&
      typeof IntersectionObserver === "undefined",
  );

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal${visible ? "is-visible" : ""}${className ? ` ${className}` : ""}`}
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
