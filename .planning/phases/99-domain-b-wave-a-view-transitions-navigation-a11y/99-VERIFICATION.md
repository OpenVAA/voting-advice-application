---
phase: 99-domain-b-wave-a-view-transitions-navigation-a11y
verified: 2026-06-04T00:00:00Z
status: gaps_found
score: 3/4
overrides_applied: 0
operator_dispositions:
  # Recorded 2026-06-04 by execute-phase orchestrator after presenting CR-01/CR-02 to the operator.
  - finding: "CR-02 — afterNavigate focus-reset no-ops app-wide (MainContent <h1> fallback lacks tabindex)"
    decision: "FIX NOW — resolved in commit 71399cc9e (added tabindex=\"-1\" to MainContent.svelte default <h1>). Focus-reset now works app-wide; NAVA11Y-02 satisfied beyond the literal question-heading marker."
    status: resolved
  - finding: "CR-01 — route announcer speaks hardcoded English + opaque questionId DB slug"
    decision: "DEFER TO GAP-CLOSURE PLAN. Operator spec: the announcer text should equal the dynamically-set page title MINUS the constant parts (i.e. the same dynamic title the route already computes for <title>, without the app-name/suffix constants). Reuse the existing localized title source rather than authoring new i18n strings. Close via /gsd-plan-phase 99 --gaps."
    status: gap
gaps:
  - id: CR-01
    requirement: NAVA11Y-01
    summary: "aria-live route announcer outputs hardcoded English + the raw questionId DB slug ('Questions list' for all other routes) instead of a localized human-readable label."
    fix_spec: "Announcer text = the dynamically-set page title with the constant parts stripped (the same dynamic title source the route already feeds to the document <title>, minus the app-name/suffix constants). Reuse the existing localized title derivation — do NOT author net-new announcement i18n strings. Applies to all routes, not just /questions."
    location: "apps/frontend/src/routes/+layout.svelte:232-234"
    severity: warning
    close_via: "/gsd-plan-phase 99 --gaps"
human_verification:
  - test: "Resolve located-voter-journey fixture/seed issue then run a11y-smoke live"
    expected: "PLAYWRIGHT_A11Y=1 yarn test:e2e --project=a11y-smoke exits 0 — all 8 tests pass (6 original axe routes + 2 new NAVA11Y-01/02 blocks)"
    why_human: "The located fixture stalls on a multi-election seed at voter-journey.fixture.ts:130 (ElectionSelector testid forwarding inconsistency). This blocks the 3 pre-existing baseline-green axe tests as well as the 2 new assertions — the failure is environmental/pre-existing, not caused by Phase 99 code, but the live green gate for SC-4 (NAVA11Y-03) cannot be confirmed without it."
  - test: "Visually confirm element-stable VT cross-fades + reduced-motion (SC-1/SC-2/VT-03)"
    expected: "On Q->Q, results election-switch, results entity tabs, and entity-detail tabs, the named surfaces cross-fade element-stably instead of a perceived full-page redraw; with OS 'reduce motion' on (and with ?notr=1), no view-transition animation runs."
    why_human: "Visual cross-fade quality and the reduced-motion short-circuit require a browser with a running dev server; cannot be asserted by unit tests or grep."
---

# Phase 99: Domain B Wave A — View Transitions + Navigation a11y — Verification Report

