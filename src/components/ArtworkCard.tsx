import Link from "next/link";
import Image from "next/image";
import { AccentScope } from "./AccentScope";
import { Reveal } from "./Reveal";
import { formatMoney } from "@/lib/money";

/**
 * A single artwork tile on the gallery grid (DESIGN.md §3, §4).
 *
 * Reads like work hung on a wall: a thin paper "mount" frames the image, with a
 * museum-label caption sitting directly on the canvas below. Each card owns its
 * own accent via AccentScope, used sparingly — the type label is tinted to the
 * piece and the title underline wipes in on hover. 3:4 aspect, lazy image,
 * staggered reveal. Presentational only — the page resolves accent + image URL.
 */
export function ArtworkCard({
  slug,
  title,
  type,
  priceCents,
  currency,
  accentHex,
  imageUrl,
  alt,
  index = 0,
}: {
  slug: string;
  title: string;
  type: "original" | "print";
  priceCents: number;
  currency: string;
  accentHex: string;
  imageUrl: string | null;
  alt: string;
  index?: number;
}) {
  const label = type === "print" ? "Fine-art print" : "Original";
  const number = String(index + 1).padStart(2, "0");

  return (
    <Reveal delay={Math.min(index, 8) * 70}>
      <AccentScope accentHex={accentHex} as="article">
        <Link href={`/shop/${slug}`} className="group block">
          <div className="hover-lift bg-panel relative aspect-[3/4] overflow-hidden p-1.5 shadow-[0_2px_10px_-6px_rgba(28,26,22,0.3)] ring-1 ring-[color-mix(in_srgb,var(--text)_12%,transparent)]">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={alt}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover p-1.5 transition-transform duration-[1100ms] ease-out group-hover:scale-[1.04]"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,var(--accent-soft),transparent_70%)]" />
            )}
          </div>
          <div className="border-border mt-5 flex items-baseline justify-between gap-4 border-t pt-4">
            <div className="flex gap-3">
              <span className="eyebrow pt-1 tabular-nums opacity-70">
                {number}
              </span>
              <div>
                <h3 className="display text-text text-[1.35rem] leading-none">
                  <span className="wipe-underline">{title}</span>
                </h3>
                <p className="eyebrow mt-2.5 text-[var(--accent-text)]">
                  {label}
                </p>
              </div>
            </div>
            <p className="text-text shrink-0 text-sm tabular-nums">
              {formatMoney(priceCents, currency)}
            </p>
          </div>
        </Link>
      </AccentScope>
    </Reveal>
  );
}
