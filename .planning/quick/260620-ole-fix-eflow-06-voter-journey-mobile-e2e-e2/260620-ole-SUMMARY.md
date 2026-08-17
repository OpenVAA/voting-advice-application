---
quick_id: 260620-ole
slug: fix-eflow-06-voter-journey-mobile-e2e-e2
type: quick
date: 2026-06-20
outcome: superseded
superseded_by: 260620-ole-PERM-ISOLATION-FIX.md
superseded_on: 2026-08-12
status: complete
---

# Quick 260620-ole: Fix EFLOW-06 + voter-journey-mobile E2E — Summary

> **SUPERSEDED 2026-08-12.** This summary records the BLOCKED state and a template-selection
> hypothesis that was subsequently REFUTED. The real defect — perm `app_settings` singleton
> cross-contamination — is diagnosed and fixed in `260620-ole-PERM-ISOLATION-FIX.md`
> (`status: fixed`). EFLOW-06 was closed in Phase 124, which reached E2E 125/0/0 cardinal-clean.
> Retained for the refutation trail; it is NOT open work.

## BLOCKED (historical — see banner above)

The operator-supplied diagnosis ("the seed template(s) lack an election / constituency
*selection* path, so the voter walk cannot advance Home→Intro→Elections→Constituencies→/questions")
**does NOT hold**. I did not commit any change, because adding election/constituency selection
to the templates would be a non-fix — the evidence below shows the templates already have valid
selection paths and both specs pass in isolation. The real cause is **shared-`app_settings`-singleton
contamination across the many `perm-*` data-setup projects when a broad test selection runs them all
together**, not a missing template selection.

Per the plan's GUARDRAIL ("if adding election/constituency selection does NOT make the specs pass …
STOP, do NOT commit a non-fix"), I stopped and report findings.

## What the walk actually does at the stall

Both specs time out at the SAME line — `walkUntilQuestionsIntro` line 231 — waiting for the
`voter-questions-start` / `voter-questions-category-start` / `question-choice` triple `.or()`.
The captured page snapshots (Playwright `error-context.md`) show the page is parked on the
**Intro page** ("Let's start!" heading + a live, clickable "Continue" button), i.e. the walk
NEVER REACHED the Elections or Constituencies pages at all.

- EFLOW-06 snapshot: Intro page, "Continue" button present (`perm-localisation-positive-…-EFLOW-06…/error-context.md`).
- voter-journey-mobile snapshot: Intro page, bullet list explicitly shows **"Select an election"**
  and **"Select your constituency"** steps (`voter-journey-mobile-…/error-context.md`) — proving the
  `e2e/base` data IS loaded and the selection flow exists; the walk just never advanced off Intro.

Because the stall is at Intro (before Elections), adding/altering election/constituency *selection*
in the template cannot affect it.

## Isolation proof (this is contamination, not a template defect)

| Invocation | Projects pulled | Result |
| --- | --- | --- |
| `… tests/tests/specs/voter/voter-journey-mobile.spec.ts` (path only, no `./tests`) | 3 (base setup + spec + teardown) | **3 passed (15.3s)** |
| `… ./tests -g "EFLOW-06"` (grep narrows tests, all setups still load) | 52 | 52 passed (run A) … but `… perm-localisation-positive.spec.ts -g "EFLOW-06"` → **1 failed / 51 passed** (run B) → FLAKY |
| `… ./tests tests/tests/specs/voter/voter-journey-mobile.spec.ts` (broad — `./tests` runs the WHOLE suite) | 131 | **6 failed, 43 did not run, 82 passed** |
| same broad selection `--workers=1` (CI parallelism) | 131 | **13 failed, 43 did not run, 75 passed** |

Key signals:
- `voter-journey-mobile` (using `e2e/base`, which already has multi-election + multi-constituency
  selection) **passes cleanly in isolation** — the template is fine.
- The broad runs produce **"43 did not run"**, the project's documented upstream-cascade failure
  signature (an upstream data-setup project failed, cascading to dependents).
- The same broad selection fails with `--workers=1` too (13 failed), so it is NOT purely 6-worker
  load — it is **deterministic cross-setup contamination**, made worse (more victims) by parallelism.
- The failures are not confined to the two named specs; they spread to unrelated `_probes`
  (`popupNotice` EPERM-09, `questionInfo` EPERM-07, `video` EPERM-06, `orgMatching` EPERM-10) and
  `a11y-smoke`, all of which depend on a clean per-perm `app_settings`.

## Confirmed root cause

There is a **single runtime DB `app_settings` row**, mutated by every perm data-setup via the
additive `merge_jsonb_column` RPC (`tests/tests/setup/shared/setupFromTemplate.ts:233-239`;
`updateAppSettings`). `packages/dev-seed/src/templates/e2e/perm/shared.ts:120-127` documents this
explicitly: "the perm family is one sequential chain sharing the app_settings singleton" and warns
that one perm's settings (e.g. `candidateApp.show: true`, `questions.questionsIntro.show`,
`elections.disallowSelection`) **BLEED into every downstream perm that spreads this base**.

