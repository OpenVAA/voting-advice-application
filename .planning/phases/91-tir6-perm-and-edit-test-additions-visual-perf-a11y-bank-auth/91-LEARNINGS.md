---
phase: 91
phase_name: "tir6-perm-and-edit-test-additions-visual-perf-a11y-bank-auth"
project: "OpenVAA Framework Evolution"
generated: "2026-05-31"
counts:
  decisions: 11
  lessons: 10
  patterns: 10
  surprises: 6
missing_artifacts:
  - "91-UAT.md (not authored — phase shipped E2E suite changes; runtime confirmation routed to operator runbook)"
---

# Phase 91 Learnings: tir6-perm-and-edit-test-additions-visual-perf-a11y-bank-auth

## Decisions

### D-91-PD-06 REVISED — Delete candidateSessionMinter, do NOT wrap it
The synth-token `candidateSessionMinter` helper authored in Plan 91-01 was DELETED outright (185-line helper + 91-line vitest coverage) rather than re-implemented or wrapped. A1/A2/A9 perm setups now mint authenticated storage state via real `forceRegister` + real UI login through the candidate-app login form. The plan's `<gap_closure_directive>` explicitly listed three forbidden alternatives: re-implementing synth-tokens with `auth.admin.generateLink + exchangeCodeForSession`, keeping the helper as a `forceRegister + UI-login` wrapper, and premature centralisation of UI-login into a shared utility.

**Rationale:** Locally-signed synthetic base64 tokens fail server-side `safeGetSession()` JWT signature validation in the SvelteKit Supabase adapter — A1/A2/A9 sub-tests would redirect to `/candidate/login` instead of asserting on the protected layout. Pays ~5s of extra perm-setup runtime for a real signed Supabase session that survives validation.
**Source:** 91-05-PLAN.md `<gap_closure_directive>`, 91-VERIFICATION.md §CR-01

### D-91-PD-07 — Named-params for builders with >1 confusable positional params
All `shared.ts` builders + new helpers (`buildMinimal`, `candidateSessionMinter`) now accept a single named-options object instead of multiple positional params. Single-param functions stay positional. `buildCandidate.answersByExternalId` made optional (default empty map at leaf-builder) — assembling layer is responsible for population. `buildMinimal` defaults `candidateAnswersDefault: 'all'` (every candidate carries an answer to every seeded question).

**Rationale:** Positional-argument confusion is a real failure mode at 130+ call sites. Hardcoded `buildStandardCandidateAnswers(P)` inside `buildCandidate` blocked the clean-candidate use case needed by A6 (hide-if-missing-answers).
**Source:** 91-CONTEXT.md §decisions D-91-PD-07, 91-01-SUMMARY.md §Task 0

### D-91-MJ-01 — Mega-journey absorption (no new spec files for edit-step additions)
The 3 TIR6 edit-step additions (candidate `invalidUrl`, voter `feedbackDialog`, voter `all-nominations`) append into the existing `candidate-mega-journey.spec.ts` / `voter-mega-journey.spec.ts` — no new spec files. Preserves the "one canonical journey per app" invariant.

**Rationale:** Follows TIR6's "New step:" / "Edit candidate journey: Step:" phrasing and the 89-D-89-01 lockstep precedent.
**Source:** 91-CONTEXT.md §decisions D-91-MJ-01

### D-91-MJ-02 — feedbackDialog as new SHARED fixture under fixtures/shared/
New `tests/tests/fixtures/shared/feedbackDialog.fixture.ts` function-fixture exposes `expectVisible/Hidden/SendDisabled/SendEnabled`, `setRating/Comment`, `submit/cancel`, `expectSuccess/RatingValue/CommentValue`. Strict testids only.

**Rationale:** Voter-mega consumes immediately; candidate-side flows (CandidateNav openFeedbackModal) can later reuse without forking. Shared location enables forward use without coupling to voter-mega.
**Source:** 91-CONTEXT.md §decisions D-91-MJ-02

### D-91-MJ-03 — Conservative two-stage spec deletion (only voter-feedback-persistence)
Phase 91 deletes ONLY `voter-feedback-persistence.spec.ts` (absorbed by voter-mega feedbackDialog step). 12 other potentially-overlapping voter-*/candidate-* specs stay untouched; broader supersession sweep deferred to v2.11+.

