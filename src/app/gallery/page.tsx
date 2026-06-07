import type { Metadata } from "next";
import Link from "next/link";
import { getGalleryItems } from "@/lib/gallery";
import { GalleryGrid } from "@/components/GalleryGrid";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "The full body of work — original paintings by Anna Barnett. Browse the gallery and enquire about a piece.",
};

export default function GalleryPage() {
  const items = getGalleryItems();

  return (
    <div className="mx-auto max-w-[1180px] px-6 py-20">
      <Reveal>
        <header className="border-border max-w-2xl border-b pb-10">
          <p className="eyebrow">The Gallery</p>
          <h1 className="display text-text mt-4 text-5xl sm:text-7xl">
            The full body of work
          </h1>
          <p className="text-muted mt-5 max-w-xl text-lg leading-relaxed">
            Original paintings, built in layers — colour worked over colour
            until the surface holds. Select any piece to see it larger, or to
            enquire about acquiring it.
          </p>
        </header>
      </Reveal>

      <div className="mt-14">
        {items.length === 0 ? (
          <p className="text-muted">
            The gallery is being hung. Please check back soon.
          </p>
        ) : (
          <GalleryGrid items={items} enableFilter />
        )}
      </div>

      <Reveal>
        <div className="border-border mt-20 flex flex-col items-start gap-4 border-t pt-10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted max-w-md leading-relaxed">
            Interested in a piece, a commission, or a print? Anna handles every
            enquiry personally.
          </p>
          <Link href="/contact" className="btn btn-primary shrink-0">
            Get in touch
          </Link>
        </div>
      </Reveal>
    </div>
  );
}
