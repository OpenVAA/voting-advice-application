---
phase: 120-e2e-specs-settings-permutation-matrix
plan: 03
subsystem: e2e-tests
tags: [e2e, voter-journey, entity-details, EPERM-04, EPERM-05, settings-permutation]
requires:
  - "e2e/base dataset (per-type entityDetails.contents + showMissing* settings)"
  - "entityDetails fixture (expectTabs/selectTab/expectInfoItem/expectQuestionDisplay)"
  - "resultsPage fixture (openEntityDetailsForCard/selectEntityTab)"
provides:
  - "EPERM-04 candidate+org entityDetails tab-control assertions (per-type)"
  - "EPERM-05 organization-typed missing-data marker assertions (additive)"
  - "re-confirmation of EPERM-01/02/03-bulk/08 already-covered verdicts"
affects:
  - "tests/tests/specs/voter/voter-journey.spec.ts"
tech-stack:
  added: []
  patterns:
    - "per-type tab control asserted via expectTabs (exact count+order+a11y-name) + explicit non-declared-tab-absent check"
    - "additive (assert-only) reading of showMissingElectionSymbol.organization=false → row ABSENT"
key-files:
  created: []
  modified:
    - "tests/tests/specs/voter/voter-journey.spec.ts"
decisions:
  - "EPERM-05 org slice is ADDITIVE (zero seed change): showMissingElectionSymbol.organization=false → assert the Election Number row is ABSENT (not a '—' placeholder); showMissingAnswers.organization=true + orgs carry no opinion answers → assert org-typed 'hasn't answered'/'Neither has answered' markers. Rigid org-card counts (749-781) untouched."
  - "3× determinism gate run with full `yarn db:reset` between runs (Task-3-specified clean DB), which also clears the feedback rate-limit counter that otherwise accumulates across re-seed-only runs."
metrics:
  duration: ~35min
  completed: 2026-06-16
---

# Phase 120 Plan 03: EPERM-04 tab control + EPERM-05 org-typed missing markers Summary

EPERM-04 (per-type entityDetails tab control, candidate + organization) and EPERM-05
(organization-typed missing-data markers) asserted in place in `voter-journey.spec.ts`,
additive (zero seed change); EPERM-01/02/03-bulk/08 re-confirmed already-covered; the
extended voter-journey passes 3× deterministically (clean DB each run).

## What this plan did

Extended the existing voter-journey walk (no new spec, no new project, no seed change)
with two assertion slices, then ran the SC5 3× determinism gate:

### Task 1 — EPERM-04 entityDetails tab control (candidate + organization)

- **Candidate drawer** (CA-AA-Special, already-open step ~854): `entityDetails.expectTabs(['info','opinions'])` per `entityDetails.contents.candidate` (`e2e/base.ts:147`), PLUS an explicit hard assertion that the org-only **Members** tab is **ABSENT** (`getByRole('tab', { name: membersTab }).toHaveCount(0)`).
- **Organization drawer** (Party AA, step ~974): `entityDetails.expectTabs(['info','children','opinions'])` per `entityDetails.contents.organization` (`e2e/base.ts:148`), PLUS an explicit assertion that the **Members** tab is **PRESENT** (`toHaveCount(1)`) — the per-type contrast with the candidate drawer (candidate has no Members tab, org does). Tab control is per-type, not a fixed set.

### Task 2 — EPERM-05 organization-typed missing-data markers (+ re-confirm 01/02/03/08)

- **Org missing-election-symbol (info tab):** `showMissingElectionSymbol.organization` is **false** (`e2e/base.ts:153`) and org nominations carry **no** `election_symbol` (`e2e/base.ts:1287-1325`). Per `EntityInfo.svelte:95` the Election Number row renders only when `electionSymbol || showMissingElectionSymbol[type]` — so for an org with neither, the row is **ABSENT**. Asserted the row's absence (`getInfoItems().filter({ hasText: /Election Number|Election Symbol/i }).toHaveCount(0)`). This is the **additive** reading of the org-typed `showMissingElectionSymbol` contract under base settings.
- **Org missing-answers (opinions tab):** `showMissingAnswers.organization` is **true** (`e2e/base.ts:157`) and every org in base carries **no opinion answers**, so the org opinions tab renders org-typed missing markers (`EntityOpinions.svelte:62-72`). Asserted via `entityDetails.expectQuestionDisplay`: Base opinion 1 (voter answered, org missing) → `numSelected:1` + "hasn't answered"; Opt-A opinion 1 (voter skipped, org missing) → `numSelected:0` + "Neither has answered".
- **Re-confirmation (assertion-of-existing-coverage, no rebuild)** of the four "confirmed covered, no new code" EPERM verdicts against the coverage-plan evidence lines (see citations below).

### Task 3 — 3× determinism gate (SC5)

`voter-journey` project passed **3/3** consecutive runs, each preceded by a full `yarn db:reset` (clean DB) against the running dev server. Zero flakes.

## EPERM re-confirmation citations (Task 2 requirement)

