---
phase: 90-tir5-permutations-missing-nominations-warning-localisation-n
plan: 02
subsystem: e2e-test-permutation
tags:
  - dev-seed-template
  - perm-template
  - playwright-config
  - voter-app
  - missing-nominations-modal
  - TIR5-15-26
requires:
  - "@openvaa/dev-seed (existing helpers buildOrganizations / buildQuestionCategories / buildQuestions / buildCandidate / buildElectionConstituencyNoms / MINIMAL_BASE_APP_SETTINGS)"
  - "tests/tests/setup/setupFromTemplate.ts (existing)"
  - "tests/tests/utils/testIds.ts (testIds.voter.missingNominationsModal already registered)"
  - "Phase 89 Plan 04 perm chain (perm-per-app-notifications anchor)"
provides:
  - "perm-missing-nominations dev-seed template with externalIdPrefix 'e2e-perm-missnoms-'"
  - "BUILT_IN_TEMPLATES registry entry + re-export of permMissingNominationsTemplate"
  - "perm-missing-nominations.setup.ts / perm-missing-nominations.teardown.ts wrappers"
  - "perm-missing-nominations.spec.ts (1 strict-assertion E2E test)"
  - "3 playwright.config.ts project entries (setup + spec + teardown triplet) sequenced after perm-per-app-notifications"
affects:
  - "tests/playwright.config.ts (additive — no existing project entry modified)"
  - "packages/dev-seed/src/templates/index.ts (additive — 1 import, 1 BUILT_IN_TEMPLATES entry, 1 re-export)"
tech-stack:
  added: []
  patterns:
    - "Per-perm externalIdPrefix discipline (88-03 / 89-04 lineage) — 'e2e-perm-missnoms-' distinct from all prior perm prefixes"
    - "Asymmetric nominations: el-1 receives buildElectionConstituencyNoms; el-2 INTENTIONALLY left empty to trigger the missing-nominations modal 'some' variant"
    - "MINIMAL_BASE_APP_SETTINGS verbatim — this perm does NOT depend on 90-01's Stage A runtime supportedLocales override"
    - "Rigidity contract (TIR5:5-13): no expect.soft, no try/catch around expect(), no .catch fallbacks"
    - "Sequential perm-* chain dependency (HIGH-2 invariant at tests/playwright.config.ts:653-660) — data-setup depends on perm-per-app-notifications"
key-files:
  created:
    - "packages/dev-seed/src/templates/permutations/perm-missing-nominations.ts"
    - "tests/tests/setup/perm-missing-nominations.setup.ts"
    - "tests/tests/setup/perm-missing-nominations.teardown.ts"
    - "tests/tests/specs/perm/perm-missing-nominations.spec.ts"
  modified:
    - "packages/dev-seed/src/templates/index.ts (import + BUILT_IN_TEMPLATES entry + re-export)"
    - "tests/playwright.config.ts (3 new project entries appended after perm-per-app-notifications)"
decisions:
  - "Spec navigates via constituency-picker continue click (NOT auto-advance): the 1 CG / 1 CO topology still renders the constituency selector page with an auto-checked option, and the canonical voter-constituencies-continue testId is the strict-mode advance path (voter-not-located-redirect.spec.ts:152-155 precedent)."
  - "Spec asserts the localised 'no nominations for election' marker via the EXACT string 'not available' from apps/frontend/src/lib/i18n/translations/en/results.json `missingNominations.noNominationsForElection`. Stable-ID assertions ([EL1] / [EL2]) handle the localisable election names per D-90-03 + D-90-06."
  - "testIds.voter.missingNominationsModal ALREADY EXISTED in tests/tests/utils/testIds.ts:128 — no new testid registration required for this plan. The plan's contingency for adding it (Task 2 Step C tail) did not fire."
  - "Operator-deferred runtime gate: the 3-project chain runs end-to-end only when the operator runs `yarn db:reset && yarn db:seed --template perm-missing-nominations && npx playwright test --project=perm-missing-nominations` locally; consistent with the v2.10 environment cascade carry-forward from 89-01/02/03/04 (vite dev returns 500 in headless agent env)."
metrics:
  duration: "~15 minutes"
  completed_date: "2026-05-29"
  task_count: 3
  file_count: 6
---

# Phase 90 Plan 02: perm-missing-nominations Summary

**One-liner:** TIR5:15-26 missing-nominations modal E2E perm — 2 elections sharing 1 CG/CO, 1 candidate, 1 nomination in el-1 only; voter selects both elections and the modal surfaces el-2 with the "not available" marker.

