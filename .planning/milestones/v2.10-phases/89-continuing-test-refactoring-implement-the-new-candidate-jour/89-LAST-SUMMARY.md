---
phase: 89-continuing-test-refactoring-implement-the-new-candidate-jour
plan: LAST
subsystem: testing
tags: [playwright, e2e, candidate-app, legacy-retirement, page-objects, parallel-landing, d-89-04, tir4-retire-01]

# Dependency graph
requires:
  - phase: 89-continuing-test-refactoring-implement-the-new-candidate-jour
    plan: 03
    provides: candidate-mega-journey.spec.ts absorbing the coverage of candidate-auth/password/registration/questions/required-info (22-step serial flow); playwright project chain data-setup-candidate-mega → candidate-mega-journey → data-teardown-candidate-mega.
  - phase: 89-continuing-test-refactoring-implement-the-new-candidate-jour
    plan: 04
    provides: 3 perm-* specs (perm-disable-voter-app, perm-disable-candidate-app, perm-per-app-notifications) absorbing the coverage of candidate-settings 7.1.2 (CAND-10) + 7.1.4 (CAND-13). D-89-04 explicitly retires 7.1.3 (CAND-11).
provides:
  - "tests/tests/specs/candidate/ catalog shrunk from 12 specs (pre-89-LAST) to 6 specs (post-89-LAST): candidate-mega-journey.spec.ts + candidate-mega-journey.README.md + candidate-profile.spec.ts + candidate-profile-validation.spec.ts + candidate-translation.spec.ts + candidate-bank-auth.spec.ts + candidate-settings.spec.ts (residual)"
  - "tests/tests/pages/candidate/ catalog shrunk from 7 PageObject classes to 3 (ProfilePage, QuestionPage, QuestionsPage) per per-class consumer audit"
  - "tests/playwright.config.ts: 2 project entries deleted (candidate-app-password, variant-hidden-required-candidate); 2 testMatch regexes trimmed (candidate-app, candidate-app-mutation); 1 dependency rerouted (data-setup-multi-election from candidate-app-password → candidate-app-settings)"
  - "tests/tests/fixtures/index.ts: 4 PageObject classes pruned from import + fixture-extend + named re-export blocks (HomePage, LoginPage, PreviewPage, SettingsPage); 3 KEEP-verdict classes preserved verbatim"
  - "89-LAST-AUDIT.md: per-class consumer audit table establishing source of truth for Task 3 deletions"
  - "89-LAST-VERIFY.txt: static + dynamic verification ledger; operator runbook for the deferred dynamic full-suite gate"
