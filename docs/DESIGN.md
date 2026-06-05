# Design System & Decisions — Barnett Art

> The single source of truth for the **look, feel, and motion** of the site.
> Every decision below is recorded with its rationale and a **"how to backtrack"**
> note, so anything Anna doesn't like can be reversed quickly without guesswork.
>
> **Status:** Redesigned **2026-06-05** to a light editorial "gallery wall"
> direction (superseding the original 2026-06-01 dark draft — see the decision
> log). Pending Anna's feedback on a deployed Vercel preview. Architecture
> reference: [`anna-art-platform-plan.md`](./anna-art-platform-plan.md).

---

## 1. Mood — Light editorial (the gallery wall)

A warm, quiet **paper-white** canvas — work hung against a contemporary gallery
wall, not a screen. **Not stark white**: the base is a warm bone/paper with a
faint printed **grain** (multiply-blended fractal noise) and a barely-there warm
vignette for depth. This is the deliberate move away from the original dark +
purple-glow draft, which read as generic.

| Token | Value | Use |
|-------|-------|-----|
| `--bg` | `#f3efe6` | page canvas — warm paper |
| `--panel` | `#fbf9f3` | cards / mounts / surfaces |
| `--text` | `#1c1a16` | primary text — warm near-black ink |
| `--muted` | `#6b6457` | secondary text — warm taupe |
| `--border` | `#e2dccd` | hairline rules |
| atmosphere | low-opacity paper grain + faint warm vignette (no glow) | depth |

- **Why:** the way high-end art shops actually present work (Tappan, Partnership
  Editions, Avant Arte). The art supplies the colour; the chrome stays quiet.
- **Backtrack:** warm/cool or lighten/darken the paper by editing `--bg`/`--panel`
  only. The grain lives in one `body::before` rule; drop its `opacity` to 0 to
  remove it. A dark theme would be a second token set behind a switch (the old
  dark values are preserved as `DARK_BG` in `src/lib/color.ts`).
- **Accessibility:** maintain ≥ 4.5:1 text contrast on paper; any accent used as
  text/price is clamped **darker** until it clears the bar (see §2).

## 2. Palette — Per-artwork accent, artist-adjustable, with a uniform override

The defining decision. Each artwork drives the **accent colour** used across the
UI when that piece is in focus (hover on the grid; the whole product page when
opened). Neutral dark shell + one shifting accent — never a rainbow at once.

**How colour is set (the agreed model):**
1. **Auto by default.** When a product image is uploaded, we extract a small
   palette (dominant + a few candidates) from the image and store it on the
   product. The primary becomes that piece's accent.
2. **Anna adjusts in admin.** On the product editor she sees the extracted
   swatches and a fine colour picker, and can pick/tweak the accent until it
   looks right. The stored value — not a live client guess — is what ships.
3. **Global uniform override.** A site-level setting "**Match artwork colours**"
   can be turned **off**, which makes every piece use one **uniform site
   palette** (default accent `--accent: #9c4221`, a burnt sienna). This is the
   escape hatch if Anna prefers a consistent look.

**Used sparingly (the light-theme rule).** On paper, the accent is a quiet
detail, never a fill or a glow: the type label on a card, a wipe-in underline on
hover, the price, a thin rule, the back-link. The artwork itself is the colour.

- **Why this model:** "matches the individual artwork" literally, but the artist
  stays in control and customers get a deterministic, accessible result (no
  flicker, no unreadable auto-colours).
- **Data:** store on the product, e.g. `accent_hex` (nullable) + optional
  `palette_json` (extracted candidates). Null + uniform-mode → site default.
- **Accessibility guard:** clamp any accent used for **text** to meet contrast on
  paper. `clampAccentForText` is **direction-aware** — it darkens a too-bright
  accent on the light canvas (and would lighten on a dark one). Large
  fills/washes (`--accent-soft`, now a 0.12-alpha tint) are exempt. Enforced in
  one place: `src/lib/color.ts` + `src/lib/accent.ts`.
- **Backtrack:**
  - Don't like per-piece colour at all → flip the uniform toggle (no deploy).
  - One piece looks wrong → re-pick its accent in admin (no deploy).
  - Want to change the default accent → one token.

## 3. Motion — "In between": engaging, not overstimulating

Tasteful, smooth motion. Explicitly **not** the heavy/playful tier.

| Moment | Behaviour |
|--------|-----------|
| Page / grid load | content fades + rises in a soft **stagger** |
| Card hover | gentle **lift** + soft ink shadow + accent **wipe-underline** on the title; image **slowly zooms** |
| Nav / links | accent underline **wipes in** from the left |
| Open product | hero artwork **settles up** into its paper mount; details **slide up** staggered |
| Scroll | gentle fade reveals (light touch) |

- **Why:** premium and alive without distracting from the art or hurting perf.
- **Removed (2026-06-05):** the pointer-trailing **cursor glow** — an additive
  glow doesn't read on a light canvas and leaned generic. Deleted with its
  component.