## Tasks

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Author perm-missing-nominations template + register in templates/index.ts | `61ae43b94` | `packages/dev-seed/src/templates/permutations/perm-missing-nominations.ts`, `packages/dev-seed/src/templates/index.ts` |
| 2 | Author setup + teardown wrappers + perm-missing-nominations spec | `c943b082c` | `tests/tests/setup/perm-missing-nominations.setup.ts`, `tests/tests/setup/perm-missing-nominations.teardown.ts`, `tests/tests/specs/perm/perm-missing-nominations.spec.ts` |
| 3 | Append 3 playwright.config.ts project entries (setup + spec + teardown triplet) | `a3c996956` | `tests/playwright.config.ts` |

## Verification

| Check | Result | Evidence |
|-------|--------|----------|
| Template file exists | PASS | `ls packages/dev-seed/src/templates/permutations/perm-missing-nominations.ts` ✓ |
| index.ts has ≥3 references | PASS | `grep -c "perm-missing-nominations\|permMissingNominationsTemplate" packages/dev-seed/src/templates/index.ts` → 3 |
| @openvaa/dev-seed typecheck | PASS | `cd packages/dev-seed && yarn typecheck` → no errors |
| Template runtime shape | PASS | tsx probe → `prefix=e2e-perm-missnoms-, elections=2, noms=3, candidates=1` (3 noms = 2 org rows + 1 candidate row for el-1; el-2 has zero) |
| Registry + re-export wiring | PASS | tsx probe → `BUILT_IN_TEMPLATES['perm-missing-nominations'] === permMissingNominationsTemplate` |
| Setup/teardown/spec files exist | PASS | `ls tests/tests/setup/perm-missing-nominations.{setup,teardown}.ts tests/tests/specs/perm/perm-missing-nominations.spec.ts` ✓ |
| Teardown PREFIX const present | PASS | `grep -c "e2e-perm-missnoms-" tests/tests/setup/perm-missing-nominations.teardown.ts` → 2 (docstring + const) |
| Rigidity contract — no soft/catch in spec body | PASS | `grep` finds only the docstring describing the contract; no actual `expect.soft` / `.catch(... => null)` / `try { expect(... } catch` usage |
| ESLint clean on new spec | PASS | `npx eslint tests/tests/specs/perm/perm-missing-nominations.spec.ts` → 0 errors |
| ESLint pre-existing pattern on setup file | accepted | `playwright/expect-expect` warning matches 89-04 perm-disable-voter-app.setup.ts baseline (a Playwright setup project is structurally a fixture, not a test — pre-existing project-wide pattern, not introduced by this plan) |
| Playwright project list | PASS | `npx playwright test --list --project=perm-missing-nominations` enumerates the new chain after the 89-04 chain (50 tests in 42 files total) |
| Chain dependency anchor | PASS | `data-setup-perm-missing-nominations.dependencies = ['perm-per-app-notifications']` preserves the HIGH-2 sequential-perm invariant |

## Decisions Made

1. **Spec navigation shape — constituency-picker click, not auto-advance.** Verified the constituency selector page renders even with 1 CG / 1 CO. Used the canonical `testIds.voter.constituencies.continue` click path (precedent: `voter-not-located-redirect.spec.ts:152-155`). The plan asked the executor to capture which navigation style was used — final answer: **constituency-picker continue click, then explicit `goto('/en/results')` to land the (located) layout and open the missing-nominations modal on first entry per Pitfall 7**.

2. **Localised "no nominations" assertion string — `"not available"`.** Captured verbatim from `apps/frontend/src/lib/i18n/translations/en/results.json:30` (`missingNominations.noNominationsForElection`). Bounded the substring match to the modal scope so the short string ("not available") cannot collide with unrelated UI text elsewhere on the page.

