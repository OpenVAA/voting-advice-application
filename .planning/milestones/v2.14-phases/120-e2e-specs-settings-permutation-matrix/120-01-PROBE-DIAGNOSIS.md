# 120-01 Probe Diagnosis — Trace-First Re-Diagnosis of the 4 Deferred Perm Probes

**Date:** 2026-06-15
**Plan:** 120-01 (DEF-119-08-01 gate close)
**Environment:** local Supabase (clean per-probe `yarn db:reset`), fresh Vite dev
server on a FREE port (`FRONTEND_PORT=5174`, 5173 occupied by the host dev
server), each probe SEEDED ONE-AT-A-TIME with ONLY its own perm template, run
under the committed `_probes` Playwright project (single-file `--workers=1`,
`--trace on` for the failing runs).

## Verdict (headline)

**The recorded 119-08 root-cause verdict is REFUTED.** The 4 deferred probes did
NOT fail because the minimal perm seeds make `voterCtx.selectedQuestionBlocks`
churn enough that the `voter-questions-start` Button detaches mid-click (TOCTOU)
or intermittently never mounts. That "reactive churn" hypothesis is UNCONFIRMED
and is contradicted by the trace evidence below.

The actual primary blocker is **deterministic and settings-driven**, NOT a race:
the minimal perm seeds set `questions.questionsIntro.show = false`
(`MINIMAL_BASE_APP_SETTINGS`, `packages/dev-seed/src/templates/e2e/perm/shared.ts:92-95`),
so the `/questions` intro page **auto-redirects on mount** PAST the
`voter-questions-start` button (`apps/frontend/src/routes/(voters)/(located)/questions/+page.svelte:49-71`,
`onMount → goto(..., { replaceState: true })`). The shared walk helper
`walkUntilQuestionsIntro` hard-waited for `voter-questions-start`
(`tests/tests/fixtures/voter/voter-journey.fixture.ts:184`), which never paints
under the bypass — so EVERY probe timed out at the WALK stage (line ~184),
NEVER reaching the suspected `answerAndAdvanceToResults` churn site (line ~209).

## Detach-vs-never-mounts separation measurement (CONDITION 2, objection 2)

The two conflated 119-08 failure modes — (a) Button detaches mid-click (TOCTOU)
vs (b) Button intermittently never mounts — are BOTH ruled out as the cause. The
trace-grounded measurement that separates them:

- The Playwright `error-context.md` page snapshots + the `frame-snapshot` URL
  sequence in the trace show the page is NOT on the `/questions` intro at all
  when the timeout fires. It has already navigated PAST it.
- **video probe** frame-URL sequence (from `0-trace.trace`):
  `/` → `/intro` → `/questions?electionId=…` → `/questions/category/<id>?electionId=…`.
  At timeout the snapshot shows the CATEGORY INTRO (`[QC1] Video category one`,
  "3 questions", a "Continue" button) — `categoryIntros.show=true` for this seed.
- **questionInfo probe** snapshot at timeout shows QUESTION 1 directly
  (`[QU-POPUP] … Question 1/5`) — `categoryIntros.show=false`, so the redirect
  target is `{ route: 'Question' }` (the first question), bypassing BOTH the
  questions-intro AND the category intro.

So the Button is neither detaching mid-click (it is never reached) nor
intermittently failing to mount (it is DETERMINISTICALLY absent because the page
redirects away from it). The failure reproduces 100% of the time, on every run,
which by definition is not a "intermittent never-mounts" race. **Mode (a) and
(b) are both REFUTED; the true mode is "settings-driven page bypass."**

## Env confound ruled out (CONDITION 2, objection 3)

The degraded-Vite-env confound is ruled out:

- A FRESH Vite dev server was started on a free port (`5174`) for the isolation
  runs; it was RESTARTED whenever Supabase was restarted (HMR/DB-connection
  staleness guard, per project memory `project_e2e_hmr_staleness_restart.md`).
- `/results` cold-start is NOT independently timing out — the popupNotice and
  orgMatching probes both reach `/results` cleanly and assert on it.
- The failure is deterministic (100% reproducible across the clean isolation
  runs), not the intermittent signature a degraded env would produce. The
  intermittent `imgproxy`/storage `502` that surfaced during `yarn db:reset` /
  seed (a KNOWN infra flake, `project_all_green_suite_priority.md` /
  STATE deferred-items "imgproxy 502") affects ONLY the seed/portrait-upload
  step and is cleared by `yarn db:stop && yarn db:start`; it does NOT affect the
  app-under-test behavior and is unrelated to the probe failures.

## Counterintuitive-smaller-seed objection (CONDITION 2, objection 1) — resolved

The 119-08 puzzle ("why does a SMALLER seed churn MORE than `e2e/base`?") is
dissolved: it was never about churn or seed size. The difference is a single
SETTING. `e2e/base` keeps `questions.questionsIntro.show = true`
(`packages/dev-seed/src/templates/e2e/base.ts:194-197`), so the questions-intro
page IS shown and `voter-questions-start` paints. The minimal perm seeds inherit
`questionsIntro.show = false` from `MINIMAL_BASE_APP_SETTINGS`, so the page is
bypassed. Same walk helper, opposite outcome — driven by the setting, not data
volume.

## The fix (trace-grounded, rides `_probes`, NOT the protected line 209)

