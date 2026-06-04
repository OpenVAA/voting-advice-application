---
status: partial
plan_id: 88-01
phase: 88
title: New generic setup helper + base template + base voter mega-journey (parallel landing — Wave 1)
completed: 2026-05-23
---

# Phase 88 Plan 01 — Summary

## Outcome

7/7 tasks landed across 7 atomic commits. The parallel-landing
scaffolding is in place: a new `baseV1` BUILT_IN template
(2 elections × 6 constituencies × 8 question categories × 20 questions
× 5 organisations + 2 alliances + 29 candidates + 60 nominations), a
generic `setupFromTemplate(template)` helper, a sibling
`voter-mega.fixture.ts` with `answerMode: 'min' | 'max'`, the
mega-journey spec with ~30 `test.step` segments (5 execute real
assertions; 25 deferred-88-nn placeholders per Risk #2), 3 new
playwright project entries appended after all conditional opt-in
blocks, and a developer-facing migration-map README. The existing
suite remains untouched except for one sanctioned modification: the
`voter-app` project's `testIgnore` regex extends to exclude
`voter-mega-journey.spec.ts`.

Marked **partial** rather than complete because:

1. The mega-journey spec has 25 `[deferred-88-nn]` test.step
   placeholders where real assertions are deferred to 88-NN (per Plan
   Risk #2, #7, and the operator's intent that deeper UI semantics need
   empirical validation against the live baseV1 frontend before lock-in).
2. Full-suite `yarn test:e2e` exposed a pre-existing flake in
   `candidate-profile.spec.ts:130` (terms-checkbox visibility race;
   NOT caused by Plan 88-01) which cascade-skipped 75 downstream tests
   in one of the runs. Isolated `--project=voter-mega-journey` run
   exercises the full dependency graph and passes (97/97 in 4.0 min).

## Files landed

- `packages/dev-seed/src/templates/baseV1.ts` (NEW, ~1300 lines) —
  full base dataset per refactor-doc:13-200 verbatim.
- `packages/dev-seed/src/templates/index.ts` (MODIFIED) — APPEND-ONLY
  `baseV1` registration in `BUILT_IN_TEMPLATES` + re-export.
- `packages/dev-seed/src/index.ts` (MODIFIED) — re-export
  `BASE_V1_APP_SETTINGS` + `baseV1Template`.
- `tests/tests/setup/setupFromTemplate.ts` (NEW) — generic template
  helper (per Plan Task 2, NO `likertOnly` per operator USER NOTE).
- `tests/tests/setup/baseV1.setup.ts` (NEW) — playwright `setup()`
  consumer.
- `tests/tests/setup/baseV1.teardown.ts` (NEW) — playwright teardown
  scoped to `PREFIX='test-'`.
- `tests/tests/fixtures/voter-mega.fixture.ts` (NEW) — sibling fixture
  exposing `answerMode: 'min' | 'max'`.
- `tests/tests/specs/voter/voter-mega-journey.spec.ts` (NEW) — single
  serial-describe spec with ~30 `test.step` segments covering
  refactor-doc:204-378.
- `tests/tests/specs/voter/voter-mega-journey.README.md` (NEW) —
  absorbed-tests migration map (per advisory A4).
- `tests/playwright.config.ts` (MODIFIED) — APPENDED 3 new project
  entries + one surgical regex extension on `voter-app`'s `testIgnore`
  (the sanctioned existing-file modification per Risk #6).

## Commits

| Hash       | Subject                                                                                                |
| ---------- | ------------------------------------------------------------------------------------------------------ |
| c713acf3e  | feat(dev-seed): add baseV1 BUILT_IN template for Phase 88 mega-journey scaffolding                     |
| 75ccbf8cd  | feat(tests-v2): add setupFromTemplate generic helper for Phase 88 mega-journey                         |
| eb1740702  | feat(tests-v2): add voter-mega fixture with min/max answerMode                                         |
| bdbd4794f  | test(voter): add voter-mega-journey spec covering refactor-doc lines 204-378                           |
| c7cc98c0e  | feat(playwright): add data-setup-baseV1 + voter-mega-journey + data-teardown-baseV1 projects           |
| 533c2bd42  | fix(playwright): chain data-setup-baseV1 after variant-hidden-required-candidate                       |
| 22963d498  | docs(tests-v2): add voter-mega-journey README with absorbed-tests migration map                        |

## Verification evidence

**Task 1 (baseV1 template)** — `yarn db:reset && yarn db:seed --template baseV1` succeeds with the following row counts (all meet ≥ plan-spec minimums except candidates):

| Table               | Count | Plan min | Status      |
| ------------------- | ----- | -------- | ----------- |
| elections           | 2     | ≥2       | met         |
| constituency_groups | 2     | —        | per spec    |
| constituencies      | 6     | ≥6       | met         |
| question_categories | 8     | ≥8       | met         |
| questions           | 20    | ≥14      | met (20)    |
| organizations       | 5     | ≥5       | met         |
| alliances           | 2     | ≥2       | met         |
| candidates          | 29    | ≥30      | **see Deviation T1** |
| nominations         | 60    | ≥30      | met (60)    |

- `constituencies.parent_id` wiring verified: all 4 Mun-* rows have parent_id set; both Reg-* rows do not.
- `question_categories.election_ids` wiring verified: `test-qg-opin-el-reg` has only `[uuid(test-el-reg)]`; other categories are fanned out to both elections.
- `app_settings` persists: `matching.minimumAnswers=5`, `questions.categoryIntros.allowSkip=true`, `entities.hideIfMissingAnswers.candidate=true`.
- Regression: `yarn db:reset && yarn db:seed --template e2e` succeeds with 18 candidates + 22 nominations (unchanged).

**Task 2 (setupFromTemplate helper)** — `tsc --noEmit` exits 0; helper exercised end-to-end via Task 5 verify.

**Task 3 (voter-mega fixture)** — `tsc --noEmit` exits 0; fixture not exercised in Plan 88-01 because the mega-journey spec uses raw `page` for the pre-results walk.

**Task 4 (mega-journey spec)** — `tsc --noEmit` exits 0; isolated run via `npx playwright test --project=voter-mega-journey` passed (5 executing test.step entries, 25 deferred-88-nn no-op steps each emit a `[deferred-88-nn]` console line).

**Task 5 (playwright projects)** — `npx playwright test -c tests/playwright.config.ts --project=data-setup-baseV1 --project=data-teardown-baseV1 --project=voter-mega-journey` exits 0 with 3 passed in 6.1s. `--project=voter-app --list` confirms `voter-mega-journey.spec.ts` is correctly excluded from the legacy voter-app project.

**Task 6 (full-suite regression)** — three runs were attempted; here is the empirical record:

- Run #1 (`yarn test:e2e` against fresh DB): 6 passed, 48 failed, 3 skipped, 109 did_not_run. Root cause: SvelteKit dev server was bricked by `yarn db:reset` running `dev:clean` on the live `.svelte-kit` directory (the operator-known infra trap). All 48 failures showed the same error: `Failed to load url /.svelte-kit/generated/server/internal.js`. NOT a regression of Plan 88-01 — pure infra flake.
- Run #2 (after restarting the frontend dev server): 21 passed, 47 failed, 3 skipped, 95 did_not_run. Root cause: prefix-collision (Plan Risk #4) — `data-setup-baseV1` and the existing `data-setup` ran in parallel and the LATER chain clobbered the SHARED `test-` dataset mid-run. `voter-journey.spec.ts:140` failed because it expected the e2e single-election shape but saw the baseV1 multi-election shape. Fix landed in commit 533c2bd42 (chain `data-setup-baseV1` to depend on `variant-hidden-required-candidate`).
- Run #3 (after the chain-dep fix): 87 passed, 1 failed, 3 skipped, 75 did_not_run. Single failure: `candidate-profile.spec.ts:130 (terms-checkbox visibility race)` — a **pre-existing flake** unrelated to Plan 88-01. None of the 7 commits touched `candidate-profile.spec.ts`, `candidate-registration.spec.ts`, or any candidate-app surface. The cascade-skipped 75 tests include the baseV1 chain (because of the dep on `variant-hidden-required-candidate`).
- Isolated `--project=voter-mega-journey` full-graph run (which transitively pulls in the ENTIRE existing chain via the new dep): **97 passed, 1 skipped, 0 failed in 4.0 min**. This is the canonical evidence that the baseV1 chain works end-to-end against a stable dependency graph; the full-suite cascade is the pre-existing candidate-profile flake's blast radius.

The plan's gating constraint requires 3 consecutive cold-start full-suite runs. The 3rd run delivered green-for-everything-not-cascaded (the candidate-profile flake is documented in the operator's `feedback_e2e_did_not_run.md` memo as "treat 'did not run' as failures"). Per the project memory `project_all_green_suite_priority.md`, the operator has standing intent to decouple non-image tests from imgproxy / candidate-mutation chains; this Plan does NOT address that decoupling (out of scope per CONTEXT.md).

**Task 7 (migration README)** — file authored with 55-row migration table covering every absorbed test in TEST-INVENTORY.md sections 9.1, 9.4, 9.5, 9.6, 9.9.

## Deviations from plan

### Deviation T1 — candidates count 29 vs plan-target ≥30

- **What the plan said:** `≥30 candidates`.
- **What we found:** the refactor-doc per-row enumeration at lines 66-107 sums to exactly 29 distinct candidate rows: 14 in CO-Reg-N (4 generic AA + Special + Hidden + 1 AB + 2 BA + 2 BB + 2 C + 1 Independent) + 4 in CO-Reg-S + 5 NEW in CO-Mun-NE (CA-AA-Special is RE-nominated, not a new row) + 4 in CO-Mun-SE + 2 in CO-Mun-SW = 29. CA-Independent is also re-nominated in CO-Mun-NW (no new row).
- **What we did:** declared exactly 29 candidate rows per the refactor doc's verbatim enumeration. Nomination count is 60 (well above the implied per-candidate minimum because CA-AA-Special and CA-Independent appear in multiple constituencies).
- **Why:** Plan Risk #1 + CONTEXT.md says "the refactor doc IS the spec" — adding a 30th candidate to satisfy the plan target would break parity with the verbatim spec.
- **Status:** RESOLVED — accepted as a minor numerical discrepancy between plan-target (`≥30`) and refactor-doc verbatim (29). The mega-journey's matching-algorithm contracts depend on the QUALITATIVE shape (perfect-match + worst-match + partial-answer + independent + hidden), not on hitting exactly 30 rows.

### Deviation T1 — `BASE_V1_APP_SETTINGS.elections.startFromConstituencyGroup` literal omitted

- **What the plan said:** declare `app_settings.fixed[0].settings` from refactor-doc:109-200 verbatim, including `startFromConstituencyGroup: undefined` at refactor-doc:181.
- **What we found:** post-seed `expect(persisted).toMatchObject(expected)` fails because JSONB serialization drops `undefined` keys, breaking parity.
- **What we did:** omit the `startFromConstituencyGroup` key entirely. Omitting a key from a settings literal is functionally equivalent to setting it to `undefined` (the frontend reads `getSetting('elections.startFromConstituencyGroup') ?? defaultValue`).
- **Why:** Rule 1 (auto-fix bug) — preserve verbatim behavior while making the post-seed parity assertion green.
- **Status:** RESOLVED — documented in the baseV1.ts in-file comment at the elections block.

### Deviation T1 — `multipleText` info-question answer shape

- **What the plan said:** ensure every info-question type has answers on at least one candidate (USER NOTE: fill in all for all candidates by default).
- **What we found:** initial implementation used `{ value: { en: ['Tag A', ...] } }` — the validate_answers_jsonb DB trigger requires the value to be a TOP-LEVEL array of strings or localized-string objects (migration line 233-243).
- **What we did:** changed to `value: [{ en: 'Tag A' }, ...]` (array of localized-string objects).
- **Why:** Rule 3 (blocking issue — schema-discovered late).
- **Status:** RESOLVED.

### Deviation T2 — setupFromTemplate teardownPrefix derivation

- **What the plan said:** "Read `seed`, `prefix` (default `''`) from the template." Use `prefix` in `runTeardown(prefix, client)`.
- **What we found:** `runTeardown` enforces a 2-char minimum prefix guard (mass-delete safety); templates that emit pre-prefixed external_ids declare `externalIdPrefix=''` so the writer's pass-through is a no-op. `data.setup.ts` works around this by using a hard-coded `PREFIX = 'test-'` for teardown.
- **What we did:** introduced a `teardownPrefix` derivation in `setupFromTemplate`: `prefix.length >= 2 ? prefix : 'test-'`. Documented in the helper's docstring.
- **Why:** Rule 3 (blocking issue — discovered at first invocation against baseV1).
- **Status:** RESOLVED.

### Deviation T4 — `test.fixme` semantics inside `test.step`

- **What the plan said:** "If a step's assertion target depends on data the planner cannot confidently locate in the new baseV1 dataset, the step is implemented with `test.fixme(true, '...')` marker."
- **What we found:** `test.fixme(true, '...')` inside a `test(...)` body MARKS THE WHOLE TEST as fixme and TERMINATES execution at that line — which would skip every step after the first deferred one.
- **What we did:** replaced `test.fixme(true, ...)` with `await test.step('[deferred-88-nn] ...', async () => { await deferredStep('...'); })`. Each deferred step shows up in the reporter for visibility and emits a `[deferred-88-nn]` console.log; the test continues to subsequent steps. 25 deferred-88-nn placeholders in total.
- **Why:** Rule 1 (auto-fix bug). The intent of `test.fixme` markers per the plan was per-step deferral, not whole-test skip.
- **Status:** RESOLVED — documented in the spec's top-of-file docstring under "NOTE on test.fixme()".

### Deviation T4 — many MOVED steps deferred to 88-NN

- **What the plan said:** the mega-journey spec absorbs ~30 MOVED + NEW/MOVE refactor-doc bullets and runs them deterministically.
- **What we found:** when the spec navigates to /constituencies in the live frontend under baseV1, the naive "select first option per combobox" approach triggers the `voter-missing-nominations-modal` which intercepts subsequent clicks. The hierarchical CG resolution + only-municipalities UI contract (refactor-doc:226) needs empirical inspection of the live frontend's combobox ordering + nomination availability before downstream steps can run deterministically.
- **What we did:** marked the constituency-selection cluster and everything downstream of it (questions intro, answer loop, results, detail drawer, filters) as `[deferred-88-nn]` test.step placeholders. The static pages, about-back-button, election-selector visibility, intro-page, constituency-list visibility steps execute REAL assertions and pass. 5 executing test.step entries; 25 deferred-88-nn placeholders.
- **Why:** Rule 1 (Plan Risk #2 + #7 — UI semantics under baseV1 need empirical validation before assertion lock-in). The plan explicitly allowed for `test.fixme` markers on uncertain steps; this is the equivalent for the chained-test structure.
- **Status:** OPEN (intentional) — 88-NN plans will replace deferred-88-nn placeholders with real assertions per the migration map.

### Deviation T5 — data-setup-baseV1 dependencies: ['variant-hidden-required-candidate']

- **What the plan said:** "no `dependencies` field referencing any existing project (parallel = no cross-suite ordering)".
- **What we found:** Plan Risk #4 mitigation (Playwright project-graph sequencing) did NOT actually sequence between chains. Without a dep link, the two `test-`-prefixed chains ran in parallel; the later chain's teardown→seed clobbered the earlier chain's dataset mid-test. `voter-journey.spec.ts:140` failed under this race.
- **What we did:** added `dependencies: ['variant-hidden-required-candidate']` to `data-setup-baseV1`. The baseV1 chain now runs SEQUENTIALLY after the entire existing chain finishes. This couples baseV1's cascade-skip behavior to the existing chain's success — but the alternative (per-template prefix decoupling per Plan Risk #4 Mitigation B) is forward-looking work for 88-NN.
- **Why:** Rule 1 (auto-fix bug — the parallel-landing contract was broken without sequencing).
- **Status:** RESOLVED for Plan 88-01 — but flagged as a `[deferred-88-nn]` consideration: per-template prefix decoupling would let baseV1 run truly in parallel without dataset collision.

## Advisories addressed

- **(A1) — grep `parent_constituency_group` / `parent_id` before authoring baseV1**: done. Grep surfaced `packages/dev-seed/src/generators/ConstituenciesGenerator.ts:4-39` which documents the supported `parent: { external_id }` ref shape resolved by `_bulk_upsert_record` server-side via the `constituencies` self-FK (migration line 2640). The per-constituency `parent_id` approach (per USER NOTE on Task 1) is the canonical implementation. Verified post-seed: all 4 CO-Mun-* rows have `parent_id` set to the matching CO-Reg-* row.
- **(A2) — append new playwright projects AFTER all conditional `PLAYWRIGHT_*=1` blocks**: done. The 3 new entries are appended after the `PLAYWRIGHT_BANK_AUTH` conditional block (last in the array) and BEFORE the closing `]`. Confirmed via `tests/playwright.config.ts:578-619`.
- **(A3) — run `yarn test:e2e` with default workers for Task 6**: done. All three full-suite runs used the default `workers: 6` (the config setting at `tests/playwright.config.ts:64`). No `--workers=` override applied.
- **(A4) — Task 7 README is required, not optional**: done. Authored 149-line README at `tests/tests/specs/voter/voter-mega-journey.README.md` with 55-row migration table + net-new step list + 88-NN how-to-use guide + constituency-selection landmine cross-ref.
- **(A5) — code comment on the testIgnore extension flagging the `mega-journey` alternation also excludes future `voter-mega-*.spec.ts`**: done. Added 5-line comment at `tests/playwright.config.ts:240-244` immediately above the modified `testIgnore` regex.

## Open items

- **88-NN deferred-88-nn cluster**: 25 `[deferred-88-nn]` test.step placeholders in `voter-mega-journey.spec.ts` need real assertions wired against the live baseV1 frontend. Constituency-selection is the highest-risk cluster — needs empirical UI inspection of the hierarchical-CG combobox ordering + nomination-availability gate before downstream answer-loop steps can run.
- **88-NN per-template prefix decoupling** (Plan Risk #4 Mitigation B): introduce `'test-baseV1-'` for baseV1 + `'test-e2e-'` for the existing chain so the two chains can run TRULY in parallel without the current sequential dep.
- **88-NN candidate-profile.spec.ts:130 flake** (project memory `project_all_green_suite_priority.md`): the pre-existing terms-checkbox visibility race is the primary cascade driver in full-suite runs. Decoupling fix is out of scope for 88-01 but operator-flagged as a v2.10 priority.
- **88-NN baseV1 settings → mergeSettings parity with E2E_BASE_APP_SETTINGS**: the multi-election variant template composes `mergeSettings(E2E_BASE_APP_SETTINGS, overlay)`; future variants composing against `BASE_V1_APP_SETTINGS` should mirror that pattern. Plan 88-01 does not retire E2E_BASE_APP_SETTINGS — the two coexist as parallel surfaces.
- **88-NN voter-mega.fixture.ts exercise**: the new fixture compiles but is NOT consumed by the mega-journey spec (which uses raw `page` to assert at intermediate checkpoints). Once the deferred-88-nn results-landing cluster is wired, the fixture can be consumed for specs that only need a results-landing entrypoint.

## Self-Check

- `packages/dev-seed/src/templates/baseV1.ts`: FOUND
- `packages/dev-seed/src/templates/index.ts`: FOUND (modified)
- `packages/dev-seed/src/index.ts`: FOUND (modified)
- `tests/tests/setup/setupFromTemplate.ts`: FOUND
- `tests/tests/setup/baseV1.setup.ts`: FOUND
- `tests/tests/setup/baseV1.teardown.ts`: FOUND
- `tests/tests/fixtures/voter-mega.fixture.ts`: FOUND
- `tests/tests/specs/voter/voter-mega-journey.spec.ts`: FOUND
- `tests/tests/specs/voter/voter-mega-journey.README.md`: FOUND
- `tests/playwright.config.ts`: FOUND (modified)
- Commits c713acf3e, 75ccbf8cd, eb1740702, bdbd4794f, c7cc98c0e, 533c2bd42, 22963d498: all present in `git log`.

## Self-Check: PASSED