3. **`testIds.voter.missingNominationsModal` already existed.** Confirmed at `tests/tests/utils/testIds.ts:128` — registered as a top-level voter-namespace entry (not nested under `voter.elections` as the plan's `<must_haves>` example string suggested). The spec references it as `testIds.voter.missingNominationsModal`. No new testid registration was needed; the plan's Task 2 contingency for adding it did not fire.

4. **Runtime end-to-end execution deferred to operator.** Consistent with the v2.10 environment cascade carry-forward (Phases 89-01/02/03/04): the headless agent environment cannot complete a vite-dev cold-start E2E run in this session. Static verification (typecheck + lint + runtime shape probe + playwright list) clean. Operator runbook step: `yarn db:reset && yarn db:seed --template perm-missing-nominations && npx playwright test --project=perm-missing-nominations`.

## Deviations from Plan

**1. [Rule 1 — Bug avoidance] Replaced conditional constituency-continue click with unconditional click.**

- **Found during:** Task 2 (post-write lint run).
- **Issue:** Initial spec draft wrapped the constituency-continue click in `if (await constContinue.isVisible())` to handle a hypothetical single-CG/single-CO auto-advance case. ESLint flagged `playwright/no-conditional-in-test`, and inspection of `apps/frontend/src/routes/(voters)/constituencies/+page.svelte` confirmed the page always renders the selector — there is no auto-advance branch.
- **Fix:** Replaced the conditional with an unconditional `expect(... continue).toBeVisible()` + `.click()` pair, matching the canonical pattern at `voter-not-located-redirect.spec.ts:152-155`.
- **Files modified:** `tests/tests/specs/perm/perm-missing-nominations.spec.ts` (during Task 2; no separate commit — change folded into the Task 2 commit `c943b082c`).
- **Commit:** `c943b082c` (Task 2).

**No other deviations.** The plan was executed as written aside from the lint-driven local refinement above. The plan's automated `grep -c "expect.soft\|\.catch(...)"` check counted the docstring-mention as a hit (`1`), but the spec body contains no such constructs — manual verification confirms rigidity contract compliance.

## Authentication Gates

None — this perm is voter-side only and does not touch the candidate registration flow.

## Known Stubs

None. The deliverables are complete; no placeholder UI / empty data flows / hardcoded TODOs ship with this plan.

## Threat Surface

No new threat surface introduced. Per the plan's `<threat_model>`:
- T-90-02-01 (Tampering — dev-seed JSONB) — accepted, mitigation unchanged: template is committed source consumed via the typed Template schema.
- T-90-02-02 (Information Disclosure — test artefacts) — accepted, mitigation unchanged: local Supabase + Inbucket, no production credentials touched.
- T-90-02-SC (Tampering — package installs) — accepted, mitigation unchanged: no new package installs in this plan.

## Output Spec Answers

The plan's `<output>` block requested 4 specific answers:

1. **The exact text-substring used in the spec's "no nominations" assertion.**  
   `"not available"` — verbatim value of `missingNominations.noNominationsForElection` in `apps/frontend/src/lib/i18n/translations/en/results.json`. Asserted as `/not available/` against the modal scope.

2. **Whether the spec navigated via constituency picker auto-advance or direct goto('/en/results').**  
   **Both.** The spec clicks `voter-constituencies-continue` on the constituency selector page (which always renders for the 1 CG / 1 CO topology), then issues an explicit `await page.goto('/en/results')` to ensure the (located) layout is entered fresh, opening the missing-nominations modal on first entry (Pitfall 7 — `modalShownForKey` debounce only fires once per `(nomStatus, selectedElections, selectedConstituencies)` key, so a single fresh entry is the canonical path).

3. **Whether `testIds.voter.elections.missingNominationsModal` already existed or was added during Task 2.**  
   **Already existed** — at `tests/tests/utils/testIds.ts:128` as `testIds.voter.missingNominationsModal` (top-level voter namespace, not nested under `voter.elections`). The spec consumes it from its actual location. No testid catalog mutation was needed.

4. **Whether the chain ran end-to-end locally (operator-deferred per cascade).**  
   **Operator-deferred** per the v2.10 environment cascade carry-forward (89-01/02/03/04 precedent). Static verification clean: typecheck, lint, runtime shape probe, playwright list. End-to-end run requires `yarn db:reset && yarn db:seed --template perm-missing-nominations && npx playwright test --project=perm-missing-nominations` on a local machine with vite dev + Supabase running.

## Self-Check: PASSED

- `packages/dev-seed/src/templates/permutations/perm-missing-nominations.ts` — FOUND
- `packages/dev-seed/src/templates/index.ts` — MODIFIED (3 references for perm-missing-nominations)
- `tests/tests/setup/perm-missing-nominations.setup.ts` — FOUND
- `tests/tests/setup/perm-missing-nominations.teardown.ts` — FOUND
- `tests/tests/specs/perm/perm-missing-nominations.spec.ts` — FOUND
- `tests/playwright.config.ts` — MODIFIED (4 references for perm-missing-nominations chain)
- Commit `61ae43b94` — FOUND in `git log`
- Commit `c943b082c` — FOUND in `git log`
- Commit `a3c996956` — FOUND in `git log`
