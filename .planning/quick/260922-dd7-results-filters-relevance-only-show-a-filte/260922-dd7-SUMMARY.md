---
quick_id: 260922-dd7
slug: results-filters-relevance-only-show-a-filte
type: quick
date: 2026-09-22
status: complete
subsystem: frontend/voter-results
tags: [filters, results, entity-type, relevance, tdd]
requires:
  - "@openvaa/filters Filter.getValue() value seam"
  - "voter nominationAndQuestionState tree"
provides:
  - "apps/frontend/src/lib/contexts/voter/filters/filterRelevance.ts"
affects:
  - "apps/frontend/src/lib/contexts/voter/filters/filterState.svelte.ts"
tech-stack:
  added: []
  patterns:
    - "Pure, rune-free helper module beside a $derived construction site, unit-tested without a component harness"
    - "Classify-before-reduce over Filter.getValue(), keying a Set on two structurally disjoint key families (the MISSING_VALUE object identity vs. JSON strings)"
key-files:
  created:
    - apps/frontend/src/lib/contexts/voter/filters/filterRelevance.ts
    - apps/frontend/src/lib/contexts/voter/filters/filterRelevance.test.ts
  modified:
    - apps/frontend/src/lib/contexts/voter/filters/filterState.svelte.ts
decisions:
  - "A missing answer counts as ONE distinct value shared by every non-answering target of an entity type, not one per non-answerer (operator ruling, settled before execution)."
  - "An entity's answer is its whole answer SET, canonicalised by de-duplicate + sort + JSON.stringify, so a population that all picked the same two choices counts as one value."
  - "'Did not answer' and 'answered with nothing' stay distinct, because the missing key is the MISSING_VALUE object and every answered key is a string."
  - "MIN_DISTINCT_ANSWERS = 2 is exported, so the threshold is greppable and flipping it is a one-line change."
metrics:
  duration_minutes: 33
  completed: 2026-09-22
actuals:
  tokens: 4300
  tasks: 3
  commits: 2
plan_head_before: 15c5ef68d000bb0c57f6b55dd5d4e5eeedde0ffa
---

# Quick 260922-dd7: Results filter relevance per entity type — Summary

A results filter is now offered on an entity tab only when that tab's own nominations produce two or
more distinct values for it, counting "missing" once as a value of its own — implemented as one pure
helper (`filterRelevance.ts`) plus a one-call wiring change in `filterState.svelte.ts`'s `#value`
derivation, so the reduced set reaches every downstream consumer from a single site.

## What changed

- **`filterRelevance.ts` (new).** `MIN_DISTINCT_ANSWERS = 2`, `countDistinctAnswers({filter, targets})`
  and `retainRelevantFilters({filters, targets})`. Each target contributes exactly one key to a `Set`:
  the `MISSING_VALUE` sentinel object when it has no value at all (scalar missing, or a non-empty value
  array whose every member is missing), otherwise the `JSON.stringify` of its de-duplicated, sorted
  non-missing members. The classification happens BEFORE the reduction, which is what keeps "did not
  answer" apart from "answered with nothing" (whose key is the empty-JSON-array string). A `getValue()`
  throw is classified as missing rather than propagated.
- **`filterState.svelte.ts`.** The assembled `filters` array passes through
  `retainRelevantFilters({ filters, targets: nominations })` before `new FilterGroup(...)`.
  `buildParentFilters`, its alliance guard, and the `filterable` custom-data check are untouched — this
  adds a pass, it does not replace a gate.
- **Debug logging (threat T-dd7-01).** Both `log.debug` payloads name the filter, the count and the
  threshold only. No extracted value and no target entity is ever logged.

## Task 2 — per-tab filter rows, OBSERVED not predicted