**Phase Goal:** Navigation between views (Q->Q, results tabs, locale switches) renders as element-stable cross-fades instead of a perceived full-page redraw, with WCAG 2.1 AA-compliant focus management, route announcement, and reduced-motion handling.
**Verified:** 2026-06-04
**Status:** gaps_found (CR-02 fixed in 71399cc9e; CR-01 deferred to gap-closure per operator; live axe gate is an operator/UAT item)
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Root layout couples navigation to View Transitions API reading `navigation.to?.url`, with analytics preserved | VERIFIED | `+layout.svelte:159-170` — single merged `onNavigate` calls `submitAllEvents()` first, then gates on `shouldAnimate(navigation.to?.url)`, returns `new Promise(resolve => { startViewTransition(async () => { resolve(); await navigation.complete; }) })`. All 5 commits exist in git log. |
| 2 | `prefers-reduced-motion` honored on both JS and CSS layers | VERIFIED | `viewTransition.ts:40` — `window.matchMedia?.('(prefers-reduced-motion: reduce)').matches` short-circuits; `+layout.svelte:275-281` — `@media (prefers-reduced-motion: reduce) { :global(::view-transition-group(*)), ... { animation: none !important; } }` (correct `@media { :global() }` nesting, not `:global(@media)` landmine). |
| 3 | A dedicated aria-live="polite" route announcer is always present and text derives from page.params; focus resets on navigation with question heading carrying data-focus-on-nav/tabindex=-1 | PARTIAL — see human_verification items | Announcer structure and placement are VERIFIED (`+layout.svelte:232-234`, outside error/loading branches, `aria-live="polite"`, `aria-atomic="true"`, `id="route-announcer"`, `class="sr-only"`). Focus reset machinery is VERIFIED (`+layout.svelte:176-182`, `requestAnimationFrame`, `preventScroll:true`, `[data-focus-on-nav]` fallback to `h1`). Heading markers VERIFIED on both voter (`(voters)/(located)/questions/[questionId]/+page.svelte:182-184`) and candidate (`candidate/(protected)/questions/[questionId]/+page.svelte:276-278`) pages — `data-focus-on-nav`, `tabindex="-1"`, `view-transition-name: question-heading`. TWO OPEN ISSUES: CR-01 (announcer text is hardcoded English + exposes opaque DB slug; D-03 authorized this but may conflict with CLAUDE.md) and CR-02 (fallback `<h1>` in MainContent.svelte:82 has no `tabindex`, so `.focus()` silently no-ops on non-question routes). Both require developer decision — see human_verification. |
| 4 | Full transition stack passes WCAG 2.1 AA gate under axe-core/playwright env-gated smoke | UNCERTAIN | Spec is extended and typechecks (30eb5ecdd). `assertAxeGates` count = 6 (>= 4 required). `networkidle` count = 0. Unit suite: 706/706 green. Live `a11y-smoke` run blocked by pre-existing located-fixture/seed issue that fails the 3 baseline-green axe routes identically. Cannot confirm live gate. |