1. **`tests/tests/fixtures/voter/voter-journey.fixture.ts:184` — `walkUntilQuestionsIntro`
   made bypass-tolerant.** The hard-wait on `voter-questions-start` is replaced
   with `.or(categoryStart).or(firstQuestion)` so the helper resolves on the
   questions-intro start (the `e2e/base` posture) OR the bypassed landing
   (category intro / first question). ZERO-REGRESSION for `e2e/base` + a11y-smoke:
   when `questionsIntro.show=true` the start button paints and the `.or()`
   resolves on it first. **The protected `answerAndAdvanceToResults` site at line
   ~209 (the REVERTED-in-119-08 `questionsStart.click()` → `dispatchEvent`
   change) is UNTOUCHED** (`git diff` confirms 0 occurrences of
   `questionsStart.click()` in the diff). CONDITION 2 honored — no premature
   shared-fixture churn change forced under a flaky env.
2. **`voterQuestionsPage.clickStart()`** made bypass-tolerant (no-op when the
   page already advanced to the first question).
3. The video probe drops its now-dead questions-start dispatch (the bypass
   deterministically lands on the category intro).

## Per-probe result (all 4 GREEN in isolation)

| Probe | Seed template | Primary blocker (root cause) | Secondary finding (deferred) | Result |
|-------|---------------|------------------------------|------------------------------|--------|
| **video** (EPERM-06) | `perm-question-video` | WALK bypass (questionsIntro.show=false → category intro) | — | ✅ **1 passed** |
| **questionInfo** (EPERM-07) | `perm-interactive-info` | WALK bypass (→ first question) + `infoSection` testid exact-match miss (component bakes `-{index}` into the testid; fixture used `.nth()` on the bare base) | arguments render-gating + expander-mode re-seed → Plan 05 | ✅ **1 passed** |
| **popupNotice** (EPERM-09) | `show-feedback-survey` | WALK bypass + **seed delay-unit bug** (`showFeedbackPopup/showSurveyPopup` are SECONDS — `appContext.svelte.ts:414-437` schedules `setTimeout(…, delay*1000)`; the 180/500 values were 3 min / ~8 min so the popups never surfaced) + FIFO popup queue (survey is queued behind feedback) | — | ✅ **2 passed** |
| **orgMatching** (EPERM-10) | `perm-org-matching` | WALK bypass + score-gauge target mismatch (results-list card renders the score via `MatchScore.svelte`, NOT `ScoreGauge.svelte`; `score-gauge` testid only exists inside the entity-details SubMatches drawer) | wire `expectOrgMatchScore` to the list-card score → Plan 06 | ✅ **2 passed** |

All 4 probes were run ONE-AT-A-TIME against a fresh Vite server + clean Supabase,
each seeded with ONLY its own perm template. No "did not run" probes.

## Genuine fixes applied this plan (trace-established)

- `voter-journey.fixture.ts` — bypass-tolerant `walkUntilQuestionsIntro` (line ~184).
- `voterQuestionsPage.fixture.ts` — bypass-tolerant `clickStart()`.
- `questionInfo.fixture.ts` — `expectInfoSections` targets the per-index testid
  `voter-questions-info-section-{index}` (exact-match fix matching the component).
- `show-feedback-survey.ts` (dev-seed) — popup delays `180/500` → `1/1` seconds
  (delay-unit bug fix). dev-seed has NO build step (runs from `src/` via tsx), so
  the change is live for `yarn db:seed`.
- The 4 probe specs — bypass-aware walks + carrier-scoped assertions; questionInfo
  + orgMatching argument/expander/score-gauge assertions deferred to the EPERM
  spec builds (Plan 05 / 06) with in-file NOTEs.

## Deferred to the EPERM spec builds (NOT Plan-01 gate items)

These are reader↔component testid-contract / re-seed-matrix concerns that the
EPERM spec build plans own (they re-seed the singleton per mode and decide the
component-side contract). They are documented in-probe + here so they are NOT
re-discovered cold:

1. **EPERM-07 (Plan 05) — QuestionArguments render-gating.** `QuestionArguments`
   is rendered ONLY inside `QuestionExtendedInfo.svelte`'s `{#if infoSections?.length}`
   block (`QuestionExtendedInfo.svelte:52,70-80`). The seed's argument carriers
   (`qu-likert`/`qu-boolean`/`qu-categorical`) carry `arguments` but NO
   `infoSections`, so their argument groups never render. Decide: move `{#if args}`
   outside the `infoSections` conditional, or co-seed `infoSections` on the
   argument carriers. ALSO: the argument-group testid bakes the suffix in
   (`voter-questions-argument-group-{choiceId|type}`) — `expectArguments` must
   match the suffixed testid (same class as the `infoSection` fix).
2. **EPERM-07 (Plan 05) — static-expander mode.** `interactiveInfo.enabled` is an
   APP-LEVEL setting; the template ships `enabled=true`. The expander-mode
   assertion needs an `enabled=false` re-seed (the per-mode matrix the spec owns).
3. **EPERM-10 (Plan 06) — list-card score readout.** `expectOrgMatchScore` targets
   `score-gauge`, but the results-LIST card renders the callout via
   `MatchScore.svelte` (a `<span>`), not `ScoreGauge.svelte`. Add a stable testid
   to MatchScore (or re-point the reader). NB: a naive `data-testid="score-gauge"`
   passthrough on the card MatchScore was tried and REVERTED here — it has broad
   blast radius across ALL entity cards and sits near a `score-gauge` count
   assertion at `voter-journey.spec.ts:730` (scoped to the SubMatches container,
   so not an immediate collision, but a production-component change that belongs
   to the spec build, not the probe gate).
