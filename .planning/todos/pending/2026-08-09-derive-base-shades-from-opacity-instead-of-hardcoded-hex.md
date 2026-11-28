---
created: 2026-08-09T00:00:00.000Z
title: Derive base-200/300 (and similar shades) from opacity instead of hard-coded hex
area: ui
scope: next-milestone (post-v2.14)
priority: low
files:
  - packages/app-shared/src/settings/staticSettings.ts (colors.light / colors.dark)
  - packages/app-shared/src/settings/staticSettings.type.ts (Colors type)
  - apps/frontend/tailwind.config.* + DaisyUI theme wiring (consumers of the colors object)
---

## Problem

The theme palette in `packages/app-shared/src/settings/staticSettings.ts:17-40` hard-codes every
shade as an independent hex value, per theme:

```
light: 'base-100': '#ffffff', 'base-200': '#e8f5f6', 'base-300': '#d1ebee', 'line-color': '#d9d9d9'
dark:  'base-100': '#000000', 'base-200': '#101212', 'base-300': '#1f2324', 'line-color': '#262626'
```

Consequences:
- **Manual re-derivation on rebrand.** Changing the brand/base hue means hand-picking 3+ new hex
  values per theme and eyeballing that the steps stay perceptually even — the relationship between
  `base-100` → `base-200` → `base-300` is implicit and undocumented.
- **Light/dark drift.** Nothing enforces that the dark ladder mirrors the light ladder's step size,
  so contrast can silently diverge between themes (a WCAG 2.1 AA risk, per the project's a11y bar).
- **No single source of truth.** `line-color` is likewise a standalone hex rather than an expressed
  relationship to the base/neutral colours.

## Solution

TBD — capture only. Direction to evaluate:

- Express derived shades as **opacity / mix over the base** rather than literal hex, e.g.
  `base-200 = color-mix(in oklch, <tint>, base-100 <n>%)`, so one base + one tint + a step scale
  generates the whole ladder for both themes.
- Decide the mechanism: (a) compute at build time in `staticSettings.ts` (keeps the emitted values
  concrete hex, so DaisyUI/Tailwind consumers are unchanged), or (b) emit CSS custom properties using
  `color-mix()` / relative-colour syntax and let the browser compute (needs a baseline-support check
  against the project's supported browsers).
- Prefer a perceptual space (**oklch**) over sRGB so steps stay even across hues.
- Watch the alpha-vs-opaque distinction: true `rgba()` alpha lets underlying content bleed through
  (breaks on stacked/overlaid surfaces); a *mix* against `base-100` yields an opaque colour and is
  usually what's wanted for surface shades.
- Verify contrast ratios (AA) for both themes after the change — the a11y gate is non-negotiable here.
- Check every consumer of the `colors` object (Tailwind/DaisyUI theme config, any direct
  `staticSettings.colors` reads) still receives the shape its type declares.