**Rationale:** Aligns "two mega-journeys + perm are canonical" with conservative-scope discipline of 89-D-89-04. Researcher lists overlaps for future cleanup but does NOT act.
**Source:** 91-CONTEXT.md §decisions D-91-MJ-03

### D-91-RS-03/04 — voter.fixture.ts deprecated-not-deleted; @deprecated JSDoc only
`tests/tests/fixtures/voter.fixture.ts` keeps its 12 remaining legacy consumers; only the 3 TIR6 refactor targets (visual / perf / a11y) migrate to `voter-mega.fixture.ts`. Legacy fixture gets a top-of-file `@deprecated — Phase 91. Deletion scheduled v2.11+` JSDoc banner. No runtime `console.warn` (researcher decided — risks E2E noise).

**Rationale:** Full migration of 12 remaining consumers is out of scope for Phase 91. Deprecation banner signals future intent without forcing same-phase churn.
**Source:** 91-CONTEXT.md §decisions D-91-RS-03 / D-91-RS-04

### D-91-RS-05 — Bank-auth swap to @playwright/test direct, keep JWE+env-gating intact
`candidate-bank-auth.spec.ts` import swapped from `'../../fixtures'` (legacy index root) to `@playwright/test` direct. Test body uses raw `test.use({ storageState: { cookies: [], origins: [] } })` + raw `page` — no fixture consumption needed. JWE-token synthesis + `PLAYWRIGHT_BANK_AUTH=1` env-gating preserved verbatim.

**Rationale:** Edge-Function-direct tests synthesise their own state; perm-dataset authoring would add no value. Minimal pass per scope.
**Source:** 91-CONTEXT.md §decisions D-91-RS-05

### Task 8 SKIP — Verification gate #3 outweighs LOC-duplication threshold
Plan 91-05 Task 8 (extract shared `loginAndSaveCandidateStorageState` helper) was SKIPPED despite the 3 perm setups exceeding the >25 LOC duplication threshold (~52 LOC of shared content per file, ~156 total). Inline pattern retained.

**Rationale:** Verification gate #3 (`grep -l 'forceRegister(' tests/tests/setup/perm-*.setup.ts` must return all 3 files) is a literal-grep contract. Extracting `forceRegister(...)` into a helper file would hide the call inside the helper, failing the gate. Plan's `<gap_closure_directive>` also lists "Premature centralisation of UI-login into a shared utility" under forbidden alternatives.
**Source:** 91-05-SUMMARY.md §Task 8 Decision

### Task 6 Option B — voterTest aliased as test for entire file
Plan 91-05 Task 6 offered Option A (mixed `@playwright/test` `test` + `voterTest` runners) and Option B (`voterTest` aliased as `test` for whole file, candidate-side block uses `voterTest.use({ storageState })`). Plan preferred A; executor chose B after A surfaced 5 `playwright/no-standalone-expect` lint errors.

**Rationale:** `playwright/no-standalone-expect` plugin does not recognise custom `voterTest()` as a test-block runner (tests/eslint.config.mjs has no `additionalTestBlockFunctions` config). Aliasing `voterTest` as `test` gives the plugin a recognised name. Candidate-side `answeredVoterPage` fixture is lazy — uninvoked if not destructured.
**Source:** 91-05-SUMMARY.md §Task 6 Decision

### Drawer locator anchored on testIds.shared.navigation.menu, NOT getByRole('dialog')
The voter-mega-journey cycle-3 fix anchors `menuDrawer = page.getByTestId(testIds.shared.navigation.menu)` (the `<nav data-testid="nav-menu">` element in Navigation.svelte:56-62) instead of the fallback `page.getByRole('dialog', { name: /menu/i })`.

**Rationale:** The daisyUI drawer is a CSS-only checkbox-toggled overlay (Layout.svelte:75-83 + 107-111), not a true `<dialog>` element. `getByRole('dialog')` would not match. The testid is already exported and is a stable testid-only anchor consistent with the strict-fixture discipline.
**Source:** 91-05-SUMMARY.md §key-decisions

