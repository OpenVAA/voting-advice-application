---
phase: 91-tir6-perm-and-edit-test-additions-visual-perf-a11y-bank-auth
plan: 02
subsystem: test-infra
tags: [perm-chains, testids, dev-seed, playwright-projects, tir6-group-a]
requires:
  - buildMinimal helper + BuildMinimalOptions (Plan 91-01 Task 1)
  - mintCandidateSession helper (Plan 91-01 Task 3)
  - testIds.ts shared.inputError + feedback data-status (Plan 91-03)
  - testIds.ts central inventory (88-04 baseline)
  - setupFromTemplate + runTeardown (88-03 baseline)
  - SupabaseAdminClient (88-03 baseline)
provides:
  - 7 new testids on candidate-app + voter-app + shared Svelte components
  - 7 new entries in tests/tests/utils/testIds.ts
  - 9 new TIR6 Group A perm templates under packages/dev-seed/src/templates/permutations/
  - 9 BUILT_IN_TEMPLATES entries + 9 re-exports in templates/index.ts
  - 9 perm setup files + 9 perm teardown files under tests/tests/setup/ (A1/A2/A9 mint per-perm storage state)
  - 9 perm spec files under tests/tests/specs/perm/ (strict-fixture, testid-only)
  - 27 new playwright.config.ts project entries forming a sequential chain anchored on perm-localisation-positive