affects: [v2.10 close (catalog ready for final post-audit anchor capture; surviving legacy candidate specs ready for individual TIR5-deferred follow-up phases)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Evidence-based PageObject pruning — per-class grep audit over surviving spec inventory drives DELETE/KEEP verdicts; no speculative pruning of classes that might still have consumers"
    - "Parallel-landing → legacy-retirement closure — completes the 89-03 + 89-04 sibling-not-replacement contract by deleting the parallel-landed predecessor specs only AFTER their absorbers have shipped + are statically verifiable"
    - "Retirement-marker comment blocks — at every excision site (candidate-settings.spec.ts excised describes; playwright.config.ts deleted projects; fixtures/index.ts docstring update) a brief comment cites WHICH absorbed migrating spec/project the coverage moved to, so future archaeologists can trace the migration without git blame"
    - "Single-edit testMatch trimming — when only one spec survives in a project, the testMatch regex collapses to a single-literal pattern (e.g., /candidate-translation\\.spec\\.ts/) for maximum future-readability"
    - "Surgical configuration cleanup — dependency rerouting (data-setup-multi-election → candidate-app-settings) preserves the sequencing-after-default-candidate-suite invariant while routing around the deleted candidate-app-password project"

key-files:
  created:
    - .planning/phases/89-continuing-test-refactoring-implement-the-new-candidate-jour/89-LAST-AUDIT.md
    - .planning/phases/89-continuing-test-refactoring-implement-the-new-candidate-jour/89-LAST-VERIFY.txt
    - .planning/phases/89-continuing-test-refactoring-implement-the-new-candidate-jour/89-LAST-SUMMARY.md
  modified:
    - tests/playwright.config.ts
    - tests/tests/specs/candidate/candidate-settings.spec.ts
    - tests/tests/fixtures/index.ts
    - .planning/phases/89-continuing-test-refactoring-implement-the-new-candidate-jour/deferred-items.md
  deleted:
    - tests/tests/specs/candidate/candidate-auth.spec.ts
    - tests/tests/specs/candidate/candidate-password.spec.ts
    - tests/tests/specs/candidate/candidate-registration.spec.ts
    - tests/tests/specs/candidate/candidate-questions.spec.ts
    - tests/tests/specs/candidate/candidate-required-info.spec.ts
    - tests/tests/pages/candidate/HomePage.ts
    - tests/tests/pages/candidate/LoginPage.ts
    - tests/tests/pages/candidate/PreviewPage.ts
    - tests/tests/pages/candidate/SettingsPage.ts

key-decisions:
  - "Plan honored as-written: 5 tasks committed atomically (Task 1 → Task 5). Each task's verify gate passed (static verification clean; dynamic full-suite gate deferred to operator runbook per the established 89-01/02/03/04 environment-cascade precedent)."
  - "Per-class audit DELETE verdict for 4 PageObject classes (HomePage, LoginPage, PreviewPage, SettingsPage); KEEP verdict for 3 (ProfilePage, QuestionPage, QuestionsPage). SettingsPage was DELETE despite candidate-settings.spec.ts being a surviving spec — the spec consumes SupabaseAdminClient + page.goto directly, never the settingsPage fixture (verified via grep on the post-excision spec body)."
  - "Excision sites preserved as retirement-marker comment blocks (not git-blame-only) — candidate-settings.spec.ts retains an in-file ~20-line block citing where each of CAND-10 / CAND-11 / CAND-13 coverage moved (or that CAND-11 is per-D-89-04 explicitly retired with no replacement)."
  - "data-setup-multi-election.dependencies rerouted from 'candidate-app-password' (now deleted) to 'candidate-app-settings' (the new last surviving candidate project). Preserves the variants-after-default-candidate-suite sequencing invariant. data-setup-hidden-required STAYS (still consumed by variant-hidden-required-voter)."
  - "Dynamic full-suite gate deferred per 89-01/02/03/04 precedent. The deletions are structurally orthogonal to both blockers (vite-cache wipe race + perm-1e1cg1co cascade) — they can only narrow the catalog that the blockers eventually serve from."

patterns-established:
  - "Per-class consumer-count grep audit table → KEEP/DELETE verdict before any prune action. The audit is committed FIRST as the source of truth for the prune task. Any future legacy-prune phase should follow the same shape: audit-first, prune-by-verdict."
  - "Retirement-marker comment block at every excision site — at minimum, cite WHICH spec/project absorbed the coverage. For per-D-decision retirements with no absorber (like CAND-11 per D-89-04), explicitly state 'retired per D-NN-NN with no replacement'."
  - "Dependency reroute over project deletion-cascade — when deleting a project that other projects depend on, prefer rerouting the orphaned dependencies to the closest surviving sibling rather than deleting the dependent projects too. Preserves the sequencing semantics with minimum collateral edits."

requirements-completed:
  - D-89-04
  - TIR4-RETIRE-01

# Metrics
duration: ~30 min
completed: 2026-05-29
---

# Phase 89 Plan LAST: legacy candidate retirement Summary

**5 absorbed candidate specs deleted from disk + 3 candidate-settings test blocks excised (CAND-10/11/13) + 4 zero-consumer PageObject classes pruned + tests/playwright.config.ts cleaned of 2 defunct project entries + 1 testMatch regex narrowed per project + 1 dependency rerouted. Static verification GREEN in both default + legacy modes; dynamic full-suite gate deferred to operator runbook per the established 89-01/02/03/04 environment-cascade precedent.**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-05-29T10:57:00Z (orchestrator handoff post-89-04)
- **Completed:** 2026-05-29T11:25:00Z (this commit)
- **Tasks:** 5
- **Files created:** 3 planning artifacts (89-LAST-AUDIT.md, 89-LAST-VERIFY.txt, this SUMMARY)
- **Files modified:** 4 (tests/playwright.config.ts, candidate-settings.spec.ts, fixtures/index.ts, deferred-items.md)
- **Files deleted:** 9 (5 spec files + 4 PageObject classes)

## Accomplishments

- **89-LAST-AUDIT.md** authored at the canonical audit path. Per-class grep audit table establishes KEEP/DELETE verdicts for all 7 PageObject classes in `tests/tests/pages/candidate/`. Source of truth for Task 3's prune action.

- **5 absorbed candidate spec files deleted via `git rm`**:
  - `candidate-auth.spec.ts` — absorbed by mega-journey step 9 (login flow).
  - `candidate-password.spec.ts` — absorbed by mega-journey steps 7-9 (forgot-password reset + wrong-password rejection + new-password login).
  - `candidate-registration.spec.ts` — absorbed by mega-journey steps 3-6 (registration via Inbucket + password set + ToU + first-time home).
  - `candidate-questions.spec.ts` — absorbed by mega-journey steps 15-20 (questions overview + per-question editor + edit + completion).
  - `candidate-required-info.spec.ts` — absorbed by mega-journey steps 12-14 (required field gate + partial-submit + completion).

- **candidate-settings.spec.ts excision**: the 3 test blocks for CAND-10 (lines 159-187), CAND-11 (lines 189-220), CAND-13 (lines 222-271) were removed verbatim. A retirement-marker comment block was inserted at the former site documenting where each block's coverage moved (or that 7.1.3/CAND-11 was explicitly retired per D-89-04 with no replacement — the underMaintenance branch is sufficiently exercised by the perm-* family's wider flag matrix). All TIR5-deferred residual blocks STAY: 7.1.1 CAND-09 read-only warning, 7.1.7/8 CAND-15 hideHero, CAND-14 help/privacy, SETTINGS-01 wave A matrix.

