# Design System & Decisions — Barnett Art

> The single source of truth for the **look, feel, and motion** of the site.
> Every decision below is recorded with its rationale and a **"how to backtrack"**
> note, so anything Anna doesn't like can be reversed quickly without guesswork.
>
> **Status:** Direction approved (2026-06-01) from interactive drafts. Pending
> Anna's feedback on a deployed Vercel preview. Architecture reference:
> [`anna-art-platform-plan.md`](./anna-art-platform-plan.md).

Interactive drafts these decisions came from (kept for reference, git-ignored):
`/.superpowers/brainstorm/.../homepage-dark.html` and `…-v2.html`.

---

## 1. Mood — Dark immersive (lifted)

A dark, quiet "gallery at night" canvas so artworks glow against it. **Not pure
black** — the base is lifted to a deep charcoal with a faint top light, after
feedback that pure black felt too heavy.

| Token | Value | Use |
|-------|-------|-----|
| `--bg` | `#15151d` | page canvas |
| `--panel` | `#1e1e28` | cards / surfaces |
| `--text` | `#f5f4f9` | primary text |
| `--muted` | `#a6a5b6` | secondary text |
| ambient | corner radial glows in the active accent + a soft top white wash | depth |

- **Why:** lets vibrant artwork and accents pop; premium, focused, art-first.
- **Backtrack:** raise/lower darkness by editing `--bg`/`--panel` only. A light
  theme would be a second token set behind a theme switch (not in scope now).
- **Accessibility:** maintain ≥ 4.5:1 text contrast on the dark canvas; verify
  accent-on-dark for any accent used as text/price (some bright accents may need
  a minimum-lightness clamp — see §2).

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
   palette** (default accent `--accent: #8a7bff`). This is the escape hatch if
   Anna prefers a consistent look.

- **Why this model:** "matches the individual artwork" literally, but the artist
  stays in control and customers get a deterministic, accessible result (no
  flicker, no unreadable auto-colours).
- **Data:** store on the product, e.g. `accent_hex` (nullable) + optional
  `palette_json` (extracted candidates). Null + uniform-mode → site default.
- **Accessibility guard:** clamp/adjust any accent used for **text** to meet
  contrast on the dark canvas; large fills/glows are exempt. Define a helper so
  this is enforced in one place.
- **Backtrack:**
  - Don't like per-piece colour at all → flip the uniform toggle (no deploy).
  - One piece looks wrong → re-pick its accent in admin (no deploy).
  - Want to change the default accent → one token.

## 3. Motion — "In between": engaging, not overstimulating

Tasteful, smooth motion. Explicitly **not** the heavy/playful tier.

| Moment | Behaviour |
|--------|-----------|
| Grid load | cards fade + rise in a soft **stagger** |
| Card hover | gentle **lift** + accent glow + scene retint to that piece |
| Cursor | a **soft glow trails** the pointer (desktop only) |
| Open product | overlay **fades in**, hero artwork **scales up** with its glow, details **slide up** staggered |
| Scroll | gentle fade/parallax reveals (light touch) |

- **Why:** premium and alive without distracting from the art or hurting perf.
- **Non-negotiable:** **`prefers-reduced-motion: reduce`** disables cursor glow,
  parallax, and large transforms; content still appears (no reliance on motion
  to reveal). Bake this into the motion utilities from day one.
- **Performance:** animate `transform`/`opacity` only; avoid layout thrash; lazy
  reveal below the fold. Keep Core Web Vitals green (a launch requirement).
- **Backtrack:** motion lives in shared utilities/components; dial intensity by
  editing durations/distances in one place, or gate behind a `motion="subtle"`
  flag.

## 4. Layout & typography (starting point)

- Max content width ~1180px; generous spacing; 3-up artwork grid (2-up tablet,
  1-up mobile); 3:4 artwork cards.
- Type: large, tight-tracked display headings; restrained uppercase labels with
  wide letter-spacing for nav/eyebrows. Final typeface TBD in implementation
  (system stack in drafts) — pick one web-font pairing, self-hosted for perf/CSP.
- **Backtrack:** typography is tokenised; swapping the font pairing is a config
  change, not a rewrite.

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
- ✅ **Contrast-clamp helper** — `src/lib/color.ts` `clampAccentForText()` lifts
  any accent used as text to ≥4.5:1 on the dark canvas; raw accent kept for fills.
  `src/lib/accent.ts` is the single owner of accent resolution + CSS vars.
- ✅ **Web-font pairing** — Fraunces (display) + Geist (body), self-hosted via
  `next/font`. Swap is a one-line config change in `layout.tsx`.
  _CSP note:_ confirm `font-src`/`style-src` still cover self-hosted fonts when
  the nonce-based CSP hardening lands (Phase 3).
- Light-mode: out of scope for launch unless Anna asks.

> **Implementation note (Phase 1a):** per-card and per-page accent retint are
> live; "lift one card's accent to the whole scene on hover" is deferred as a
> polish item. The cursor glow, scroll reveals, hover-lift and hero-rise are all
> implemented and reduced-motion aware.

---

### Decision log

| Date | Decision | Rationale | Backtrack |
|------|----------|-----------|-----------|
| 2026-06-01 | Dark immersive, lifted off black | Art pops; pure black felt heavy | Edit `--bg`/`--panel` |
| 2026-06-01 | Per-artwork accent, auto-extracted | "Matches the individual artwork" | Uniform toggle |
| 2026-06-01 | Artist adjusts accent in admin (swatch + picker) | Keep the artist in control | n/a (it *is* the control) |
| 2026-06-01 | Global "uniform palette" override | Escape hatch if Anna dislikes per-piece colour | Toggle off |
| 2026-06-01 | Motion = "in between", reduced-motion respected | Engaging, not overstimulating; a11y | Tune in motion utils |
