---
phase: 74-high-leverage-e2e-coverage
plan: 02
subsystem: testing
tags: [playwright, e2e, voter, variants, browse-without-match, dev-seed, supabase]

# Dependency graph
requires:
  - phase: 63-determinism-rebaseline
    provides: "E2E_BASE_APP_SETTINGS + mergeSettings deep-merge pipeline (Pitfall 4); variant-template app_settings.fixed[] convention; runTeardown('test-', client) cleanup pattern"
  - phase: 58-variant-projects
    provides: "Canonical variant Playwright project chain (data-setup-X → variant-X) + variant-multi-election analog shape"
provides:
  - "variant-low-minimum-answers Playwright project (data-setup + variant pair) — sequential after variant-startfromcg"
  - "variant template at tests/tests/setup/templates/variant-low-minimum-answers.ts (settings-only overlay, matching.minimumAnswers: 1)"
  - "Setup driver at tests/tests/setup/variant-low-minimum-answers.setup.ts (6-step pipeline + post-seed assertion)"
  - "E2E-02 browse-without-match Playwright gate at tests/tests/specs/voter/voter-browse-without-match.spec.ts"
affects:
  - "74-04 (E2E-04 cell 2 + cell 4 — 1e×Nc + Ne×Nc variants — first new data-setup depends on variant-low-minimum-answers; PATTERNS Pitfall 5)"
  - "74-07 (parity / IMGPROXY regen-constants — new test titles enter the PASS_LOCKED pool)"

# Tech tracking
tech-stack:
  added: []  # No new dependencies — reuses mergeSettings (@openvaa/app-shared), BUILT_IN_TEMPLATES.e2e (@openvaa/dev-seed)
  patterns:
    - "Settings-only variant template: count: 0 + baseFixed(table) for every table, app_settings.fixed[0] is the only overlay (no new candidates/elections/constituencies)"
    - "Spec navigates Home → location (auto-imply) → /questions/<id> via navigateToFirstQuestion, then skips opinions by direct goto /results with electionId+constituencyId carried as search params"
    - "Browse-vs-results ingress assertion uses content discriminator (\"ordered by election symbol or name\" present + \"best matches are first\" absent) rather than translation-key probing — survives copy edits on either side independently"

key-files:
  created:
    - "tests/tests/setup/templates/variant-low-minimum-answers.ts"
    - "tests/tests/setup/variant-low-minimum-answers.setup.ts"
    - "tests/tests/specs/voter/voter-browse-without-match.spec.ts"
  modified:
    - "tests/playwright.config.ts (insert data-setup-low-minimum-answers + variant-low-minimum-answers project entries after variant-startfromcg block)"

key-decisions:
  - "Used `mergeSettings` from `@openvaa/app-shared` (NOT `mergeAppSettings` from frontend) per Pitfall 4 — deep merge preserves base results.cardContents/sections/header keys when only `matching` overlay is provided."
  - "Ingress assertion uses content discriminator (browse-specific phrase 'ordered by election symbol or name' + absence of results-specific phrase 'best matches are first') rather than translation-key probing. RESEARCH Assumption A1 listed `results.title.browse` as the candidate but the actual rendered key is `dynamic.results.ingress.browse`, which in EN has no questionsLink placeholder — the phrase 'answer at least N questions' (results.ingress.questionsLinkText) is NEVER rendered inline. Discriminator-based check survives independent copy edits on either branch."
  - "data-setup-low-minimum-answers.dependencies = ['variant-startfromcg'] per Pitfall 5 — first new variant in the Phase 74 chain extends the canonical sequential setup ordering."
  - "variant-low-minimum-answers.testDir = './tests/specs/voter' (E2E-02 lives under voter/ per CONTEXT D-13). Differs from Plan 04's variant projects which use ./tests/specs/variants."

patterns-established:
  - "Settings-only variant template: pure pass-through baseFixed(table) for every non-app_settings table, app_settings.fixed[0] carries the entire overlay via mergeSettings(E2E_BASE_APP_SETTINGS, OVERLAY). Plan 04's 1e-Nc + Ne-Nc templates can reuse this shape unchanged (their overlays will replace `matching.minimumAnswers` with their own knob)."
  - "Variant chain insertion is additive at a clean point AFTER variant-startfromcg + BEFORE the opt-in specialized projects (visual-regression / performance / bank-auth). Plan 04 extends the chain by pointing data-setup-1e-Nc.dependencies → ['variant-low-minimum-answers'] (the new previous-variant terminus)."

requirements-completed: [E2E-02]

# Metrics
duration: 37min
completed: 2026-05-11
---

# Phase 74 Plan 02: High-Leverage E2E Coverage Summary

**E2E-02 browse-without-match Playwright gate: voter under `matching.minimumAnswers` (overlay: 1, 0 opinions answered) navigates Home → location → /results and sees the entity list with NO match-score percentages + browse-mode ingress copy, persistently asserted under a new sequential `variant-low-minimum-answers` Playwright project.**

## Performance