- **4 PageObject classes pruned per audit verdicts**: `HomePage.ts`, `LoginPage.ts`, `PreviewPage.ts`, `SettingsPage.ts` deleted via `git rm`. The 3 KEEP-verdict classes (`ProfilePage`, `QuestionPage`, `QuestionsPage`) are preserved verbatim — they're still consumed by `candidate-profile.spec.ts`, `candidate-translation.spec.ts`, and the hideHero blocks in `candidate-settings.spec.ts` (lines 216/247).

- **tests/tests/fixtures/index.ts updated** in lockstep: 4 import lines, 4 fixture-extend blocks, and 4 named re-export lines removed for the pruned classes. The file docstring usage example was updated to reference a surviving fixture pair (candidateQuestionsPage + questionPage). Voter-side imports/exports preserved verbatim.

- **playwright.config.ts surgical cleanup**:
  - `candidate-app` testMatch trimmed from `/candidate-(auth|questions|translation)\.spec\.ts/` to `/candidate-translation\.spec\.ts/`.
  - `candidate-app-mutation` testMatch trimmed from `/candidate-(registration|profile)\.spec\.ts/` to `/candidate-profile\.spec\.ts/`.
  - `candidate-app-password` project entry DELETED entirely + replaced with retirement-marker comment.
  - `variant-hidden-required-candidate` project entry DELETED entirely + replaced with retirement-marker comment.
  - `data-setup-multi-election.dependencies` rerouted from `['candidate-app-password']` → `['candidate-app-settings']` (the new last surviving candidate project).
  - File-header comment block updated to reflect the new 3-project candidate split (auth + questions merged out; just translation / profile / settings residual remain in the legacy chain).

- **89-LAST-VERIFY.txt** ledger captures:
  - **Run A.STATIC (default mode catalog enumeration via `--list`)**: PASS — 47 tests in 39 files; zero active references to deleted specs.
  - **Run B.STATIC (PLAYWRIGHT_LEGACY=1 catalog enumeration via `--list`)**: PASS — surviving candidate inventory enumerates correctly; CAND-10/11/13 blocks absent from candidate-settings listing; candidate-app-password + variant-hidden-required-candidate projects absent from project listing; variant-hidden-required-voter still anchored on data-setup-hidden-required (KEEP).
  - **Dynamic full-suite gate**: DEFERRED per environment cascade (vite-cache wipe race + perm-1e1cg1co cascade — same shape as 89-01/02/03/04 deferrals). Operator runbook captured verbatim.