**Instrument:** a temporary `@probe` Playwright spec (`dd7FilterRelevance.probe.spec.ts`, since deleted)
registered in `_probes` with a temporary `dependencies: ['data-setup-base']`, driven through
`tests/scripts/e2e-run.sh --project _probes` so the run had a preflight-confirmed dev server scoped to
the project the harness seeds. It walked the real voter journey to `/results` and, for each entity tab,
counted the `entity-list-filter` Button and read back the `entity-filter-row` titles. The two halves are
the SAME probe against the SAME seeded `e2e/base` dataset, with `filterState.svelte.ts` reverted to
`15c5ef68d` for the before half and at its committed state for the after half; the dev server was
re-spawned fresh by the wrapper for each half, so no HMR staleness is in the measurement.

Both probe runs: 5 passed, exit 0, preflight failures 0 / successes 1.
Run dirs: `tests/e2e-runs/260922-dd7-observe-before`, `tests/e2e-runs/260922-dd7-observe-after`.

Rendered entity tabs, both halves: `["Candidates","Parties","Alliances"]`.

| Entity tab | BEFORE (rows offered) | AFTER (rows offered) | Verdict |
|---|---|---|---|
| Candidates | 3 — `Party`, `[qu-info-multipleChoiceCategorical] Info: pick multiple categories that apply.`, `[qu-info-number] Info: years of experience.` | 3 — identical, same order | UNCHANGED. `voter-journey`'s `toHaveCount(3)` and `a11y-smoke`'s `filterNumericMin` anchor both still hold. |
| Parties (organizations) | 3 — `Alliance`, `[qu-info-multipleChoiceCategorical] …`, `[qu-info-number] …` | 1 — `Alliance` | Both candidate-facing question filters DROPPED. The parent `Alliance` filter is retained, as expected and as intended — it is a working filter, not the reported bug. |
| Alliances | 2 — `[qu-info-multipleChoiceCategorical] …`, `[qu-info-number] …` | 0 — `filterButtonCount=0`, NO FILTER AFFORDANCE | Both question filters dropped, and because nothing survived, the filter **Button and Modal do not render at all** on this tab. This is the one user-visible change beyond the dialog contents. |

All four facts the plan re-derived at plan time are CONFIRMED by this observation:

1. The candidate tab is unchanged at exactly three filters (floor and ceiling both hold).
2. Both candidate-facing question filters vanish on the organizations AND alliances tabs. Neither
   survives anywhere, so the plan's stop-and-report condition did not trigger — the reported symptom
   IS fixed under the operator ruling.
3. The organizations tab retains its parent `Alliance` filter.
4. The alliances tab ends with an empty `FilterGroup`, and the whole filter affordance disappears with
   it, exactly as `EntityListWithControls.svelte`'s `{#if filterGroup?.filters.length}` gate implies.

## Task 3 — gates

Every gate's exit status was read DIRECTLY from the process, never through a pipe; output was
redirected to a file and the file read separately.

| Gate | Command | Exit | Result |
|---|---|---|---|
| Lint / typecheck / assert-* chain | `yarn lint:check` | 0 | green (includes both typecheck passes and `assert:comment-hygiene`) |
| Unit (repo root, all workspaces) | `yarn test:unit` | 0 | 25/25 turbo tasks successful; frontend 100 files / 1792 tests passed |
| Frontend typecheck (Task 1) | `yarn workspace @openvaa/frontend typecheck` | 0 | 2767 files, 0 errors, 0 warnings |
| **E2E cardinal gate** | `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/260922-dd7 --no-db-reset` | 0 | **165 passed / 0 failed / 0 flaky / 0 skipped / 0 did-not-run** |

E2E detail, from `tests/e2e-runs/260922-dd7/results.json` (the runner's own JSON, not a human-read
count): `{"expected":165,"skipped":0,"unexpected":0,"flaky":0}`; per-test status tally `{expected: 165}`.
Duration 11.1 min. Preflight: failures 0, successes 1. Run directory:
`tests/e2e-runs/260922-dd7`.

Disk was measured at 18 GiB free immediately before the run (plan floor: 15 GiB) and 15 GiB after —
above the floor throughout, no ENOSPC.

