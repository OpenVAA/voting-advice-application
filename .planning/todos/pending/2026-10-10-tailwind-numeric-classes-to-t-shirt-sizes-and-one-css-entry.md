---
created: 2026-10-10T00:00:00.000Z
title: Convert numeric Tailwind classes to T-shirt sizes and reduce the CSS files to a canonical structure
area: ui / spacing scale
severity: minor
source: operator, 2026-10-10 (while answering 177-UI-SPEC.md; the spec's `gap-12` / `mt-12` became `gap-md` / `mt-md` by the same rule)
files:
  - apps/frontend/src/app.css
  - apps/frontend/src/tailwind-theme.css
---

## Problem

The frontend's spacing scale in `apps/frontend/src/app.css` (`@theme`, `--spacing-*`) declares the
same lengths under two kinds of name: numeric (`--spacing-2` … `--spacing-100`) and T-shirt (`xs` 4px,
`sm` 8px, `md` 10px, `lg` 20px, `xl` 40px, `xxl` 60px). Markup uses both — a rough count of numeric
margin, padding and gap classes in `apps/frontend/src/**/*.svelte` gives about 120 (`gap-12`,
`mt-16`, `p-24`, …; not audited, and it leaves out width, height, inset and the other spacing-fed
utilities). The operator's direction is T-shirt names only.

The T-shirt scale has no step between `md` (10px) and `lg` (20px), so 12px, 14px, 16px and 18px have
no name; 16px (1rem) is the commonest of them and is also the base style's paragraph margin.

The styles are also spread over more files than they need to be: `app.css` (474 lines) holds the
Tailwind import, the DaisyUI plugin and themes and the `@theme` block, and `tailwind-theme.css` is a
one-line `@reference "./app.css"` beside it, named only by `lib/components/video/Video.svelte`.

## Solution

1. Audit every numeric class fed by the spacing scale across the codebase (`apps/frontend/src`, and
   `apps/docs` if it shares the scale) — margin, padding, gap, space, width, height, min/max, inset,
   basis, and the same values in `@apply` and in class strings built in script.
2. Convert each to its nearest T-shirt size (12 => md, 20 => lg). Add intermediates where rounding
   would change a layout visibly: `mlg` (1rem) for certain, others as the audit shows a need.
3. Once nothing reads them, remove the numeric `--spacing-*` tokens so the numeric classes cannot
   come back; `touch` and the safe-area tokens stay.
4. Remove the CSS files that are not needed — for example merge `app.css` into `tailwind-theme.css`
   (or the reverse, whichever the Tailwind 4 and SvelteKit convention expects) — so that the
   structure is as canonical as possible. Check who imports each file first.
5. A change of 2px in many places moves pixels: run the visual gate and the phone-width specs, and
   read the pages, before and after.

Related: `2026-08-26-146-dead-font-weight-utility-classes.md` (the same `@theme` block resets
`--font-weight-*`), `2026-08-09-derive-base-shades-from-opacity-instead-of-hardcoded-hex.md`.

## Update 2026-10-11 — the nominations view's three numeric classes are converted; Phase 177's markup wrote none (Phase 177 close)

The nominations view (`…/nominations/+page.svelte`) held three numeric spacing classes at the phase's base commit, `mt-12`, `gap-12` and `mt-12`; it now holds none. The markup Phase 177 added (the editor's three steps, `EntitySelector`) writes T-shirt names only, read by a search of every `class` attribute of those files for a numeric step. The one numeric class in those files is `pl-0`, a reset to zero on a `list-none` list, for which the T-shirt scale has no name: on the view's list, where it is older than the phase, and on the details step's list of cards. The rest of the application's roughly 120 numeric classes are untouched.