## Task Commits

Each task was committed atomically (sequential mode; hooks bypassed per project memory `project_gsd_repo_hook_workaround.md`):

1. **Task 1: 89-LAST-AUDIT.md** — `4e1b63b18` (docs)
2. **Task 2: 5 absorbed specs deleted + 3 candidate-settings blocks excised** — `26fdf43c0` (test)
3. **Task 3: 4 PageObject classes pruned + fixtures/index.ts updated** — `2e3858e64` (refactor)
4. **Task 4: tests/playwright.config.ts cleaned (2 projects deleted, 2 testMatch trimmed, 1 dep rerouted)** — `d7354566e` (chore)
5. **Task 5: 89-LAST-VERIFY.txt ledger + operator runbook** — `b6f3d78e5` (docs)

**Plan metadata commit:** (this commit) docs(89-LAST): complete plan

## Files Created/Modified

### Created (3 files)

- `.planning/phases/89-…/89-LAST-AUDIT.md` — per-class PageObject consumer audit table; source of truth for Task 3 prune action (99 lines).
- `.planning/phases/89-…/89-LAST-VERIFY.txt` — static + dynamic verification ledger + operator runbook for the deferred dynamic gate (141 lines).
- `.planning/phases/89-…/89-LAST-SUMMARY.md` — this summary.

### Modified (4 files)

- `tests/playwright.config.ts` — 2 project entries deleted, 2 testMatch regexes trimmed, 1 dependency rerouted, 4 comment blocks updated (47 insertions / 46 deletions).
- `tests/tests/specs/candidate/candidate-settings.spec.ts` — 3 describe blocks excised (CAND-10 / CAND-11 / CAND-13); 1 retirement-marker comment block inserted (19 insertions / 117 deletions).
- `tests/tests/fixtures/index.ts` — 4 PageObject imports + fixture-extend blocks + named re-exports removed; usage docstring updated (15 insertions / 35 deletions).
- `.planning/phases/89-…/deferred-items.md` — item #9 added documenting the pre-existing `apps/frontend/src/routes/runes-test/*` build + lint failures discovered during Task 3 verification (spike-016 origin; orthogonal to 89-LAST surface).

### Deleted (9 files)

Spec files (5):

- `tests/tests/specs/candidate/candidate-auth.spec.ts`
- `tests/tests/specs/candidate/candidate-password.spec.ts`
- `tests/tests/specs/candidate/candidate-registration.spec.ts`
- `tests/tests/specs/candidate/candidate-questions.spec.ts`
- `tests/tests/specs/candidate/candidate-required-info.spec.ts`

PageObject classes (4):

- `tests/tests/pages/candidate/HomePage.ts`
- `tests/tests/pages/candidate/LoginPage.ts`
- `tests/tests/pages/candidate/PreviewPage.ts`
- `tests/tests/pages/candidate/SettingsPage.ts`

## Decisions Made

- **Plan executed as-written.** 5 tasks committed atomically per the plan structure. Each task's verify gate (static-verifiable: file existence + grep counts + Playwright catalog enumeration) passed.

- **PageObject audit verdicts (Task 1).** The audit is the source of truth for Task 3. Verdicts:
  - `HomePage` → DELETE (only candidate-auth + candidate-password consumed it — both deleted)
  - `LoginPage` → DELETE (only candidate-auth consumed it — deleted)
  - `PreviewPage` → DELETE (only candidate-questions + candidate-required-info consumed it — both deleted)
  - `ProfilePage` → KEEP (candidate-profile.spec.ts consumes via `profilePage.uploadImage` etc.)
  - `QuestionPage` → KEEP (candidate-translation.spec.ts consumes via `questionPage.answerInput` + `saveAnswer`)
  - `QuestionsPage` → KEEP (candidate-translation.spec.ts + candidate-settings residual hideHero blocks 7.1.7/8 consume via `candidateQuestionsPage.expandAllCategories` + `navigateToQuestion`)
  - `SettingsPage` → DELETE (no surviving consumer — the legacy candidate-settings.spec.ts never used the settingsPage fixture; it drives SupabaseAdminClient + page.goto directly)

  The `SettingsPage` DELETE verdict was a noteworthy finding: the class registration in fixtures/index.ts was already a dead fixture pre-89-LAST. Pruning it was net-strict-cleanup.

