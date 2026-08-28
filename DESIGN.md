---
name: Verabloom
description: Thai-first bouquet shop app — public catalog plus a shared admin area for orders, payments, and expenses
colors:
  brand-pink: "#d99a99"
  ink-black: "#21372d"
  paper-white: "#f8f4ec"
  legacy-paper: "#f8f4ec"
  legacy-ink: "#21372d"
  legacy-muted-ink: "#637066"
  legacy-leaf: "#365d49"
  legacy-leaf-dark: "#244537"
  legacy-blush: "#d99a99"
  legacy-blush-light: "#efd0ca"
  owner-chompooh: "#b4436b"
  owner-chompooh-soft: "#fbe0e8"
  owner-meen: "#2f6f9e"
  owner-meen-soft: "#dcecf8"
  owner-kan: "#8a5a12"
  owner-kan-soft: "#f8ecd4"
  owner-unassigned: "#637066"
  delivery-postal: "#2f6f9e"
  delivery-postal-soft: "#dcecf8"
  delivery-messenger: "#a4531b"
  delivery-messenger-soft: "#fbe7d6"
  delivery-collection: "#365d49"
  delivery-collection-soft: "#dce9dc"
typography:
  display:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(2.8rem, 7vw, 7.5rem)"
    fontWeight: 500
    lineHeight: 0.98
    letterSpacing: "-0.055em"
  body:
    fontFamily: "Mali, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.8
    letterSpacing: "normal"
rounded:
  sm: "0.65rem"
  md: "0.95rem"
  lg: "1.25rem"
  pill: "999px"
spacing:
  sm: "0.75rem"
  md: "1.2rem"
  lg: "2.4rem"
components:
  button-primary:
    backgroundColor: "{colors.legacy-leaf-dark}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "0.9rem 1.15rem"
  button-primary-disabled:
    backgroundColor: "{colors.legacy-leaf-dark}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "0.9rem 1.15rem"
  owner-chip:
    backgroundColor: "{colors.owner-chompooh-soft}"
    textColor: "{colors.owner-chompooh}"
    rounded: "{rounded.pill}"
    padding: "0.25rem 0.6rem"
---

## Overview

Verabloom is a Thai-first, mobile-first web app: a public bouquet catalog and a shared admin
area for the shop's three owners. This file documents both the **shipped** visual system in
`src/styles.css` and a **target** the shop has committed to that the code has not caught up to
yet.

**Target (not yet built):** the real Verabloom brand mark (`public/images/image.png`) is a
white circular badge with a thin pink ring, a black script wordmark, and a small pink flower
sprig — pink, black, and white. A future retheme task should move the app's palette toward this
mark. That task is out of scope here; this file only records the target so it isn't lost.

**Shipped today:** a warm cream-and-green system — `--paper` cream background, `--leaf` green
as the primary accent, `--blush` pink as a secondary accent — built on Tailwind v4 tokens plus
a large hand-written class layer for page furniture. Treat every color below labeled `legacy-*`
as what currently renders, and every color labeled with the brand names as the direction to
move toward.

## Colors

Shipped OKLCH tokens (`src/styles.css:6-48`, `:root`):

| Token | Value | Use |
|---|---|---|
| `--paper` | `#f8f4ec` | Page background |
| `--ink` | `#21372d` | Primary text |
| `--muted-ink` | `#637066` | Secondary text, captions |
| `--leaf` | `#365d49` | Primary accent (buttons, links, icons) |
| `--leaf-dark` | `#244537` | Primary button fill, active accent |
| `--blush` / `--blush-light` | `#d99a99` / `#efd0ca` | Decorative accent (logo mark, hero flower) |
| `--line` | `rgba(33,55,45,0.16)` | Hairline borders |
| `--surface` | `rgba(255,253,248,0.86)` | Translucent card surface |
| `--background` | `oklch(0.97 0.018 75)` | shadcn background layer |
| `--foreground` | `oklch(0.31 0.035 155)` | shadcn foreground layer |
| `--primary` | `oklch(0.42 0.07 154)` | shadcn primary (maps to leaf) |
| `--accent` | `oklch(0.88 0.055 28)` | shadcn accent (maps to blush) |
| `--destructive` | `oklch(0.56 0.17 25)` | Errors, delete actions |

Semantic accents are domain vocabulary, not decoration (see `CONTEXT.md` "Team member" and
"Delivery method"). They must survive any retheme with three distinguishable owners and three
distinguishable delivery methods, each with a soft background pair:

| Role | Accent | Soft background |
|---|---|---|
| Owner: Chompooh | `#b4436b` | `#fbe0e8` |
| Owner: Meen | `#2f6f9e` | `#dcecf8` |
| Owner: Kan | `#8a5a12` | `#f8ecd4` |
| Owner: unassigned | `var(--muted-ink)` | `rgba(33,55,45,0.08)` |
| Delivery: postal | `#2f6f9e` | `#dcecf8` |
| Delivery: messenger | `#a4531b` | `#fbe7d6` |
| Delivery: collection | `var(--leaf)` | `#dce9dc` |