All confirmed by reading `voter-journey.spec.ts` + the coverage-plan EPERM map this session:

| Req | Verdict | Confirming spec lines |
|-----|---------|----------------------|
| **EPERM-01** question-flow path matrix | covered, no new code | `voter-journey.spec.ts` min-answers gate (`/Answer 4/` disabled→enabled, ~480-504), category Start (`expectCategoryIntroAndAdvance`, ~526) + Skip (`skip:true`, ~666), deselected category never appears (~668); `perm-1e1cg1co.spec.ts:12-17` no-selector direct-to-questions. (Coverage plan row, line 61.) |
| **EPERM-02** election/constituency sequencing | covered, no new code | full sequencing matrix across `perm-1e1cg1co`, `perm-2e-shared`, `perm-2e-asymmetric`, `perm-startfromcg`, `perm-disjoint-1co`, `perm-disable-election-1co`, `perm-disable-election-2co`. (Coverage plan row, line 62.) |
| **EPERM-03** results-display (candidate/org bulk) | covered, no new code (alliance slice → 130) | `voter-journey.spec.ts` candidate tab/section + parties switch (~683-699), card contents (info-text, submatches, 4 gauges, symbol "10", ~709-736), org 5 cards + show-all/collapse (~749-781). (Coverage plan row, line 63.) |
| **EPERM-08** `matching.minimumAnswers` gating | covered, no new code | `voter-journey.spec.ts` `questionsStart` `/Answer 4/` + disabled-until-enough (~493-498), results-link disabled→enabled→re-disabled on delete (~600-620). (Coverage plan row, line 68.) |

## Deviations from Plan

### 1. [Interpretation — must_have reading] EPERM-05 org election-symbol row asserted ABSENT, not "—"

- **Found during:** Task 2 build-time read of `e2e/base.ts` org rows + `EntityInfo.svelte`.
- **Plan wording:** the `must_haves`/acceptance text said "assert the `showMissingElectionSymbol.organization` (— row)" and "an org-typed missing-election-symbol '—' row".
- **Actual contract:** base sets `showMissingElectionSymbol.organization: false`, and org nominations carry no `election_symbol`. Per `EntityInfo.svelte:95` the row renders only when `electionSymbol || showMissingElectionSymbol[type]` — so for orgs the row is **ABSENT**, and the "—" placeholder NEVER renders for the org type under base settings. A "—" assertion would require flipping the setting to `true` — a **NON-ADDITIVE** change to a shared setting affecting every org drawer.
- **Resolution:** honored the plan's explicit **ADDITIVE/assert-only default** (D-04 / §Extension-Scope Pins: "If an existing party already lacks a symbol/answer this is additive (assert-only, zero seed change)"). Asserted the org Election Number row is **ABSENT** — the faithful org-typed `showMissingElectionSymbol` contract under the base posture. The `showMissingAnswers.organization=true` opinions markers ARE asserted as written. Zero seed change; rigid org-card counts (749-781) untouched.
- **Files modified:** `tests/tests/specs/voter/voter-journey.spec.ts`.
- **Commit:** `32412a9b6`.

## Seed-change status (Task 2 acceptance)

**Additive (assert-only) — no seed change.** No org was made answer-incomplete; orgs already carry zero opinion answers and zero election symbols in `e2e/base`. The rigid org-card counts at lines 749-781 were **NOT** touched (no re-baseline needed).

## Deferred Issues

- **DEF-120-03-01** (logged to `deferred-items.md`): the feedback rate-limit counter (`private.feedback_rate_limits`, 5 inserts / 5 min / IP, `107-feedback.sql:39-94`) is NOT cleared by `data-teardown-base` (out of the `test-e2e-base-` seed namespace). Running `voter-journey` back-to-back via the re-seed-only project chain flakes on the feedback step (`data-status` reaches `error`, not `sent`) once the cross-run counter exceeds 5 within the 5-min window. **Not caused by this plan** (the feedback step ~line 1189 is untouched by the EPERM-04/05 edits). A full `yarn db:reset` between runs (the Task-3-specified clean-DB discipline) clears it; the 3× gate is GREEN. Proper fix (schema/teardown reset RPC) is out of scope for a test-authoring plan.

## Verification

- `yarn typecheck:tests` — exit 0.
- `eslint --flag v10_config_lookup_from_file tests/tests/specs/voter/voter-journey.spec.ts` — clean (`no-restricted-locators` guard passes).
- `grep "expectTabs"` (non-comment) → 2 hits: `['info','opinions']` (candidate, line 864) + `['info','children','opinions']` (org, line 988).
- `npx playwright test --project=voter-journey -c tests/playwright.config.ts` — **3/3 GREEN** with full `yarn db:reset` between runs (SC5).

## Self-Check: PASSED

- `tests/tests/specs/voter/voter-journey.spec.ts` — FOUND (modified, contains `expectTabs`/`expectQuestionDisplay` org-slice assertions).
- Commit `32412a9b6` — FOUND in `git log`.