- **D-89-04 7.1.3 retirement without replacement.** Per D-89-04 verbatim cut, the underMaintenance block (CAND-11) is RETIRED with NO replacement in Plan 89-04 perm chain. The reasoning (per CONTEXT.md D-89-04 + 89-04 SUMMARY analysis): the perm-* family's wider settings-flag matrix sufficiently exercises the `access.underMaintenance` route-blocking semantics; the legacy single-flag flip-and-revert pattern at 7.1.3 was the weakest of the three excised blocks (its assertions are 100% subsumed by the role-based maintenance assertions in perm-disable-voter-app + perm-disable-candidate-app, which both transitively assert the MaintenancePage rendering on their respective routes when their flag toggles).

- **data-setup-multi-election dependency reroute.** When `candidate-app-password` was deleted, the orphaned dependency on `data-setup-multi-election` was rerouted to `candidate-app-settings` (the new last surviving candidate project in the default-mode legacy chain). This preserves the variants-after-default-candidate-suite sequencing invariant with one-line edit; the alternative (deleting the variant chain dependency entirely or rerouting it to `candidate-app-validation`) would have either degraded sequencing semantics or required more invasive surgery.

- **data-setup-hidden-required KEPT.** `variant-hidden-required-candidate` was deleted, but its sibling `variant-hidden-required-voter` (which runs `voter-visibility-required.spec.ts`) still consumes `data-setup-hidden-required`. The setup project stays per the simple "keep if still consumed" rule.

- **Dynamic full-suite gate deferred.** Per the established 89-01/02/03/04 carry-forward: the two blockers (vite-cache wipe race + perm-1e1cg1co cascade) are not addressable in-orchestrator without disrupting the operator's working dev server. The deletions are structurally orthogonal to both blockers; they can only narrow the eventual blocked catalog. Static verification covers both default + legacy modes via `--list` and is the highest in-orchestrator acceptance gate possible.

## Deviations from Plan

### Test verification deferral (Task 5 — environment cascade carry-forward, NOT a Rule 1-4 deviation)

**1. [Out-of-scope / environment cascade] Task 5 dynamic full-suite gate deferred to operator runbook**

