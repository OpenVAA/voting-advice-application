# Phase 86: Voter-App FAILURE-CLASS Cleanup — Research

**Researched:** 2026-05-14
**Domain:** Playwright e2e determinism / Svelte 5 hydration / voter-app full-suite cold-start failures
**Confidence:** HIGH on inventory + per-test surface code; MEDIUM on per-test root-cause hypotheses (training-data RCA, not run-and-confirm); HIGH on verification-gate mechanism (Phase 79/84/85 precedent reads cleanly).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01 — Plan count: 3.** Plans aligned to roadmap's cluster grouping:
  - Plan 01 = popups + hydration + navigation/redirects (~4 tests).
  - Plan 02 = filter + feedback + (optional) question-rendering (~3 tests).
  - Plan 03 = visibility + edge-cases + (optional) question-rendering (~3 tests).
  Planner finalizes exact test allocation when reading Plan boundaries — `voter-question-rendering` straddles Plan 02 / Plan 03 cluster boundaries; planner picks based on RCA proximity.

- **D-02 — Per-cluster RCA approach.** Each plan starts with a brief RCA section (NOT a separate plan — inline in the PLAN.md body):
  - For Plan 01 (popups + hydration + navigation): hypothesis-driven instrumentation focused on hydration timing + navigation state propagation. Mirrors Phase 83 D-02 hydration-completeness-race lens.
  - For Plan 02 (filter + feedback): hypothesis-driven instrumentation focused on Svelte 5 reactivity + state-update-depth. Filter-toggle no-effect-update-depth is a likely effect_update_depth_exceeded; needs `untrack()` or similar guard per CLAUDE.md context-destructuring rule patterns.
  - For Plan 03 (visibility + edge-cases + question-rendering): per-test investigation; failures may have heterogeneous causes (QSPEC-01/02 is i18n-rendering, SETTINGS-03-hidden is variant overlay, case-d-both-missing is data-model edge-case).

- **D-03 — Acceptance per test: fix-preferred, skip-acceptable-with-rationale.**
  - Default: attempt fix (~1h investigation each).
  - Escalation: `test.skip(true, '<reason>')` with block-comment rationale + v2.11+ follow-up todo if fix exceeds budget OR requires out-of-scope product work.
  - Every skip MUST have: (1) inline `test.skip()`, (2) block comment rationale, (3) `.planning/todos/pending/2026-MM-DD-<short-name>.md`.

- **D-04 — `voter-question-rendering boolean + categorical (QSPEC-01/02)` cluster assignment.** RECOMMENDATION: Plan 03 (visibility + edge-cases) since QSPEC-01/02 is i18n-render-path which is closer to "edge-case" semantics than to "filter + feedback".

- **D-05 — Fresh 3-run cold-start gate via Phase-84-updated archived `regen-constants.mjs`.** Phase 86 moves tests OUT of FAILURE-CLASS narrative AND into PASS_LOCKED_TESTS (per fix) OR a new SKIPPED section in `diff-playwright-reports.ts` (per skip). New `SKIPPED_TESTS` const introduced if ≥ 2 skips land.

- **D-06 — Anchor expectation.** Expected post-Phase-86 anchor: ~155-160 PASS_LOCKED (Phase 85 ~150 + 8-10 net) + 3 DATA_RACE + ≤ 5 CASCADE + ≤ 2 FAILURE-CLASS (residual deferrals only). Phase 85 anchor (`411e09f5ff…`) is ABSORBED.

- **D-07 — Gate execution: agent-inline via Bash run_in_background.** ~162 min unattended.

- **D-08 — DETERM-12/13/14 must not pre-resolve out-of-scope product gaps.** SETTINGS-02/03 voter-side product gaps re-deferred to v2.11+ per STATE.md. If Phase 86 RCA reveals that fixing `voter-visibility-required SETTINGS-03 hidden absent` requires the SETTINGS-03 PRODUCT-GAP fix, the test is skipped+rationale'd, NOT pre-fixed.

- **D-09 — DATA_RACE pool MUST NOT grow** (Phase 73 D-09 binding renegotiated by Phase 84).

- **D-10 — CASCADE_BASELINE_TESTS contract.** A Phase 86 fix should not regress a CASCADE entry. A CASCADE entry promoted to PASS via a cascade-unblock is a PASS_LOCKED promotion, NOT a CASCADE regression.

### Claude's Discretion

- Planner finalizes cluster boundary for `voter-question-rendering` (Plan 02 vs Plan 03). RECOMMENDATION: Plan 03.
- Per-test fix-vs-skip decision (during Plan execution). RECOMMENDATION: 1h investigation cap before skip-escalation.
- Whether to fold the FAILURE-CLASS narrative block update into per-plan commits (atomic per cluster) OR into the constants regen commit (single atomic across all 3 plans). RECOMMENDATION: atomic-per-plan for narrative-block update (1 commit per cluster); constants regen is the single atomic close commit.
- Whether to introduce `SKIPPED_TESTS` const in `diff-playwright-reports.ts` for tracked deferrals (vs inline FAILURE-CLASS narrative comment block). RECOMMENDATION: introduce const if ≥ 2 skips land; otherwise keep inline narrative.
- Inline RCA depth per cluster (1-3 hypotheses); planner picks per cluster's known surface complexity.

### Deferred Ideas (OUT OF SCOPE)

- **SETTINGS-02 voter-side `answer.info` authoring PRODUCT-GAP** — re-deferred to v2.11+ per STATE.md. If Plan 03's `voter-visibility-required` fix is blocked, the test is skipped+rationale'd and the v2.11+ todo at `.planning/todos/pending/2026-05-12-settings-02-voter-authoring-product-gap.md` is updated to reference Phase 86's skip rationale.
- **SETTINGS-03 voter-side `customData.required` enforcement PRODUCT-GAP** — re-deferred to v2.11+ per STATE.md. Same handling as SETTINGS-02.
- **Constituency filter UI PRODUCT-GAP** — re-deferred to v2.11+.
- **Project-wide voter-app assertion hardening sweep** — Phase 83 deferred-ideas. Phase 86 may surface that FAILURE-CLASS items share a broader pattern; a v2.11+ project could do the project-wide sweep.
- **Voter-app `effect_update_depth_exceeded` hardening** — if Plan 02's filter-toggle fix lands an `untrack()` guard, a v2.11+ project could audit the full voter-app for similar patterns.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DETERM-12 | Voter-app popup + hydration FAILURE-CLASS cluster resolved: `voter-app-popups dismissal-after-reload` + `voter-popup-hydration full-page-load`. Each test passes deterministically OR `test.skip()`+rationale. | §3.1, §3.2 (per-test analysis); also covers `voter-navigation results-CTA threshold` (§3.3) + `voter-not-located-redirect /results deeplink` (§3.4) per ROADMAP DETERM-12 grouping. |
| DETERM-13 | Voter-app filter + feedback FAILURE-CLASS cluster resolved: `voter-results filter-toggle no-effect-update-depth` + `voter-feedback-persistence`. Each test passes OR `test.skip()`+rationale. | §3.5 (filter-toggle), §3.6 (feedback-persistence). |
| DETERM-14 | Voter-app visibility + edge-case + question-rendering FAILURE-CLASS cluster resolved: `voter-visibility-required SETTINGS-03`, `voter-detail case-d both-missing`, `voter-question-rendering boolean + categorical (QSPEC-01/02)`. Each test passes OR `test.skip()`+rationale. | §3.7 (visibility-SETTINGS-03), §3.8 (detail-case-d), §3.9 (QSPEC-01), §3.10 (QSPEC-02). |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

These directives override default research recommendations. Tasks generated from this research MUST respect them:

- **Svelte 5 Context Destructuring Rule.** Reactive accessors (`selectedElections`, `selectedConstituencies`, `opinionQuestions`, `infoQuestions`, `unansweredOpinionQuestions`, `unansweredRequiredInfoQuestions`, `profileComplete`, `electionsSelectable`, `constituenciesSelectable`, `matches`, `nominationsAvailable`, `resultsAvailable`, `answersLocked`, etc.) MUST be read via direct property access (`ctx.X`) inside `$derived(...)`, NEVER destructured. Stable references (`t`, `getRoute`, `appSettings`, `dataRoot`, `darkMode`, `locale`, `answers`, `userData`, lifecycle functions) MAY be destructured. The canonical pattern lives at `apps/frontend/src/routes/(voters)/(located)/results/+layout.svelte:61-79`. **Highly relevant to Plan 02 filter-toggle fix** if RCA implicates reactive-accessor leak in `EntityListWithControls.svelte` / `EntityFilters.svelte` / `filterContext`.
- **Svelte Warning-Accepted Format.** When a Svelte / vite-plugin-svelte / SvelteKit warning is intentionally accepted, use `// svelte-warning: accepted — <rationale>` immediately above the line. Use sparingly — prefer fixing at source.
- **TypeScript strictness** — avoid `any`, prefer explicit types.
- **No conditional in test.** `playwright/no-conditional-in-test` is hard-enforced. `try/catch` is exception-handling (allowed); `if`/`switch` in a `test(...)` body is forbidden.
- **Test deletion is FORBIDDEN.** Phase 86 fix-or-skip — never delete a test. `test.skip(true, '<reason>')` with block-comment rationale is the only escalation.
- **No new test runners / framework migrations.** Playwright 1.58.2 only.
- **Code review checklist applies** (`.agents/code-review-checklist.md`).

## 1. Executive Summary

Phase 86 closes the ~10 deterministic voter-app failures surfaced in the Phase 85 run-3.json canonical capture. Research established the actual inventory by parsing Phase 85's `post-fix/run-3.json`: **13 voter-app non-passing cells** (10 deterministic FAIL + 3 cascade-skipped CLEAN-02 cells that ride atop a chain-head FAIL). Each of the 10 in-scope tests cited in CONTEXT.md was located, its current code excerpt analyzed, and a per-test root-cause hypothesis formed against the cluster's RCA lens.