### Hybrid port for perm-localisation-positive — buildMinimal topology + hand-authored override
Of the 6 ported perm templates in Plan 91-01, `perm-localisation-positive` uses `buildMinimal({ organizations: 1, candidates: 0, opinionQuestions: 0, infoQuestions: 0 })` for topology + app_settings, then spreads + overrides with hand-authored `question_categories / questions / candidates / nominations` blocks for the bespoke 4-question + [Q1..Q4] markers + `[en-answer-qN]` content + `disableMultilingual customData` + `allow_open: true` flags.

**Rationale:** The L10N spec depends on this shape byte-for-byte; buildMinimal's defaults cannot generate it cleanly. Hybrid preserves the topology helper's value (app_settings + base shape) without forcing extension for one bespoke perm.
**Source:** 91-01-SUMMARY.md §key-decisions

---

## Lessons

### Locally-signed synthetic JWTs do not pass server-side safeGetSession() validation
The `candidateSessionMinter` helper authored in Plan 91-01 synthesised `sb-access-token` + `sb-refresh-token` cookies + `sb-auth-token` localStorage entries — all with base64-encoded payloads that were never signed by Supabase GoTrue. The helper's vitest coverage (`vi.mock('./supabaseAdminClient')`) was green. But the SvelteKit Supabase adapter's `safeGetSession()` validates JWT signatures server-side on every protected-route request, so all A1/A2/A9 authenticated sub-tests would redirect to `/candidate/login` at runtime. Verification surfaced this as a BLOCKER → triggered Plan 91-05 gap closure to replace with real `forceRegister` + UI login.

**Context:** Three weeks of authoring effort across Plans 91-01 + 91-02 sunk because the auth mechanism was prototyped without an integration smoke check before the perm-spec consumers fanned out. **Future rule:** When authoring a new auth-adjacent helper, run a single end-to-end smoke (1 perm setup + 1 protected-route assertion) BEFORE writing the helper's consumers.
**Source:** 91-VERIFICATION.md §CR-01, 91-05-PLAN.md `<gap_closure_directive>`, [[feedback_scout_first_for_structural_phases]]

### Hand-rolled located walks break under single-election + single-constituency auto-imply
The pattern `page.goto('/en') → home.startButton.click() → elections.continue.click() → constituencies.continue.click() → page.goto('/en/results')` works when there are ≥2 elections or ≥2 constituencies to select from. Under single-election + single-constituency auto-imply, the elections.continue / constituencies.continue testids may not render (auto-redirect), making `.click()` hang or skip and `page.goto('/en/results')` short-circuit onto a partially-located /results page.

**Context:** Both `perm-hide-if-missing-answers.spec.ts` + `perm-disable-allow-open.spec.ts` voter-side block tripped this. Consume `voter-mega.fixture.ts`'s `answeredVoterPage` (which uses `walkUntilQuestionsIntro` + `answerAndAdvanceToResults`) — the fixture owns the canonical walk and handles auto-imply transparently.
**Source:** 91-VERIFICATION.md §CR-02, 91-RESEARCH.md Pitfall 6

### Drawer locators rooted at page race against close/open transitions in multi-cycle interactions
The voter-mega-journey feedback drawer cycle-3 reopen used `page.getByTestId(testIds.shared.navigation.menuItem).filter({hasText: ...})` (page-rooted). Between cycle-2 close and cycle-3 open, the previous drawer's `menuItem` element is still in the DOM during the close-transition; the locator matches the stale item and clicks it during fade-out. Cycles 1+2 also benefit from the fix even though only cycle-3 surfaced the flake.

**Context:** Belt-and-braces fix: anchor on the open `menuDrawer` testid + `menuDrawer.waitFor({state:'visible'})` before each menu-item click (3 visible-waits) + `menuDrawer.waitFor({state:'hidden'})` between cycles (2 hidden-waits) = 5 total waitFor calls.
**Source:** 91-VERIFICATION.md §CR-03, 91-05-SUMMARY.md §patterns-established