**Score:** 3/4 truths fully verified (SC-4 is UNCERTAIN; SC-3 is PARTIAL pending developer decision on CR-01/CR-02)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/frontend/src/lib/utils/viewTransition.ts` | `shouldAnimate` + typed `startViewTransition`, no `any` | VERIFIED | Exists (commit 1b3c073c4). Exports both functions. `shouldAnimate`: SSR guard, feature-detect, `prefers-reduced-motion`, `?notr=1`. `startViewTransition`: typed via `Partial<DocumentWithViewTransition>`, no `as any` (grep confirms 0 hits). |
| `apps/frontend/src/routes/+layout.svelte` | Merged onNavigate + afterNavigate + announcer + reduced-motion CSS | VERIFIED | Modified (commit a6857a9b9). All plan acceptance criteria confirmed: `navigation.to?.url`, `preventScroll: true`, `requestAnimationFrame`, `id="route-announcer"`, `aria-live="polite"`, `submitAllEvents` + `startPageview` preserved, `@media (prefers-reduced-motion: reduce)` present, no `:global(@media)`. |
| `apps/frontend/src/routes/Header.svelte` | `style:view-transition-name="persistent-header"` | VERIFIED | `style:view-transition-name="persistent-header"` on `<header>` (line 69). |
| `apps/frontend/src/routes/MainContent.svelte` | `style:view-transition-name="main-content"` | VERIFIED | `style:view-transition-name="main-content"` on outer content div (line 60). Default `<h1>` at line 82 has NO `tabindex` — relevant to CR-02. |
| `apps/frontend/src/lib/components/questions/QuestionActions.svelte` | `view-transition-name: question-actions` | VERIFIED | `style:view-transition-name="question-actions"` on `role="group"` div (line 85). |
| `apps/frontend/src/routes/(voters)/(located)/questions/[questionId]/+page.svelte` | `question-hero` + `data-focus-on-nav` + `tabindex="-1"` + `question-heading` | VERIFIED | Lines 171 (question-hero on figure), 182-184 (data-focus-on-nav + tabindex="-1" + question-heading on QuestionHeading callsite). |
| `apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte` | Same markers as voter page | VERIFIED | Lines 264 (question-hero), 276-278 (data-focus-on-nav + tabindex="-1" + question-heading). |
| `apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte` | `results-election-select` + `results-entity-tabs` | VERIFIED | Lines 357-358 (`results-election-select` on AccordionSelect), 385-386 (`results-entity-tabs` on results Tabs). |
| `apps/frontend/src/lib/components/tabs/Tabs.svelte` | `transitionOnChange` opt-in prop, imports `shouldAnimate`/`startViewTransition` | VERIFIED | Line 28 imports both from viewTransition; line 35 `transitionOnChange = false` (default false, no callsite breakage); lines 46-47 conditional wrap. |
| `apps/frontend/src/lib/dynamic-components/entityDetails/EntityDetails.svelte` | `transitionOnChange` + `entity-detail-tabs` | VERIFIED | Lines 147-157 confirm `transitionOnChange` prop passed and `style="view-transition-name: entity-detail-tabs"` present. |
| `tests/tests/specs/a11y/a11y-smoke.spec.ts` | Extended with NAVA11Y-01/02 assertions + `?notr=1` + assertAxeGates preserved | VERIFIED (static) | Commit 30eb5ecdd. `#route-announcer` locator, `aria-live` attribute check, `data-focus-on-nav`/`activeElement` assertion, `notr=1` usage, `assertAxeGates` count = 6, `networkidle` count = 0. Typechecks and lints clean. Live run blocked — see SC-4. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `+layout.svelte` | `viewTransition.ts` | `import { shouldAnimate, startViewTransition }` | WIRED | `+layout.svelte:34` — confirmed import; `shouldAnimate(navigation.to?.url)` at line 163; `startViewTransition(...)` at line 165. |
| `+layout.svelte onNavigate` | `document.startViewTransition` | Promise returned from onNavigate | WIRED | `+layout.svelte:164-169` — `startViewTransition(async () => { resolve(); await navigation.complete; })` wrapped in `new Promise<void>`. |
| `+layout.svelte afterNavigate` | `[data-focus-on-nav]` / `h1` | `requestAnimationFrame(() => target.focus(...))` | WIRED | `+layout.svelte:176-182`. Falls back to `h1` — but `h1` in `MainContent.svelte:82` has no `tabindex`, so focus is a silent no-op on most routes (CR-02). |
| `Tabs.svelte` | `viewTransition.ts` | `import { shouldAnimate, startViewTransition }` | WIRED | `Tabs.svelte:28` import confirmed. `activate()` conditionally wraps in `startViewTransition` when `transitionOnChange && shouldAnimate(undefined)`. |
| `EntityDetails.svelte` | `Tabs.svelte transitionOnChange` | `transitionOnChange` prop pass-through | WIRED | EntityDetails passes `transitionOnChange` and `style="view-transition-name: entity-detail-tabs"` to `<Tabs>`. |
| `a11y-smoke.spec.ts` | `#route-announcer` + `[data-focus-on-nav]` | Playwright assertions | WIRED (static) | Selectors, attributes, and evaluate() checks present in spec; live run blocked by pre-existing fixture issue. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|-------------------|--------|
| `+layout.svelte` announcer div | `page.params.questionId` | SvelteKit `$app/state` `page` reactive store | Yes — real URL param | FLOWING, but CR-01: the text is hardcoded English template literal `Question ${questionId}` / `'Questions list'`; `questionId` is an opaque DB slug not a human-readable title; all non-question routes get `'Questions list'` regardless. |
| `Tabs.svelte activate()` | `activeIndex` state mutation | Local `$state` | Real DOM state | FLOWING — `startViewTransition` wraps the mutation when `transitionOnChange=true`. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `viewTransition.ts` exports correct functions | `grep -c "export function shouldAnimate\|export function startViewTransition" .../viewTransition.ts` | 2 | PASS |
| No `as any` in viewTransition.ts | `grep -c "as any" .../viewTransition.ts` | 0 | PASS |
| `navigation.to?.url` used (not `page.url`) | `grep -c "navigation.to?.url" .../+layout.svelte` | 1 | PASS |
| `preventScroll: true` in afterNavigate | `grep -c "preventScroll: true" .../+layout.svelte` | 1 | PASS |
| `@media` wraps `:global` (not reverse) | `grep -c ":global(@media" .../+layout.svelte` | 0 | PASS |
| assertAxeGates preserved (>= 4) | `grep -c "assertAxeGates" a11y-smoke.spec.ts` | 6 | PASS |
| No networkidle in spec | `grep -c "networkidle" a11y-smoke.spec.ts` | 0 | PASS |
| All 5 commits exist in git log | `git log --oneline` | 1b3c073c4, a6857a9b9, 49127e0ba, 3f1fa752f, 30eb5ecdd | PASS |
| Unit suite (706 tests) | Reported in 99-03-SUMMARY.md | 706/706 passed | PASS |
| Live a11y-smoke | `PLAYWRIGHT_A11Y=1 yarn test:e2e --project=a11y-smoke` | Blocked — pre-existing fixture issue | SKIP (blocked) |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| VT-01 | 99-01 | Root layout onNavigate couples to startViewTransition reading navigation.to?.url | SATISFIED | `+layout.svelte:159-170` — exact canonical pattern from REQUIREMENTS.md. |
| VT-02 | 99-02 | view-transition-names on expanded surface set | SATISFIED | All 8 named surfaces confirmed: `persistent-header`, `main-content`, `question-actions`, `question-hero` (voter+candidate), `question-heading` (voter+candidate), `results-election-select`, `results-entity-tabs`, `entity-detail-tabs`. |
| VT-03 | 99-01 | prefers-reduced-motion honored both layers | SATISFIED | JS: `viewTransition.ts:40` matchMedia. CSS: `+layout.svelte:275-281` @media block. |
| NAVA11Y-01 | 99-01/03 | aria-live="polite" announcer with page.params-derived text | PARTIAL | Structural requirements satisfied. CR-01 raises a quality gap: hardcoded English + opaque slug. D-03 explicitly authorized 'generic param-derived label, no new i18n strings' — the implementation is within that scope. Whether D-03 is itself acceptable (vs CLAUDE.md localization mandate) requires developer decision. |
| NAVA11Y-02 | 99-01/02 | afterNavigate focus reset + question heading carries data-focus-on-nav/tabindex=-1 | PARTIAL | The afterNavigate rAF + the question heading markers are all verified. CR-02: the `<h1>` fallback in MainContent.svelte:82 lacks `tabindex`, so focus-reset silently no-ops on all non-question routes. NAVA11Y-02's wording ("the question heading carries data-focus-on-nav") is satisfied; the broader app-wide coverage question requires developer scope decision. |
| NAVA11Y-03 | 99-03 | WCAG 2.1 AA gate under axe-core/playwright | UNCERTAIN | Spec extended, typechecks, assertAxeGates=6. Live run blocked by pre-existing fixture/seed issue that also breaks the 3 baseline-green located axe tests. Cannot confirm live gate. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `+layout.svelte` | 233 | Hardcoded English `'Questions list'` / `` `Question ${page.params.questionId}` `` in aria-live region | WARNING | CLAUDE.md mandates all user-facing strings support multiple locales. D-03 explicitly deferred localization for this phase; resolution requires developer scope call (CR-01). |
| `MainContent.svelte` | 82 | `<h1>` without `tabindex` — used as focus fallback target | RESOLVED (71399cc9e) | Fixed: operator chose "fix now"; `<h1 tabindex="-1">` added so `target?.focus({ preventScroll: true })` works app-wide. App-wide focus-reset contract now holds (CR-02 closed). |
| `Tabs.svelte` | 53 | `onChange?.({ index, tab: tabs[index] })` — `tabs[index]` can be `undefined`, but type declares `tab: Tab` (non-optional) | WARNING | WR-01: `EntityDetails.handleContentTabChange` casts `tab as ContentTab` without null-guard — latent runtime crash if activate() is called with out-of-range index. |