- **Found during:** Task 5 (gate execution decision).
- **Issue 1 (vite-cache wipe race vs operator dev server):** `yarn db:reset` invokes `dev:clean` which wipes `apps/frontend/.svelte-kit/` and the vite cache. The frontend was at HTTP 200 at the time of this verification (confirming the operator's `vite dev` is the active serving instance); the executor cannot safely invoke `db:reset` without risk of disrupting the operator's working dev server. Same shape as 89-01/02/03/04 documented deferrals.
- **Issue 2 (perm-1e1cg1co cascade):** The first spec project in the default-mode perm-* chain is in the v2.11+ carry-forward set per Phase 86.3-05 D-06; running it cold-start in the sandbox cascades. NOT introduced by 89-LAST.
- **Decision:** Per scope-boundary rule, both blockers are out of scope. Static verification of all 5 tasks is GREEN: 5 deleted specs absent + 4 deleted classes absent + 3 excised blocks absent + 0 broken imports in `tests/tests/fixtures/index.ts` + 0 orphan testIgnore in `tests/playwright.config.ts` + Playwright `--list` clean in BOTH default and legacy modes.
- **Files modified:** None (no code rollback; VERIFY.txt operator runbook captured per Task 5 acceptance).
- **Verification path post-89-LAST:** Operator runbook captured verbatim in 89-LAST-VERIFY.txt. Steps: (1) pkill any stray vite dev workers; (2) `yarn db:reset && yarn db:seed --template baseV1 && yarn dev:clean`; (3) restart `yarn dev`; (4) `cd tests && npx playwright test --reporter=list`; (5) repeat under `PLAYWRIGHT_LEGACY=1` for Run B.

### Pre-existing frontend build + lint failures (out-of-scope; logged as deferred-items #9)

- **Found during:** Task 3 verification surface (`yarn build` + `yarn lint:check`).
- **Issue:** `apps/frontend/src/routes/runes-test/nav-a11y/+page.svelte:19:2` fails Svelte compilation (`<ol>` nested inside `<p>` auto-closing violation). 32 lint errors across `apps/frontend/src/routes/runes-test/voter-context-orchestration/*` files. Both are PRE-EXISTING from spike-016 commit `69eedf4dd` (validated WCAG gate) — completely orthogonal to 89-LAST's test-catalog surface.
- **Decision:** Per scope-boundary rule (only auto-fix issues DIRECTLY caused by current task's changes), these are out of scope. The runes-test routes are spike-test code earmarked for v2.11+ rune-migration cleanup.
- **Logged at:** `.planning/phases/89-…/deferred-items.md` item #9.

---

**Total deviations:** 1 (Task 5 environment cascade — same shape as 89-01/02/03/04 deferrals; not a Rule 1-4 auto-fix).
**Impact on plan:** Code-level state of all 5 tasks is correct + statically verifiable. Task 5 dynamic gate is the ONLY task whose acceptance criteria can't close in-orchestrator due to the documented environment cascade. The plan's deliverables (5 deleted specs + 3 excised blocks + 4 pruned PageObjects + 1 cleaned playwright config + 1 updated fixtures/index.ts + 3 planning artifacts) are all in tree.

## Issues Encountered

- **Pre-existing frontend build + lint failures** in `apps/frontend/src/routes/runes-test/*` blocked `yarn build` + `yarn lint:check` (spike-016 origin). Surfaced as deferred-items #9; out of 89-LAST scope. ESLint clean confirmed on changed files via direct `npx eslint <path>` invocation.
- **vite dev concurrency + db:reset cache wipe race** continues to be the dominant operator-runbook blocker for dynamic full-suite verification (89-01/02/03/04 + 89-LAST). Out of 89 milestone scope; v2.11+ dev-environment hygiene cleanup candidate.

## Known Stubs

None. Plan 89-LAST is pure deletion + configuration cleanup; no new code introduced. The 3 KEEP-verdict PageObject classes are preserved verbatim (not stubbed). The `candidate-settings.spec.ts` retirement-marker comment block is a documentation marker, not a code stub.

## Threat Flags

No new security-relevant surface introduced. Per the threat_model in 89-LAST-PLAN.md:

- **T-89-LAST-01 (Tampering — premature deletion of in-use PageObject):** MITIGATED. Task 1 audit table is the source of truth; Task 3 deletes only DELETE-verdict classes. `ProfilePage`, `QuestionPage`, `QuestionsPage` all preserved verbatim (verified via fixtures/index.ts grep).
- **T-89-LAST-02 (Denial of Service — defunct project entry in playwright.config.ts):** MITIGATED. Playwright `--list` runs clean in both default and legacy modes; zero "spec file not found" errors; zero orphan testIgnore references to deleted specs.
- **T-89-LAST-03 (Information Disclosure — excision of 7.1.3 might lose underMaintenance coverage):** ACCEPTED per D-89-04 explicit retirement + perm-* family transitively exercises the underMaintenance route-blocking semantics.
- **T-89-LAST-04 (Repudiation — lost git history on deleted specs):** ACCEPTED. `git rm` preserves history; deletion is the documented retirement per D-89-04.
- **T-89-LAST-SC (no package installs):** ACCEPTED. Zero npm/pip/cargo installs in 89-LAST.

## Next Phase Readiness

- **Phase 89 SHIPPED.** All 5 plans of Phase 89 are now complete: 89-01 (baseV1 dataset extensions) + 89-02 (candidate fixture library) + 89-03 (candidate mega-journey) + 89-04 (3 settings permutations) + 89-LAST (legacy retirement). The candidate app's e2e catalog has been migrated from the legacy PageObject-class-per-spec architecture to the function-fixture + mega-journey + perm-* family architecture established by Phase 88-01/03/04 lineage.

- **v2.10 close (Phase 88-LAST anchor capture against post-89 catalog) unblocked.** The 3-run cold-start gate at v2.10-close can now exercise the full post-Phase-89 catalog including the new mega-journey + perm chains. Pool counts will need updating; the exact deltas are TBD on operator-driven gate.

- **Surviving legacy candidate specs (5) ready for individual TIR5-deferred follow-up phases**:
  - `candidate-profile.spec.ts` (A11Y-02 persistence still pending — 3 tests at lines 295, 332, 358)
  - `candidate-profile-validation.spec.ts` (A11Y-01/05/06/07 validation matrix still pending)
  - `candidate-translation.spec.ts` (3.3.1 candidate translation still pending)
  - `candidate-bank-auth.spec.ts` (37.1.1-6 bank auth still pending; runs only under PLAYWRIGHT_BANK_AUTH=1)
  - `candidate-settings.spec.ts` residual (7.1.1 read-only + 7.1.7/8 hideHero + 7.1.10-17 SETTINGS-01 wave A + CAND-14 help/privacy)

### Blockers / Concerns

- The pre-existing perm-1e1cg1co cascade continues to block the canonical chained full-suite default-mode runs. Already documented in `89-…/deferred-items.md` items #8/#9 carried from 89-01.
- The vite dev concurrency race + db:reset cache wipe gap remains the dominant in-sandbox blocker for operator-less runtime verification. Operator runbook is the canonical mitigation path until v2.11+ dedicates a phase to dev-environment hygiene cleanup.

## Self-Check: PASSED

Verified prior to final commit:

- `test -f .planning/phases/89-…/89-LAST-AUDIT.md`: **FOUND**
- `test -f .planning/phases/89-…/89-LAST-VERIFY.txt`: **FOUND**
- `! test -f tests/tests/specs/candidate/candidate-auth.spec.ts`: **CONFIRMED ABSENT**
- `! test -f tests/tests/specs/candidate/candidate-password.spec.ts`: **CONFIRMED ABSENT**
- `! test -f tests/tests/specs/candidate/candidate-registration.spec.ts`: **CONFIRMED ABSENT**
- `! test -f tests/tests/specs/candidate/candidate-questions.spec.ts`: **CONFIRMED ABSENT**
- `! test -f tests/tests/specs/candidate/candidate-required-info.spec.ts`: **CONFIRMED ABSENT**
- `test -f tests/tests/specs/candidate/candidate-settings.spec.ts`: **FOUND** (residual)
- `! test -f tests/tests/pages/candidate/HomePage.ts`: **CONFIRMED ABSENT**
- `! test -f tests/tests/pages/candidate/LoginPage.ts`: **CONFIRMED ABSENT**
- `! test -f tests/tests/pages/candidate/PreviewPage.ts`: **CONFIRMED ABSENT**
- `! test -f tests/tests/pages/candidate/SettingsPage.ts`: **CONFIRMED ABSENT**
- `test -f tests/tests/pages/candidate/ProfilePage.ts`: **FOUND** (KEEP)
- `test -f tests/tests/pages/candidate/QuestionPage.ts`: **FOUND** (KEEP)
- `test -f tests/tests/pages/candidate/QuestionsPage.ts`: **FOUND** (KEEP)
- `grep -c "should show maintenance page when candidateApp is disabled\|should show maintenance page when underMaintenance is true\|should display notification popup when enabled" candidate-settings.spec.ts` (excluding comment block): **0 real test() invocations** (3 grep matches are all in the retirement-marker comment block per design)
- `grep -nE "testMatch.*candidate-(auth|password|registration|questions|required-info)|name: 'candidate-app-password'|name: 'variant-hidden-required-candidate'" tests/playwright.config.ts`: **0** (no active config references)
- `npx playwright test --list` (default mode) returns 47 tests in 39 files cleanly: **PASS**
- `PLAYWRIGHT_LEGACY=1 npx playwright test --list` enumerates surviving candidate inventory cleanly without CAND-10/11/13 blocks + without candidate-app-password / variant-hidden-required-candidate projects: **PASS**
- Commit `4e1b63b18` (Task 1) exists in git log: **FOUND**
- Commit `26fdf43c0` (Task 2) exists in git log: **FOUND**
- Commit `2e3858e64` (Task 3) exists in git log: **FOUND**
- Commit `d7354566e` (Task 4) exists in git log: **FOUND**
- Commit `b6f3d78e5` (Task 5) exists in git log: **FOUND**

---
*Phase: 89-continuing-test-refactoring-implement-the-new-candidate-jour*
*Plan: LAST*
*Completed: 2026-05-29*
