import type { CSSProperties, ReactNode } from "react";
import { accentTheme } from "@/lib/accent";

/**
 * Owns colour for a subtree (DESIGN.md §5 "theme/accent provider").
 *
 * Writes `--accent`, `--accent-text` and `--accent-soft` as inline CSS variables
 * so everything inside retints to the given accent — the whole product page when
 * opened, or a single card on the grid. The contrast guard lives in
 * `accentTheme`, so any accent used as text stays readable on the dark canvas.
 *
 * Server component: the accent is resolved server-side and shipped as plain CSS,
 * so there's no client flicker and no live colour computation in the browser.
 */
export function AccentScope({
  accentHex,
  children,
  className,
  style,
  as: Tag = "div",
}: {
  accentHex: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  as?: "div" | "section" | "article" | "main";
}) {
  const vars = accentTheme(accentHex) as CSSProperties;
  return (
    <Tag className={className} style={{ ...vars, ...style }}>
      {children}
    </Tag>
  );
}