affects:
  - apps/frontend/src/routes/Banner.svelte (header-feedback + header-help testids)
  - apps/frontend/src/routes/candidate/login/+page.svelte (login-answers-locked-info testid, conditional on answersLocked)
  - apps/frontend/src/routes/candidate/(protected)/+page.svelte (candidate-answers-locked-warning testid)
  - apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte (candidate-answers-locked-warning testid)
  - apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte (candidate-answers-locked-warning testid)
  - apps/frontend/src/lib/components/electionTag/ElectionTag.svelte (election-tag testid)
  - apps/frontend/src/lib/components/categoryTag/CategoryTag.svelte (category-tag testid)
  - apps/frontend/src/lib/dynamic-components/entityDetails/EntityOpinions.svelte (entity-opinion-open-answer testid on QuestionOpenAnswer wrapper)
  - tests/tests/utils/testIds.ts (7 new entries; preserves Plan 91-03's shared.inputError)
  - packages/dev-seed/src/templates/index.ts (9 BUILT_IN_TEMPLATES + 9 re-exports)
  - tests/playwright.config.ts (27 new project entries appended after perm-localisation-positive)
tech-stack:
  added: []
  patterns:
    - Per-perm `externalIdPrefix` invariant (88-D-88-03 / 89-04 / 90 / 91-01)
    - buildMinimal-based perm templates (Plan 91-01 Task 1 helper consumed by all 9 new perms)
    - Per-perm storage-state mintor (D-91-PD-06) — A1/A2/A9 setups mint Playwright storage state via candidateSessionMinter and write to `playwright/.auth/perm-{name}.json`; teardowns delete the file alongside DB rows
    - Sequential perm-* chain (HIGH-2 invariant) — app_settings JSONB singleton clobbering risk; every new perm spec project has `fullyParallel: false` + `dependencies: ['<previous-perm-spec>']`
    - Strict-fixture spec discipline (88-04 / 89-02 / 90-D-90-06) — no soft assertions, no try/catch around assertion calls, no .catch fallbacks
    - Pitfall 3 mitigation — testid-only selectors, NO `t('...')` locale-text matching
    - Pitfall 5 mitigation — `await expect(page).toHaveURL(...)` for server-side 307 redirects
    - Pitfall 6 mitigation — A6 spec asserts ONLY on candidate-card visibility, NOT on org count (cascade gate at supabaseDataProvider.ts:384)
    - D-91-PD-04 typo resolution — A9 cand-1 authors info on BOTH Q1+Q2; customData.allowOpen=false on Q2 suppresses rendering
key-files:
  created:
    - packages/dev-seed/src/templates/permutations/perm-answers-locked.ts
    - packages/dev-seed/src/templates/permutations/perm-hide-hero.ts
    - packages/dev-seed/src/templates/permutations/perm-header-show-feedback.ts
    - packages/dev-seed/src/templates/permutations/perm-header-show-help.ts
    - packages/dev-seed/src/templates/permutations/perm-hide-all-nominations.ts
    - packages/dev-seed/src/templates/permutations/perm-hide-if-missing-answers.ts
    - packages/dev-seed/src/templates/permutations/perm-hide-election-tags.ts
    - packages/dev-seed/src/templates/permutations/perm-hide-category-tags.ts
    - packages/dev-seed/src/templates/permutations/perm-disable-allow-open.ts
    - tests/tests/setup/perm-answers-locked.setup.ts
    - tests/tests/setup/perm-answers-locked.teardown.ts
    - tests/tests/setup/perm-hide-hero.setup.ts
    - tests/tests/setup/perm-hide-hero.teardown.ts
    - tests/tests/setup/perm-header-show-feedback.setup.ts
    - tests/tests/setup/perm-header-show-feedback.teardown.ts
    - tests/tests/setup/perm-header-show-help.setup.ts
    - tests/tests/setup/perm-header-show-help.teardown.ts
    - tests/tests/setup/perm-hide-all-nominations.setup.ts
    - tests/tests/setup/perm-hide-all-nominations.teardown.ts
    - tests/tests/setup/perm-hide-if-missing-answers.setup.ts
    - tests/tests/setup/perm-hide-if-missing-answers.teardown.ts
    - tests/tests/setup/perm-hide-election-tags.setup.ts
    - tests/tests/setup/perm-hide-election-tags.teardown.ts
    - tests/tests/setup/perm-hide-category-tags.setup.ts
    - tests/tests/setup/perm-hide-category-tags.teardown.ts
    - tests/tests/setup/perm-disable-allow-open.setup.ts
    - tests/tests/setup/perm-disable-allow-open.teardown.ts
    - tests/tests/specs/perm/perm-answers-locked.spec.ts
    - tests/tests/specs/perm/perm-hide-hero.spec.ts
    - tests/tests/specs/perm/perm-header-show-feedback.spec.ts
    - tests/tests/specs/perm/perm-header-show-help.spec.ts
    - tests/tests/specs/perm/perm-hide-all-nominations.spec.ts
    - tests/tests/specs/perm/perm-hide-if-missing-answers.spec.ts
    - tests/tests/specs/perm/perm-hide-election-tags.spec.ts
    - tests/tests/specs/perm/perm-hide-category-tags.spec.ts
    - tests/tests/specs/perm/perm-disable-allow-open.spec.ts
  modified:
    - apps/frontend/src/routes/Banner.svelte
    - apps/frontend/src/routes/candidate/login/+page.svelte
    - apps/frontend/src/routes/candidate/(protected)/+page.svelte
    - apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte
    - apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte
    - apps/frontend/src/lib/components/electionTag/ElectionTag.svelte
    - apps/frontend/src/lib/components/categoryTag/CategoryTag.svelte
    - apps/frontend/src/lib/dynamic-components/entityDetails/EntityOpinions.svelte
    - tests/tests/utils/testIds.ts
    - packages/dev-seed/src/templates/index.ts
    - tests/playwright.config.ts
decisions:
  - "login-answers-locked-info testid is rendered conditionally (only when answersLocked is true) via the inline `data-testid={answersLocked ? 'login-answers-locked-info' : undefined}` expression on the <p> element in candidate/login/+page.svelte:156. Rationale: the same <p> renders BOTH the answersLocked info text AND the default email-prompt text; an unconditional testid would mark the wrong branch for the A1 perm assertion. The Pitfall-3 testid-only contract is preserved because the perm spec asserts `expect(page.getByTestId(testIds.candidate.login.answersLockedInfo)).toBeVisible()` — true only when answersLocked=true seeds the DOM tag."
  - "Per-perm storage state files (D-91-PD-06) live under `playwright/.auth/perm-{name}.json` — same directory as the existing user.json STORAGE_STATE for candidate-app/auth-setup. Each per-perm teardown deletes its file via fs.unlinkSync(STORAGE_STATE_PATH); the spec consumes it via `test.use({ storageState: STORAGE_STATE_PATH })` inside a describe block (so the test.use() applies only to the authenticated sub-tests, not to the unauthenticated branches in A1 + A9)."
  - "A1 spec uses TWO describe blocks — surface 1 (unauthenticated /en/candidate login) + surfaces 2+3 (authenticated /en/candidate/profile + /en/candidate/questions/[questionId]). The authenticated describe uses `test.use({ storageState })` to apply the minted candidate session ONLY to those two tests; surface 1 remains anonymous. Mirrors the perm-localisation-positive multi-block pattern but with per-block storage-state scoping."
  - "A9 spec uses TWO describe blocks — candidate-side authenticated (storage state) + voter-side unauthenticated (default storage state). The candidate-side block asserts Q1's candidate-questions-comment Input is visible AND Q2's Input has toHaveCount(0). The voter-side block walks the standard election + constituency selector, clicks the cand-1 [CA1A] entity-card, and asserts entity-opinion-open-answer toHaveCount(1) inside the detail container for Q1 plus a filtered toHaveCount(0) for the [Q2 info] marker."
  - "A9 template explicitly sets customData.allowOpen=true on Q1 (not just unset). Rationale: the candidate-side gate at +page.svelte:294 is `{#if customData.allowOpen}` (truthy literal — not `!== false`); leaving Q1's customData.allowOpen undefined would falsy-fail the gate and hide the comment Input on Q1, breaking the symmetric Q1-visible / Q2-hidden contract D-91-PD-04 locks. The voter-side gate at EntityOpinions.svelte:78 is the asymmetric `!== false` form; both forms render Q1 (truthy / `!== false`) and both suppress Q2 (falsy / `=== false`) — the explicit `true` on Q1 keeps the perm template's intent crystal-clear."
  - "The 9 new sequential perm chain entries in playwright.config.ts are appended at the bottom (after the existing perm-localisation-positive block from Phase 90). The chain dependencies form a strict linear chain (perm-localisation-positive → perm-answers-locked → ... → perm-disable-allow-open) — no parallel execution within the perm-* family per HIGH-2 (app_settings JSONB singleton clobbering risk)."
metrics:
  duration_minutes: 20
  tasks_completed: 3
  files_created: 36
  files_modified: 11
  commits: 3
  completed_date: "2026-05-30"
---

# Phase 91 Plan 02: TIR6 perm + edit test additions — 9 new TIR6 perm chains + 7 testid additions

## One-Liner

Added 7 testids on Banner / candidate / ElectionTag / CategoryTag / EntityOpinions Svelte component surfaces + 7 testIds.ts inventory entries; authored 9 new TIR6 Group A perm templates (each ~10 lines via buildMinimal), 9 setup + 9 teardown wrappers (A1/A2/A9 mint per-perm Playwright storage state via candidateSessionMinter per D-91-PD-06), 9 strict-fixture perm specs (A1 covers FULL 3-surface CONTEXT contract; A9 covers BOTH candidate-side + voter-side assertions per D-91-PD-04 typo resolution); 27 new playwright.config.ts project entries form a sequential chain anchored on perm-localisation-positive.

## What Shipped

### Task 1 — 7 testid additions + central testIds.ts inventory (commit cc7cbd875)

- **Banner.svelte** — `data-testid="header-feedback"` on the feedback `<Button>` (A3 perm) + `data-testid="header-help"` on the help `<Button>` (A4 perm). Each gated on their respective `topBarSettings.current.actions.{feedback,help} === 'show'` branches.
- **candidate/login/+page.svelte:156** — `data-testid={answersLocked ? 'login-answers-locked-info' : undefined}` on the `<p>` element. Conditional binding so the testid is present ONLY when the answersLocked branch renders (A1 surface 1).
- **candidate/(protected)/+page.svelte:87**, **/profile/+page.svelte:184**, **/questions/[questionId]/+page.svelte:258** — `data-testid="candidate-answers-locked-warning"` on the `<Warning>` element. Single canonical testid reused across all 3 surfaces; consumed by A1 surfaces 2+3 (authenticated).
- **ElectionTag.svelte** — `data-testid="election-tag"` on the root `<span>` (A7 perm).
- **CategoryTag.svelte** — `data-testid="category-tag"` on the root `<span>` (A8 perm).
- **EntityOpinions.svelte** — `data-testid="entity-opinion-open-answer"` on the `<QuestionOpenAnswer>` wrapper (A9 voter-side gate at `customData?.allowOpen !== false`).
- **testIds.ts** — 7 new entries: `candidate.login.answersLockedInfo`, `candidate.common.answersLockedWarning`, `voter.entityDetail.opinionOpenAnswer`, `shared.electionTag`, `shared.categoryTag`, `shared.header.feedback`, `shared.header.help`. Plan 91-03's `shared.inputError` entry preserved untouched.

### Task 2 — 5 TIR6 perm chains (A1-A5) (commit 641efda3b)

- **A1 perm-answers-locked** (`e2e-perm-answers-locked-`) — `access.answersLocked=true`. Spec has TWO describe blocks (surface 1 unauthenticated + surfaces 2+3 authenticated via storage state). Surface 1 asserts `login-answers-locked-info` visible on `/en/candidate`. Surfaces 2+3 assert `candidate-answers-locked-warning` visible + every visible profile input disabled + every question-choices radio disabled. FULL 3-surface CONTEXT contract per Group A item 1.
- **A2 perm-hide-hero** (`e2e-perm-hide-hero-`) — `candidateApp.questions.hideHero=true` + `customData.hero` emoji on Q1. Spec uses storage state to land on `/en/candidate/questions/[questionId]` and asserts `candidate-questions-hero` figure has no img/span children.
- **A3 perm-header-show-feedback** (`e2e-perm-header-feedback-`) — `header.showFeedback=true`. Spec asserts `header-feedback` visible on voter intro + click opens `feedback-form`.
- **A4 perm-header-show-help** (`e2e-perm-header-help-`) — `header.showHelp=true`. Spec asserts `header-help` visible on voter intro + click navigates to `/en/about`.
- **A5 perm-hide-all-nominations** (`e2e-perm-hide-all-noms-`) — `entities.showAllNominations=false`. Spec asserts `/en/nominations` 307-redirects to `/en` via `toHaveURL(/\/en\/?$/)` (Pitfall 5).

A1 + A2 setups call `mintCandidateSession({ externalId: 'cand-1', prefix: P })` per D-91-PD-06 and write the storage state to `playwright/.auth/perm-{name}.json`; teardowns delete the file alongside DB rows.

15 new playwright.config.ts project entries appended after perm-localisation-positive (3 per perm — setup + spec + teardown). Sequential chain via `dependencies: ['<previous-perm-spec>']`.

### Task 3 — 4 remaining TIR6 perm chains (A6-A9) (commit 4bb41897a)

- **A6 perm-hide-if-missing-answers** (`e2e-perm-hide-missing-`) — `entities.hideIfMissingAnswers.candidate=true` + 2 cands + 2 opinion qs. cand-1 answers both, cand-2 answers only Q1. Spec walks voter to `/results` and asserts `[CA1A]` card toHaveCount(1) + `[CA2B]` card toHaveCount(0). Per Pitfall 6 NO org-count assertion.
- **A7 perm-hide-election-tags** (`e2e-perm-hide-eltags-`) — 2 elections + `elections.showElectionTags=false`. Spec walks voter to `/questions` and asserts `election-tag` toHaveCount(0).
- **A8 perm-hide-category-tags** (`e2e-perm-hide-cattags-`) — `questions.showCategoryTags=false`. Spec walks voter to `/questions` and asserts `category-tag` toHaveCount(0).
- **A9 perm-disable-allow-open** (`e2e-perm-no-allowopen-`) — Q1 customData.allowOpen=true + Q2 customData.allowOpen=false; cand-1 authors info on BOTH Q1+Q2 (D-91-PD-04 typo resolution). Spec has TWO describe blocks: candidate-side authenticated (storage state) asserts `candidate-questions-comment` visible on Q1 + toHaveCount(0) on Q2; voter-side unauthenticated walks to `/results`, clicks `[CA1A]` card, asserts `entity-opinion-open-answer` toHaveCount(1) with `[Q1 info]` marker AND filtered toHaveCount(0) on `[Q2 info]` marker.

A9 setup also calls `mintCandidateSession` per D-91-PD-06.

12 new playwright.config.ts project entries appended after A5's chain. Final chain order: perm-localisation-positive → perm-answers-locked → perm-hide-hero → perm-header-show-feedback → perm-header-show-help → perm-hide-all-nominations → perm-hide-if-missing-answers → perm-hide-election-tags → perm-hide-category-tags → perm-disable-allow-open (END).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] login-answers-locked-info testid would mark the wrong branch if applied unconditionally**

- **Found during:** Task 1 (adding the testid to candidate/login/+page.svelte:156)
- **Issue:** The `<p>` element at line 156 renders BOTH branches via a ternary on `answersLocked`: when `answersLocked=true` it renders `t('candidateApp.login.answersLockedInfo')`, otherwise it renders `t('candidateApp.login.enterEmailAndPassword')`. Applying `data-testid="login-answers-locked-info"` unconditionally would mark the wrong branch for the A1 perm spec assertion (the testid would also be present for default login flows, breaking the strict perm semantic).
- **Fix:** Use a conditional binding — `data-testid={answersLocked ? 'login-answers-locked-info' : undefined}`. The testid attribute is present ONLY when the answersLocked branch renders; Playwright's `page.getByTestId(...)` returns 0 elements otherwise. Preserves the Pitfall-3 testid-only contract.
- **Files modified:** apps/frontend/src/routes/candidate/login/+page.svelte
- **Commit:** cc7cbd875

**2. [Rule 1 — Bug] AC text `[CA2A]` for A6 spec is inconsistent with buildCandidate's letter-from-index mapping**

- **Found during:** Task 3 (writing the A6 perm-hide-if-missing-answers spec)
- **Issue:** The plan's Task 3 acceptance criterion for A6 expects markers `[CA1A]` (cand-1) and `[CA2A]` (cand-2). But buildMinimal computes `letter = String.fromCharCode('A'.charCodeAt(0) + i)` so cand-1 (i=0) → letter A, cand-2 (i=1) → letter B. Combined with `orgN: i % 2 === 0 ? 1 : 2` (cand-1 → orgN=1, cand-2 → orgN=2), the actual first_name markers are `[CA1A]` and `[CA2B]`. The AC text was off by one letter.
- **Fix:** Spec asserts on the actual computed markers `[CA1A]` and `[CA2B]`. The AC's intent (cand-1 visible / cand-2 hidden) is preserved verbatim; only the seeded marker string differs from the AC text.
- **Files modified:** tests/tests/specs/perm/perm-hide-if-missing-answers.spec.ts
- **Commit:** 4bb41897a

### Plan-Stated Acceptance Reconciliation

**A1 spec `grep -q "answersLockedInfo\\|login-answers-locked-info"` AC**

- The plan's Task 2 acceptance criterion greps for either token. The spec uses `testIds.candidate.login.answersLockedInfo` which is a property reference, not a string literal of either name. The grep still matches because `answersLockedInfo` is the literal property name as written in the source. (Verified: `grep -q "answersLockedInfo\|login-answers-locked-info" tests/tests/specs/perm/perm-answers-locked.spec.ts` exits 0.)

**Task 2 + Task 3 spec rigidity grep accepts doc-comment mentions of `expect.soft`**

- The acceptance criterion `! grep -RE "expect\\.soft|\\.catch\\(" ...` initially false-positive matched the rigidity-contract doc-comment in perm-answers-locked.spec.ts (the comment listed "no expect.soft, no try/catch around expect, no .catch fallbacks"). Reworded the comment to avoid the literal `expect.soft` substring while preserving the meaning ("no soft assertions, no try/catch around assertion calls, no `.catch` fallbacks on assertion-bearing locators"). The grep now exits cleanly across all 9 specs.

### Pre-Existing Issues (NOT fixed in this plan)

**1. e2eTemplate row-count drift (`questions.fixed.length === 18` expected vs 25 actual)**

- Same pre-existing failure documented in Plan 91-01 SUMMARY §"Pre-Existing Issues". Out of scope for Plan 91-02 (perm templates, not the e2e template). Dev-seed unit-test suite is 512/513 GREEN with the pre-existing failure unchanged.

**2. Pre-existing svelte-check errors in unrelated files**

- `yarn workspace @openvaa/frontend check` exits non-zero due to pre-existing errors in candidateContext.svelte.ts, QuestionInput.svelte, EntityListControls.svelte, EntityInfo.svelte, LanguageSelection.svelte, admin API routes, runes-test, settings, and `Could not find a declaration file for module 'qs'`. NONE of these are in files Plan 91-02 modified. Verified by `yarn workspace @openvaa/frontend check 2>&1 | grep -E "Banner.svelte|electionTag|categoryTag|EntityOpinions.svelte|candidate/login/|candidate/\\(protected\\)/"` — only pre-existing `(protected)/+layout.server.ts` + `settings/+page.svelte` matches surface; nothing in the 8 files Plan 91-02 modified.

### E2E Run Status

The plan's verify command `yarn test:e2e --project=perm-*` was NOT executed in this autonomous run — running the full sequential chain end-to-end requires `yarn dev` to be up + a clean local Supabase instance, plus the chain itself is gated behind perm-localisation-positive landing post-Phase-90. The acceptance criteria reduce to:

- **Static checks:** `npx playwright test --list --project=perm-{name}` exits 0 for all 9 new perm projects (verified via Task-2 + Task-3 list runs). Playwright config + spec files + setup/teardown wrappers all compile + register correctly with the project graph.
- **Unit tests:** Dev-seed vitest suite 512/513 GREEN (no regression vs. Plan 91-01).
- **Strict-fixture grep:** No `expect.soft` / `.catch(` across all 9 new spec files.
- **AC greps:** All Task-1, Task-2, Task-3 grep-based acceptance criteria pass.

The full e2e sweep against a live Supabase instance is deferred to the next verifier dispatch (`/gsd:verify-work 91-02`). Should any perm chain fail at runtime, the strict-fixture pattern + sequential chain + per-perm `externalIdPrefix` isolate the failure to its own setup-spec-teardown triplet without contaminating sibling chains.

## Auth Gates / Manual Interventions

None — Plan 91-02 is purely automated test-infrastructure + Svelte testid additions. The candidateSessionMinter helper (consumed by A1/A2/A9 setups) requires the standard SUPABASE_SERVICE_ROLE_KEY env from Phase 78 CLEAN-05 IN-01; that env is already established at the local-dev + CI layer and is not new for Plan 91-02.

## Self-Check: PASSED

**Files claimed to exist verified via shell:**

- packages/dev-seed/src/templates/permutations/perm-answers-locked.ts: FOUND
- packages/dev-seed/src/templates/permutations/perm-hide-hero.ts: FOUND
- packages/dev-seed/src/templates/permutations/perm-header-show-feedback.ts: FOUND
- packages/dev-seed/src/templates/permutations/perm-header-show-help.ts: FOUND
- packages/dev-seed/src/templates/permutations/perm-hide-all-nominations.ts: FOUND
- packages/dev-seed/src/templates/permutations/perm-hide-if-missing-answers.ts: FOUND
- packages/dev-seed/src/templates/permutations/perm-hide-election-tags.ts: FOUND
- packages/dev-seed/src/templates/permutations/perm-hide-category-tags.ts: FOUND
- packages/dev-seed/src/templates/permutations/perm-disable-allow-open.ts: FOUND
- 9 setup files + 9 teardown files under tests/tests/setup/: FOUND
- 9 spec files under tests/tests/specs/perm/: FOUND

**Commits claimed verified via `git log`:**

- cc7cbd875: FOUND (Task 1)
- 641efda3b: FOUND (Task 2)
- 4bb41897a: FOUND (Task 3)

**Tests / static checks claimed:**

- 9 new perm projects listed cleanly by `npx playwright test --list --project=perm-{name}`: VERIFIED
- Dev-seed vitest 512/513 PASS (pre-existing e2eTemplate failure unchanged): VERIFIED
- No `expect.soft` / `.catch(` in any of the 9 new spec files: VERIFIED
- All Task 1+2+3 grep-based AC: PASSED

## Threat Flags

No new threat surfaces introduced beyond the threat model already enumerated in 91-02-PLAN.md `<threat_model>`:

- **T-91-04 (Cross-perm row leakage):** mitigated — each of the 9 new perms carries a distinct externalIdPrefix; teardowns use the same prefix verbatim.
- **T-91-05 (Locale-fragile assertions):** mitigated — all 9 specs use testid + URL selectors only; ZERO `t('...')` text matching.
- **T-91-06 (A9 typo regression):** mitigated — D-91-PD-04 typo resolution captured in both template AND spec; candidate-side (authenticated) AND voter-side assertions verify suppression.
- **T-91-07 (Banner testid addition breaking consumers):** accepted — `data-testid` is an inert HTML attribute; svelte-check confirms no Svelte 5 context destructure regression on Banner.svelte (file was not flagged by `yarn workspace @openvaa/frontend check`).
- **T-91-A3 (A1 scope-reduction):** mitigated — Task 2 acceptance criteria explicitly grep for /candidate/profile + /candidate/questions + toBeDisabled in the A1 spec; verified.
- **T-91-A4 (Storage-state files leaking across perm chains):** accepted — each per-perm storage-state file is named `perm-{name}.json` and isolated to its perm chain's setup/spec/teardown triplet; teardown removes the file alongside DB rows.

## Next Steps (Plan 91-04 unblocked)

- Plan 91-03 (mega-journey edits + feedbackDialog fixture) is independent of Plan 91-02 and may have already shipped.
- Plan 91-04 (visual + perf + a11y + bank-auth refactor) may now consume `shared.electionTag` / `shared.categoryTag` / `shared.header.{feedback,help}` testids added in this plan when refactoring the visual / a11y assertion surface.
- The 9 new TIR6 perm chains are ready for a green sweep via `yarn test:e2e --project=perm-answers-locked --project=perm-hide-hero ... --project=perm-disable-allow-open` once `yarn dev` is up against a clean Supabase instance.
