---
created: 2026-09-21T15:05:41.168Z
title: Refactor number opinion input layout
area: ui
severity: minor
files:
  - apps/frontend/src/lib/components/questions/NumberScaleInput.svelte (answer mode: the `flex items-center justify-between` value row and the `range range-primary w-full` input below it; display mode has its own copy of the same track at the `pt-24` marker block)
  - apps/frontend/src/lib/components/questions/NumberScaleInput.type.ts
  - apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte (the only caller; gates on `question.isMatchable`)
---

## Problem

Flagged as a **priority** item by the operator during v2.15 UAT — severity is recorded as `minor`
because nothing is broken, but the priority is higher than that tag alone suggests.

The number-question answering input (`NumberScaleInput`, a native `<input type="range">` styled with
DaisyUI `range range-primary`) has two layout problems:

1. **The track is too thick.** It renders at DaisyUI's default `range` height, which is visually
   heavy next to the rest of the question card and reads as the dominant element on the page rather
   than as one input among several.
2. **The current value is presented awkwardly.** It sits in a three-up flex row *above* the track —
   `{min}` left, the live value centred, `{max}` right — so the number does not travel with the
   thumb. During a drag the eye has to jump between a moving thumb and a static centred label, and
   at either extreme the value label crowds the min/max labels. The value is emphasised only by
   `text-primary` + `font-bold` once `isSet` is true.

## Solution

TBD — the *what* is settled (thinner bar, different current-value treatment) but the *how* is a
design decision, so this wants a `/gsd-ui-phase` or a sketch pass before implementation.

Shape of the work, and the constraints any design has to respect:

- **Keep the native `<input type="range">`.** The component comment records this as a deliberate
  choice: keyboard-arrow exact stepping (ArrowUp/Right +1, ArrowDown/Left −1, Home→min, End→max)
  comes for free, and values at exactly `min`/`max` stay reachable. A custom-div slider would put
  that back on us, along with the WCAG 2.1 AA obligations.
- **Candidate value treatments:** a bubble or tick that tracks the thumb (the `voterPct`/`otherPct`
  percentage-offset helper already in the file does exactly this positioning for display mode's
  markers, so the mechanism exists and can be reused), or the value inline in the question's own
  label, or a value that only appears while dragging.
- **Track thinning:** DaisyUI's `range` sizing plus the existing `--range-bg` custom property the
  component already sets (`onShadedBg ? base-200 : base-100`). A thinner track must not shrink the
  *hit target* — the thumb needs to stay ≥ 24×24 CSS px for WCAG 2.5.8 / pointer accessibility even
  if the bar behind it gets thinner.
- **Two render paths, one change.** `display` mode (the read-only dual-marker view reused by
  `EntityOpinions`) carries its own copy of the track and min/max row. Whatever the answer mode
  gets, display mode has to stay visually consistent with it.
- **Pinned by tests, and more load-bearing than it looks.** Both ids are registered in
  `tests/tests/utils/testIds.ts` (`numberSlider`, `numberValue`), and
  `tests/tests/fixtures/voter/voter-journey.fixture.ts` uses `question-number-slider` as a
  **loop-entry surface probe**: a number question renders no `question-choice` nodes, so without
  that probe the entry wait can only match while the *outgoing* question's options are still
  mounted, which is the page-reuse DOM-lag race the fixture's comment documents (it previously
  burned a measured 10 002 ms — 38% of that fixture's runtime). The same fixture answers number
  questions **by keyboard** (`Home` to land on `min`, then `ArrowRight` × (value − min)), and
  `entityDetails.fixture.ts` reads the disabled slider's `value` attribute as the authoritative
  numeric in display mode. So: keep the ids on whatever elements carry those roles, keep the native
  keyboard contract intact, and keep display mode's slider exposing its value as an attribute. A
  renamed testid with a green suite means the specs stopped looking.
