import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCollection,
  getCollections,
  getCollectionPaintings,
} from "@/lib/collections";
import { GalleryGrid } from "@/components/GalleryGrid";
import { Reveal } from "@/components/Reveal";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getCollections().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (!collection) return { title: "Collection not found" };
  return {
    title: collection.title,
    description: `${collection.title} — a collection of paintings by Anna Barnett.`,
  };
}

export default async function CollectionPage({ params }: Params) {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (!collection) notFound();

  const items = getCollectionPaintings(slug);

  return (
    <div className="mx-auto max-w-[1180px] px-6 py-20">
      <Reveal>
        <Link href="/collections" className="eyebrow link-accent inline-block">
          ← All collections
        </Link>
        <header className="border-border mt-6 max-w-2xl border-b pb-10">
          <p className="eyebrow">Collection</p>
          <h1 className="display text-text mt-4 text-5xl sm:text-7xl">
            {collection.title}
          </h1>
          <p className="text-muted mt-5 max-w-xl text-lg leading-relaxed">
            {collection.story}
          </p>
        </header>
      </Reveal>

      <div className="mt-14">
        {items.length === 0 ? (
          <p className="text-muted">This collection is being hung.</p>
        ) : (
          <GalleryGrid items={items} />
        )}
      </div>

      <Reveal>
        <div className="border-border mt-20 flex flex-col items-start gap-4 border-t pt-10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted max-w-md leading-relaxed">
            Interested in a piece from this collection, or a commission in the
            same vein? Anna handles every enquiry personally.
          </p>
          <Link href="/contact" className="btn btn-primary shrink-0">
            Get in touch
          </Link>
        </div>
      </Reveal>
    </div>
  );
}
