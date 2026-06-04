import "server-only";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { isDemoMode } from "@/lib/env";
import { siteSettings, type SiteSettings } from "./schema";

/**
 * Site settings accessor (DESIGN.md §2 uniform-mode toggle).
 *
 * A single pinned row keyed `singleton`. `getSiteSettings` is read on every
 * storefront render to resolve accents, so it returns sensible defaults if the
 * row hasn't been seeded yet rather than throwing.
 */

const SINGLETON_ID = "singleton";

const DEFAULTS: SiteSettings = {
  id: SINGLETON_ID,
  matchArtworkColours: true,
  uniformAccentHex: "#8a7bff",
  updatedAt: new Date(0),
};

export async function getSiteSettings(): Promise<SiteSettings> {
  if (isDemoMode) return DEFAULTS;
  const [row] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.id, SINGLETON_ID))
    .limit(1);
  return row ?? DEFAULTS;
}

export async function updateSiteSettings(
  patch: Partial<
    Pick<SiteSettings, "matchArtworkColours" | "uniformAccentHex">
  >,
): Promise<SiteSettings> {
  const [row] = await db
    .insert(siteSettings)
    .values({ id: SINGLETON_ID, ...patch, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: siteSettings.id,
      set: { ...patch, updatedAt: new Date() },
    })
    .returning();
  return row;
}
