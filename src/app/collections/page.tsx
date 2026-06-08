import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getCollections } from "@/lib/collections";
import { getGalleryItem } from "@/lib/gallery";
import { Reveal } from "@/components/Reveal";
import { AccentScope } from "@/components/AccentScope";

export const metadata: Metadata = {
  title: "Collections",
  description:
    "Anna Barnett's paintings, grouped into collections. Explore each series and the story behind it.",
};

export default function CollectionsPage() {
  const collections = getCollections();

  return (
    <div className="mx-auto max-w-[1180px] px-6 py-20">
      <Reveal>
        <header className="border-border max-w-2xl border-b pb-10">
          <p className="eyebrow">Collections</p>
          <h1 className="display text-text mt-4 text-5xl sm:text-7xl">
            Bodies of work
          </h1>
          <p className="text-muted mt-5 max-w-xl text-lg leading-relaxed">
            The paintings are grouped into collections — each a series with its
            own palette and intent. Choose one to read its story and see the
            pieces together.
          </p>
        </header>
      </Reveal>

      <div className="mt-14 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2">
        {collections.map((c, i) => {
          const cover = getGalleryItem(c.coverSlug);
          return (
            <Reveal key={c.slug} delay={i * 90}>
              <AccentScope accentHex={cover?.accentHex ?? "#9c4221"}>
                <Link href={`/collections/${c.slug}`} className="group block">
                  <div className="hover-lift bg-panel overflow-hidden p-2 shadow-[0_2px_14px_-8px_rgba(28,26,22,0.35)] ring-1 ring-[color-mix(in_srgb,var(--text)_12%,transparent)]">
                    <span className="block overflow-hidden">
                      {cover && (
                        <Image
                          src={cover.thumb}
                          alt={`${c.title} — cover`}
                          width={cover.width ?? 900}
                          height={cover.height ?? 1125}
                          sizes="(max-width: 640px) 100vw, 50vw"
                          className="h-[22rem] w-full object-cover transition-transform duration-[1100ms] ease-out group-hover:scale-[1.04]"
                        />
                      )}
                    </span>
                  </div>
                  <div className="mt-5">
                    <div className="flex items-baseline justify-between gap-4">
                      <h2 className="display text-text text-3xl">{c.title}</h2>
                      <span className="eyebrow shrink-0 opacity-70">
                        {c.paintingSlugs.length} works
                      </span>
                    </div>
                    <p className="text-muted mt-3 max-w-prose leading-relaxed">
                      {c.story.length > 180
                        ? `${c.story.slice(0, 180).trimEnd()}…`
                        : c.story}
                    </p>
                    <span className="link-accent mt-4 inline-block text-[0.72rem] tracking-[0.18em] uppercase">
                      Explore the collection →
                    </span>
                  </div>
                </Link>
              </AccentScope>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