### Over-broad locale regexes on EN-only walks are unnecessary surface area
The voter-mega-journey is EN-exclusive (all step doc-comments reference `en` throughout). The feedback filter regex `/feedback|palaute|återkoppling/i` had no semantic value (no fi or sv branches are exercised) and increased false-positive match risk. Tightened to `/feedback/i`.

**Context:** Pattern applies to other EN-exclusive spec walks. Don't carry over multi-locale regexes from copy-pasted helpers when the walk is single-locale.
**Source:** 91-05-PLAN.md §CR-03

### Verification gates with literal-grep contracts can constrain refactoring choices
Plan 91-05 Task 8's helper extraction was structurally justified by the LOC-duplication metric (~52 LOC × 3 files) but blocked by verification gate #3's literal `grep -l 'forceRegister(' tests/tests/setup/perm-*.setup.ts` contract. The gate trumped the metric.

**Context:** When authoring verification gates, prefer behavioural assertions ("setups call forceRegister") over file-path-coupled greps ("file X contains literal Y") to avoid foreclosing future refactoring. Or, when the literal grep IS the intent (e.g., to enforce inline pattern across N parallel files), make that intent explicit.
**Source:** 91-05-SUMMARY.md §Task 8 Decision

### Mixed Playwright runners trip playwright/no-standalone-expect lint
A spec file with both `import { test } from '@playwright/test'` (for one describe block) AND `import { voterMegaTest as voterTest } from '../../fixtures/voter-mega.fixture'` (for another) generates 5 lint errors per `voterTest()` test callback. The plugin's test-block detection requires an `additionalTestBlockFunctions: ['voterTest']` config in eslint that this project does not set.

**Context:** Either (a) configure `additionalTestBlockFunctions` for every custom runner, or (b) standardise on a single runner per file (the chosen fix here — alias `voterTest` as `test`). Option (b) is simpler when the custom runner extends the base `test`.
**Source:** 91-05-SUMMARY.md §Task 6 Decision

### state.complete-phase SDK tool corrupts milestone-level frontmatter
Running `gsd-sdk query state.complete-phase --phase 91` mangled `milestone_name` (overwrote with an unrelated ship-anchor string) AND flipped milestone-level `status: verifying` → `status: completed`, even though only the phase had completed. Required manual repair.

**Context:** Treat `state.complete-phase` as untrusted on milestone fields. After invoking, diff STATE.md and revert any milestone-level field changes that weren't phase-scoped. Worth filing as an upstream GSD bug.
**Source:** Direct observation during orchestration; STATE.md repair commit 086e4224b

### Vitest workspace doesn't auto-discover tests/ — needs explicit vitest.config.ts
Root `vitest.workspace.ts` only includes `packages/**`. The plan's `yarn vitest run tests/tests/utils/candidateSessionMinter.test.ts` invocation would have failed without a discoverable config. Required authoring `tests/vitest.config.ts` (minimal node-env, restricted to `tests/utils/**/*.test.ts`) so Playwright spec files in `tests/specs/**` are not picked up.

**Context:** Surfaced during Plan 91-01 Task 3. Future tests-directory vitest needs already covered by the config.
**Source:** 91-01-SUMMARY.md §Deviations

### buildElectionConstituencyNoms always emits or-1 + or-2 parent nominations
With `organizations: 1`, the canonical `buildElectionConstituencyNoms` from `shared.ts` would emit an `or-2` parent nomination row that orphan-FKs against the missing organisation row. buildMinimal had to add a `buildSingleOrgNoms` branch (mirroring the file-local helper from `perm-localisation-positive.ts`).

**Context:** Future helpers that compose `buildElectionConstituencyNoms` for single-org topologies must include this branch. Worth lifting `buildSingleOrgNoms` into `shared.ts` if a third caller needs it.
**Source:** 91-01-SUMMARY.md §Deviations

### Subagents may complete worktree commits without auto-merging back to main checkout
Claude Code `isolation="worktree"` creates the worktree under `<sibling-checkout>/.claude/worktrees/agent-<id>/` and commits land on a `worktree-agent-<id>` branch — they do NOT auto-merge into the orchestrator's branch. The orchestrator must explicitly `git merge --ff-only <worktree-branch>` after the executor returns + `git worktree remove --force` (often with `-f -f` if locked).

