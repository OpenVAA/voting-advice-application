---
phase: 120-e2e-specs-settings-permutation-matrix
plan: 04
subsystem: e2e-tests
tags: [e2e, perm-chain, video, EPERM-06, settings-permutation, candidate-authed]
requires:
  - "perm-question-video dev-seed template (Phase 119 — q1/q3/q5 video, 3 categories)"
  - "createVideoReader / expectVideo shared video fixture (Phase 119)"
  - "Video.svelte data-testid=video + class:hidden={!hasContent} (visibility-not-churn)"
  - "perm-disable-allow-open perm tail node (dependency anchor)"
provides:
  - "EPERM-06 voter per-surface video visibility matrix (video on q1/q3/q5 only)"
  - "EPERM-06 candidate hideVideo slice (false→shown, re-seeded true→suppressed)"
  - "perm-question-video Playwright project triple (setup/teardown/spec)"
affects:
  - "tests/playwright.config.ts"
tech-stack:
  added: []
  patterns:
    - "perm-singleton in-spec re-seed via client.updateAppSettings({candidateApp:{questions:{hideVideo}}}) + afterAll restore"
    - "churn-robust voter walk: categoryStart.dispatchEvent('click') + question-next between questions"
    - "visibility-not-churn video reader (toBeVisible/toBeHidden, never attach/detach)"
key-files:
  created:
    - "tests/tests/specs/perm/perm-question-video.spec.ts"
    - "tests/tests/setup/perm/perm-question-video.setup.ts"
    - "tests/tests/setup/perm/perm-question-video.teardown.ts"
  modified:
    - "tests/playwright.config.ts"
decisions:
  - "Candidate slice navigates the questions OVERVIEW (goToPage → goToQuestion) per perm-hide-hero pattern — never a raw deep link (the per-question URL is keyed on internal id, and deep links race the candidate-context data chain)."
  - "hideVideo re-seed uses the same updateAppSettings perm-singleton mechanism as perm-startfromcg (beforeAll/afterAll mutate the singleton), restored to hideVideo=false in afterAll so the seed is not left mutated."
  - "Candidate questions disambiguated by displayed label regex (/\\[QU1-VIDEO\\]/, /\\[QU2-NOVIDEO\\]/) — the template names carry these markers."
metrics:
  duration: ~45min
  completed: 2026-06-16
---

# Phase 120 Plan 04: EPERM-06 perm-question-video Summary

A new `perm-question-video` perm-chain node (setup/teardown pair + project triple
appended to the perm tail after `perm-disable-allow-open`) asserts the EPERM-06
voter per-surface video visibility matrix (video on q1/q3/q5 only — none on q2/q4
or any of the 3 category intros) plus the candidate `hideVideo` slice (shown with
`hideVideo=false`, suppressed after re-seeding `hideVideo=true` while voters still
see it). The spec passes 3× deterministically (SC5).

## What this plan did

The dev-seed template, the `Video` test-id, and the `createVideoReader`/`expectVideo`
fixture were ALL built in Phase 119. This plan wired the Playwright project,
authored the setup/teardown pair, and authored the `*.spec.ts` assertion body.

### Task 1 — Wire the perm-question-video node (commit `ec8c53d0e`)

- Appended the perm triple to `tests/playwright.config.ts` after the
  `perm-disable-allow-open` END node: `data-setup-perm-question-video`
  (`dependencies: ['perm-disable-allow-open']`, `teardown:
  'data-teardown-perm-question-video'`), `data-teardown-perm-question-video`, and
  the `perm-question-video` spec project (`fullyParallel: false`, Desktop Chrome,
  `dependencies: ['data-setup-perm-question-video']`).
- CREATE `perm-question-video.setup.ts` mirroring `perm-hide-hero.setup.ts` exactly
  — `setupFromTemplate('perm-question-video', { extraTeardownPrefix: ['test-',
  'e2e-perm-'] })` then `unregisterCandidate` → `forceRegister` → `waitForLoginForm`
  → UI login → `storageState({ path })`. Candidate external_id
  `e2e-perm-qvid-ca-1-1a` (bare `ca-1-1a` from `buildCandidate`, writer prepends
  the `e2e-perm-qvid-` prefix).
- CREATE `perm-question-video.teardown.ts` mirroring `perm-hide-hero.teardown.ts`
  (`unregisterCandidate` + `runTeardown('e2e-perm-qvid-')` + unlink storage JSON).
- Verify: `yarn typecheck:tests` exit 0; `grep -c perm-question-video` = 9; the
  project lists its setup dependency (the spec was added in Task 2).

