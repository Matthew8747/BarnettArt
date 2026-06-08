"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { GalleryItem } from "@/lib/gallery";
import { getArtworkMeta } from "@/lib/artwork-meta";
import {
  getCollections,
  getCollectionForPainting,
  paintingCollectionMap,
} from "@/lib/collections";
import { ArtworkDrawer } from "@/components/ArtworkDrawer";

/**
 * Masonry showcase of Anna's paintings (DESIGN.md aesthetic — paper mounts,
 * per-artwork accent, no glow). Each work hangs at its true aspect ratio and
 * opens in the sliding ArtworkDrawer (story, details, reviews, navigation).
 *
 * `enableFilter` adds collection filter chips above the grid (used on /gallery).
 * A `?piece=<slug>` query param opens that work on load (home reviews link in).
 */
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

  // Deep link: /gallery?piece=<slug> opens that work on load.
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("piece");
    if (!slug) return;
    const idx = items.findIndex((it) => it.slug === slug);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing UI to the URL is a client-only effect
    if (idx !== -1) setOpen(idx);
  }, [items]);

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
                className="hover-lift bg-panel block w-full cursor-pointer overflow-hidden p-1.5 shadow-[0_2px_10px_-6px_rgba(28,26,22,0.3)] ring-1 ring-[color-mix(in_srgb,var(--text)_12%,transparent)]"
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

      <ArtworkDrawer
        items={shown}
        open={open !== null}
        index={open ?? 0}
        onClose={close}
        onStep={step}
      />
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