**Context:** Surfaced during Plan 91-05 dispatch — the executor returned successfully but `ls 91-05-SUMMARY.md` returned "No such file" until manual FF-merge. Worth checking whether the GSD workflow's step 5.5 cleanup loop actually runs in this runtime.
**Source:** Direct observation during orchestration; FF-merge `git merge --ff-only adda740ef`

---

## Patterns

### Real-Supabase perm-setup auth (forceRegister + UI login + storageState save)
The canonical Playwright storage-state mint for an authenticated candidate session: `setupFromTemplate(template) → client.unregisterCandidate(email) (defensive no-op) → client.forceRegister(externalId, email, password) → waitForLoginForm(page, route, emailTestid) → fill email + password + click submit → expect(page).not.toHaveURL(/.*login.*/) → page.context().storageState({ path })`. Uses `setup.setTimeout(90000)` ceiling.

**When to use:** Any Playwright perm setup that needs an authenticated candidate session in subsequent spec tests. Forbidden alternative: synth-token cookie/localStorage minting.
**Source:** 91-05-SUMMARY.md §patterns-established, mirrors auth.setup.ts:23-98 + data.setup.ts:137-153

### voter-mega.fixture.ts answeredVoterPage / locatedVoterPage consumption
Perm specs that need /results-landed state import via `import { voterMegaTest as test } from '../../fixtures/voter-mega.fixture'` and consume the fixture in callbacks: `async ({ answeredVoterPage }) => {...}` or `async ({ locatedVoterPage }) => {...}`. The fixture's `walkUntilQuestionsIntro` + `answerAndAdvanceToResults` own the canonical Home → Intro → Elections → Constituencies → /questions → /results walk.

**When to use:** Any spec asserting on /results or /questions when the test needs a fully-located voter (with or without answers). Replaces hand-rolled `page.goto + click chains`.
**Source:** 91-05-SUMMARY.md §patterns-established, 91-04-SUMMARY.md §migration

### buildMinimal({...}) for terse perm template authoring
Authoring a new perm template: `defineTemplate(buildMinimal({ externalIdPrefix: 'e2e-perm-X-', candidates: N, opinionQuestions: M, infoQuestions: K, settingsOverlay: { ... } }))`. ~10 lines per perm. No baseV1 dependency — pure primitive composition.

**When to use:** Perm templates with minimal topology (1 election / 1 CG / 1 CO / N cands / M opinion qs / optional K info qs) + a settings-overlay. Use the `settingsOverlay` field to scope the perm to its tested DynamicSettings branch. For non-minimal topologies (`perm-2e-*`, `perm-disjoint-1co`, etc.), stay bespoke.
**Source:** 91-CONTEXT.md §decisions D-91-PD-01/02, 91-01-SUMMARY.md §Task 1

### Hybrid port — buildMinimal topology + spread-override for bespoke spec content
When a perm template has byte-for-byte content dependencies (e.g., `[Q1..Q4]` markers, `[en-answer-qN]` text, bespoke `customData` flags) that buildMinimal's defaults cannot generate cleanly: use buildMinimal for topology + app_settings, then spread the result and override the bespoke fields (`question_categories / questions / candidates / nominations`) with hand-authored blocks.

**When to use:** Ports where the spec's assertions reference exact seeded strings or content shapes that the helper cannot derive from parameters. Avoid extending the helper for one-off bespoke shapes.
**Source:** 91-01-SUMMARY.md §key-decisions (perm-localisation-positive)

### Per-perm template + per-perm playwright project chain
Each TIR6 perm gets its own template file, its own spec file, AND its own playwright.config.ts triplet: `data-setup-perm-X → perm-X → data-teardown-perm-X` projects with sequential dependencies. Per-template `externalIdPrefix` decouples concurrent perm runs. 27 new project entries appended after `perm-localisation-positive` for the 9 TIR6 perms.

**When to use:** Any new perm scope. The HIGH-2 invariant from 91-RESEARCH (app_settings JSONB singleton clobbering risk) means perm projects MUST chain sequentially, not run in parallel.
**Source:** 91-CONTEXT.md §decisions D-91-PD-05, 91-RESEARCH.md Pitfall HIGH-2