### Human Verification Required

#### 1. Live a11y-smoke Gate (NAVA11Y-03)

**Test:** Resolve the pre-existing `voter-journey.fixture.ts:130` located-fixture/seed issue (ElectionSelector `data-testid` forwarding / non-deterministic multi-election seed), then run `PLAYWRIGHT_A11Y=1 yarn test:e2e --project=a11y-smoke` against a fresh dev stack.
**Expected:** All 8 tests pass — the original 6 axe routes + the 2 new `navigation-a11y — route announcer is route-derived` and `navigation-a11y — focus lands on heading after Q->Q nav` blocks exit 0. The pre-existing 3 baseline-green located tests must also pass (confirms the fixture issue is fixed, not the new tests are broken).
**Why human:** The failure is in a shared voter-journey fixture that affects the entire located E2E suite. Fixing it requires either: (a) stabilising `ElectionSelector`'s `data-testid` forwarding (`voter-elections-list`), or (b) pinning the `data-setup-base` seed to a deterministic single-election seed. Both changes are cross-cutting (they affect all located E2E tests, not just Phase 99 assertions) and fall outside a spec-only plan. The deferred-items.md from Phase 99 documents the exact root cause.

#### 2. CR-01: Route Announcer Localization Acceptability

**Test:** Review the announcer text in `+layout.svelte:232-234`:
```svelte
{page.params.questionId ? `Question ${page.params.questionId}` : 'Questions list'}
```
Evaluate: (a) Does D-03 ("generic param-derived label, no new i18n strings this phase") intentionally authorize this pattern for Wave A, making it an accepted deviation from CLAUDE.md's localization mandate? OR (b) Does this constitute a WCAG 2.1 AA gap that must be fixed before Phase 99 is closed?
**Expected:** Developer states: either "D-03 applies, accept for Wave A — add to follow-up backlog" (in which case a VERIFICATION.md override entry should be added and this item resolves to PASSED (override)), or "this is a gap — add tabindex + a localized label before closing."
**Why human:** Both D-03 (explicit decision) and CLAUDE.md (mandatory rule) apply to this element, and they pull in opposite directions. D-03 wording is "no new localized announcement strings in this phase" — this is a deliberate Wave-A scope boundary. CLAUDE.md says "all user-facing strings must support multiple locales." The verifier cannot resolve which document governs without a developer call on whether D-03's "this phase" scope boundary is intentional.

