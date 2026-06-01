import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <p className="mb-4 text-sm tracking-[0.2em] text-neutral-500 uppercase">
        Coming soon
      </p>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
        Anna Barnett
      </h1>
      <p className="mt-4 max-w-xl text-lg text-neutral-600 dark:text-neutral-400">
        Original artwork and fine-art prints. The shop and portfolio are being
        built — check back soon.
      </p>
      <nav className="mt-10 flex gap-6 text-sm text-neutral-500">
        <Link href="/privacy" className="hover:underline">
          Privacy
        </Link>
        <Link href="/terms" className="hover:underline">
          Terms
        </Link>
      </nav>
    </main>
  );
}
