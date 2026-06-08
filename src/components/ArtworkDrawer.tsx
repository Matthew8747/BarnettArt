"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import type { GalleryItem } from "@/lib/gallery";
import { getArtworkMeta } from "@/lib/artwork-meta";
import { getReviewsForProduct, getAverageRating } from "@/lib/reviews";
import { getCollectionForPainting } from "@/lib/collections";

function Stars({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  const rounded = Math.round(value);
  return (
    <span
      aria-label={`${value.toFixed(1)} out of 5`}
      className={`text-[var(--accent-text)] ${className}`}
    >
      {"★★★★★".slice(0, rounded)}
      <span className="opacity-30">{"★★★★★".slice(rounded)}</span>
    </span>
  );
}

/**
 * The artwork "drawer": a bone panel that slides in from the left over a dimmed
 * page (header stays visible above it). Artwork on the left, story + details +
 * reviews on the right, with prev/next navigation. Enter and exit are animated
 * (CSS transform); honours prefers-reduced-motion via globals.css.
 *
 * Controlled by the parent: `open` drives the slide; `index` selects the work.
 */
export function ArtworkDrawer({
  items,
  open,
  index,
  onClose,
  onStep,
}: {
  items: GalleryItem[];
  open: boolean;
  index: number;
  onClose: () => void;
  onStep: (dir: 1 | -1) => void;
}) {
  // render = mounted in the DOM; shown = in the "open" position. The gap between
  // them is what lets the exit animation play before unmount.
  const [render, setRender] = useState(open);
  const [shown, setShown] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      // Pin the drawer just below the live header height.
      const header = document.querySelector("header");
      const h = header?.getBoundingClientRect().height ?? 64;
      document.documentElement.style.setProperty("--header-h", `${h}px`);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-then-animate orchestration
      setRender(true);
      // Let the browser paint the off-screen state, then animate in. A short
      // timeout (not rAF, which throttles in background tabs) is reliable.
      const id = setTimeout(() => setShown(true), 30);
      return () => clearTimeout(id);
    }
    if (render) {
      setShown(false);
      const t = setTimeout(() => setRender(false), 470);
      return () => clearTimeout(t);
    }
  }, [open, render]);

  // Reset the info panel scroll to the top whenever the work changes.
  useEffect(() => {
    if (panelRef.current) panelRef.current.scrollTop = 0;
  }, [index]);

  if (!render) return null;

  const item = items[index];
  if (!item) return null;

  const meta = getArtworkMeta(item.slug);
  const collection = getCollectionForPainting(item.slug);
  const reviews = getReviewsForProduct(item.slug);
  const rating = getAverageRating(item.slug);
  const counter = `${String(index + 1).padStart(2, "0")} / ${String(
    items.length,
  ).padStart(2, "0")}`;

  return createPortal(
    <>
      <div
        className="drawer-scrim"
        data-shown={shown}
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        className="drawer-panel overflow-y-auto"
        data-shown={shown}
        role="dialog"
        aria-modal="true"
        aria-label={meta.title}
        style={{ "--accent": item.accentHex } as React.CSSProperties}
      >
        <div className="relative grid min-h-full grid-cols-1 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Artwork */}
          <div className="relative flex items-center justify-center bg-[color-mix(in_srgb,var(--accent)_10%,var(--bone))] p-6 sm:p-10">
            <Image
              key={item.slug}
              src={item.large}
              alt={meta.title}
              width={item.width ?? 1500}
              height={item.height ?? 2000}
              sizes="(max-width: 1024px) 90vw, 55vw"
              priority
              className="hero-rise max-h-[78vh] w-auto object-contain shadow-[0_30px_80px_-40px_rgba(28,26,22,0.6)]"
            />
            {items.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => onStep(-1)}
                  aria-label="Previous work"
                  className="absolute top-1/2 left-3 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-[var(--bone)]/80 text-xl text-[var(--text)] shadow-sm backdrop-blur-sm transition hover:bg-[var(--bone)] sm:left-5"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => onStep(1)}
                  aria-label="Next work"
                  className="absolute top-1/2 right-3 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-[var(--bone)]/80 text-xl text-[var(--text)] shadow-sm backdrop-blur-sm transition hover:bg-[var(--bone)] sm:right-5"
                >
                  ›
                </button>
              </>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col gap-6 border-t border-[var(--border)] p-7 sm:p-10 lg:border-t-0 lg:border-l">
            <div className="flex items-center justify-between gap-4">
              <span className="eyebrow tabular-nums opacity-70">{counter}</span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="text-[0.72rem] tracking-[0.2em] text-[var(--muted)] uppercase transition-colors hover:text-[var(--text)]"
              >
                Close ✕
              </button>
            </div>

            <div>
              {collection && (
                <Link
                  href={`/collections/${collection.slug}`}
                  className="eyebrow link-accent"
                >
                  {collection.title}
                </Link>
              )}
              <h2 className="display text-text mt-2 text-4xl sm:text-5xl">
                {meta.title}
              </h2>
              <p className="text-muted mt-3 text-sm">
                {meta.medium} · {meta.dimensions} · {meta.year}
                {meta.status === "sold" && (
                  <span className="text-text"> · Sold</span>
                )}
              </p>
            </div>

            <div className="border-border border-t pt-5">
              <p className="eyebrow mb-2">The story</p>
              <p className="text-text/80 leading-relaxed">{meta.story}</p>
            </div>

            {reviews.length > 0 && (
              <div className="border-border border-t pt-5">
                <div className="mb-3 flex items-center gap-3">
                  <p className="eyebrow">Reviews</p>
                  {rating && (
                    <span className="text-sm">
                      <Stars value={rating.average} />{" "}
                      <span className="text-muted">({rating.count})</span>
                    </span>
                  )}
                </div>
                <ul className="flex flex-col gap-4">
                  {reviews.map((r) => (
                    <li key={r.id}>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-text text-sm font-medium">
                          {r.author}
                        </span>
                        <Stars value={r.rating} className="text-xs" />
                      </div>
                      <p className="text-muted mt-1 text-sm leading-relaxed">
                        {r.body}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="border-border mt-auto flex flex-wrap items-center gap-4 border-t pt-5">
              <Link
                href={`/contact?artwork=${encodeURIComponent(meta.title)}`}
                className="btn btn-primary"
              >
                Enquire about this piece
              </Link>
              {items.length > 1 && (
                <div className="ml-auto flex gap-2">
                  <button
                    type="button"
                    onClick={() => onStep(-1)}
                    aria-label="Previous work"
                    className="grid h-10 w-10 place-items-center rounded-full border border-[var(--border)] text-lg text-[var(--muted)] transition hover:border-[var(--text)] hover:text-[var(--text)]"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => onStep(1)}
                    aria-label="Next work"
                    className="grid h-10 w-10 place-items-center rounded-full border border-[var(--border)] text-lg text-[var(--muted)] transition hover:border-[var(--text)] hover:text-[var(--text)]"
                  >
                    ›
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