- **Duration:** ~37 min
- **Started:** 2026-05-11T07:06:15Z
- **Completed:** 2026-05-11T07:43:27Z
- **Tasks:** 3
- **Files modified:** 4 (3 new + 1 modified)

## Accomplishments

- New `variant-low-minimum-answers` Playwright project (data-setup + variant pair) wired into the sequential variant chain after `variant-startfromcg`.
- Variant template at `tests/tests/setup/templates/variant-low-minimum-answers.ts` — settings-only overlay (`matching.minimumAnswers: 1` + `questions.questionsIntro.show: false`); every other table passes through `BUILT_IN_TEMPLATES.e2e` unchanged. `external_id: 'test-app-settings-low-minimum-answers'` survives `runTeardown('test-', client)` cleanup.
- Setup driver at `tests/tests/setup/variant-low-minimum-answers.setup.ts` mirrors `variant-multi-election.setup.ts` (6-step pipeline + post-seed `toMatchObject` assertion + candidates sanity check).
- E2E-02 spec at `tests/tests/specs/voter/voter-browse-without-match.spec.ts`: voter navigates Home → location → /questions/<first-question-id> via shared `navigateToFirstQuestion` helper; then `page.goto(Results + currentUrl.search)` to skip opinions; asserts (1) entity card visibility, (2) zero `%` text inside the results list, (3) browse-mode ingress copy via content discriminator.
- 3 cold-start `--workers=1` runs PASS identically.

## Task Commits

Each task was committed atomically:

1. **Task 1: variant-low-minimum-answers template + setup driver** — `b95ccd975` (feat)
2. **Task 2: wire playwright.config.ts projects** — `12a8422c9` (feat)
3. **Task 3: voter-browse-without-match.spec.ts** — `969994790` (feat)

**Plan metadata:** _to be added with final commit_

## Test + Setup Titles (for Plan 07 IMGPROXY collision audit)

- **Setup title:** `'import low-minimum-answers dataset'` — verified safe vs. the 14 bound `IMGPROXY_TIED_TITLES` patterns at `.planning/phases/73-determinism-baseline/post-fix/regen-constants.mjs:64-78`. Does NOT end with any of the 14 bound titles.
- **Test title:** `'voter completes location, skips opinions, browses entity list without match scores'` — verified safe vs. the same list. Distinctive ending `...without match scores`.

## DATA_RACE / PASS_LOCKED classification recommendation

**Recommendation:** Add the new test to **PASS_LOCKED** at Plan 07's `regen-constants.mjs` regeneration step.

Rationale:
- 3 cold-start runs PASS identically (per-plan smoke gate).
- No flake observed across 3 sequential runs (each preceded by `data-setup-low-minimum-answers` re-running through `runTeardown` + Writer pipeline).
- No image proxy / portrait upload dependency in the spec body — assertions are DOM-only (entity-card visibility + ingress text discriminator + match-score absence).
- Test runs inside its own dedicated variant Playwright project with `fullyParallel: false` — no within-project parallelism + sequential variant chain → no contention with other test bodies.

If Plan 07 observes a single flake across the regen 10-run window, the most likely root cause is the Supabase storage container restart pattern seen during execution (multiple ENOENT / "fetch failed" / "Bucket not found" errors from the supabase_storage container restarting under load) — that is an infrastructure flake not a spec-content flake; the right fix is upstream of this test.

## Files Created/Modified

- `tests/tests/setup/templates/variant-low-minimum-answers.ts` — new variant template (settings-only overlay; 109 lines).
- `tests/tests/setup/variant-low-minimum-answers.setup.ts` — new setup driver (56 lines).
- `tests/tests/specs/voter/voter-browse-without-match.spec.ts` — new E2E-02 spec (98 lines).
- `tests/playwright.config.ts` — 2 new project entries inserted after the `variant-startfromcg` block (17 lines added).

## Decisions Made

1. **Ingress assertion via content discriminator (not translation-key probing)** — RESEARCH Assumption A1 listed `results.title.browse` as the likely browse-mode key. The actual rendered key is `dynamic.results.ingress.browse`. In EN, this translation has NO `{questionsLink}` interpolation, so the "answer at least 1 question" fragment from `results.ingress.questionsLinkText` is never rendered inline. The assertion uses the distinguishing browse-specific phrase ("ordered by election symbol or name") + the absence of the results-specific phrase ("best matches are first"). Survives independent copy edits on either branch.

2. **No new testIds** — Reuses `testIds.voter.results.list` + `testIds.voter.results.card` + `testIds.voter.results.ingress` per the plan's contract. CONTEXT D-11 inline `// reason:` comment is not required because these testIds are pre-existing and consumed by the canonical `voter-results.spec.ts`.

3. **Spec navigation uses `navigateToFirstQuestion` helper** — initial pass tried direct `page.goto(Home)` + `voter-home-start` click + `voter-intro-start` click + `waitForURL(/questions/)`, but the base e2e seed still surfaces `/elections` and `/constituencies` pages (auto-Continue pattern). Switched to the shared `navigateToFirstQuestion` which handles `passThroughElections` + `passThroughConstituencies` internally.

