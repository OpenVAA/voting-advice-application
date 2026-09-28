---
quick_id: 260527-nat
description: apply TEST-INVENTORY-REFACTOR-3.md to voter-mega-journey + associated files
date_started: 2026-05-27
date_completed: 2026-05-27
status: complete
original_status: partial
status_note: "Re-stamped complete at v2.10 milestone audit (2026-06-04). T1+T2 shipped here; T3-T9 (the phase-sized voter-mega-journey REFACTOR/EDIT/ADD + fixtures + settings work) were deferred-to-phase and then SUPERSEDED by Phase 89's TIR4 refactor (TEST-INVENTORY-REFACTOR-4 replaced TIR3 — proper candidate fixture library + mega-journey + voter-mega lockstep). TIR3's remaining scope is obsolete, not outstanding. The resulting suite is green through Phase 94."
tasks_completed: 2 of 9 (T1+T2; T3-T9 superseded by Phase 89 TIR4)
deferred_tasks: 0 (7 original deferrals re-scoped into Phase 89)
final_verification: T1 filter unit tests 22/22 green + T2 baseV1 seed 135 rows OK; T3-T9 superseded by Phase 89 TIR4 (voter-mega-journey green through Phase 94)
---

# Quick task 260527-nat: TEST-INVENTORY-REFACTOR-3 (Path A — T1+T2 only)

## Scope decision (operator-driven)

The plan author originally specified 9 tasks (T1 categorical-filter fix, T2 baseV1 [ID] rename, T3 settings cardContents widening, T4 fixtures library, T5-T8 voter-mega-journey REFACTOR / EDIT / ADD steps, T9 TEXT_RE cleanup). A prior executor analysis (agent: `a7293c592ef5abf98`) flagged that the plan was phase-sized in disguise:

- **T3** needs a settings-resolution architecture spike (load-time vs seed-time `external_id` resolution; resolver placement in EntityCard render path; type widening surface for `QuestionInCardContent`). Not a quick task.
- **T4-T9** carry assertion counts (cluster #6: 5 outer org cards; cluster #8: 13 info-items + 4-row matrix; cluster #9: 2-card text filter narrowing; cluster #10: 5+2+3+13+12+0 dialog/badge assertions) that the plan itself flags as "verify against baseV1 reality at execution time" — high risk of PARTIAL/deferred placeholders mirroring Phase 88-01.

Operator chose **Path A: ship T1+T2 atomically, defer T3-T9 to a proper phase plan** with discuss-phase room for count reconciliation and an architecture spike for T3.

## What landed

| Task | Commit       | One-liner                                                                                              |
| ---- | ------------ | ------------------------------------------------------------------------------------------------------ |
| T1   | `caf6ee931`  | Categorical entity filter: `No answer` selectable + empty selection = 0 results + library-level distinction between `include=undefined` (inactive) and `include=[]` (active, allow none) |
| T2   | `accfba54f`  | baseV1 `[<id-token>] desc` rename across all 45 fixed-row `name: { en: ... }` entries; opt-a → `[qg-opin-opt-a-NotSelected]`; opt-b → `[qg-opin-opt-b-Skipped]` |

### T1 details — `caf6ee931`

**Defects fixed (three distinct symptoms in one cluster):**

1. **`isMissing(isMissing)` typo** at `EnumeratedEntityFilter.svelte:~104` — the
   argument was the `isMissing` function reference (never missing-equal), so
   the `MISSING_VALUE` sentinel was never substituted into `<input value=...>`
   for the "No answer" row. The row's checkbox couldn't be toggled from the
   DOM. Fixed to `isMissing(v)`.

2. **Auto-select-all on filter-inactive mount** — `updateSelected()` initialized
   `selected = values.map(v => v.value)` whenever `filter.include` was undefined
   (the inactive baseline). Every box appeared checked, hiding the "No answer"
   affordance and making "deliberate empty selection" impossible to express.
   Now `selected` initializes to `[]` and only mirrors a non-empty
   `filter.include`.

3. **`include=[]` collapsed into `include=undefined`** — the filter library's
   `EnumeratedFilter.testValue/testValues` checked `include?.length &&
   !include.includes(value)`, which treats a defined-but-empty include as
   "filter inactive" (all pass). The scope doc wanted defined-empty = 0
   results. Library changes:
   - `EnumeratedFilter.set include` bypasses the `setRule`/`matchRules`
     optimization for the undefined-vs-empty distinction (these matched on
     `ruleIsActive`, which collapses both states).
   - `EnumeratedFilter.testValue/testValues` now check `include !== undefined`
     rather than `include?.length`.
   - `EnumeratedFilter.get active` overridden so a defined-but-empty include
     registers as active (drives the filter-button-badge correctly).

**Component disambiguation:** introduced a `userActivated` `$state` flag in
`EnumeratedEntityFilter.svelte` to distinguish "mount baseline before any user
interaction" from "user explicitly selected nothing." The `$effect` writes
`filter.include = undefined` until `userActivated` flips (on checkbox change
OR `toggleSelectAll()`), then writes `[]` or the allow-list as appropriate.
This prevents an immediate "0 results everywhere" flash on dialog mount.

**Unit test added** in `packages/filters/tests/filter.test.ts`:
`ChoiceQuestionFilter: TIR3 empty-include semantics` — exercises the three
states explicitly: `include = undefined` → all entities; `include = []` →
0 matches + filter.active === true; `include = [MISSING_VALUE]` → only
missing-answer entities; reset back to undefined → all entities.

**Verification:**
- `cd packages/filters && yarn exec vitest run` → 22 tests passed (was 21
  + the new TIR3 test).
- `yarn build --filter=@openvaa/filters` → clean (cached `>>> FULL TURBO`
  after one source rebuild).
- `svelte-check` reports no errors in `EnumeratedEntityFilter.svelte` (the
  159 pre-existing errors across the frontend project are in unrelated
  `runes-test/*` scratch pages — see "Pre-existing breakage" below).

### T2 details — `accfba54f`

Applied the `[<id-token>] <desc>` naming convention from `packages/dev-seed/src/templates/permutations/perm-1e1cg1co.ts` to every fixed-row `name: { en: ... }` entry in `baseV1.ts`. The token is the bare `external_id` minus the `test-` prefix:

| External ID                       | New name                                                                |
| --------------------------------- | ----------------------------------------------------------------------- |
| `test-el-reg`                     | `[el-reg] Regional Election`                                             |
| `test-el-mun`                     | `[el-mun] Municipal Election`                                            |
| `test-cg-reg`                     | `[cg-reg] Regions`                                                       |
| `test-cg-mun`                     | `[cg-mun] Municipalities`                                                |
| `test-co-reg-{n,s}`               | `[co-reg-{n,s}] Region {North,South}`                                    |
| `test-co-mun-{ne,nw,se,sw}`       | `[co-mun-{...}] Municipality {...}`                                      |
| `test-or-{aa,ab,ba,bb,c}`         | `[or-{...}] Party {AA,AB,BA,BB - Best-Regional-Party,C}`                 |
| `test-al-{a,b}`                   | `[al-{a,b}] Alliance {A,B}`                                              |
| `test-qg-info`                    | `[qg-info] Info Questions`                                               |
| `test-qg-opin-base`               | `[qg-opin-base] Base Opinion Questions`                                  |
| **`test-qg-opin-opt-a`**          | **`[qg-opin-opt-a-NotSelected] Optional Opinion Questions A`**           |
| **`test-qg-opin-opt-b`**          | **`[qg-opin-opt-b-Skipped] Optional Opinion Questions B`**               |
| `test-qg-opin-{el-reg,co-mun-se-sw,filt-a,filt-b}` | bracketed + verbatim desc                               |
| all 9 `test-qu-info-*` questions  | bracketed + verbatim desc                                                |
| all 11 `test-qu-opin-*` and `test-qu-open-filt-*` questions | bracketed + verbatim desc                       |

**Totals:** 45 `name: { en: ... }` rows updated. `short_name`, `external_id`, and all functional fields untouched.

**Skipped (per plan):**
- `candidates.fixed[]` — no `name` field; rendered from `first_name`/`last_name`.
- `nominations.fixed[]` — no `name` field at all.
- Constants `DEFAULT_INFO_ANSWERS`, `POLAR_MAX`, `NEAR_MAX`, `POLAR_MIN`, `GENERIC`, `SPECIAL` — not name-bearing rows.

**Pre-baseline preserved:** `27ef8f998`'s edits remain intact — Party BB's "- Best-Regional-Party" suffix is preserved (now `[or-bb] Party BB - Best-Regional-Party`); opt-a/opt-b `external_id` renames untouched; NEAR_MAX answer block, Polar-Max / Generic candidate reassignment, partial-answer arrangement on CA-AA-Special all untouched.

**Verification:**
- `cd packages/dev-seed && yarn exec tsc --noEmit` → clean.
- `yarn db:reset && yarn db:seed --template baseV1` → succeeded with 135 rows (`2 elections + 6 constituencies + 5 orgs + 2 alliances + 8 categories + 20 questions + 29 candidates + 60 nominations + 1 app_settings + 2 cg`).
- Required a Supabase storage-bucket recreate (`supabase db reset`) before the seed succeeded — storage container had a transient 502 from a prior session; not related to T2 changes. Documented for future executors hitting the same.

## What's deferred (T3-T9) — recommended phase scope

For a follow-up phase (suggested: a new plan under Phase 88 — e.g. `88-04-tir3-fixtures-and-spec-refactor`):

1. **T3 — `cardContents.candidate` accepts `{question: <external_id>}`.**
   Requires a settings-resolution architecture spike: where does `external_id` → DB
   `question` resolution land? Two viable strategies (load-time in
   frontend; seed-time in dev-seed Writer). Plan recommended (A) load-time
   resolver at `EntityCard` consumer site, but the actual resolver hook and
   the type widening shape of `QuestionInCardContent` need a discuss-phase
   ADR. Touches `packages/app-shared/src/settings/dynamicSettings.type.ts`,
   `apps/frontend/src/lib/dynamic-components/entityCard/` (location TBD),
   `packages/dev-seed/src/templates/baseV1.ts:204` (the wiring line).
2. **T4 — Fixtures library** (`tests/tests/fixtures/results.fixture.ts`,
   `entityFilters.fixture.ts`, `entityDetails.fixture.ts`, plus `index.ts`
   composition + raw-testid promotion to `tests/tests/utils/testIds.ts`).
   Pure scaffolding; depends on grep'ing the actual DOM testids in the
   frontend at execution time (the plan calls out `score-gauge`,
   `election-symbol`, `entity-list-filter-badge` as "grep to find actual
   testid; ADD it to the frontend component if missing"). High risk of
   sprawling into a frontend testid sweep.
3. **T5 — EDIT `result-card-contents` step** — refactor to fixtures, swap
   `import { test, expect } from '@playwright/test'` → `from '../../fixtures'`,
   assert `test-qu-info-text` answer text + 4 score gauges + election
   symbol "10" on first candidate, REMOVE the parties-tab assertion block.
   Depends on T4.
4. **T6 — REMOVE 5 redundant steps** + delete 7 module-scope helpers in
   `voter-mega-journey.spec.ts`. The plan lists exact line ranges, but
   those will have drifted; a deduplication grep over step titles is
   needed at execution time. Depends on T5 (import swap landed).
5. **T7 — REFACTOR `9.6.5-8 voter-vs-entity matrix` step + party-drawer
   step.** Renames + fixture migration; preserves 13 info-item assertions
   + 4-row matrix verbatim. Member-count assertion (`5` per scope doc) needs
   reconciliation against the actual Party AA membership at seed time
   (likely 7 AA candidates of which CA-AA-Hidden is hidden + show-all
   filter active → 5; plan flags this for execution-time verification).
6. **T8 — ADD 3 steps**: `matching: organisations` (cluster #6),
   `filters: text` (cluster #9), `filters: dialog` (cluster #10). Assertion
   counts are heavy: 5 outer cards + Party BB 2 children + Party AA 3+5
   show-all/collapse contract + 13-line dialog assertion choreography
   including badge counts and filter-button hide/show. The numeric counts
   (5/2/3/5/3/2 outer cards + filter dropdown counts 3/2 + result counts
   1/13/12/1/0) are all "verify against baseV1 reality at execution time"
   per the plan — pre-flight check needed.
7. **T9 — TEXT_RE cleanup** in `voter-mega-journey.spec.ts`. Remove the
   module-scope `TEXT_RE` constant block (or trim entries that became
   stale after T2's category renames). The remaining inline regex literals
   should be tightened to either include the new `[<id>]` prefix OR drop
   the category-name probes entirely in favour of fixture-driven testid
   queries.

## Expected breakage in voter-mega-journey

The voter-mega-journey spec (`tests/tests/specs/voter/voter-mega-journey.spec.ts`) references baseV1 category descs via the module-scope `TEXT_RE` constants:

- `TEXT_RE.optionalOpinionsA` — was a substring probe of "Optional Opinion Questions A"; the new name is `[qg-opin-opt-a-NotSelected] Optional Opinion Questions A`. Case-insensitive substring probes against the old text MAY still match (the suffix is unchanged), but exact-name probes won't.
- `TEXT_RE.optionalOpinionsB` — same shape; new name `[qg-opin-opt-b-Skipped] Optional Opinion Questions B`.
- `TEXT_RE.baseOpinion`, `baseOpinion1Likert5`, `baseOpinion5Boolean` — probe Base-category descs which are now `[qg-opin-base] Base Opinion Questions`, `[qu-opin-base-1-likert5] Base opinion 1 — Likert 5.`, etc. Substring probes likely still match (the post-bracket suffix matches verbatim), but the regex anchors may not.
- `regionalOpinionsCategory`, `regionallyFilteredCategory`, `regionalOpinionsQuestion`, `filtMunNeOpinion` — same risk profile.

The full spec was NOT re-run as part of T2 — that's T5-T9 territory. Operator MUST budget for green-cycle work in the follow-up phase: each step that reads category/question names from the DOM will need either (a) a fixture-driven testid query that ignores the desc text, or (b) a TEXT_RE update that includes the new `[<id>]` bracket prefix.

## Pre-existing breakage (out of scope)

- **159 svelte-check errors** in the frontend project, almost entirely in `apps/frontend/src/routes/runes-test/**/+page.svelte` scratch pages (invalid `<ol>` nesting inside `<p>`, `state_referenced_locally` warnings on mock-route components). These predate T1 and were already present at session start (likely from the WIP commits `b315f29e6` / `1f010d5d8`). Not touched.
- **`yarn build --filter=@openvaa/frontend` fails** on the same `runes-test/nav-a11y/+page.svelte:19` `</p>` autoclose error. Pre-existing.
- **Supabase storage container 502** observed on first `yarn db:seed --template baseV1` invocation after this session's prior `yarn db:reset`. Fixed by `yarn db:down` + `supabase start` + `supabase db reset` chain. Environmental — not related to T1 or T2.

## Follow-up recommendation

1. Operator runs `/gsd:plan-phase` (or equivalent) to spin up a proper phase plan
   (probably `88-04-tir3-fixtures-and-spec-refactor`) consuming T3-T9. The
   plan-phase MUST include:
   - A discuss-phase room for T3 settings-resolution architecture (load-time
     vs seed-time `external_id` resolution).
   - A research-phase pass for T4-T8 to grep the actual baseV1 row counts,
     DOM testids (`score-gauge`, `election-symbol`, `entity-list-filter-badge`),
     and party-membership numbers BEFORE the executor wave starts. This avoids
     PARTIAL placeholders in spec assertion counts.
   - A T9 cleanup task that runs LAST to drop or update `TEXT_RE` based on
     what the T5-T8 work actually needs.
2. The base contract this quick task established (T1's filter semantics +
   T2's `[<id>] desc` convention) is stable and ready for downstream consumers.
3. Recommended phase wave order:
   - Wave 1: T3 (architecture; ADR + types + frontend resolver + baseV1 wiring; atomic).
   - Wave 2: T4 (fixtures library — depends on T3 because some fixtures will read the new cardContents shape).
   - Wave 3: T5, T6, T7, T8 (spec migrations — parallel-safe within the spec file IF git's hunk-merge can keep up; otherwise serial in this order).
   - Wave 4: T9 (TEXT_RE cleanup — depends on T5-T8 to know which entries are still referenced).
   - Wave 5: full `voter-mega-journey` project run as integration gate.

## Self-Check: PASSED

**Files claimed exist:**
- `apps/frontend/src/lib/components/entityFilters/enumerated/EnumeratedEntityFilter.svelte` — FOUND
- `packages/filters/src/filter/enumerated/enumeratedFilter.ts` — FOUND
- `packages/filters/tests/filter.test.ts` — FOUND
- `packages/dev-seed/src/templates/baseV1.ts` — FOUND

**Commits claimed exist:**
- `caf6ee931` (T1) — FOUND in `git log --oneline -5`
- `accfba54f` (T2) — FOUND in `git log --oneline -5`

**Verification commands run + green:**
- `cd packages/filters && yarn exec vitest run` — 22/22 PASSED
- `cd packages/dev-seed && yarn exec tsc --noEmit` — clean
- `yarn db:reset && yarn db:seed --template baseV1` — 135 rows seeded OK

**Out-of-scope NOT touched:**
- `tests/tests/specs/voter/voter-mega-journey.spec.ts` — UNCHANGED (T5-T9 own this; deferred)
- `tests/tests/fixtures/*` — UNCHANGED (T4 owns; deferred)
- `tests/tests/utils/testIds.ts` — UNCHANGED (T4 owns; deferred)
- `packages/app-shared/src/settings/dynamicSettings.type.ts` — UNCHANGED (T3 owns; deferred)
- `apps/frontend/src/lib/dynamic-components/entityCard/` — UNCHANGED (T3 owns; deferred)