When the broad `./tests` selector forces ALL ~25 `perm-*` data-setup projects to seed against the
one shared `app_settings` row, the singleton ends up in a merged/contaminated state. A spec whose
voter walk runs while a foreign `app_settings` is live can stall on Intro (e.g. a bled-in
`elections.disallowSelection`/intro-gating combination), exactly the observed symptom. Run-to-run
ordering variance is why EFLOW-06 passes in one 52-project run and fails in the next — i.e. flaky,
not deterministically green or deterministically red.

The two plan verification commands are themselves the trigger:
- `./tests -g "EFLOW-06"` — `-g` narrows the *tests*, but every data-setup project still loads, so the
  shared `app_settings` is still contaminated → flaky.
- `./tests tests/tests/specs/voter/voter-journey-mobile.spec.ts` — the `./tests` positional is
  ADDITIVE (it makes Playwright run the entire suite), so all perm setups load → cascade.

## Files changed

**None.** No commit was made (guardrail: do not commit a non-fix). Only pre-existing untracked
`.planning/` artifacts and a pre-existing `package.json` modification are in the working tree —
neither produced by this task.

## Before / after pass counts

No fix was applied, so there is no "after". Baselines captured:
- `voter-journey-mobile.spec.ts` alone: **3/3 passed** (already green).
- `perm-localisation-positive.spec.ts -g "EFLOW-06"`: flaky — 52 passed (run A) vs 1 failed/51 passed (run B).
- Broad `./tests …` selection: 6 failed (6 workers) / 13 failed (workers=1), each with 43 did-not-run.

## Recommended real fix (out of scope for this test-infra quick task)

The defect is in **test orchestration / project isolation**, not in any seed template's
election/constituency selection. Options, in order of preference:

1. **Isolate the shared `app_settings` per perm at spec runtime.** Have each spec (or its
   data-setup `globalSetup`/`beforeEach`) re-apply ITS template's `app_settings` immediately
   before the walk, so a sibling perm's bled-in settings cannot leave the singleton in a
   walk-breaking state. (The cleanest durable fix.)
2. **Run perm specs strictly serially with re-seed-before-each-spec** (enforce the documented
   "one sequential chain" contract at the runner level, not just by author discipline), so the
   shared `app_settings` is deterministic when each walk runs.
3. **At minimum, correct the verification commands**: the project's trusted signal is the
   per-project isolated run (`tests/tests/specs/<file>.spec.ts` WITHOUT the broad `./tests`
   positional), or a single full-suite `yarn test:e2e` run on a freshly `db:reset` DB with
   `workers: 1` (the CI posture that yields the documented 95/0). Mixing a broad `./tests`
   positional with a single-file path is what manufactures the cascade.

## Unrelated cause surfaced

Yes — the failure is a **shared-`app_settings`-singleton cross-perm contamination /
test-project-isolation** problem, surfaced only by broad multi-setup test selections. It is
unrelated to election/constituency selection in any template, and it also affects unrelated
`_probes` and `a11y-smoke` specs (collateral victims), confirming it is an orchestration-layer
issue rather than a per-template data defect.