4. **Plan 04 hand-off** — `data-setup-low-minimum-answers` is the new chain terminus. Plan 04's `data-setup-1e-Nc.dependencies` MUST point to `['variant-low-minimum-answers']` per Pitfall 5.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Ingress assertion regex initially targeted wrong translation key**
- **Found during:** Task 3 (Author voter-browse-without-match.spec.ts)
- **Issue:** Plan's `<read_first>` hinted that the browse-mode prompt would render "answer at least N questions" inline (via `results.ingress.questionsLinkText` interpolated through `{questionsLink}` in `dynamic.results.ingress.browse`). Inspecting `apps/frontend/src/lib/i18n/translations/en/dynamic.json` showed the EN `browse` translation has NO `{questionsLink}` placeholder — the questionsLink anchor is computed in the layout but never substituted into the rendered text. The initial regex `/answer at least/i` would never match.
- **Fix:** Switched assertion to content discriminator: assert `/ordered by election symbol or name/i` (browse-specific) is present AND `/best matches are first/i` (results-specific) is absent. The two assertions together pin the conditional to the browse branch and survive independent copy edits on either side.
- **Files modified:** `tests/tests/specs/voter/voter-browse-without-match.spec.ts`
- **Verification:** 3 cold-start runs pass identically.
- **Committed in:** `969994790` (Task 3 commit)

**2. [Rule 3 - Blocking] Spec navigation initially missed location-selection pages**
- **Found during:** Task 3 (first smoke run)
- **Issue:** Initial implementation called `page.goto(Home)` + clicked `voter-home-start` + clicked `voter-intro-start` then awaited `page.waitForURL(/\/questions\//)` directly. Smoke run landed on `/elections` (base e2e seed has 1 election but `/elections` page still renders an auto-Continue selection flow; `/constituencies` follows). `waitForURL(/questions/)` timed out.
- **Fix:** Replaced the manual sequence with a call to the shared `navigateToFirstQuestion(page)` helper which internally drives `passThroughElections` + `passThroughConstituencies` + `clickThroughIntroPages` and waits for the URL to settle on `/questions/<id>`.
- **Files modified:** `tests/tests/specs/voter/voter-browse-without-match.spec.ts`
- **Verification:** Subsequent smoke runs reached `/questions/<id>` successfully and the spec progressed to the `/results` navigation step.
- **Committed in:** `969994790` (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (Rule 1 bug + Rule 3 blocking)
**Impact on plan:** Both were necessary for the spec to assert the E2E-02 contract correctly. Original plan body was internally consistent but bumped against (a) a translation-key vs. translation-content mismatch and (b) a navigation-flow detail that the base e2e seed exposes despite single-election + single-constituency dataset shape. No scope creep — both fixes stay inside Task 3's contract.

## Issues Encountered

- **Recurring Supabase Storage container restarts** — during smoke testing the local supabase_storage_openvaa-local container restarted multiple times unprompted, producing "fetch failed" / "Bucket not found" / playwright-artifact ENOENT errors that cascaded into spurious data-setup + spec failures. Mitigated by `yarn supabase:stop` + `yarn supabase:start` + `cd apps/supabase && yarn reset` cycle which recreated the `public-assets` + `private-assets` buckets. Final 3-run determinism gate ran cleanly after the storage layer stabilized. This is upstream infrastructure (not E2E-02 code) and matches the issue-class flagged in the DATA_RACE/PASS_LOCKED note above.

- **Concurrent agent file modifications** — Plans 01, 03, 06 are executing in parallel as sibling agents. `tests/playwright.config.ts` is also modified by Plan 01 (different line / different project entry); we used `git add -p` to stage ONLY our Task 2 hunk (lines 273+) so Plan 01's hunk at line 108 stays in the working tree for its own commit. No conflict introduced.

## Next Phase Readiness

- **Plan 04 unblocked.** Its `data-setup-1e-Nc.dependencies` is now expected to be `['variant-low-minimum-answers']` (the new chain terminus). Plan 04's planning doc already records this dependency.
- **Plan 07 input ready.** Both the setup title and test title are recorded in this SUMMARY for IMGPROXY collision audit. Recommend PASS_LOCKED classification at constants regen.
- **No blockers.** All 4 deliverables present, lint clean, type-check clean, 3-run determinism gate PASSES.

## Self-Check: PASSED

- File `tests/tests/setup/templates/variant-low-minimum-answers.ts` — FOUND
- File `tests/tests/setup/variant-low-minimum-answers.setup.ts` — FOUND
- File `tests/tests/specs/voter/voter-browse-without-match.spec.ts` — FOUND
- File `tests/playwright.config.ts` contains `data-setup-low-minimum-answers` + `variant-low-minimum-answers` (grep count 4 = each name appears 2× as name string + dependency reference) — FOUND
- Commit `b95ccd975` (Task 1) — FOUND in git log
- Commit `12a8422c9` (Task 2) — FOUND in git log
- Commit `969994790` (Task 3) — FOUND in git log

---
*Phase: 74-high-leverage-e2e-coverage*
*Plan: 02*
*Completed: 2026-05-11*