**The 10 deterministic FAILs in Phase 85 run-3.json:** `voter-popups dismissal-after-reload` (strict-mode close-button ambiguity — 2 elements match the regex), `voter-popups survey + disabled` (cascade-skipped by serial describe), `voter-popup-hydration full-page-load` (results-list not visible within 15s — hydration-race), `voter-navigation results-CTA threshold` (page.waitForURL timeout 30s — auto-advance navigation never completed), `voter-not-located-redirect /results deeplink chain-head` (received URL doesn't match `/elections?next=` regex, cascades 4 siblings), `voter-results filter-toggle` (post-filter card count failed to STRICTLY narrow — likely the IN-04 hardening landed on a flaky assertion), `voter-feedback-persistence` (dialog never hides after click — 2-dialog collision), `voter-question-rendering-boolean QSPEC-01` (10s timeout on `voter-questions-start` — `walkToQuestion` cannot find the intro start button), `voter-question-rendering-categorical QSPEC-02` (same `walkToQuestion` failure), `voter-visibility-required SETTINGS-03 hidden absent` (opinions tab never appeared — likely `answeredVoterPage` upstream failure given `voterAnswerCount: 15` override), `voter-detail case (d) both-missing` (Neither-has-answered message never rendered in opinions tab — likely upstream `answeredVoterPage` failure), `voter-detail party-drawer` (BOUNDARY FLAKE — passed in Phase 85 run-3 but failed in runs 1+2; classified as PASS_LOCKED-boundary graduate, NOT deterministic FAIL).

**Plan-allocation recommendation for `voter-question-rendering`:** Plan 03 (visibility + edge-cases) per CONTEXT D-04 recommendation. The actual failure mode of QSPEC-01/02 in Phase 85 run-3 is a `voter-questions-start` testId timeout — NOT an `effect_update_depth_exceeded` reactivity bug. This places it firmly outside the Plan 02 reactivity-cluster RCA lens and aligns it with the broader "fixture-fragility / cold-start hydration" lens that already covers Plan 03's `voter-visibility-required` and `voter-detail case-d`. **Plan 03 is the recommended home.**

**Critical correction to CONTEXT.md inventory:** the QSPEC-01/02 specs live in two FILES (`voter-question-rendering-boolean.spec.ts` + `voter-question-rendering-categorical.spec.ts`), not one. The voter-not-located-redirect chain-head failure (`CLEAN-02 — direct link to /results route…`) is the test that produces the 4 cascade-skipped siblings; the chain-head test is missing from CONTEXT.md's 10-item list (CONTEXT.md cites only the deeplink-cascade test, not which CLEAN-02 row is the chain head). The party-drawer flake is correctly routed here but is BOUNDARY-classified — best-fit treatment is hardening the existing Phase 83 DETERM-07b hydration guard, NOT a fix-vs-skip decision.

## 2. FAILURE-CLASS Inventory (current state, post-Phase-85 anchor)

Source: `.planning/phases/85-variant-project-cascade-rca-fix-investigate-and-close-the-47/post-fix/run-3.json` parsed via `flattenReport` (matches `diff-playwright-reports.ts` flattening). The FAILURE-CLASS narrative comment block at `tests/scripts/diff-playwright-reports.ts:42-142` is approximately 100 lines long; the legacy `:87-101` line reference in CONTEXT.md and ROADMAP is stale (block grew through Phases 84-85 narrative annotations).

| # | Project :: Spec :: Test | Phase 85 run-3 status | Categorized as |
|---|--------------------------|------------------------|----------------|
| 1 | `voter-app-popups :: voter-popups.spec.ts > should remember dismissal after page reload` | `failed` (strict-mode click violation) | deterministic FAIL (chain head of voter-app-popups serial describe — runs FIRST in feedback-popup serial block, currently does NOT cascade-skip siblings since each describe has its own serial mode, but does generate other issues) |
| 2 | `voter-app-popups :: voter-popups.spec.ts > should show survey popup after delay on results page` | `skipped` | cascade-skipped (serial describe upstream failure — actually, NOT upstream from #1; it's in the `survey popup (VOTE-16)` describe block, which has its own beforeAll. Investigation needed) |
| 3 | `voter-app-popups :: voter-popups.spec.ts > should not show any popup when disabled` | `skipped` | cascade-skipped (`popups disabled` describe block) |
| 4 | `voter-app :: voter-popup-hydration.spec.ts > popup appears on full page load to /results (LAYOUT-03 hydration path)` | `failed` (results-list never visible within 15s) | deterministic FAIL — Plan 01 hydration cluster |
| 5 | `voter-app :: voter-navigation.spec.ts > results-CTA toggles per minimumAnswers threshold` | `failed` (page.waitForURL Timeout 30s) | deterministic FAIL — Plan 01 navigation cluster |
| 6 | `voter-app :: voter-navigation.spec.ts > browser-back preserves answer state across navigation` | `skipped` | cascade-skipped (depends on #5 via serial describe) |
| 7 | `voter-app :: voter-not-located-redirect.spec.ts > CLEAN-02 — direct link to /results route with no election picked bounces twice and resumes /results` | `failed` (URL doesn't match `/elections?next=` — chain-head failure) | deterministic FAIL — Plan 01 redirect cluster |
| 8 | `voter-app :: voter-not-located-redirect.spec.ts > CLEAN-02 — multi-election multi-constituency bounces twice…` | `skipped` | cascade-skipped (depends on #7) |
| 9 | `voter-app :: voter-not-located-redirect.spec.ts > CLEAN-02 — election pre-selected via URL bounces only to constituency selector…` | `skipped` | cascade-skipped (depends on #7) |
| 10 | `voter-app :: voter-not-located-redirect.spec.ts > CLEAN-02 — refresh after localStorage clear mid-session resumes deferred target` | `skipped` | cascade-skipped (depends on #7) |
| 11 | `voter-app :: voter-not-located-redirect.spec.ts > CLEAN-02 — open-redirect attempt to external URL is rejected by whitelist` | `skipped` | cascade-skipped (depends on #7) |
| 12 | `voter-app :: voter-results.spec.ts > filter toggle narrows list without effect_update_depth_exceeded (RESULTS-01 + RESULTS-02)` | `failed` (post-filter card count failed to STRICTLY narrow) | deterministic FAIL — Plan 02 filter cluster |
| 13 | `voter-app :: voter-feedback-persistence.spec.ts > feedback text persists across dismiss and resets after send` | `failed` (feedback dialog never hides after cancel click) | deterministic FAIL — Plan 02 feedback cluster |
| 14 | `voter-app :: voter-question-rendering-boolean.spec.ts > boolean opinion question renders, voter answers, persists across goBack, mirrors on entity-detail` | `failed` (10s timeout on `voter-questions-start`) | deterministic FAIL — Plan 03 question-rendering cluster |
| 15 | `voter-app :: voter-question-rendering-categorical.spec.ts > categorical opinion question (single-choice) renders, voter answers, persists across goBack, mirrors on entity-detail` | `failed` (same `voter-questions-start` timeout as #14) | deterministic FAIL — Plan 03 question-rendering cluster |
| 16 | `variant-hidden-required-voter :: voter-visibility-required.spec.ts > SETTINGS-03 hidden question absent from voter question flow` | `skipped` (depends on cascade-broken data-setup-hidden-required) | CASCADE-via-Phase-85 — see §3.7 |
| 17 | `voter-app :: voter-visibility-required.spec.ts > SETTINGS-03 hidden question absent from voter question flow` | `failed` (opinions tab `getByTestId('voter-entity-detail-opinions')` toHaveCount mismatch) | deterministic FAIL — Plan 03 visibility cluster (NOTE: distinct from #16 — runs in the `voter-app` project, NOT the variant project) |
| 18 | `voter-app :: voter-detail.spec.ts > case (d) — both missing: "Neither has answered" message rendered` | `failed` (the "Neither" message never rendered in opinions tab — likely upstream `answeredVoterPage` failure) | deterministic FAIL — Plan 03 edge-case cluster |
| 19 | `voter-app :: voter-detail.spec.ts > should open party detail drawer with info, candidates, and opinions tabs` | **PASSED in run-3** (FAILED in runs 1+2) | BOUNDARY FLAKE — Phase 83 DETERM-07b graduate; symmetric-flake direction across Phase 84 + Phase 85 |

**Totals:** 10 deterministic FAILs + 8 cascade-skipped + 1 boundary flake = 19 tracked items in Phase 85 run-3. Of these, ~10 are FIX-CANDIDATES (#1, #4, #5, #7, #12, #13, #14, #15, #17, #18) plus 1 BOUNDARY-flake (#19, candidate for guard-tightening). Cascade-skipped siblings (#2, #3, #6, #8-11) auto-resolve when their chain-head is fixed.

**Variance from CONTEXT.md 10-item list:** CONTEXT.md cites "voter-question-rendering boolean + categorical (QSPEC-01/02)" as ONE test, but the specs live in TWO files (#14 + #15). Treating each file's test as a distinct FAILURE-CLASS row (10 distinct items below) aligns the inventory with the actual run-3 capture.

**FAILURE-CLASS narrative block location reality-check (line numbers may drift through Phase-86 commits):**
- Narrative comment block: `diff-playwright-reports.ts:42-142` (~100 lines; includes Phase 84 + Phase 85 anchor history)
- PASS_LOCKED_TESTS const: `:145-255`
- DATA_RACE_TESTS const: `:258-262`
- CASCADE_TESTS const: `:265-308`
- Phase 86 update target: the FAILURE-CLASS narrative comment block at top (introduce new `SKIPPED_TESTS` const after CASCADE_TESTS if ≥ 2 skips land per D-05).

## 3. Per-Test Analysis (10 in-scope tests + 1 boundary flake)

### 3.1 `voter-app-popups :: voter-popups.spec.ts > should remember dismissal after page reload`

**Spec path:** `tests/tests/specs/voter/voter-popups.spec.ts:111-147`

**Current test code (key assertions):**
```typescript
const dialog = page.getByRole('dialog');
await dialog.waitFor({ state: 'visible', timeout: 7000 });
await expect(dialog).toBeVisible();
// Dismiss the popup by clicking the close button.
await dialog.getByRole('button', { name: /close|sulje|stäng|luk/i }).click();
```

**Failure surface (from Phase 85 run-3):**
```
Error: locator.click: Error: strict mode violation: getByRole('dialog').getByRole('button', { name: /close|sulje|stäng|luk/i }) resolved to 2 elements:
    1) <button tabindex="0"
```
Two `<button>` elements inside the dialog have an accessible name matching the locale-resilient regex. Most likely: a "Close filters"/"Close dialog" sr-only label plus an icon-button with the same regex hit.

**RCA hypothesis (Plan 01 — hydration / state cluster lens):** This is NOT a hydration race — it's a strict-mode locator ambiguity. The feedback popup's btn-circle close button (Modal.svelte / Drawer.svelte / Alert.svelte share this pattern per the test's docstring) renders with sr-only "Close" text from `t('common.closeDialog')`. A SECOND element matching the regex was introduced post-Phase-78 — possibly the iconButton's `aria-label` per Phase 80 A11Y-04 Drawer fix landed an `aria-label="Close"` that now collides.

**Fix sketch (HIGH confidence):**
1. Replace the regex-only locator with a `.first()` resolution or a more specific scope:
   ```typescript
   await dialog.getByRole('button', { name: /close|sulje|stäng|luk/i }).first().click();
   ```
   OR scope by btn-circle class (with `// reason:` inline justification per Phase 73 lint-gate):
   ```typescript
   // eslint-disable-next-line playwright/no-raw-locators
   await dialog.locator('.btn-circle').click();
   ```
2. Alternative: use a more discriminating testId on the close button if available (e.g., `feedback-close-btn` or `modal-close`).

**Skip-rationale candidate (if fix exceeds budget):** "Phase 80 A11Y-04 Drawer aria-label introduced a strict-mode collision with the dialog's btn-circle close button regex. Locator hardening deferred — pre-existing voter-app assertion pattern needs project-wide sweep (Phase 83 deferred-ideas)."

**Out-of-scope blockers:** None. This is a test-only locator hardening fix.

**Confidence:** HIGH — the error message is dispositive.

### 3.2 `voter-app :: voter-popup-hydration.spec.ts > popup appears on full page load to /results (LAYOUT-03 hydration path)`

**Spec path:** `tests/tests/specs/voter/voter-popup-hydration.spec.ts:122-167`

**Current test code (key assertions):**
```typescript
await page.goto(`/results?electionId=${electionId}&constituencyId=${constituencyId}`);
await expect(page.getByTestId(testIds.voter.results.list)).toBeVisible({ timeout: 15000 });
const dialog = page.getByRole('dialog');
await dialog.waitFor({ state: 'visible', timeout: 15000 });
```

**Failure surface (Phase 85 run-3):**
```
Error: expect(locator).toBeVisible() failed
Locator: getByTestId('voter-results-list')
Expected: visible
Timeout: 15000ms
```
The voter-results-list never paints. This is upstream of the popup-render assertion — the test never reaches the popup wait.

**RCA hypothesis (Plan 01 — hydration cluster lens):**
- **H1 (PRIMARY):** Cold-start `/results?electionId=X&constituencyId=Y` deeplink with seeded `VoterContext-answerStore` localStorage has a hydration race: the (located)/+layout.ts loader expects to parse query-string IDs via `parseParams`, but if hydration completes before the answerStore initScript fires (race between localStorage seed and layout-load), `resultsAvailable` evaluates false and the results-list never renders. Phase 83 DETERM-07b landed a hydration-completeness guard on `voter-detail.spec.ts:141-153` — the same pattern likely applies here.
- **H2 (SECONDARY):** answerStore version mismatch — the test seeds `{ version: 1, data: answerEntries }` but `staticSettings.appVersion.requireUserDataVersion` may have shifted post-Phase-82 (A11Y-07 added new fixture rows). If `requireUserDataVersion` ≠ `version` in seed, the store is invalidated on hydrate and answers are lost.
- **H3 (TERTIARY):** the `addInitScript` localStorage seed fires correctly but the seeded answer-count (16) is BELOW the dynamic `minimumAnswers` threshold post-Phase-82 fixture additions (which added sort-22 + sort-23 + sort-24 — total opinion questions grew). Voter falls below `minimumAnswers` → `resultsAvailable=false` → /results renders in browse mode without the results-list testid.

**Fix sketch (MEDIUM confidence; needs instrumentation to disambiguate H1/H2/H3):**
- **For H1:** Add a `waitForLoadState('networkidle')` between goto and the results-list assertion. If the hydration race is the cause, networkidle gives the answerStore initScript + layout-load time to converge.
- **For H2:** Read `requireUserDataVersion` from `packages/app-shared/src/settings/staticSettings.ts` and use that exact value in the seed (not a hardcoded `1`).
- **For H3:** Either seed answers for ALL opinion questions in the current e2e seed (not just `test-question-%`), or increase the seed count by querying `dataRoot.opinionQuestions.length` first. RECOMMENDATION: derive question IDs from `findData('questions', { externalId: { $like: 'test-question-%' } })` AND `{ $like: 'test-voter-q-%' }` to cover the post-Phase-82 question population.

**Skip-rationale candidate:** "Cold-start hydration race between addInitScript localStorage seed and (located)/+layout.ts loader's parseParams. Deeplink LAYOUT-03 hydration path is the most fragile in the voter-app — alternative regression coverage via voter-results.spec.ts's filter/drawer deeplink tests covers the SSR-render-path contract. Routed to v2.11+ for proper LayoutTransition-aware hydration-completeness guard."

**Out-of-scope blockers:** None directly. Fix is contained within the spec.

**Confidence:** MEDIUM on root-cause; HIGH on the symptom.

### 3.3 `voter-app :: voter-navigation.spec.ts > results-CTA toggles per minimumAnswers threshold`

**Spec path:** `tests/tests/specs/voter/voter-navigation.spec.ts:188-243`

**Current test code (key assertions):**
```typescript
await sharedPage.goto(`${new URL(sharedPage.url()).origin}/en/questions/__first__`);
const deleteButton = sharedPage.getByTestId(testIds.shared.questionDelete);
await deleteButton.waitFor({ state: 'visible', timeout: 10000 });
// loops: for (let i = 0; i < DELETE_COUNT; i++) { deleteAndMaybeAdvance(...) }
await expect(resultsNav).toHaveText(/browse/i);
```

**Failure surface (Phase 85 run-3):**
```
TimeoutError: page.waitForURL: Timeout 30000ms exceeded.
waiting for navigation until "load"
  navigated to "http://loc...
```
A `page.waitForURL(...)` inside the test's URL-transition assertion timed out. Likely site is the `await page.waitForURL(/\/results/, { timeout: 30000 })` inside `answerNQuestions` helper line 167 OR the `navigateToNextQuestion` loop helper's 10s waitForURL.

**RCA hypothesis (Plan 01 — navigation state propagation cluster lens):**
- **H1 (PRIMARY):** the test's `beforeAll` invokes `answerNQuestions(sharedPage, 16, 4)` which mirrors the `voter.fixture.ts:answeredVoterPage` answer loop. That fixture's docstring notes "requires --likert-only seed mode (singleChoiceOrdinal opinion questions only)" — but this spec does NOT use the fixture and does NOT pass `--likert-only`. Post-Phase-82, the e2e seed includes Q22 (email-format info, Phase 81) + Q23 (URL-format info, Phase 81) + Q24 (required-empty, Phase 82) — info questions, NOT opinion. These should be filtered out of the voter opinion-question flow but the test answers 16 opinion questions assuming they're all Likert. The 17th opinion question is `test-question-directional-1` at sort 17 (categorical, 3 options) — auto-advance with `.nth(4)` is OUT OF RANGE and the URL never changes.
- **H2 (SECONDARY):** the `/en/questions/__first__` route (used at line 217) was deprecated when `test-voter-q-*` questions were added — the route may now resolve to Q1 from a category that wasn't seeded for the cold-start variant data.

**Fix sketch (HIGH confidence on H1):**
- Switch this spec's `beforeAll` to use the `voterTest` fixture from `voter.fixture.ts` instead of the inline `answerNQuestions` helper. The fixture already handles the Phase 75 P01 / Phase 77 P02 boolean (sort 18) + categorical (sort 17) Skip-Next fallback.
- ALTERNATIVE: gate the spec to `--likert-only` seed mode via a Playwright project-level setting + condition the inline loop on the 16-Likert-only assumption being valid.
- VERIFICATION: the `voterTest.use({ trace: 'off' })` pattern is preserved.

**Skip-rationale candidate:** "Inline answer loop in beforeAll predates Phase 75/77 heterogeneous-question support and breaks on the sort-17 categorical (.nth(4) out of range). Migration to voterTest fixture + --likert-only seed pre-condition deferred until project-wide voter-fixture-heterogeneous-question-types todo lands."

**Out-of-scope blockers:** None — fix is contained, mirrors the documented `.planning/todos/pending/2026-05-11-voter-fixture-heterogeneous-question-types.md` already-resolved todo.

**Confidence:** HIGH on root-cause (the spec's own DATA_RACE classification docstring at lines 24-34 admits exactly this pre-existing race).

### 3.4 `voter-app :: voter-not-located-redirect.spec.ts > CLEAN-02 — direct link to /results route with no election picked bounces twice and resumes /results`

**Spec path:** `tests/tests/specs/voter/voter-not-located-redirect.spec.ts:79-119`

**Current test code (key assertions):**
```typescript
await page.goto('/results');
// First bounce: /elections?next=<encoded-target>
await expect(page).toHaveURL(/\/elections\?next=/, { timeout: 15000 });
```

**Failure surface (Phase 85 run-3):**
```
Error: expect(page).toHaveURL(expected) failed
Expected pattern: /\/elections\?next=/
Received string:  "htt...
```
Received URL does NOT match `/elections?next=`. The (located)/+layout.ts gate did not fire the deferred-target redirect. **This is the chain-head failure that cascade-skips the 4 sibling CLEAN-02 cells.**

**RCA hypothesis (Plan 01 — navigation cluster lens):**
- **H1 (PRIMARY):** Phase 84 DETERM-08 added a portrait-rendering gate / lazy-load mechanism to `re-auth.setup.ts` + 11 candidate-app-settings pages. If the gate landed via a query-param mechanism (e.g., `?skipImages=1`) that the (voters)/(located)/+layout.ts loader now interprets, the gate logic may have INVERTED the redirect condition — voter with empty cookies + empty localStorage + no query params should still trigger the `?next=` round-trip.
- **H2 (SECONDARY):** Cookie isolation issue — `test.use({ storageState: { cookies: [], origins: [] } })` at line 52 should clear all cookies but a parallel test (or persistent session state) may leak through.
- **H3 (TERTIARY):** The CONTEXT.md notes "voter-results filter-toggle no-effect-update-depth" mentions Svelte 5 reactivity — same `effect_update_depth_exceeded` could be firing during the `/results` cold-start, breaking the layout-load redirect before it can issue.

**Fix sketch (MEDIUM confidence; needs instrumentation):**
- Step 1: Add an instrumentation line `console.error('URL after goto:', page.url())` to capture the actual received URL — error message is truncated.
- Step 2: Verify `(voters)/(located)/+layout.ts` `?next=` whitelist regex hasn't changed since Phase 78 CLEAN-02 landed.
- Step 3: Check whether Phase 84 DETERM-08 added a project-level dependency change that breaks `voter-app` project's cookie isolation guarantees.
- Step 4: If H3 implicated, capture browser console logs in test via `page.on('console', ...)` and assert no `effect_update_depth_exceeded` warnings.

**Skip-rationale candidate:** "Chain-head CLEAN-02 redirect-cascade requires (voters)/(located)/+layout.ts loader instrumentation. Deferred to v2.11+ — sibling cells will auto-promote when chain-head is fixed."

**Out-of-scope blockers:** Possibly — if H1 implicates Phase 84 DETERM-08 gate logic, the fix lives in PHASE-84-AUTHORED code, not in `(voters)/(located)/+layout.ts`. Planner should escalate if Step 3 confirms.

**Confidence:** LOW on root-cause (received URL is truncated in the run-3 error message); HIGH on cascade-impact (4 sibling FAILs).

### 3.5 `voter-app :: voter-results.spec.ts > filter toggle narrows list without effect_update_depth_exceeded (RESULTS-01 + RESULTS-02)`

**Spec path:** `tests/tests/specs/voter/voter-results.spec.ts:172-236`

**Current test code (key assertions):**
```typescript
const initialCount = await page.getByTestId(testIds.voter.results.card).count();
// ... open dialog, check first party checkbox, click Close filters ...
await expect
  .poll(() => page.getByTestId(testIds.voter.results.card).count(), {
    timeout: 5000,
    message: 'Filtered card count must STRICTLY narrow after applying filter (RESULTS-01/02 + IN-04)'
  })
  .toBeLessThan(initialCount);
expect(consoleErrors.filter((e) => e.includes('effect_update_depth_exceeded'))).toEqual([]);
```

**Failure surface (Phase 85 run-3):**
```
Error: Filtered card count must STRICTLY narrow after applying filter (RESULTS-01/02 + IN-04)
expect(received).toBeLessThan(expected)
```
The post-filter card count failed the STRICTLY narrow assertion. The Phase 78 CLEAN-05 IN-04 hardening flipped `toBeLessThanOrEqual` to `toBeLessThan` — this hardening is now exposed as flaky/wrong.

**RCA hypothesis (Plan 02 — Svelte 5 reactivity + state-update-depth cluster lens):**
- **H1 (PRIMARY):** The filter checkbox's first option does NOT correspond to "TPA" (Test Party Alpha) deterministically. The e2e seed has 4 parties (TPA/TPB/VPA/VPB); the EnumeratedEntityFilter renders checkboxes in `name`-sort-order which depends on the runtime locale's collation. If `Locale.en.collation` orders "TPA" first OR alphabetical-by-id-where-TPA-comes-first depending on seed order, the test's assumption that "checking the first checkbox" filters out Alpha's party holds in some runs but not others. Post-Phase-82 fixture additions may have shifted party-seed-order.
- **H2 (SECONDARY):** The `effect_update_depth_exceeded` from RESULTS-01 is the underlying bug — the filter PUSH event causes a Svelte 5 reactivity cascade that re-evaluates `entityList` twice within the same tick, and the second evaluation reads the pre-filter state. The console-error watcher fires on the warning but the test ALSO observes the card-count fail (a side effect, not the only failure mode). Per CLAUDE.md "Context Destructuring Rule", destructured reactive accessors in `EntityList.svelte` / `EntityFilters.svelte` / `filterContext.svelte.ts` could be the leak point.
- **H3 (TERTIARY):** Race between the modal close animation and the filterStore update. The test waits for `toHaveCount(0)` on `getByRole('dialog')` (line 274 in a sibling test, NOT in the filter-toggle test) but the filter-toggle test does NOT have that gate.

**Fix sketch (HIGH confidence on H1; MEDIUM on H2):**
- **For H1:** Change the locator from `.first()` to filter by accessible name (e.g., `name: /^TPA/`). Pattern already exists in this file at line 794 for the FilterGroup AND test.
- **For H2:** Audit `EntityListWithControls.svelte` + `EntityFilters.svelte` + `filterContext.svelte.ts` for destructured reactive accessors per CLAUDE.md Svelte 5 rule. If found, wrap in `$derived(ctx.X)` accessor pattern OR use `untrack()` inside the filter-apply event handler. This is a Svelte 5 hardening fix that aligns with CONTEXT.md D-02 Plan 02 lens.
- **For H3:** Add `await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 5000 })` between the close-filters click and the post-filter card count poll — mirrors the existing D-14 / D-15 pattern in this same spec.

**Skip-rationale candidate:** "RESULTS-01 + RESULTS-02 STRICTLY-narrow assertion (Phase 78 IN-04 hardening) is sensitive to e2e seed party-sort-order; voter-app Svelte 5 reactivity audit (effect_update_depth_exceeded hardening sweep) is v2.11+ scope per STATE.md deferred-items §'Voter-app effect_update_depth_exceeded hardening'."

**Out-of-scope blockers:** Possibly H2 — if the underlying `effect_update_depth_exceeded` is the real issue, the fix is a voter-app-wide audit beyond Phase 86 scope. Per CLAUDE.md Svelte 5 rule, this work has clear precedent (Phase 61 `candidateContext` destructure fix); a 1h investigation could land an `untrack()` guard locally without the full audit.

**Confidence:** MEDIUM — the symptom is dispositive, but multiple causes plausibly fit.

### 3.6 `voter-app :: voter-feedback-persistence.spec.ts > feedback text persists across dismiss and resets after send`

**Spec path:** `tests/tests/specs/voter/voter-feedback-persistence.spec.ts:43-98`

**Current test code (key assertions):**
```typescript
await openFeedbackBtn.click();
const feedbackDialog = page.getByRole('dialog').filter({ has: page.getByTestId('feedback-form') });
await expect(feedbackDialog).toBeVisible();
// ... type, cancel ...
await feedbackDialog.getByTestId('feedback-cancel').click();
await expect(feedbackDialog).toBeHidden();  // <-- FAILS HERE
```

**Failure surface (Phase 85 run-3):**
```
Error: expect(locator).toBeHidden() failed
Locator: getByRole('dialog').filter({ has: getByTestId('feedback-form') })
Expected: hidd...
```
After clicking `feedback-cancel`, the feedback dialog does NOT become hidden. Either (a) the cancel-click landed on the wrong element, (b) the dialog's `closeFeedback` event handler didn't fire, or (c) the dialog's `open` attribute is removed but the locator's `filter({ has: ... })` is matching a stale form element.

**RCA hypothesis (Plan 02 — Svelte 5 reactivity cluster lens):**
- **H1 (PRIMARY):** Modal-close-race — `FeedbackModal.svelte:62` maps `onCancel` to `closeFeedback`. If `closeFeedback` calls `closeModal()` which removes the dialog's `open` attribute, but the `<dialog>` element stays in the DOM (per Phase 64 D-11 + Modal.svelte ModalContainer.svelte:131-144 pattern), the `getByRole('dialog')` should return count 0 once `open` is removed. The fact that `toBeHidden()` fails suggests the `open` attribute is NOT being removed — the cancel button click may be intercepted by another handler.
- **H2 (SECONDARY):** Two dialogs collide — the docstring at line 55-60 already explicitly notes "Pitfall 8 anti-collision: multiple components render <dialog role="dialog"> (feedback modal, popup modal, entity-details drawer)." If a feedback POPUP from `voter-popups.spec.ts` upstream describe-block somehow leaks through to this test (cookie / settings residue), the locator's `filter({ has: feedback-form })` correctly narrows to the feedback modal, but the cancel-click may still fire on the wrong button if the form testid was duplicated.
- **H3 (TERTIARY):** Svelte 5 reactivity — `feedbackRef.reset()` is conditionally called in `FeedbackModal.svelte:47-52` on the `onSent` path but NOT on the `onCancel` path; the spec relies on this distinction. If Phase 70+ Svelte 5 audit-sweeps reframed reset() semantics (e.g., reactive cleanup via `$effect`), the dialog might re-mount with fresh state instead of preserving across close.

**Fix sketch (MEDIUM confidence):**
- **For H1:** Add `await page.waitForLoadState('networkidle')` or explicit wait for `feedback-form` testid absence after the cancel-click. Replace `toBeHidden()` with `toHaveCount(0)` on the dialog locator (mirrors the Phase 64 D-11 close-race pattern in `voter-results.spec.ts:274`).
- **For H2:** Investigate parallel feedback-popup interference; add `notifications.voterApp.show: false` + `analytics.trackEvents: false` to a beforeEach that pre-suppresses (mirrors `voter-popups.spec.ts:37-40` suppressInterferingPopups pattern).
- **For H3:** Add `await expect(feedbackDialog.getByTestId('feedback-description')).toBeHidden()` instead of asserting on the whole dialog — narrows the assertion to the actual close-state contract.

**Skip-rationale candidate:** "Multi-dialog locator collision in feedback-persistence assertion — Phase 8 anti-collision pattern needs feedback-modal-specific testId hardening. Deferred to project-wide voter-app assertion sweep (Phase 83 deferred-ideas)."

**Out-of-scope blockers:** None — fix is contained in spec + possibly minor `FeedbackModal.svelte` testId addition.

**Confidence:** MEDIUM.

### 3.7 `voter-app :: voter-visibility-required.spec.ts > SETTINGS-03 hidden question absent from voter question flow` (running in `voter-app` project — NOT the variant project)

**Spec path:** `tests/tests/specs/voter/voter-visibility-required.spec.ts:77-132`

**Current test code (key assertions):**
```typescript
await expect(page.getByText(hiddenQuestionEn, { exact: true })).toHaveCount(0);
await page.getByTestId(testIds.voter.results.card).filter({ hasText: alphaCandidate.last_name! }).click();
const dialog = page.getByRole('dialog');
await expect(dialog).toBeVisible();
await dialog.getByRole('tab', { name: /opinions/i }).click();
const opinionsTab = dialog.getByTestId(testIds.voter.entityDetail.opinionsTab);
await expect(opinionsTab).toBeVisible();
await expect(opinionsTab.getByText(hiddenQuestionEn, { exact: true })).toHaveCount(0);
```

**Failure surface (Phase 85 run-3):**
```
Error: expect(locator).toHaveCount(expected) failed
Locator:  getByRole('dialog').getByTestId('voter-entity-detail-opinions...
```
The opinions tab inside the entity-details drawer either failed to render OR contains the hidden question text. **Critical context:** there are TWO entries in run-3 for this spec — one for the `voter-app` project (failed, this row) and one for the `variant-hidden-required-voter` project (skipped — cascade victim of Phase 85's variant-multi-election timeout). The voter-app project entry is the unexpected one: this spec was originally authored for the variant-hidden-required project context with `test-voter-q-8` HIDDEN; running it in the `voter-app` project means `test-voter-q-8` is NOT hidden (no overlay), so the question SHOULD appear in the opinions tab.

**RCA hypothesis (Plan 03 — heterogeneous causes; visibility cluster):**
- **H1 (PRIMARY):** This spec was authored ONLY for the `variant-hidden-required-voter` Playwright project (per docstring lines 14-19). It is being incorrectly discovered by the `voter-app` project because of a Playwright project-config glob that matches `specs/voter/*.spec.ts`. In the `voter-app` project the variant overlay never runs (no `customData.hidden: true` on `test-voter-q-8`), so the negative-presence assertion `toHaveCount(0)` correctly fails — the test should not have been collected for `voter-app` in the first place.
- **H2 (SECONDARY):** `voterAnswerCount: 15` override at line 71 — the `answeredVoterPage` fixture takes this count, but the `voter-app` project's seed has 16 opinion questions (no hidden ones), so answering 15 leaves the voter ONE answer short of the threshold for completing the flow. The fixture's post-loop fallback (`for (let skip = 0; skip < 3; skip++)`) may walk past the remaining question — but if `minimumAnswers` is 15, the voter would still be on /results. Actually this should still work — but if the 16th opinion question is the categorical at sort 17 (3 choices), `.nth(4)` would have been the 5th choice in the original 16-Likert flow, which is out of range for this question.

**Fix sketch (HIGH confidence on H1):**
- **For H1:** Add a project-level `testMatch` exclusion in `tests/playwright.config.ts` so this spec ONLY runs in `variant-hidden-required-voter`. Alternatively, add a `test.skip()` guard at the spec top conditioned on `process.env.VARIANT_NAME` or similar.
- ALTERNATIVE: refactor the spec to be project-agnostic by querying `dataRoot.opinionQuestions` to dynamically determine whether the hidden flag is in effect.

**Skip-rationale candidate:** "Spec was authored for `variant-hidden-required-voter` project but Playwright glob also collects it under `voter-app` where the hidden overlay does not apply. Skip in `voter-app` project via test.skip() + project-config exclusion. Variant-project execution remains gated by Phase 85's data-setup-hidden-required cascade resolution."

**Out-of-scope blockers:** If H1 is correct, the fix lives in `tests/playwright.config.ts` — this should be in scope but planner should verify it doesn't conflict with any Phase 84 / 85 project-config edits.

**Confidence:** HIGH on root-cause (the spec docstring explicitly says it's a variant-only spec).

### 3.8 `voter-app :: voter-detail.spec.ts > case (d) — both missing: "Neither has answered" message rendered`

**Spec path:** `tests/tests/specs/voter/voter-detail.spec.ts:292-315`

**Current test code (key assertions):**
```typescript
await page.getByTestId(testIds.voter.results.card).filter({ hasText: 'CaseD Neither' }).click();
const dialog = page.getByRole('dialog');
await dialog.getByRole('tab', { name: /opinions/i }).click();
const opinionsTab = dialog.getByTestId(testIds.voter.entityDetail.opinionsTab);
await expect(
  opinionsTab.getByText(/Neither you nor .* has(?:n't| not)? answered/i)
).toBeVisible();
```

**Failure surface (Phase 85 run-3):**
```
Error: expect(locator).toBeVisible() failed
Locator: getByRole('dialog').getByTestId('voter-entity-detail-opinions').getByText(/Neith...
```
The "Neither has answered" i18n message never renders in the opinions tab. The opinions tab itself appears (else the locator chain would fail higher).

**RCA hypothesis (Plan 03 — data-model edge-case cluster):**
- **H1 (PRIMARY):** The marker question for case (d) is `test-question-directional-1` at sort 17 (per docstring line 198-200). Voter's `answeredVoterPage` fixture answers 16 questions (sorts 0-15 Likert + Skip-Next past sorts 17-18). The `CaseD-Neither` candidate has NO answer for sort 17. Both voter and CaseD have NO answer for sort 17 → `EntityOpinions.svelte:57-60` renders the i18n message. BUT: Phase 82 added `test-question-required-empty-1` (Phase 82 P01 sort 24), Phase 81 added `test-question-email-format-1` (sort 22 — info, not opinion) + `test-question-social-1` (sort 21 — info). The seed's opinion-question count may not have changed, but if it did (e.g., sort-17 was moved or `CaseD-Neither`'s answer was inadvertently seeded), the test fails.
- **H2 (SECONDARY):** The i18n message text itself changed post-Phase-80 A11Y-04 — the regex `/Neither you nor .* has(?:n't| not)? answered/i` may no longer match if the message was reworded.
- **H3 (TERTIARY):** Hydration race in the opinions tab — the message is dynamically inserted via EntityOpinions.svelte:57-60 reactive expression; if the reactivity chain races (per Phase 83 DETERM-07b party-drawer pattern), the message may not be rendered within the assertion timeout.

**Fix sketch (MEDIUM confidence):**
- **For H1:** Verify the `e2e.ts` fixture's `CaseD-Neither` candidate still has no answer for `test-question-directional-1` (sort 17) AND voter doesn't answer it. The Phase 82 P01 sort-24 fixture row + the `test-question-required-empty-1` external-id pattern is the suspect change.
- **For H2:** Inspect `apps/frontend/src/lib/i18n/locales/en/questions.json` (or equivalent) for the `bothHaventAnswered` key text. Verify the regex matches.
- **For H3:** Add a hydration-completeness guard — `await expect(opinionsTab.locator('opinion-question-input').first()).toBeVisible()` BEFORE asserting on the negative-presence message. Phase 83 DETERM-07b pattern.

**Skip-rationale candidate:** "Case-(d) marker question dependency on test-question-directional-1 at sort 17; Phase 81+82 fixture extensions may have shifted opinion-question order. Deferred to v2.11+ fixture-stability sweep."

**Out-of-scope blockers:** None — fix is contained.

**Confidence:** LOW-MEDIUM — multiple causes are plausible, but H1 is the most testable.

### 3.9 `voter-app :: voter-question-rendering-boolean.spec.ts > boolean opinion question renders, voter answers, persists across goBack, mirrors on entity-detail` (QSPEC-01)

**Spec path:** `tests/tests/specs/voter/voter-question-rendering-boolean.spec.ts:63-192`

**Current test code (key assertions):**
```typescript
await walkToQuestion(page, 17);  // <- fails here
```

**Failure surface (Phase 85 run-3):**
```
TimeoutError: locator.waitFor: Timeout 10000ms exceeded.
Call log:
  - waiting for getByTestId('voter-questions-start') to be visible
```
The `voter-questions-start` testId in the questions intro page never appears within 10s. The `walkToQuestion` helper calls `walkToQuestionsIntro` which calls `passThroughConstituencies` which falls through to the questions intro page. The intro page's start CTA (`apps/frontend/src/routes/(voters)/(located)/questions/+page.svelte:161`) is the missing element.

**RCA hypothesis (Plan 03 — i18n-render-path / fixture-fragility cluster):**
- **H1 (PRIMARY):** The questions intro page redirects via `onMount` to `/questions/__first__` when `appSettings.questions.questionsIntro.show` is FALSE. Phase 82 + Phase 81 modified app-settings defaults; if `questionsIntro.show` was flipped to true and the start CTA's testId rendered, the spec should work — but if `show` is FALSE and the redirect fires before the spec's `waitFor('voter-questions-start')` can lock, the testId is never visible.
- **H2 (SECONDARY):** `walkToQuestionsIntro` (line 160-173) calls `passThroughConstituencies` which has its own fallback to `navigateDirectlyToQuestions` (line 145-152) — if the fallback fires, the voter lands on `/questions?electionId=...&constituencyId=...` directly, BYPASSING the questions-intro page. The spec then expects the intro's start CTA but voter is already past it.
- **H3 (TERTIARY):** Phase 75's docstring notes "full-suite cold-start: deterministic FAIL × 3 inheriting upstream voter-fixture race (`voter-questions-start` 10s timeout). Per-plan smokes PASS × 3 each." Phase 75 closed this as PASS-WITH-DEFERRAL routing to Phase 78 CLEAN-05 (which became Phase 86 inheritance). The `--likert-only` seed modifier exists at `packages/dev-seed/src/cli/likert-only.ts` (per the voter.fixture.ts:53 docstring) — but the `voter-app` Playwright project does NOT run with `--likert-only` by default (the seed is the full e2e template).

**Fix sketch (HIGH confidence on H3, MEDIUM on H1):**
- **For H3 (most likely):** Run the `voter-app` project with `--likert-only` pre-seed. This means modifying `tests/playwright.config.ts` `data-setup`'s seed command (currently `yarn db:seed --template e2e`) to `yarn db:seed --template e2e --likert-only`. This is the canonical Phase 78 CLEAN-05 resolution — the voter fixture's docstring at line 53 confirms this. **HOWEVER:** this seeding flip would affect ALL voter-app project tests, not just QSPEC-01/02. Need to verify it doesn't regress other tests.
- ALTERNATIVE: Make `walkToQuestion` resilient to the `passThroughConstituencies` fallback path — if voter lands directly on `/questions/<id>`, skip the intro start CTA wait.
- **For H1:** Set `appSettings.questions.questionsIntro.show: true` in a beforeAll for this spec only.

**Skip-rationale candidate:** "QSPEC-01 cold-start failure inheriting Phase 75 PASS-WITH-DEFERRAL classification — `walkToQuestion` helper's intro-start CTA wait races the full-suite settings overlay. Aligned with Phase 75 §FAILURE-CLASS rationale precedent. Per-plan smoke remains PASS × 3 in isolation."

**Out-of-scope blockers:** Possibly — if H3 fix flips the project-wide seed mode, the spec collection in other voter-app tests may regress (the e2e template ships sort-17 categorical + sort-18 boolean which are filtered OUT by `--likert-only`; spec assertions on those questions would fail).

**Confidence:** HIGH on symptom (10s timeout on `voter-questions-start` is unambiguous); MEDIUM on the right fix path.

### 3.10 `voter-app :: voter-question-rendering-categorical.spec.ts > categorical opinion question (single-choice) renders, voter answers, persists across goBack, mirrors on entity-detail` (QSPEC-02)

**Spec path:** `tests/tests/specs/voter/voter-question-rendering-categorical.spec.ts:88-277`

**Current test code (key assertions):**
```typescript
await walkToQuestion(page, 16);
```

**Failure surface (Phase 85 run-3):** **Same as QSPEC-01 (§3.9):** `voter-questions-start` 10s timeout.

**RCA hypothesis (Plan 03 — same as §3.9):** Same root cause as QSPEC-01.

**Fix sketch:** Same as §3.9 — both QSPEC tests resolve together via the same `walkToQuestion` helper fix or the same `--likert-only` seed-mode flip.

**Skip-rationale candidate:** Same as §3.9.

**Out-of-scope blockers:** Same as §3.9.

**Confidence:** Same as §3.9.

### 3.11 BONUS: `voter-app :: voter-detail.spec.ts > should open party detail drawer with info, candidates, and opinions tabs` (boundary flake)

**Spec path:** `tests/tests/specs/voter/voter-detail.spec.ts:130-181`

**Current test code (key gate — Phase 83 DETERM-07b hardening):**
```typescript
await expect(partySection.getByRole('heading', { level: 3 }).first()).toContainText(
  `${expectedPartyCount} parties`
);
```

**Failure surface (cross-phase pattern):**
- Phase 84 (2026-05-13): runs 1 + 3 PASSED, run 2 FAILED. Direction: pass-pass-fail. Phase 84 anchor used run-3.
- Phase 85 (2026-05-14): runs 1 + 2 FAILED, run 3 PASSED. Direction: fail-fail-pass. Phase 85 anchor used run-3.
- Phase 85 SHA anchor binding chose run-3.json as canonical regen source explicitly because party-drawer PASSED in run 3.

**RCA hypothesis (BOUNDARY classification, not deterministic):** Symmetric flake across phases confirms Phase 83 DETERM-07b classification — this is a PASS_LOCKED-boundary graduate that flakes ~1-in-3 cold-start runs. The Phase 83 hydration-completeness guard (heading-text assertion before .first().click()) was correctly inserted but is itself sensitive to a deeper race: the entity-list reactivity / results-page hydration where the party-section may render with stale empty array before the data populates.

**Fix sketch (MEDIUM confidence):**
- Tighten the Phase 83 DETERM-07b guard: instead of asserting heading text contains `"${expectedPartyCount} parties"`, poll for `partySection.getByRole('heading', { level: 3 }).getByText(new RegExp(`^${expectedPartyCount}`))` with explicit `expect.poll()` timeout extension to 10s.
- ALTERNATIVE: Replace `.first()` party-card click with `await partySection.getByTestId('entity-card-action').first().click()` IFF the action element is detected as visible AND the party section heading has been polled for completeness.
- Per CONTEXT.md D-05 routing: this test could be routed into the new `SKIPPED_TESTS` const if the fix exceeds 1h investigation — but boundary-flake behavior across 6 cold-start captures (3 each in Phase 84 and Phase 85) suggests the test is RELIABLE to harden, not unfixable.

**Skip-rationale candidate (LAST RESORT):** "Phase 83 DETERM-07b hydration-completeness guard exposes a symmetric ~33% boundary flake across Phase 84 + Phase 85 cold-start gates. Hardening deferred to a v2.11+ project-wide voter-app hydration-completeness assertion sweep."

**Out-of-scope blockers:** None.

**Confidence:** MEDIUM — boundary-flake taxonomy is well-established but the specific tightening pattern needs empirical validation.

## 4. Cluster Boundary Recommendation: `voter-question-rendering`

**Per CONTEXT D-04 recommendation:** Plan 03 (visibility + edge-cases).

**Reasoning:** The Phase 85 run-3 RCA confirms QSPEC-01 + QSPEC-02 share a SINGLE root cause (the `voter-questions-start` timeout in `walkToQuestion`). This is NOT a Svelte 5 reactivity bug (Plan 02 lens) but a fixture-fragility / cold-start hydration issue (Plan 03 heterogeneous-cause lens). Both QSPEC tests resolve together — they belong in the same plan.

**Cluster fits in Plan 03 (visibility + edge-cases):**
- Plan 03 already covers `voter-visibility-required SETTINGS-03` (variant-overlay + product-gap heterogeneous cause)
- Plan 03 already covers `voter-detail case-d both-missing` (data-model edge-case)
- Adding QSPEC-01/02 (i18n-render-path + walkToQuestion helper fragility) keeps Plan 03 at ~4 tests, still under the cluster-RCA cap.

**Plan 02 stays focused on Svelte 5 reactivity** (`voter-results filter-toggle` RESULTS-01 + `voter-feedback-persistence` modal-close-race) where the `untrack()` / context-destructuring-rule guard pattern applies uniformly.

## 5. Verification Gate Mechanism

### 5.1 `regen-constants.mjs` location

**Path:** `.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/regen-constants.mjs` (Phase-84-renegotiated; Phase 85 used verbatim with `reportPath` re-pointed at Phase 85's `post-fix/run-3.json`).

**Current IMGPROXY_TIED_TITLES constant** (lines 91-95, post-Phase-84 shrink):
```javascript
const IMGPROXY_TIED_TITLES = [
  'should upload a profile image (CAND-03)',
  'should show editable info fields on profile page (CAND-03)',
  'should persist profile image after page reload (CAND-12)'
];
```

**Phase 86 modification required:** update `reportPath` (line 34) to point at Phase 86's `post-fix/run-3.json`. IMGPROXY_TIED_TITLES MUST NOT shrink (Phase 73 D-09 + Phase 84 renegotiation: "MUST NOT grow" is the contract).

### 5.2 Current FAILURE-CLASS classification shape

The narrative comment block at `diff-playwright-reports.ts:42-142` is the current "FAILURE-CLASS pool" representation. There is NO `FAILURE_CLASS_TESTS` const or `SKIPPED_TESTS` const today; the FAILURE-CLASS cells are tracked ONLY in the narrative block + in `Phase 85 regen-output.txt` as "tests that did not appear in any partition (PASS_LOCKED / DATA_RACE / CASCADE)".

The narrative block contains:
- 100+ line history (Phase 84 + Phase 85 anchor narratives)
- Per-test commentary (party-drawer flake, variant-multi-election timeouts, etc.)
- Cross-phase routing (Phase 86 DETERM-12/13/14 references)
- WARNING 9 contingency narrative (relaxed criterion: `CASCADE + new variant-FAIL count ≤ 47`)

### 5.3 Recommended `SKIPPED_TESTS` const shape (D-05)

Per CONTEXT D-05 recommendation (introduce const if ≥ 2 skips land):

```typescript
/** N tests deliberately skipped via test.skip() with rationale comments. Phase 86 DETERM-12/13/14 closure. These tests are NOT part of the parity contract — they are excluded from regression checks. Each entry MUST have a corresponding v2.11+ follow-up todo at .planning/todos/pending/. */
const SKIPPED_TESTS: ReadonlyArray<string> = [
  // Plan 01 (popups + hydration + navigation/redirects) — DETERM-12 closure
  'voter-app :: specs/voter/voter-popup-hydration.spec.ts > popup appears on full page load to /results (LAYOUT-03 hydration path)',
  // ... per-test entries with inline reason comments ...
];
```

The `diffReports` function (line 462+) MUST be updated to filter SKIPPED_TESTS out of the regression-checking set (mirrors the existing SOURCE_SKIP filter pattern referenced in the jsdoc at line 20-21).

### 5.4 Regen flow for Phase 86

1. Plan 01-03 land (with fix-or-skip resolutions per test).
2. Run 3-run cold-start gate via `yarn test:e2e` (cold-start = post-`yarn db:reset` + `yarn dev:clean`).
3. Capture `post-fix/run-{1,2,3}.json` + `sha256.txt`.
4. Verify SHA-identity (or "almost-strict" per Phase 85 precedent if the party-drawer flake remains).
5. Update `regen-constants.mjs` `reportPath` → Phase 86's run-3.json.
6. Run `node .planning/phases/79-…/post-fix/regen-constants.mjs > regen-output.txt`.
7. Paste regen output into `diff-playwright-reports.ts` (replace PASS_LOCKED_TESTS / DATA_RACE_TESTS / CASCADE_TESTS).
8. Add `SKIPPED_TESTS` const (if ≥ 2 skips landed).
9. Update narrative comment block at top to reflect Phase 86 anchor.
10. Atomic commit per D-10 recommendation (1 commit for constants-regen close).

## 6. Validation Architecture (Nyquist dimension matrix)

`workflow.nyquist_validation` is absent from `.planning/config.json` → treated as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright 1.58.2 + Vitest (unit tests for matching/data/filters packages) |
| Config file | `tests/playwright.config.ts` (project-level test discovery) |
| Quick run command | `yarn workspace tests playwright test --project=voter-app specs/voter/voter-popups.spec.ts -x` (single spec, single project) |
| Full suite command | `yarn test:e2e` (cold-start requires `yarn db:reset && yarn dev:clean` first) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| DETERM-12 | voter-popups dismissal-after-reload deterministically passes OR test.skip() | e2e (Playwright) | `yarn workspace tests playwright test --project=voter-app-popups voter-popups.spec.ts -x` | ✅ |
| DETERM-12 | voter-popup-hydration full-page-load deterministically passes OR test.skip() | e2e | `yarn workspace tests playwright test --project=voter-app voter-popup-hydration.spec.ts -x` | ✅ |
| DETERM-12 | voter-navigation results-CTA threshold deterministically passes OR test.skip() | e2e | `yarn workspace tests playwright test --project=voter-app voter-navigation.spec.ts -x` | ✅ |
| DETERM-12 | voter-not-located-redirect /results deeplink (chain-head) passes OR test.skip() | e2e | `yarn workspace tests playwright test --project=voter-app voter-not-located-redirect.spec.ts -x` | ✅ |
| DETERM-13 | voter-results filter-toggle no-effect-update-depth passes OR test.skip() | e2e | `yarn workspace tests playwright test --project=voter-app voter-results.spec.ts -g "filter toggle" -x` | ✅ |
| DETERM-13 | voter-feedback-persistence passes OR test.skip() | e2e | `yarn workspace tests playwright test --project=voter-app voter-feedback-persistence.spec.ts -x` | ✅ |
| DETERM-14 | voter-question-rendering boolean (QSPEC-01) passes OR test.skip() | e2e | `yarn workspace tests playwright test --project=voter-app voter-question-rendering-boolean.spec.ts -x` | ✅ |
| DETERM-14 | voter-question-rendering categorical (QSPEC-02) passes OR test.skip() | e2e | `yarn workspace tests playwright test --project=voter-app voter-question-rendering-categorical.spec.ts -x` | ✅ |
| DETERM-14 | voter-visibility-required SETTINGS-03 hidden absent passes OR test.skip() | e2e | `yarn workspace tests playwright test --project=voter-app voter-visibility-required.spec.ts -x` (also `variant-hidden-required-voter` project) | ✅ |
| DETERM-14 | voter-detail case (d) both-missing passes OR test.skip() | e2e | `yarn workspace tests playwright test --project=voter-app voter-detail.spec.ts -g "case \\(d\\)" -x` | ✅ |
| DETERM-12+13+14 | 3-run cold-start gate SHA-identical FIRST attempt | manual sequence | 3× `yarn db:reset && yarn dev:clean && yarn test:e2e` + `sha256` audit | ✅ Phase 79 + 84 + 85 helper at `.planning/phases/79-…/post-fix/sha-identity.mjs` |
| DETERM-12+13+14 | New anchor reflects ~+10 net PASS_LOCKED OR ~+8 (if 2 skips land) | constants regen | `node .planning/phases/79-…/post-fix/regen-constants.mjs` after re-pointing reportPath at Phase 86 run-3.json | ✅ |

### Sampling Rate
- **Per task commit:** `yarn workspace tests playwright test --project=<project> <spec>.spec.ts -x` for the touched spec(s).
- **Per wave merge:** `yarn workspace tests playwright test --project=voter-app --project=voter-app-popups --project=variant-hidden-required-voter` (~3-4 min — voter projects only; skips imgproxy-tied + variant-cascade projects to keep iteration fast).
- **Phase gate:** Full suite green (3-run cold-start SHA-identity) before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] None — Phase 79's `regen-constants.mjs` + `sha-identity.mjs` infrastructure remains intact post-Phase-85. All target specs exist. No new fixtures or test runners required.

### Validation Dimension Matrix (for downstream VALIDATION.md)

| # | Dimension | Coverage Mechanism |
|---|-----------|---------------------|
| 1 | Per-test fix verification | Per-task smoke: spec runs PASS × 3 in isolation (mirrors Phase 75 / Phase 83 per-plan smoke pattern) |
| 2 | Per-cluster determinism | Per-plan smoke: spec + dependent specs run PASS × 3 in cluster scope (mirrors Phase 73 PARITY GATE PASS pattern) |
| 3 | Full-suite 3-run cold-start identity | Phase gate: 3× `yarn db:reset && yarn dev:clean && yarn test:e2e` SHA-256 identity (Phase 79/83/84/85 precedent) |
| 4 | DATA_RACE pool MUST NOT grow (D-09 binding) | regen-constants.mjs assertion (IMGPROXY_TIED_TITLES match-count gate, exit 1 on shrink-or-grow) |
| 5 | CASCADE_BASELINE_TESTS no regression (D-10 contract) | diff-playwright-reports.ts parity gate: cascade → fail-outside-pool is BLOCKER |
| 6 | FAILURE-CLASS pool shrinks ≥ 8 net (target ≤ 2 residual) | Compare Phase 85 baseline (~10 FAILURE-CLASS) vs Phase 86 anchor (≤ 2 residual + ≤ N SKIPPED_TESTS) |
| 7 | Skip-rationale completeness | Each `test.skip(true, '...')` MUST have (a) inline rationale ≥ 20 chars, (b) block comment ≥ 3 lines, (c) v2.11+ follow-up todo file at `.planning/todos/pending/2026-MM-DD-<short>.md` |
| 8 | Narrative block consistency | `diff-playwright-reports.ts:42-142` narrative comment updated to reflect Phase 86 reality; legacy `:87-101` line reference in CONTEXT.md fixed in narrative block (the reference is stale — block grew through Phases 84-85) |

## 7. Constraints + Landmines

### Constraints (from CLAUDE.md + CONTEXT.md)

1. **Test deletion is FORBIDDEN.** `test.skip()` is the ONLY escalation path. Never `rm` a spec or remove `test('…', …)` blocks.
2. **`playwright/no-conditional-in-test` is hard-enforced.** Use `try/catch` for branching (exception handling, allowed); never use `if`/`switch` in `test(...)` body.
3. **Svelte 5 Context Destructuring Rule applies** (CLAUDE.md §"Context Destructuring Rule"). Plan 02 RCA must NOT introduce destructured reactive accessors; if filter-toggle fix touches `EntityListWithControls.svelte` / `EntityFilters.svelte` / `filterContext.svelte.ts`, audit for this pattern.
4. **TypeScript strictness** — avoid `any`, prefer explicit types.
5. **No new test runners / framework migrations** (Playwright 1.58.2 only).
6. **`yarn dev:reset-with-data --likert-only` does NOT forward `--likert-only`** through the `&&` chain (yarn arg-forwarding LANDMINE per CLAUDE.md). Canonical invocation for a fully Likert-only reset is the manual chain: `yarn db:reset && yarn db:seed --template e2e --likert-only && yarn dev:clean`. Relevant if Plan 03 fix path involves switching `voter-app` project to `--likert-only` seed mode.

### Landmines (test-domain)

1. **IMGPROXY_TIED_TITLES match-count assertion.** `regen-constants.mjs:100-112` asserts every IMGPROXY_TIED_TITLES entry matches ≥ 1 test in the new JSON. Any Phase 86 rename of the 3 image-intrinsic tests breaks the regen with exit 1. Phase 86 fixes should NOT rename those tests.
2. **DATA_RACE pool MUST NOT grow** (Phase 73 D-09 binding per CONTEXT.md D-09). The 3 image-intrinsic cells are the entire pool today; adding any voter-app cell to DATA_RACE is a contract violation. Phase 86 skips → SKIPPED_TESTS const, NOT DATA_RACE_TESTS.
3. **CASCADE_BASELINE_TESTS contract** (Phase 73 D-10 + CONTEXT.md D-10). A Phase 86 fix that accidentally unblocks a CASCADE entry is a PASS_LOCKED promotion (cascade-unblock), NOT a CASCADE regression. Verified via 3-run gate. **Specifically, fixing voter-not-located-redirect chain-head (§3.4) WILL promote 4 CASCADE entries** to PASS_LOCKED — this is expected, not a regression.
4. **SETTINGS-02 / SETTINGS-03 voter-side PRODUCT-GAPs.** Per CONTEXT.md D-08, Phase 86 MUST NOT pre-resolve these. If §3.7 voter-visibility-required RCA reveals the test needs SETTINGS-03 PRODUCT-GAP fix to pass, the test is skipped+rationale'd. STATE.md "Deferred Items" lists the v2.11+ routing.
5. **Constituency filter UI PRODUCT-GAP** — re-deferred to v2.11+. Plan 02's filter-toggle test does NOT touch constituency filtering (which is in `variant-constituency` project, not `voter-app`).
6. **Phase 75 QSPEC-01/02 skip+rationale precedent.** Per CONTEXT.md canonical-refs, the Phase 75 demotion rationale shape is the template for §3.9/§3.10 skips. Pattern: `test.skip(true, 'Phase 75 PASS-WITH-DEFERRAL inheritance: walkToQuestion intro-start CTA wait races full-suite settings overlay (10s timeout on voter-questions-start in 3/3 Phase 85 cold-start runs). Per-plan smoke remains PASS × 3 in isolation. v2.11+ todo: 2026-05-14-qspec-walkToQuestion-cold-start-race.md')`.
7. **The voter-app project's `data-setup` step seeds the full e2e template (NOT `--likert-only`).** If Plan 03 fix path requires flipping voter-app project seed to `--likert-only`, this is a `tests/playwright.config.ts` project-config change that affects ALL voter-app tests — verify no regression in 60+ other PASS_LOCKED voter-app cells.
8. **Phase 85 boundary-flake party-drawer routing.** Per CONTEXT.md D-04 + 85-02-SUMMARY.md, the party-drawer flake is routed to Phase 86 DETERM-12 but is BOUNDARY-classified (passed in 3/6 cold-start captures across Phase 84 + Phase 85). Per §3.11, the best-fit treatment is hardening the Phase 83 DETERM-07b guard, NOT a fix-vs-skip decision. Planner should treat this as Plan 01 territory (related to popups + hydration cluster: party-drawer dialog is the same dialog primitive).
9. **CONTEXT.md cites the FAILURE-CLASS narrative block at `:87-101`** but the block is currently at `:42-142` (drift across Phase 84 + Phase 85 annotations). Plan deliverables should reference line ranges accurately.

## 8. Open Questions for Planner

1. **Per-test fix-vs-skip threshold.** CONTEXT.md D-03 recommends 1h investigation cap before skip-escalation. Should this be 1h *per surface cluster* or *per individual test*? With 10 in-scope tests, a strict 1h-per-test ceiling = 10h investigation cap (~12h budget per plan in worst case). RECOMMENDATION: per-test ceiling with cluster-level RCA insights pre-bidded (research-doc here primes the planner to spend less than 1h on tests where the symptom is dispositive — §3.1, §3.3, §3.7, §3.9, §3.10 are 15-30min fixes; §3.4 is the long-pole at ~1h).

2. **Should the voter-app project seed be flipped to `--likert-only`?** This is the cleanest fix for §3.9/§3.10 (QSPEC-01/02) but affects 60+ other voter-app PASS_LOCKED cells. Planner should run a per-plan smoke before committing: smoke PASS × 3 with `--likert-only` seed on voter-app project = green light; any regression = revert + use the per-spec workaround.

3. **Should §3.7 voter-visibility-required (voter-app project entry) be addressed via Playwright project-config exclusion OR test.skip() guard at spec top?** Project-config exclusion is cleaner but touches `tests/playwright.config.ts` (shared with all e2e suites). test.skip() guard is more targeted but adds a runtime conditional. RECOMMENDATION: project-config exclusion via `testIgnore` in the `voter-app` project section, IFF it doesn't conflict with Phase 84 / 85 project-config edits.

4. **For §3.5 filter-toggle (RESULTS-01 fix):** if Plan 02 RCA implicates `effect_update_depth_exceeded` Svelte 5 reactivity (H2), how deep should the audit go? CLAUDE.md Context Destructuring Rule audit on 3 components (EntityListWithControls.svelte, EntityFilters.svelte, filterContext.svelte.ts) is ~30-60min. Broader project-wide voter-app sweep is v2.11+ scope per STATE.md. RECOMMENDATION: contain to the 3 components; document any found-but-not-fixed sites as Phase 86 deferred-ideas for the broader v2.11+ sweep.

5. **Should the FAILURE-CLASS narrative block be DELETED or REWRITTEN in Phase 86 close?** Per CONTEXT.md D-05 + D-COMMIT-RECOMMENDATION, the block can be (a) replaced with a SKIPPED_TESTS const, (b) kept as commentary on the const, OR (c) deleted entirely if no skips land. RECOMMENDATION: shrink to a 10-15 line header narrative pointing at SKIPPED_TESTS const (if introduced) + clear "FAILURE-CLASS pool CLOSED at Phase 86" header.

6. **Validation gate variance:** Phase 85 closed with "ALMOST-strict" 3-run gate (runs 1+2 SHA-identical, run 3 differed by 1 cell — the party-drawer flake). Phase 86 D-06 expects "SHA-identical FIRST attempt." If party-drawer flake remains BOUNDARY-classified post-Phase-86 attempt, should we accept "ALMOST-strict" again (with rationale) or hard-block on strict identity? RECOMMENDATION: hard-block on strict identity for Phase 86 close (Phase 87 entry-condition is "fresh 3-run cold-start gate SHA-identical FIRST attempt" — Phase 86 needs to land that contract or document an explicit v2.11+ deferral for the residual flake).

## Sources

### Primary (HIGH confidence)
- `.planning/phases/86-…/86-CONTEXT.md` — locked decisions D-01..D-10 + canonical refs
- `.planning/REQUIREMENTS.md` — DETERM-12, DETERM-13, DETERM-14
- `.planning/STATE.md` — Deferred Items (v2.11+ routing)
- `.planning/ROADMAP.md` — Phase 86 §Goal + Phases 84-87 gating map
- `tests/scripts/diff-playwright-reports.ts:1-308` — current FAILURE-CLASS narrative + PASS_LOCKED / DATA_RACE / CASCADE constants
- `tests/tests/specs/voter/voter-{popups,popup-hydration,navigation,not-located-redirect,results,feedback-persistence,question-rendering-{boolean,categorical},visibility-required,detail}.spec.ts` — all 10 in-scope specs read end-to-end
- `tests/tests/fixtures/voter.fixture.ts` + `tests/tests/utils/voterNavigation.ts` — fixture infrastructure
- `.planning/phases/85-…/post-fix/regen-output.txt` + `run-3.json` — current PASS_LOCKED / DATA_RACE / CASCADE partition
- `.planning/phases/79-…/post-fix/regen-constants.mjs` — Phase 86's verification-gate script (post-Phase-85 reportPath)
- `.planning/milestones/v2.9-phases/75-question-rendering-specs/75-VERIFICATION.md` — QSPEC-01/02 PASS-WITH-DEFERRAL precedent (skip+rationale shape)
- `CLAUDE.md` — Svelte 5 Context Destructuring Rule + Project Constraints
- `apps/frontend/src/routes/(voters)/(located)/questions/+page.svelte:161` — voter-questions-start testId origin

### Direct test execution evidence (HIGH confidence)
- Phase 85 `post-fix/run-3.json` (parsed via inline node script) — 18 voter-app non-passing test entries with raw status + error message; categorizes the 10 deterministic FAILs + 8 cascade-skipped + 1 boundary flake

### Secondary (MEDIUM confidence — narrative annotations)
- `.planning/phases/84-…/84-VERIFICATION.md` (referenced; not read directly) — Phase 84 DETERM-08 imgproxy decoupling rationale
- `.planning/phases/85-…/85-02-SUMMARY.md` (referenced; not read directly) — Phase 86 routing decision context

### Not consulted (would be MEDIUM if surfaced as questions)
- `apps/frontend/src/lib/dynamic-components/feedback/Feedback.svelte` (source; testing semantics of `description = $state('')` and reset()) — referenced via spec docstring
- `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts:215-230` (source; hidden-question filter implementation) — referenced via spec docstring
- `packages/dev-seed/src/templates/e2e.ts` (current state post-Phase-82) — fixture sort-order shifts
- `tests/playwright.config.ts` (current state post-Phase-85) — project-config edits

## Assumptions Log

> All `[ASSUMED]` claims that need user confirmation before becoming locked decisions.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The voter-popups close-button strict-mode collision (§3.1) was introduced by Phase 80 A11Y-04 Drawer aria-label addition | §3.1 RCA H1 | Misdirected fix — actual collision may be a different button; locator hardening still works either way (low risk). |
| A2 | The voter-popup-hydration race (§3.2) is an answerStore-version-vs-seed-count mismatch (H2/H3) rather than a pure hydration race | §3.2 RCA | If H1 is the real cause, networkidle wait is the right fix; H2/H3 fixes are diagnostic-only. Investigation-needed (low fix risk). |
| A3 | The voter-navigation inline answer loop fails due to Phase 81/82 info-question fixture additions (sort-22/23/24) shifting opinion-question count | §3.3 RCA H1 | If H2 is the real cause (deprecated `/en/questions/__first__` route), the fixture switch is unnecessary; quick verification possible (low risk). |
| A4 | The voter-not-located-redirect chain-head failure is caused by Phase 84 DETERM-08 portrait-rendering gate inversion (H1) | §3.4 RCA H1 | If H2 (cookie isolation) or H3 (effect_update_depth) is real, fix path is different. Phase 86 may need to escalate to a Phase 84 follow-up todo. |
| A5 | The filter-toggle STRICTLY-narrow assertion (§3.5) is broken by party-sort-order non-determinism (H1) | §3.5 RCA H1 | If H2 (effect_update_depth_exceeded) is real, fix is a Svelte 5 audit, not a locator rewrite. Verification via console-error inspection is easy. |
| A6 | The feedback-persistence dialog-close (§3.6) is a multi-dialog locator collision (H2) rather than a Svelte 5 reactivity issue | §3.6 RCA | If H3 (reactive reset semantics) is real, fix lives in `FeedbackModal.svelte`, not the spec. Symptom is ambiguous. |
| A7 | The voter-visibility-required failure in `voter-app` project (§3.7) is a Playwright project-glob misallocation | §3.7 RCA H1 | If H2 (voterAnswerCount: 15 + question-count mismatch) is real, the fix is fixture-level, not project-config. Easy to disambiguate via spec docstring inspection. |
| A8 | The voter-detail case-(d) failure (§3.8) is a fixture-shift in test-question-directional-1's CaseD-Neither candidate's answer cell | §3.8 RCA H1 | If H3 (hydration race) is real, the fix is a Phase 83 DETERM-07b-style guard, not a fixture audit. |
| A9 | The QSPEC-01/02 walkToQuestion timeout (§3.9/§3.10) is the Phase 75 PASS-WITH-DEFERRAL inherited race, NOT a new Phase 86 regression | §3.9/§3.10 RCA H3 | If H1 (settings-overlay timing) is real, the fix is to flip `questionsIntro.show: true` for these specs only, not a project-wide seed flip. |
| A10 | The party-drawer flake (§3.11) is a Phase 83 DETERM-07b boundary classification, NOT deterministic | §3.11 RCA | Phase 84 + Phase 85 cross-phase symmetric-flake evidence is strong; assumption is well-supported but treatment (harden-vs-skip) is planner's call. |

**Assumption confirmation priority:** A4 (Phase 84 DETERM-08 implication) is the highest-stakes — if confirmed, Phase 86 may need a Phase 84 follow-up todo. A1/A5/A7 are LOW-RISK (fix works either way). A3/A9 are MEDIUM-RISK (fix path differs but is contained).

## Open Questions

1. **Phase 86 plan-allocation `voter-question-rendering`:** Plan 03 per CONTEXT.md D-04 recommendation. Planner-decision (no actual ambiguity given the fix path is shared with `voter-detail case-d` heterogeneous-cause cluster).
2. **`voter-not-located-redirect` chain-head (§3.4) root cause:** truncated error message in run-3.json. **Recommendation:** add per-task instrumentation step (print actual URL after goto) before locking root cause.
3. **`voter-app` project seed mode flip to `--likert-only`:** the cleanest QSPEC fix vs. the cleanest containment fix. **Recommendation:** test the flip in a per-plan smoke before committing project-wide.
4. **Boundary-flake party-drawer (§3.11):** harden the Phase 83 DETERM-07b guard (Plan 01 popup+hydration cluster) vs. SKIPPED_TESTS escalation. **Recommendation:** hardening attempt first, escalate to skip if 1h budget exhausted.
5. **FAILURE-CLASS narrative block update:** delete vs. shrink-to-header. **Recommendation:** shrink to 10-15 line header pointing at SKIPPED_TESTS const + clear "Phase 86 closed FAILURE-CLASS pool" marker.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Playwright | All Phase 86 specs | ✓ | 1.58.2 | — |
| Node | regen-constants.mjs | ✓ | v22.4.0 | — |
| Supabase CLI | yarn db:reset + seed | ✓ | latest (per Phase 84) | — |
| Local imgproxy Docker | Image-intrinsic CAND-03/CAND-12 (3 DATA_RACE cells) | intermittent 502 (carry-forward per STATE.md) | — | `supabase stop && supabase start` recycle |
| yarn 4 | All workspace commands | ✓ | 4.13.0 | — |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** None blocking — imgproxy 502 is a carry-forward infrastructure flake that may affect the 3-run cold-start gate; Phase 79 instability-protocol (D-09 fresh trio) is the canonical workaround if it surfaces.

## Metadata

**Confidence breakdown:**
- FAILURE-CLASS inventory: HIGH — derived from direct parse of Phase 85 run-3.json + cross-checked against current diff-playwright-reports.ts pool constants
- Per-test code excerpts: HIGH — all 10 specs read end-to-end
- Per-test RCA hypotheses: MEDIUM — based on training-data lens + spec-internal docstring evidence + Phase 85 error messages (no run-and-confirm instrumentation in this research)
- Plan-allocation recommendation (Plan 03 for QSPEC): HIGH — Phase 85 run-3 error message confirms shared root cause with other Plan 03 candidates
- Verification gate mechanism: HIGH — Phase 79/84/85 precedent reads cleanly; regen-constants.mjs already binds to Phase 85's run-3.json
- Validation Architecture: HIGH — config.json confirms Nyquist enabled; dimension matrix follows Phase 79/83/84/85 precedent

**Research date:** 2026-05-14
**Valid until:** 2026-05-21 (7 days — fast-moving phase, dependencies on Phase 84/85 anchor state)