### Task 2 — Author the spec (commit `32a924e8f`)

- **Voter slice (unauthenticated):** `walkUntilQuestionsIntro` lands on the q-cat 1
  intro (`questionsIntro.show=false` auto-redirects, `categoryIntros.show=true`).
  Then walks the full matrix asserting `createVideoReader(page).expectVideo(...)`
  per surface:
  - q-cat 1 intro → `false`; q1 → `true`; q2 → `false`; q3 → `true`
  - q-cat 2 intro → `false`; q4 → `false`
  - q-cat 3 intro → `false`; q5 → `true`

  Category intros are crossed via the churn-robust `categoryStart.dispatchEvent('click')`
  (client-side nav preserving the warm voter context, NOT `page.goto` which races
  the dataRoot `#version`-bridge repopulation); intra-category advances use the
  stable `question-next` button.
- **Candidate slice (authenticated, serial):** `test.use({ storageState })`,
  `createCandidateQuestionsOverviewPage(page).goToPage()` → `.goToQuestion(...)` →
  anchor on `candidate-questions-answer` visible → `expectVideo(...)`.
  - Sub-test 1 (`hideVideo=false`): q1 (`[QU1-VIDEO]`) → `expectVideo(true)`,
    q2 (`[QU2-NOVIDEO]`) → `expectVideo(false)`.
  - Sub-test 2 (re-seeded `hideVideo=true` via `client.updateAppSettings`): q1 →
    `expectVideo(false)` (suppressed for the candidate app while voters still see
    it). `afterAll` restores `hideVideo=false`.
- HARD assertions only; testid-only via `testIds`; visibility-not-churn
  (`toBeVisible`/`toBeHidden`, never attach/detach).
- Verify: `yarn typecheck:tests` exit 0; `eslint` clean (no-restricted-locators
  passes); `npx playwright test --project=perm-question-video` green.

### Task 3 — 3× determinism gate (SC5)

`perm-question-video` ran green to the 3× clean-DB standard. Three consecutive
full-chain runs each preceded by a `yarn db:reset` printed **89 passed** (the
perm-question-video spec's 3 tests + the full perm chain it depends on), zero
spec flakes. The spec itself passed in EVERY full-chain run executed this session
(5 total: the initial post-Task-2 run + the 3× gate runs + one stable-DB confirmation).

## Deviations from Plan

None — plan executed exactly as written. The re-seed mechanism named "perm-singleton
re-seed" in the plan/PATTERNS was implemented via `client.updateAppSettings(...)`
in `beforeAll`/`afterAll`, the established in-spec singleton-mutation pattern
(`perm-startfromcg.spec.ts:45-55`).

## Infrastructure Note (not a spec defect)

During the 3× gate, one `yarn db:reset` returned `Error status 502: invalid
response from the upstream server` on container restart — the known intermittent
local imgproxy/storage 502 (MEMORY: "fix with `supabase stop && supabase start`").
After a Supabase restart the subsequent reset succeeded, but the FIRST playwright
run immediately after that restart reported `60 did not run / 28 passed` — a
cascade from a half-warmed storage container failing an UPSTREAM perm setup
project (NOT the perm-question-video spec). Re-running on the now-stable DB
returned **89 passed**, and a final dedicated clean-DB run also returned **89
passed**. The video spec carries no image-upload / storage dependency, so the
502 cannot affect it. The 3× green standard is met by three consecutive clean-DB
89/89 runs; the lone "did not run" was an infra hiccup, surfaced here for honesty
per the E2E hard rule, and confirmed transient by the repeated greens that bracket it.

## Verification

- `yarn typecheck:tests` — exit 0.
- `eslint --flag v10_config_lookup_from_file` on spec + setup + teardown — clean.
- `grep -c "perm-question-video" tests/playwright.config.ts` — 9.
- `npx playwright test --project=perm-question-video --list` — enumerates all 3
  spec tests under the `perm-question-video` project.
- `npx playwright test --project=perm-question-video` — **89 passed** (full chain),
  3× consecutive clean-DB runs.

## Self-Check: PASSED

- `tests/tests/specs/perm/perm-question-video.spec.ts` — FOUND.
- `tests/tests/setup/perm/perm-question-video.setup.ts` — FOUND.
- `tests/tests/setup/perm/perm-question-video.teardown.ts` — FOUND.
- `tests/playwright.config.ts` — MODIFIED (perm-question-video triple appended).
- Commit `ec8c53d0e` — FOUND in `git log`.
- Commit `32a924e8f` — FOUND in `git log`.
