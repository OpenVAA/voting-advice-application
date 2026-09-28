---
phase: 260525-tea
status: complete
commit: b611aea6d
date: 2026-05-25
---

# Summary

Collapsed 26 hand-authored candidate opinion-answer blocks in
`baseV1.ts` down to 4 reusable templates (POLAR_MAX, POLAR_MIN, GENERIC,
SPECIAL). Extended POLAR_MAX/POLAR_MIN from 5 base questions to all 11
opinion questions in the dataset. Added unique `election_symbol` "2"…"30"
to 29 candidate nominations in declaration order; the 2 CA-AA-Special
nominations omit the symbol so the EntityInfo "Election number" row
renders as "—".

Tightened `voter-mega-journey.spec.ts` from soft sentinel-counting to
exact `info-item` assertions per the user-supplied screencap of Special
Candidate AA's drawer. Hoisted remaining inline regex literals into the
`TEXT_RE` const.

## Files

- `packages/dev-seed/src/templates/baseV1.ts` — POLAR_MAX/POLAR_MIN
  extended; new GENERIC template; 26 candidate `answersByExternalId`
  blocks replaced with `withInfoAnswers(<TEMPLATE>)`; 29 nominations
  gain `election_symbol` "2"…"30".
- `tests/tests/specs/voter/voter-mega-journey.spec.ts` — 5 new TEXT_RE
  entries (baseOpinion1Likert5, baseOpinion5Boolean, filtMunNeOpinion,
  polarMax, polarMin); removed dead `countSentinelHits` helper + 5 dead
  TEXT_RE sentinel buckets; replaced the soft "9-type sentinel count"
  step with two hard assertions:
  - Polar-Max drawer: `toHaveCount(13)` info-items + electionSymbol "3".
  - Special drawer: full 13-item breakdown per the screencap (exact
    labels + values, incl. `6/15/1980` for the en-US date and `—` for
    the missing electionSymbol + missing keywords).
- `tests/tests/utils/testIds.ts` — adds `voter.questions.heading` +
  `voter.results.cardTitle` (operator's prior in-flight work; bundled
  here because the new spec assertions depend on them).
- `apps/frontend/src/lib/dynamic-components/entityDetails/InfoItem.svelte`
  — `data-testid="info-item"` on the wrapper grid (operator's prior
  testid addition required by the new info-tab assertions).
- `apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte`
  — `data-testid="entity-card-title"` on the title cell (operator's
  prior testid; consumed by the prior step's `firstCardTitle` /
  `lastCardTitle` assertions).

## Matching contract verification

Voter pattern from the mega-journey walk:
- base 1–5 → polar MAX (optionIndex = n-1)
- regional + filt-mun-ne → polar MIN (default optionIndex = 0)

Distance budget:

| candidate group       | template   | base | non-base | total ≈     |
|-----------------------|------------|------|----------|-------------|
| CA-AA-1 (Polar-Max)   | POLAR_MAX  | 0    | 2·d_max  | 2·d_max     |
| CA-AA-Hidden          | POLAR_MAX  | hidden — does not appear in voter results  |
| 25 Generic            | GENERIC    | 5·m  | 2·m      | 3.5·d_max   |
| CA-BA-1 (Polar-Min)   | POLAR_MIN  | 5·d_max | 0     | 5·d_max     |
| CA-AA-Special         | partial    | partial overlap (case-a/b/c/d) — middle |

Ranking holds: `firstCard = Polar-Max`, `lastCard = Polar-Min`.

## Verification

- `npx eslint tests/tests/specs/voter/voter-mega-journey.spec.ts` — clean.
- `npx tsc --noEmit -p tests/tsconfig.json` — clean for the spec.
- `npx tsc --noEmit -p packages/dev-seed/tsconfig.json` — clean for baseV1.
- 32 pre-existing lint errors in `routes/runes-test/` (scratch dir) —
  unchanged, unrelated.
- E2E not run locally (operator runs e2e batches per session convention,
  especially under v2.10 determinism gate).

## Notes

- The "Polar-Max → first" / "Polar-Min → last" ranking now holds with
  more analytical headroom: pre-260525-tea, only the 5 base questions
  separated candidates because POLAR_MAX/MIN didn't cover the rest; now
  all 11 questions contribute, and the per-candidate distance budgets
  diverge cleanly (Polar-Max 2·d, Generic 3.5·d, Polar-Min 5·d).
- CA-AA-Special's `multipleText` (Keywords) renders as "—" in the
  screencap even though the seed has `[{en:'Tag A'},{en:'Tag B'},{en:'Tag C'}]`
  — likely a data-shape mismatch (top-level array of localized objects
  vs. localized-object-of-array). The new test asserts the screencap
  value (`—`) as-is; a future quick task can investigate and fix the
  data shape at the seed layer.
- Open follow-up for a separate task: the new TEXT_RE / info-item
  assertions all live in the `mega-journey` spec; if other voter specs
  add similar assertions, the TEXT_RE block (and the per-candidate
  template constants) are good candidates for promoting to shared
  utils.