## New tests

`filterRelevance.test.ts`, 13 tests, all over REAL `@openvaa/filters` instances (a stub `getValue`
appears in exactly one test, the throw-handling case). Written and observed RED before the
implementation existed (`Failed to resolve import "./filterRelevance"`), then GREEN.

Named pins so a silent rule flip fails loudly here rather than drifting in the UI:

- `OPERATOR RULING: a missing answer counts as a distinct value, so a unanimous question with one skipper KEEPS its filter`
- `OPERATOR RULING: missing is ONE shared value, not one per non-answerer`
- `OPERATOR RULING: "did not answer" and "answered with nothing" are two different values`
- `Nobody answered at all, so the filter is dropped. This is the reported symptom, on the organizations and alliances tabs`

## Known gap — accepted and UNTESTED

The operator ruling creates one case that nothing in this repository can exercise, recorded here so a
later reader meeting it in production data finds a decision rather than a surprise:

> **An entity type that answers a filter's question PARTIALLY keeps that filter**, showing one answer
> row plus "No answer" — because "answered" and "did not answer" are two distinct values under the
> ruling. A dataset whose organizations answer a candidate-facing question for even one organization
> would therefore keep that filter on the organizations tab.

`e2e/base` fixes the reported symptom precisely because its organizations and alliances answer
**nothing** (no `answersByExternalId` on any `organizations:` or `alliances:` row), so every target on
those tabs lands on the single shared missing value. No spec in the tree carries partially-answered
non-candidate entities, so **no E2E spec can catch this path**. It was NOT manufactured into seed data
in this item, per the plan. The counter-argument — that in real data somebody always skips, so one
non-answerer anywhere resurrects a filter — was put to the operator in full and chosen against.

## Follow-up — deliberately out of scope, not missed

`/nominations` (`apps/frontend/src/routes/(voters)/nominations/+page.svelte`) builds its OWN
`FilterGroup` from `buildParentFilters` over every candidate nomination in the app. It is not
entity-type-scoped, the reported item named the Results view, and leaving it untouched kept this change
to one construction site. If the same relevance rule is wanted there, it is a second, separate wiring
of the same exported helper.

## Deviations from Plan

None — the plan executed as written. No auto-fix rule (1-4) was triggered, no authentication gate was
hit, and no package install was attempted.

Two process notes that are not deviations:

- The run directory for the cardinal gate is `tests/e2e-runs/260922-dd7` (the orchestrator's dispatch
  named this path; the plan body had written `260922-dd7-filter-relevance`). Same command, same flags.
- Task 2's observation required a temporary instrument: one probe spec plus a two-line
  `tests/playwright.config.ts` edit to register it and give `_probes` a `data-setup-base` dependency.
  Both were reverted after the measurement — the probe file deleted, the config restored with
  `git checkout HEAD --`. `git status --short` is clean of both, and neither appears in any commit.

## Commits

Measured, not narrated: `git rev-list --count 15c5ef68d..HEAD` = **2**.

| Commit | Message |
|---|---|
| `589736ea9` | `test(260922-dd7): add failing specs for per-entity-type filter relevance` |
| `356b1e81c` | `fix(voter): offer a results filter only when its entity type yields distinct values` |

`git diff --diff-filter=D --name-only 15c5ef68d..HEAD` reports no deletions.

## Self-Check: PASSED

- `apps/frontend/src/lib/contexts/voter/filters/filterRelevance.ts` — FOUND
- `apps/frontend/src/lib/contexts/voter/filters/filterRelevance.test.ts` — FOUND
- `apps/frontend/src/lib/contexts/voter/filters/filterState.svelte.ts` — FOUND, routes through `retainRelevantFilters` (line 71)
- commit `589736ea9` — FOUND in `git log`
- commit `356b1e81c` — FOUND in `git log`
- `tests/e2e-runs/260922-dd7/exit` — FOUND, contains `0`
