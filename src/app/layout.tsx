import type { Metadata } from "next";
import { Hanken_Grotesk, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

// Body/UI (DESIGN.md §4): a warm, low-key grotesque — characterful but quiet,
// deliberately not Inter. Self-hosted by next/font at build (CSP-friendly).
const bodyFont = Hanken_Grotesk({
  variable: "--font-sans-stack",
  subsets: ["latin"],
  display: "swap",
});

// Display headings (DESIGN.md §4): a high-contrast garalde serif with the air of
// a printed gallery catalogue — used only at large sizes.
const displayFont = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600"],
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
      className={`${bodyFont.variable} ${displayFont.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
