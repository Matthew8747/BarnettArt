import type { Metadata } from "next";
import { Geist, Fraunces } from "next/font/google";
import "./globals.css";

// Body/UI: clean grotesque. Self-hosted by next/font at build (CSP-friendly).
const geistSans = Geist({
  variable: "--font-sans-stack",
  subsets: ["latin"],
  display: "swap",
});

// Display headings (DESIGN.md §4): an editorial serif with optical sizing.
const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Anna Barnett — Original Art & Prints",
    template: "%s · Anna Barnett",
  },
  description:
    "Original artwork and fine-art prints by Anna Barnett. Browse the collection and buy securely.",
  openGraph: {
    title: "Anna Barnett — Original Art & Prints",
    description: "Original artwork and fine-art prints by Anna Barnett.",
    type: "website",
    locale: "en_GB",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
