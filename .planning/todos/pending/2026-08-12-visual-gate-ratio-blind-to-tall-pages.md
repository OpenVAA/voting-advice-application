---
created: 2026-08-12
source: Phase 136 post-verification discrimination control
resolves_phase: null
severity: medium
area: E2E / visual regression
---

# `maxDiffPixelRatio` makes the visual gate blinder as pages get taller

## Measured, not theorised

An injected type-scale regression (`MatchScore.svelte:30`, `text-lg` → `text-2xl` — changes every
match score in the results list) was run against the repaired visual gate in the CI-matching
container. Tolerance zeroed purely to measure:

| Baseline | Dimensions | 1% tolerance | Measured diff | Shipped verdict |
|---|---|---|---|---|
| `voter-results-desktop` | 1280×3684 | 47,155 px | **19,484 px (0.41%)** | **PASSES — missed** |
| `voter-results-mobile` | 390×4152 | 16,192 px | 19,545 px (1.21%) | FAILS — caught |

Near-identical absolute damage. Caught on one baseline, missed on the other, purely because the
desktop page is 2.9× larger in area and dilutes the ratio.

## Why it matters

`maxDiffPixelRatio: 0.01` (`tests/playwright.config.ts:112`) is a **proportional** budget applied to
**full-page** screenshots of unbounded height. So the tolerance is a function of page length: a
results page that grows more rows silently raises its own threshold. The gate gets weaker exactly as
the surface it guards gets bigger.

The gate does discriminate — proven, see `136-VISUAL-DISCRIMINATION-EVIDENCE.md` — but "the visual
job would catch a UI regression" is true for some baselines and false for others, and nothing
currently says which.

## Options

- **A — add an absolute cap.** `maxDiffPixels` alongside the ratio, so the budget stops scaling with
  page height. Smallest change; needs a number chosen against observed run-to-run noise (which is
  **0 px** on the candidate-preview pair, so the floor could be genuinely tight).
- **B — bound the captured area.** Element-scoped or clipped screenshots instead of `fullPage`, so
  each baseline covers a fixed region. Bigger change, needs re-baselining, but removes the coupling
  entirely.
- **C — accept and document.** Record that the desktop results baseline is a layout-level guard only,
  not a component-level one.

## Prerequisite

Any of A or B requires re-baselining in `mcr.microsoft.com/playwright:v1.58.2-noble`,
`--platform linux/amd64` — never on a developer Mac. Recipe in `visual-regression.spec.ts`'s
docblock plus D-136-06-2 (the dev server must bind `0.0.0.0`, not loopback).

## Related

- `.planning/phases/136-real-guards-visual-repair-sweep-remediation/136-VISUAL-DISCRIMINATION-EVIDENCE.md`
- `VERIFICATION.md` `behavior_unverified_items[0]` — the item this control was run to close
- D-136-05-2 — the `fonts.googleapis.com` egress dependency in the same gate