### Belt-and-braces drawer-transition waits in multi-cycle drawer interactions
For tests that open + interact + close a drawer multiple times in sequence: anchor menu-item locators on the open drawer container (testid-scoped), insert `await menuDrawer.waitFor({state:'visible'})` BEFORE each menu-item click, AND `await menuDrawer.waitFor({state:'hidden'})` AFTER each cycle's expect-hidden before the next openMenu click.

**When to use:** Any spec that re-opens the same drawer ≥2 times. Page-rooted locators absorb close-transition races silently — only one of the cycles will flake. Eliminates close-transition vs. reopen-click ordering ambiguity.
**Source:** 91-05-SUMMARY.md §patterns-established, mirrors voter-mega-journey cycles 1-3

### vi.mock unit-test pattern for Supabase-dependent helpers
For test-utility helpers that depend on SupabaseAdminClient (or other infrastructure clients), wrap the dependency with `vi.mock('./supabaseAdminClient', ...)` in the vitest file so the helper's logic is testable without a live Supabase instance.

**When to use:** Authoring vitest coverage for new test-utility helpers. Note: doesn't catch integration-level failures (see Lesson: synth-JWTs don't pass safeGetSession) — only unit-level correctness.
**Source:** 91-01-SUMMARY.md §tech-stack patterns (candidateSessionMinter.test.ts)

### Function-fixture composition root for cross-spec shared fixtures
New shared fixtures land at `tests/tests/fixtures/shared/<name>.fixture.ts` (function-fixture pattern, 89-02 lineage). The fixture exports a factory: `feedbackDialog(page) → { expectVisible, expectHidden, ... }`. Consumers compose at the spec level — no fixture-context coupling.

**When to use:** Reusable assertion bundles for UI surfaces that >1 spec exercises (here: feedback drawer, future: candidate-side feedback modal).
**Source:** 91-CONTEXT.md §decisions D-91-MJ-02, 91-03-SUMMARY.md

### @deprecated JSDoc banner for legacy fixtures pending consumer migration
Top-of-file JSDoc: `@deprecated — Phase N. Migrate consumers to <new-fixture>. Deletion scheduled v<X>+ <retirement-phase>.` No runtime `console.warn` (avoids E2E log noise). Signals future intent without forcing same-phase churn.

**When to use:** When a fixture is being superseded but full consumer migration is out of scope for the current phase. The 12 remaining `voter.fixture.ts` consumers can migrate gradually.
**Source:** 91-CONTEXT.md §decisions D-91-RS-04

### Strict testid-driven selectors with [id desc] seeded content
All selectors use `testIds.X.Y.Z` chains (or `page.getByTestId(...)`). Text-content assertions reference `[id] desc` format strings (e.g., `[CA1A]`, `[Q1 info from cand-1]`) seeded by perm templates. No raw `page.locator('input:visible')` style selectors; no `text=Continue` style selectors.

**When to use:** All new spec authoring. Pre-existing raw-locator usages (`playwright/no-raw-locators` warnings at perm-answers-locked.spec.ts:57/73 + perm-hide-hero.spec.ts:32) are baseline-preserved but should not propagate.
**Source:** 91-CONTEXT.md §code_context Established Patterns, 91-VERIFICATION.md §Anti-Patterns Scan

---

## Surprises