**Target palette** from the logo: a saturated pink (close to the shipped `--blush` `#d99a99`,
but as a primary rather than a decorative accent), true black or near-black ink, and white or
near-white surfaces. A retheme should keep the pink hue family already present in `--blush`
rather than inventing a new pink, since it already reads correctly against the mark.

## Typography

Two families, loaded via Google Fonts at the top of `src/styles.css`:

- **Fraunces** (weights 500, 650) — display serif for all headings (`h1`–`h2`, brand wordmark,
  card titles). Tight letter-spacing (`-0.03em` to `-0.055em`) and tight line-height (`0.98`).
- **Mali** (weights 400, 500, 600) — body sans, Thai-capable, used for all body text, labels,
  buttons, and inputs.

Headings use a fluid `clamp()` scale (for example the hero `h1`: `clamp(3.4rem, 8vw, 7.5rem)`).
This fits the public catalog's brand-like hero and product pages well. It is a weaker fit for
admin screens, where the product register normally prefers a fixed rem scale so headings don't
shrink unpredictably inside dense admin layouts. This is a known tension, not a defect to fix
now; a future `typeset` pass should consider a tighter, fixed scale specifically for
`/admin/*` routes while keeping Fraunces + Mali and the fluid scale on the public catalog.

## Elevation

- `--shadow`: `0 24px 70px rgba(60, 66, 52, 0.12)` — the primary card/panel shadow (login card,
  welcome panel).
- A lighter ambient shadow, `0 12px 35px rgba(60, 66, 52, 0.05–0.07)`, on catalog cards and
  editor cards.
- `--line`: a 1px hairline border (`rgba(33, 55, 45, 0.16)`) used instead of shadow for most
  list rows and table containers.
- `--surface`: a translucent near-white fill (`rgba(255, 253, 248, 0.86)`) used with
  `backdrop-filter: blur(...)` on the sticky admin header (`blur(16px)`) and the login card
  (`blur(14px)`) to lift them off the page's radial-gradient background.

## Components

Two parallel systems exist today and should be treated as complementary, not competing:

1. **shadcn/ui primitives** in `src/components/ui/` — `alert`, `badge`, `button`, `card`,
   `chart`, `dialog`, `input`, `label`, `select`, `table`, `textarea`. These carry the Tailwind
   `@theme inline` tokens (`--color-primary`, `--radius-*`, etc.) and are the right place for
   any new interactive control.
2. **A hand-written class layer** in `src/styles.css` for page furniture and composed
   layouts that predate or wrap the shadcn primitives: `.editor-card`, `.orders-table`,
   `.summary-card`, `.request-card`, `.admin-product-list`, `.catalog-card`, and similar. New
   page-level layout should follow this layer's naming and spacing conventions rather than
   inventing a third system.

Notable pattern: `.orders-table` collapses into labelled stacked cards below 760px
(`src/styles.css:1443-1479`, `data-label` driven via `::before`). This is the project's
answer to "dense desktop tables must have a readable narrow-screen presentation" from
`AGENTS.md`, and is the reference implementation for any other data table added later.

Owner and delivery badges (`src/components/order-owner-badge.tsx`,
`src/components/delivery-badge.tsx`) render as pill chips (`.owner-chip`, `.delivery-chip`)
using `border: 1px solid currentColor` plus the soft background from the Colors table above.

## Do's and Don'ts

- **Do** keep the pink/black/white target in mind for any new surface, even while the shipped
  tokens are still cream and green; don't add new decoration that leans further into the
  cream-and-leaf-green direction.
- **Do** reuse the shadcn primitives in `src/components/ui/` for new controls; don't introduce
  a second component library.
- **Do** keep Thai as the default locale and English as the translated alternate for
  application-owned copy; don't translate admin-authored product names, descriptions, or
  customer-entered request details (`AGENTS.md`).
- **Do** keep the three owner accents and three delivery accents visually distinct after any
  retheme; don't collapse them toward a single brand pink.
- **Don't** use a colored `border-left`/`border-right` as a decorative accent. `.owner-field-accent`
  (`src/styles.css:497-500`) currently does exactly this — a `border-left: 4px solid currentColor`
  side-stripe — which is a known anti-pattern. It is recorded here as a defect to fix in a later
  pass, not fixed in this task.
- **Don't** add a hero-metric-tile or gradient-KPI-card pattern to the admin finance or
  dashboard screens; the `.summary-card` / `.payments-summary-cell` pattern already in
  `src/styles.css` is the project's convention for compact stat display.
