import Link from "next/link";
import Image from "next/image";
import { AccentScope } from "./AccentScope";
import { Reveal } from "./Reveal";
import { formatMoney } from "@/lib/money";

/**
 * A single artwork tile on the gallery grid (DESIGN.md §3, §4).
 *
 * Each card owns its own accent via AccentScope, so hovering lifts the card and
 * glows in that piece's colour. 3:4 aspect, lazy image, staggered reveal.
 * Presentational only — the page resolves the accent and image URL.
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
  const label = type === "print" ? "Print · from" : "Original";

  return (
    <Reveal delay={Math.min(index, 8) * 70}>
      <AccentScope accentHex={accentHex} as="article">
        <Link
          href={`/shop/${slug}`}
          className="hover-lift group border-border bg-panel block overflow-hidden rounded-xl border"
        >
          <div className="relative aspect-[3/4] overflow-hidden bg-[var(--accent-soft)]">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={alt}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,var(--accent-soft),transparent_70%)]" />
            )}
          </div>
          <div className="p-4">
            <p className="eyebrow">{label}</p>
            <h3 className="display text-text mt-1 text-lg">{title}</h3>
            <p className="mt-1 text-sm text-[var(--accent-text)]">
              {formatMoney(priceCents, currency)}
            </p>
          </div>
        </Link>
      </AccentScope>
    </Reveal>
  );
}