### candidateSessionMinter passed vitest but failed at integration — verification BLOCKER
The helper authored in Plan 91-01 Task 3 had 3 green vitest cases via `vi.mock('./supabaseAdminClient', ...)`. Plan 91-02 fanned out the consumer pattern across 3 perm setups (A1/A2/A9) without an integration smoke check. Verification (Plan 91-05's prior pass) flagged CR-01 as a BLOCKER — all 3 perm chains' authenticated assertions would redirect to /candidate/login because synth-tokens don't pass `safeGetSession()` JWT validation. Triggered Plan 91-05 gap closure to delete the helper + replace with `forceRegister + UI login` (D-91-PD-06 revised).

**Impact:** ~3 weeks of authoring effort across Plans 91-01 + 91-02 had to be partially redone. The gap closure plan was ~50 minutes of executor work but the decision-revision overhead (verifying the BLOCKER, writing the gap-closure plan, threading the rationale through CONTEXT's locked-decisions amendment) was non-trivial.
**Source:** 91-VERIFICATION.md §re_verification.previous_status (gaps_found 14/22 → passed 22/22), 91-05-PLAN.md `<gap_closure_directive>`

### Task 6 Option A (preferred) tripped lint failures → fell back to Option B (fallback)
The plan's preferred option for `perm-disable-allow-open.spec.ts` was mixed runners — candidate-side keeps `@playwright/test` `test`, voter-side uses `voterTest`. Executor implemented it, ran lint, saw 5 `playwright/no-standalone-expect` errors, then switched to the plan's fallback Option B (`voterTest` aliased as `test` for the whole file).

**Impact:** No re-plan needed; the fallback was already authored. Pattern observation: when a plan offers a "preferred + fallback" pair, executors should run the lint gate BEFORE committing the preferred option to avoid a churn commit.
**Source:** 91-05-SUMMARY.md §Task 6 Decision

### Task 8 LOC threshold EXCEEDED but extraction still SKIPPED
Plan 91-05 Task 8's conditional gate is "extract iff the 3 setups share >25 identical lines." Post-Tasks 1-3, each setup carries ~52 LOC of identical content (~156 total). Quantitatively, extraction was overwhelmingly justified. But verification gate #3 (literal `grep -l 'forceRegister(' tests/tests/setup/perm-*.setup.ts`) would fail if the helper hid the call. SKIPPED.

**Impact:** Highlights the tension between code-quality metrics (DRY) and behavioural verification contracts (literal greps). Surfaces a class of bug: verification gates can foreclose otherwise-correct refactors.
**Source:** 91-05-SUMMARY.md §Task 8 Decision

### "candidateSessionMinter" still grep-matches after deletion (vitest run-cache artifact)
Post-deletion verification gate `grep -rn 'mintCandidateSession\|candidateSessionMinter' tests/` returned 1 match — but it was inside `tests/node_modules/.vite/vitest/da39a.../results.json`, a vitest run-cache file. Not source code. Not on any import path. Gate counted as PASS with explanatory note.

**Impact:** Future cite-and-delete verification gates should `grep -rn ... tests/ --exclude-dir=node_modules` to avoid cache-only matches polluting the signal.
**Source:** 91-VERIFICATION.md §Note on Gate 1 cache hit

### state.complete-phase SDK tool clobbered milestone_name + milestone-level status
Running `gsd-sdk query state.complete-phase --phase 91` mangled the `milestone_name` frontmatter field (replaced with an unrelated ship-anchor string from elsewhere in STATE.md) AND flipped milestone-level `status: verifying` → `status: completed` even though only a single phase had completed. The phase-scoped updates (Current Position, Last Activity, Status text) were correct; only the milestone-level frontmatter was corrupted.

**Impact:** Required manual STATE.md repair commit (086e4224b). Worth filing as an upstream GSD bug. **Defensive practice:** diff STATE.md after every `state.complete-phase` invocation and revert any field changes that aren't phase-scoped.
**Source:** Direct observation during orchestration

### daisyUI drawer is CSS-only checkbox-toggled overlay, NOT a `<dialog>` element
The voter-mega-journey cycle-3 fix's first instinct (per the plan's text) was to scope the menu-item locator via `page.getByRole('dialog', { name: /menu/i })`. Reading `Layout.svelte:75-83 + 107-111` revealed the drawer is a `<input type="checkbox" />` + `<aside>` overlay pattern, not a `<dialog>` element. `getByRole('dialog')` would not match. Switched to `page.getByTestId(testIds.shared.navigation.menu)` anchored on the `<nav data-testid="nav-menu">` element.

**Impact:** Reinforces the project's strict-testid discipline — role-based selectors that "should work" per the W3C role model don't necessarily match daisyUI's CSS-pattern components. Anchor on stable testids exported from `testIds.ts`.
**Source:** 91-05-SUMMARY.md §key-decisions
