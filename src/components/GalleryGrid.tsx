"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { GalleryItem } from "@/lib/gallery";
import { getArtworkMeta } from "@/lib/artwork-meta";
import { getReviewsForProduct, getAverageRating } from "@/lib/reviews";
import {
  getCollections,
  getCollectionForPainting,
  paintingCollectionMap,
} from "@/lib/collections";

/**
 * Masonry showcase of Anna's paintings (DESIGN.md aesthetic — paper mounts,
 * per-artwork accent, no glow). Each work hangs at its true aspect ratio and
 * opens in a two-pane lightbox: the artwork beside a panel with its story,
 * details and reviews. Keyboard-accessible: Esc closes, ←/→ step through.
 *
 * `enableFilter` adds collection filter chips above the grid (used on /gallery).
 */
function Stars({ value }: { value: number }) {
  const rounded = Math.round(value);
  return (
    <span
      aria-label={`${value.toFixed(1)} out of 5`}
      className="text-[var(--accent-text)]"
    >
      {"★★★★★".slice(0, rounded)}
      <span className="opacity-30">{"★★★★★".slice(rounded)}</span>
    </span>
  );
}

export function GalleryGrid({
  items,
  enableFilter = false,
}: {
  items: GalleryItem[];
  enableFilter?: boolean;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>("all");

  // Collections present among these items (for the filter chips).
  const chips = useMemo(() => {
    if (!enableFilter) return [];
    const map = paintingCollectionMap();
    const present = new Set<string>();
    for (const it of items) {
      const c = map.get(it.slug);
      if (c) present.add(c.slug);
    }
    return getCollections().filter((c) => present.has(c.slug));
  }, [items, enableFilter]);

  const shown = useMemo(() => {
    if (!enableFilter || filter === "all") return items;
    return items.filter(
      (it) => getCollectionForPainting(it.slug)?.slug === filter,
    );
  }, [items, filter, enableFilter]);

  const close = useCallback(() => setOpen(null), []);
  const step = useCallback(
    (dir: 1 | -1) =>
      setOpen((i) =>
        i === null ? i : (i + dir + shown.length) % shown.length,
      ),
    [shown.length],
  );

  useEffect(() => {
    if (open === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close, step]);

  const active = open === null ? null : shown[open];
  const meta = active ? getArtworkMeta(active.slug) : null;
  const collection = active ? getCollectionForPainting(active.slug) : null;
  const reviews = active ? getReviewsForProduct(active.slug) : [];
  const rating = active ? getAverageRating(active.slug) : null;

  return (
    <>
      {enableFilter && chips.length > 0 && (
        <div className="mb-10 flex flex-wrap gap-2">
          <FilterChip
            label="All"
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />
          {chips.map((c) => (
            <FilterChip
              key={c.slug}
              label={c.title}
              active={filter === c.slug}
              onClick={() => setFilter(c.slug)}
            />
          ))}
        </div>
      )}

      <div className="gap-5 [column-fill:_balance] sm:columns-2 lg:columns-3">
        {shown.map((item, i) => {
          const ratio =
            item.width && item.height ? item.width / item.height : 0.8;
          const title = getArtworkMeta(item.slug).title;
          return (
            <figure
              key={item.slug}
              className="group mb-5 break-inside-avoid"
              style={{ "--accent": item.accentHex } as React.CSSProperties}
            >
              <button
                type="button"
                onClick={() => setOpen(i)}
                aria-label={`Open ${title}`}
                className="hover-lift bg-panel block w-full cursor-zoom-in overflow-hidden p-1.5 shadow-[0_2px_10px_-6px_rgba(28,26,22,0.3)] ring-1 ring-[color-mix(in_srgb,var(--text)_12%,transparent)]"
              >
                <span className="block overflow-hidden">
                  <Image
                    src={item.thumb}
                    alt={title}
                    width={item.width ?? 900}
                    height={item.height ?? 1125}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="h-auto w-full transition-transform duration-[1100ms] ease-out group-hover:scale-[1.04]"
                    style={{ aspectRatio: ratio }}
                  />
                </span>
              </button>
              <figcaption className="border-border mt-3 flex items-baseline justify-between gap-3 border-t pt-3">
                <span className="text-text/80 text-[0.8rem] tracking-wide">
                  {title}
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(i)}
                  className="link-accent shrink-0 text-[0.7rem] tracking-[0.18em] uppercase"
                >
                  View
                </button>
              </figcaption>
            </figure>
          );
        })}
      </div>

      {active && meta && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={meta.title}
          onClick={close}
          className="fixed inset-0 z-50 overflow-y-auto bg-[rgba(20,18,14,0.94)] p-4 sm:p-8"
        >
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="fixed top-5 right-6 z-10 text-[0.72rem] tracking-[0.2em] text-[var(--bg)]/80 uppercase hover:text-[var(--bg)]"
          >
            Close ✕
          </button>
          {shown.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  step(-1);
                }}
                aria-label="Previous"
                className="fixed top-1/2 left-2 z-10 -translate-y-1/2 text-3xl text-[var(--bg)]/60 hover:text-[var(--bg)] sm:left-5"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  step(1);
                }}
                aria-label="Next"
                className="fixed top-1/2 right-2 z-10 -translate-y-1/2 text-3xl text-[var(--bg)]/60 hover:text-[var(--bg)] sm:right-5"
              >
                ›
              </button>
            </>
          )}

          <div
            onClick={(e) => e.stopPropagation()}
            style={{ "--accent": active.accentHex } as React.CSSProperties}
            className="bg-panel mx-auto my-2 grid max-w-[1100px] grid-cols-1 overflow-hidden rounded-[3px] shadow-[0_40px_120px_-40px_rgba(0,0,0,0.8)] lg:grid-cols-[1.1fr_0.9fr]"
          >
            {/* Artwork */}
            <div className="flex items-center justify-center bg-[var(--accent-soft)] p-4 sm:p-8">
              <Image
                src={active.large}
                alt={meta.title}
                width={active.width ?? 1500}
                height={active.height ?? 2000}
                sizes="(max-width: 1024px) 92vw, 55vw"
                priority
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>

            {/* Info panel */}
            <div className="flex max-h-[80vh] flex-col gap-6 overflow-y-auto p-7 sm:p-9">
              <div>
                {collection && (
                  <Link
                    href={`/collections/${collection.slug}`}
                    className="eyebrow link-accent"
                  >
                    {collection.title}
                  </Link>
                )}
                <h2 className="display text-text mt-2 text-4xl">
                  {meta.title}
                </h2>
                <p className="text-muted mt-2 text-sm">
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
                          <span className="text-xs">
                            <Stars value={r.rating} />
                          </span>
                        </div>
                        <p className="text-muted mt-1 text-sm leading-relaxed">
                          {r.body}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="border-border mt-auto border-t pt-5">
                <Link
                  href={`/contact?artwork=${encodeURIComponent(meta.title)}`}
                  className="btn btn-primary"
                >
                  Enquire about this piece
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-4 py-1.5 text-[0.72rem] tracking-[0.12em] uppercase transition-colors ${
        active
          ? "border-text bg-text text-[var(--bg)]"
          : "border-border text-muted hover:text-text"
      }`}
    >
      {label}
    </button>
  );
}