#### 3. CR-02: App-wide Focus Reset Acceptability

**Test:** Navigate (without `?notr=1`) from the voter results page, then the elections selector, then the home page — verify that after each navigation, focus has moved to the page heading (not stayed on the activated link or gone to `<body>`).
**Expected:** Developer decides: (a) NAVA11Y-02 scope is "the question heading carries data-focus-on-nav/tabindex=-1" (which is satisfied — the marker is on both QuestionHeading callsites) and app-wide fallback coverage is out of Phase 99 scope. OR (b) the intent of NAVA11Y-02 requires that focus reset works on all routes via the h1 fallback, meaning `<h1 tabindex="-1">` must be added to `MainContent.svelte:82`.
**Why human:** NAVA11Y-02 requirement text is "the question heading carries data-focus-on-nav / tabindex='-1'" — which is literally satisfied. The requirement does not say "all page headings." However the PLAN stated "afterNavigate rAF focus reset to [data-focus-on-nav] (fallback first h1)" — if the fallback is non-functional, that PLAN goal was not fully met. This scope ambiguity requires a developer call.

### Gaps Summary (post-operator-disposition, 2026-06-04)

The phase's VT mechanism (SC-1/SC-2) is fully verified. After the orchestrator presented CR-01/CR-02 to the operator, the open items resolve as:

1. **SC-3 / NAVA11Y-02 (CR-02 — app-wide focus fallback): RESOLVED.** Operator chose "fix now". `<h1 tabindex="-1">` added to `MainContent.svelte:82` (commit `71399cc9e`); the `afterNavigate` focus-reset now lands app-wide, not only on the two question pages. eslint clean + frontend build green.

2. **SC-3 / NAVA11Y-01 (CR-01 — announcer localization): GAP — deferred to gap-closure plan.** Operator decision: the announcer text should equal the **dynamically-set page title minus the constant parts** — i.e. reuse the existing localized dynamic title the route already computes for `<title>` (stripped of the app-name/suffix constants), rather than the current hardcoded-English template + opaque `questionId` slug. No net-new announcement i18n strings. Close via **`/gsd-plan-phase 99 --gaps`** (the gap is recorded in frontmatter `gaps:` with `fix_spec`). This is the reason the phase status is `gaps_found`.

3. **SC-4 / NAVA11Y-03 (live axe gate): OPERATOR/UAT item.** The a11y-smoke spec is structurally correct and typechecks. The live gate cannot be confirmed because of a **pre-existing** fixture/seed issue (`voter-journey.fixture.ts:130`, `ElectionSelector` testid forwarding on multi-election seeds) that also breaks the 3 baseline-green located axe tests. Requires operator to fix the voter-journey fixture and re-run. Phase 99 code is not its cause.

**Net:** CR-02 is fixed in-phase. The remaining work before Phase 99 can be marked complete is (a) the CR-01 announcer gap-closure plan, and (b) the human/operator verification items (live axe gate + visual VT cross-fade / reduced-motion). The VT cross-fade machinery (the primary deliverable — SC-1 and SC-2) is cleanly verified.

---

_Verified: 2026-06-04_
_Verifier: Claude (gsd-verifier)_