- **Non-negotiable:** **`prefers-reduced-motion: reduce`** disables parallax and
  large transforms; content still appears (no reliance on motion to reveal).
  Baked into the motion utilities.
- **Performance:** animate `transform`/`opacity` only; avoid layout thrash; lazy
  reveal below the fold. Keep Core Web Vitals green (a launch requirement).
- **Backtrack:** motion lives in shared utilities/components; dial intensity by
  editing durations/distances in one place, or gate behind a `motion="subtle"`
  flag.

## 4. Layout & typography (starting point)

- Max content width ~1180px; generous spacing; 3-up artwork grid (2-up tablet,
  1-up mobile); 3:4 artwork cards.
- Type: large editorial **serif** display headings (a high-contrast garalde,
  the air of a printed gallery catalogue); a quiet **grotesque** for body and UI;
  restrained uppercase labels with wide letter-spacing for nav/eyebrows. Buttons
  are squared, small-caps, wide-tracked — gallery signage, not pills.
- **Pairing (2026-06-05):** **Cormorant Garamond** (display) + **Hanken Grotesk**
  (body), self-hosted via `next/font`. Deliberately not Inter / Geist / Fraunces.
- **Backtrack:** typography is tokenised (`--font-display`, `--font-sans-stack`);
  swapping the pairing is a one-line change in `layout.tsx`, not a rewrite.

## 5. Reusable pieces (so the design stays consistent and testable)

- **Theme/accent provider** — sets `--accent`/`--accent-soft` from the active
  product (or site default in uniform mode); single place that owns colour.
- **Motion utilities** — reveal-on-scroll, hover-lift, cursor-glow; all
  reduced-motion aware.
- **ArtworkCard**, **ProductView**, **AccentControls (admin)** — clear inputs,
  no hidden global state beyond the theme provider.

## 6. Open items to settle during implementation

- ✅ **Colour extraction** — `node-vibrant`, admin-time, server-only
  (`src/lib/palette.ts`); stores `accent_hex` + `palette_json`. Never on client.
- ✅ **Contrast-clamp helper** — `src/lib/color.ts` `clampAccentForText()` is
  direction-aware: it darkens any accent used as text until it clears ≥4.5:1 on
  the paper canvas (`PAGE_BG`), and would lighten on a dark canvas; raw accent
  kept for fills. `src/lib/accent.ts` is the single owner of accent resolution +
  CSS vars.
- ✅ **Web-font pairing** — Cormorant Garamond (display) + Hanken Grotesk (body),
  self-hosted via `next/font`. Swap is a one-line config change in `layout.tsx`.
  _CSP note:_ confirm `font-src`/`style-src` still cover self-hosted fonts when
  the nonce-based CSP hardening lands (Phase 3).
- **Dark-mode:** the original dark palette is preserved as `DARK_BG` in
  `color.ts`; a future toggle would re-add it as a second token set.

> **Implementation note (2026-06-05):** the storefront is the light editorial
> "gallery wall". Per-card and per-page accent retint are live (used sparingly);
> "lift one card's accent to the whole scene on hover" is still deferred as a
> polish item. Scroll reveals, the card hover-lift + image zoom, the wipe-in
> underlines and the product hero-rise are all implemented and reduced-motion
> aware. The cursor glow has been removed.

---

### Decision log

| Date | Decision | Rationale | Backtrack |
|------|----------|-----------|-----------|
| 2026-06-01 | ~~Dark immersive, lifted off black~~ → **superseded 2026-06-05** | Art pops; pure black felt heavy | Edit `--bg`/`--panel` |
| 2026-06-01 | Per-artwork accent, auto-extracted | "Matches the individual artwork" | Uniform toggle |
| 2026-06-01 | Artist adjusts accent in admin (swatch + picker) | Keep the artist in control | n/a (it *is* the control) |
| 2026-06-01 | Global "uniform palette" override | Escape hatch if Anna dislikes per-piece colour | Toggle off |
| 2026-06-01 | Motion = "in between", reduced-motion respected | Engaging, not overstimulating; a11y | Tune in motion utils |
| **2026-06-05** | **Redesign → light editorial "gallery wall"** (warm paper, ink, paper grain) | Dark + purple-glow draft read as generic AI; light is how high-end art shops actually present work | Dark tokens preserved as `DARK_BG`; flip token set |
| **2026-06-05** | **Default accent → burnt sienna `#9c4221`** (was purple `#8a7bff`) | Drop the AI-cliché purple; warm gallery house colour | One token / `DEFAULT_ACCENT` |
| **2026-06-05** | **Accent used sparingly** (rules, underlines, price — never glow) | Light theme: the artwork is the colour | Widen usage in components |
| **2026-06-05** | **Type → Cormorant Garamond + Hanken Grotesk** (was Fraunces + Geist) | Distinctive editorial pairing, not Inter/Geist/Fraunces | One line in `layout.tsx` |
| **2026-06-05** | **Removed the cursor glow** | Additive glow doesn't read on paper; leaned generic | Re-add component |
