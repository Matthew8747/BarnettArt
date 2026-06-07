"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { GalleryItem } from "@/lib/gallery";

/**
 * Masonry showcase of Anna's paintings (DESIGN.md aesthetic — paper mounts,
 * per-artwork accent, no glow). Each work hangs at its true aspect ratio
 * (uncropped — this is the portfolio surface, not the shop grid) and opens in a
 * lightbox. Keyboard-accessible: Esc closes, ←/→ step through.
 */
export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const [open, setOpen] = useState<number | null>(null);

  const close = useCallback(() => setOpen(null), []);
  const step = useCallback(
    (dir: 1 | -1) =>
      setOpen((i) =>
        i === null ? i : (i + dir + items.length) % items.length,
      ),
    [items.length],
  );

  useEffect(() => {
    if (open === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    }
    window.addEventListener("keydown", onKey);
    // Lock scroll behind the lightbox.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close, step]);

  const active = open === null ? null : items[open];

  return (
    <>
      <div className="gap-5 [column-fill:_balance] sm:columns-2 lg:columns-3">
        {items.map((item, i) => {
          const ratio =
            item.width && item.height ? item.width / item.height : 0.8;
          return (
            <figure
              key={item.slug}
              className="group mb-5 break-inside-avoid"
              style={{ "--accent": item.accentHex } as React.CSSProperties}
            >
              <button
                type="button"
                onClick={() => setOpen(i)}
                aria-label={`Enlarge ${item.title}`}
                className="hover-lift bg-panel block w-full cursor-zoom-in overflow-hidden p-1.5 shadow-[0_2px_10px_-6px_rgba(28,26,22,0.3)] ring-1 ring-[color-mix(in_srgb,var(--text)_12%,transparent)]"
              >
                <span className="block overflow-hidden">
                  <Image
                    src={item.thumb}
                    alt={item.title}
                    width={item.width ?? 900}
                    height={item.height ?? 1125}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="h-auto w-full transition-transform duration-[1100ms] ease-out group-hover:scale-[1.04]"
                    style={{ aspectRatio: ratio }}
                  />
                </span>
              </button>
              <figcaption className="border-border mt-3 flex items-baseline justify-between gap-3 border-t pt-3">
                <span className="eyebrow tabular-nums opacity-70">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <Link
                  href={`/contact?artwork=${encodeURIComponent(item.title)}`}
                  className="link-accent text-[0.7rem] tracking-[0.18em] uppercase"
                >
                  Enquire
                </Link>
              </figcaption>
            </figure>
          );
        })}
      </div>

      {active && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={active.title}
          onClick={close}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(20,18,14,0.92)] p-4 sm:p-10"
        >
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute top-5 right-6 text-[0.72rem] tracking-[0.2em] text-[var(--bg)]/80 uppercase hover:text-[var(--bg)]"
          >
            Close ✕
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              step(-1);
            }}
            aria-label="Previous"
            className="absolute left-3 text-2xl text-[var(--bg)]/70 hover:text-[var(--bg)] sm:left-8"
          >
            ‹
          </button>
          <figure
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-full max-w-[min(92vw,1100px)] flex-col items-center"
          >
            <Image
              src={active.large}
              alt={active.title}
              width={active.width ?? 1500}
              height={active.height ?? 2000}
              sizes="92vw"
              priority
              className="hero-rise max-h-[78vh] w-auto object-contain shadow-[0_40px_120px_-40px_rgba(0,0,0,0.8)]"
            />
            <figcaption className="mt-5 flex items-center gap-4 text-[var(--bg)]/85">
              <span className="text-[0.7rem] tracking-[0.22em] uppercase">
                {active.title}
              </span>
              <Link
                href={`/contact?artwork=${encodeURIComponent(active.title)}`}
                className="text-[0.7rem] tracking-[0.18em] text-[var(--bg)] underline-offset-4 hover:underline"
              >
                Enquire about this piece →
              </Link>
            </figcaption>
          </figure>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              step(1);
            }}
            aria-label="Next"
            className="absolute right-3 text-2xl text-[var(--bg)]/70 hover:text-[var(--bg)] sm:right-8"
          >
            ›
          </button>
        </div>
      )}
    </>
  );
}
