# Phase 64: Voter Results Reactivity Completion - Research

**Researched:** 2026-04-27
**Domain:** SvelteKit 2 + Svelte 5 runes — completion of Phase 62 reactivity refactor; root-cause analysis of 5 voter-results E2E failures; Svelte 5 `createSubscriber` survey for the filter bridge architecture; parity-script constants regeneration methodology
**Confidence:** HIGH (fixture failure mode + filter rendering verified via JSON report + codebase grep) / MEDIUM (root-cause attribution between fixture flake vs reactivity contention) / HIGH (Svelte 5 patterns — Context7 + official docs)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Scope of Allowed Changes

- **D-01: `@openvaa/filters` source IS in scope, BUT must remain UI-framework agnostic.** Phase 62 D-07 ("untouched") is rescinded for Phase 64. Targeted modifications to the package are permitted when root-cause analysis points to a contract that no consumer-side bridge can cleanly fix. **Hard constraint:** no Svelte-specific primitives may leak into `@openvaa/filters` source — no `$state`, no `$derived`, no `svelte/store`, no `svelte/reactivity` imports inside the package. The package must remain consumable by any UI framework (today: Svelte; tomorrow: hypothetical React/Solid/Vue consumers). Permissible categories of change: (a) pure-TS API additions (e.g., a `getSnapshot()` accessor for filter rule state), (b) internal correctness/notification-ordering fixes in `FilterGroup._onChange` dispatch, (c) `Filter.setRule` / `Filter._rules` immutability guarantees, (d) new generic accessors that consumers can wrap themselves. Excluded: any Svelte-specific code path inside `packages/filters/`.

- **D-02: `initFilterContext()` lifecycle audit IS in scope.** The current implementation calls `$effect(() => { ... })` directly inside the `initFilterContext({ entityFilters })` function body (`apps/frontend/src/lib/contexts/filter/filterContext.svelte.ts:80-88`). Phase 64 audits and, if reproduction confirms the lifecycle is part of the failure class, fixes it.

- **D-03: Svelte 5 best-practice for external subscriptions MUST be researched before locking the bridge architecture.** Output: a "Svelte 5 external-subscription patterns" section in `64-RESEARCH.md` ranking 2-3 viable approaches with code sketches. **Decision branch:** if the survey reveals that the `onChange` callback paradigm is fundamentally a poor fit for Svelte 5, Phase 64 may **narrow `@openvaa/filters` scope to abstract filtering logic only** — drop the built-in `onChange` subscription model from the package entirely.

- **D-04: `@openvaa/dev-seed` e2e-template extension IS in scope** for Phase 64 IF the contract for RESULTS-01/02, D-14, D-15 requires deterministic filter checkboxes. Preferred minimum: **fix consumer-side wiring first** so the EnumeratedFilter for party renders without a seed change; only extend the template if a true seed gap is identified.

#### Investigation Direction (no pre-rank — reproduce first)

- **D-05: Reproduce-first stance for the deeplink fixture timeout.** Three plausible directions: (a) Component-side `getEntityAndTitle` silent degrade; (b) Load-function-side redirect-strip; (c) Fixture-side short-circuit. **NEW SIGNAL FROM UI-SPEC:** `EntityListWithControls.svelte:143` hard-codes `data-testid="entity-list-with-controls"` — verify whether testid prop-forward works.

- **D-06: No predetermined investigation order.** Researcher reproduces against a clean stack, reads JSON test report, and determines empirical root cause.

#### PASS Criterion + Verification Gate

- **D-07: PASS criterion = 5 named tests pass deterministically inside a full v2.6 parity capture, AND parity-script constants regenerated against the post-fix baseline.** Canonical Playwright invocation: `yarn playwright test -c ./tests/playwright.config.ts --workers=1 --reporter=json`.

- **D-08: Phase 64 owns parity-script constants regeneration.** Captures `playwright-report.json` at `.planning/phases/64-voter-results-reactivity-completion/post-fix/playwright-report.json`. Regenerates `PASS_LOCKED_TESTS`, `DATA_RACE_TESTS`, `CASCADE_TESTS` constants in `.planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts` from the new baseline. Commits both atomically.

- **D-09: imgproxy upload test + 13 cascades classify into `DATA_RACE_TESTS`** in the regenerated constants.

- **D-10: Phase 62 deferred 9-step manual smoke checklist (`62-03-HUMAN-CHECKPOINT.md`) is cleared as part of Phase 64 verification.**

#### Test Hygiene

- **D-11: `test.skip(true, ...)` paths in RESULTS-01/02, D-14, D-15 are removed** once seed prerequisites are guaranteed. Replace with hard assertions.

- **D-12: Filter source for the deterministic contract = party filter (already implicit in e2e seed).**

#### Plan Split

- **D-13: 3 plans, root-cause grouped.**
  - **Plan 64-01: Reactivity bridge** — RESULTS-01/02 + D-14 + D-15.
  - **Plan 64-02: Deeplink load chain** — D-08 shape 3 + D-08 shape 4.
  - **Plan 64-03: Verification + close** — full v2.6 parity capture, parity-script constants regeneration, manual smoke clearance.
  - Plans run sequentially: 64-01 → 64-02 → 64-03.

### Claude's Discretion

- Exact Svelte 5 best-practice pattern selection for the external-subscription bridge.
- Whether `initFilterContext` is fixed in-place vs replaced by a component-side bridge.
- Specific shape of `@openvaa/filters` API additions if any.
- Whether D-08 shape 4 requires a separate fix or rides shape 3's fix.
- Whether to capture and ship a `dev:reset-with-imgproxy` script.
- Test sequencing within 64-01.

### Deferred Ideas (OUT OF SCOPE)

- Sweep all `EntityList` consumers across the candidate-app to migrate to `EntityListWithControls`.
- Extend e2e tests to cover ALL supported filter types systematically.
- Sweep the entire E2E suite for `test.skip(true, ...)` modifiers.
- Deeper voter-app reactivity refactor (`voterContext` shape, election persistence in URL, `fromStore`/`toStore` retirement).
- Wider audit of `$effect` lifecycle in non-component contexts across the app.
- Declarative test-scoped settings/seed mutation DSL.
- `@openvaa/filters` API redesign post-narrowing.
- Imgproxy resilience (`dev:reset` could include `supabase stop && supabase start`).
- Centralized overlay architecture.
- Snippet-based controls customization for `EntityListWithControls`.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| RESULTS-01 | Eliminate `effect_update_depth_exceeded` in filter toggling on the layout-based render path. Reactivity bridge between `FilterGroup.onChange` (plain JS callback registry) and Svelte 5 `$derived` consumers must be sound — no infinite loops. | Phase 62 implementation (`filterContext.svelte.ts:80-88`) uses Option B (version-counter via `$effect` + `onChange` cleanup). Existing unit tests in `filterContext.svelte.test.ts:115-310` PROVE the bridge mechanism works under mount/unmount. The 5 failing E2E tests do NOT exhibit `effect_update_depth_exceeded` — see Real Failure Analysis §1. |
| RESULTS-02 | Filters re-enabled end-to-end in the layout. Filter toggling narrows the list; badge appears; reset works. | Layout integration (`+layout.svelte:362-383`) passes `entities={activeMatches}` and `data-testid="voter-results-list"` to `<EntityListWithControls>`. The party `ObjectFilter` IS built by `buildParentFilters()` (`apps/frontend/src/lib/contexts/voter/filters/buildParentFilters.ts:30-62`) with 4 parties from the e2e seed (verified). EnumeratedEntityFilter renders checkboxes (`apps/frontend/src/lib/components/entityFilters/enumerated/EnumeratedEntityFilter.svelte:136`). |
| RESULTS-03 | Deeplink to detail URL renders both list + drawer (D-08 shapes 3+4). | Layout's `drawerVisible` `$derived` gates on `page.params.entityTypeSingular && page.params.id` (`+layout.svelte:161-163`). Drawer-first source order (line 289) + `content-visibility: auto` on list container (line 347-349). Test 10 (`drawer paints before list on cold deeplink`) PASSES today — D-10 mechanism is intact. The 2 deeplink tests fail in FIXTURE setup (see Real Failure Analysis §3), not in the deeplink rendering code path. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Yarn 4 workspaces + Turborepo:** Dependencies use `workspace:^`. No new external dependencies expected for Phase 64.
- **Runes mode globally enabled:** `apps/frontend/svelte.config.js` sets `compilerOptions.runes: true`. Every new component MUST use `$props`, `$state`, `$derived`, `$effect`. No `export let`, no `$:`, no `<slot />`.
- **Single production data adapter = Supabase.** Nothing in Phase 64 touches the adapter.
- **WCAG 2.1 AA:** UI-SPEC binding accessibility contract inherited from Phase 62 + dark-mode contrast manual step (Phase 64 D-10 step 7).
- **Localization:** All user-facing strings exist in 7 locales. Phase 64 introduces ZERO new user-facing strings (Phase 62 inherited).
- **TypeScript strict, no `any`.**
- **Code Review Checklist:** Per CLAUDE.md, each plan checks against `.agents/code-review-checklist.md`.
- **Route file convention:** `apps/frontend/src/routes/(voters)/(located)/results/` — no `[[lang=locale]]` wrapper for this route tree (verified via `ls`).
- **Test command via repo hook workaround (memory):** Commits in this repo must use `git -c core.hooksPath=/dev/null` — recorded in MEMORY.md `project_gsd_repo_hook_workaround.md`.

---

## Summary

The 5 failing voter-results E2E tests (RESULTS-01+02, D-14, D-15, D-08 shapes 3+4) **do not fail for the reasons CONTEXT.md primarily hypothesizes**. The Phase 63 post-v2.6 JSON report provides ground truth: 4 of the 5 failures are timeouts in the `answeredVoterPage` fixture (line 68 of `voter.fixture.ts` — `waitForURL` after answer click during the 16-question journey), and the fifth (D-14) is a `test.skip(true, …)` due to the filter button or checkbox not being found in the modal. **No test exhibits `effect_update_depth_exceeded`. No test fails in the deeplink rendering path itself.** This is a substantive reframe of the failure surface and the planner must adapt accordingly.

**Two distinct root-cause classes are likely contributing:**
1. **Fixture flake exposed by post-Phase-62 timing** — the voter journey takes long enough that auto-advance after answer click occasionally fails to navigate within the 5s `waitForURL` budget. The fixture's 30s test budget is consumed by 14+ question advances + final results-list wait + retries. Cause is likely cumulative reactive-chain settling time in `voterContext`'s 7+ `$effect` blocks (selectedElections / selectedConstituencies / question categories / matches), not the filterContext bridge specifically.
2. **Filter rendering path** — D-14 skips because the test fails to find a clickable filter checkbox. The party `ObjectFilter` IS built by `buildParentFilters()` (verified via codebase read), and the e2e seed has 4 parties with nominations (verified). Either (a) the filter button isn't rendering on the page when the test runs (race condition with `voterCtx.matches` settling), (b) the EnumeratedEntityFilter modal renders but the dynamic-import `{#await import('./enumerated')}` (`EntityFilters.svelte:53-55`) hasn't resolved when the test asserts, or (c) the filter trigger button rendered but in a state where `activeFilterGroup?.filters.length` is briefly 0 (line 153 of `EntityListWithControls.svelte`) — all symptoms of timing/reactivity gaps, not bridge correctness.

**The Svelte 5 ecosystem provides `createSubscriber` from `svelte/reactivity` (added in 5.7.0) as the canonical bridge for external event-based state into `$derived`.** This is a stronger, more idiomatic alternative to the current Option B (version counter via `$effect` + `onChange` cleanup) but it does NOT obviously fix the failure modes documented above — those are timing problems in the FIXTURE journey, not bridge correctness in the filterContext. **Recommendation: keep Option B as the bridge architecture, since unit tests prove it works (`filterContext.svelte.test.ts` lines 203-235 verify the version counter bumps; lines 264-288 verify cleanup).** Only narrow `@openvaa/filters` scope (D-03 branch) if Plan 64-01 reproduction reveals the bridge IS the culprit, not before.

**Primary recommendation:** Execute the 3-plan split (D-13). For Plan 64-01, lead with **empirical reproduction** — run `yarn playwright test --grep "filter toggle narrows" --workers=1 --reporter=line` against `yarn dev:reset-with-data && yarn dev` and instrument with `console.log` at `voter.fixture.ts:65-68` and at `+layout.svelte:147` (activeMatches) to verify what's slow. Plan 64-01's actual likely fix is one or more of: (a) increase the fixture's `waitForURL` budget from 5s to 10s, (b) pre-poll `voterCtx.matches[activeElectionId]` settling in the layout before rendering EntityListWithControls (matching the `awaitNominationsSettled` pattern from `(located)/+layout.svelte:99-135`), (c) remove the `test.skip(true, …)` paths and replace with hard waits for the filter button to appear (D-11). Plan 64-02 reproduces the cold-deeplink path independently (using `goto()` from a clean session, NOT the answeredVoterPage fixture) to verify whether D-08 shapes 3+4 are actual deeplink bugs OR purely fixture-induced. Plan 64-03 captures the parity baseline + regenerates the diff-script constants from the same JSON.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Filter rule state (per `(electionId, plural)` tuple) | Browser (`filterContext.svelte.ts` Symbol context) | — | Browser-only state; SPA-scoped; rebuilt by `filterStore` on URL scope change. Phase 62 D-05 locked. |
| FilterGroup → Svelte reactivity bridge | Browser (consumer-side `filterContext` `$effect` + version counter OR `createSubscriber`) | — | D-01 hard-constrains `@openvaa/filters` to be UI-framework-agnostic; bridge belongs in the consumer. |
| Filtered list computation | Browser (`$derived.by` inside `EntityListWithControls.svelte:109-117`) | — | Pure function (`computeFiltered` in helpers); `FilterGroup.apply` verified pure. |
| URL-driven scope (electionId × entityTypePlural) | Browser (page.params via parseParams) | Frontend Server (matchers run on both) | Phase 62 D-08, D-13. URL is single source of truth; matchers reject invalid plurals before route mounts. |
| Drawer visibility | Browser (`+layout.svelte:161-163` `$derived`) | — | Phase 62 D-09: `entityTypeSingular && id` both required. |
| Drawer content rendering | Browser (`getEntityAndTitle` on page.params + voterCtx.matches) | — | Phase 62 D-10 silent-degrade contract (logDebugError + undefined). |
| 4-segment route validation | Frontend Server (matchers + `+page.ts` coupling guard) | Browser (matchers re-run client) | Phase 62 D-11. SvelteKit matcher behavior. |
| Canonical redirect (`/results` → `/results/candidates`) | Frontend Server (`+layout.ts` redirect 308) | Browser (re-runs on client nav) | Phase 62 RESEARCH A3. |
| `answeredVoterPage` fixture orchestration | Test runtime (Playwright fixture) | Browser (waiting for redirects + UI mounting) | Out-of-app test setup; the failing fixture timeout is a race between Playwright's wait and the app's reactive settling. |
| Parity-script constants regeneration | Build/scripts tier (Node + tsx) | — | `diff-playwright-reports.ts` lines 53-138 embed the 3 sets; regenerated as a one-shot at milestone close. |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| svelte | ^5.53.12 (latest 5.55.5) | Runes mode for components, `$state`/`$derived`/`$effect`, `svelte/reactivity` `createSubscriber` (5.7+), `$effect.root()` for non-component scopes | `[VERIFIED: .yarnrc.yml line 26]` `[VERIFIED: npm view svelte version → 5.55.5 published 2026-04-23]` Project pinned to ^5.53.12; semver allows up to 5.55.5. |
| @sveltejs/kit | ^2.55.0 (latest 2.58.0) | `[[optional]]` param matchers, `$app/navigation` `goto`, `$app/state` `page` | `[VERIFIED: .yarnrc.yml line 25]` Phase 62 stack inherited verbatim. |
| @openvaa/filters | workspace:^ | `FilterGroup` + `Filter` + `ObjectFilter` (party filter source) + `_onChange` callback registry | `[VERIFIED: packages/filters/src/group/filterGroup.ts:9-126 + packages/filters/src/filter/base/filter.ts:13-204]` D-01 permits targeted modifications IFF UI-framework agnostic. |
| @openvaa/dev-seed | workspace:^ | `e2eTemplate` defines 4 parties + 17 questions + 13 candidates with party affiliations (`organization.external_id`) | `[VERIFIED: packages/dev-seed/src/templates/e2e.ts lines 192-228 + 525-805]` D-04: extension IS in scope IF needed. |
| @playwright/test | ^1.58.2 (latest 1.59.1) | E2E test runner; canonical invocation `yarn playwright test -c ./tests/playwright.config.ts --workers=1 --reporter=json` | `[VERIFIED: .yarnrc.yml line 22]` D-07 verification gate. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `svelte/reactivity` `createSubscriber` | (built-in, Svelte ≥5.7.0) | Canonical Svelte 5 bridge from non-runes external event sources to `$state` graph | Use IF Plan 64-01 reproduction reveals the version-counter bridge is fundamentally fragile. **Default: keep Option B (version counter)** because unit tests prove it. `[CITED: https://svelte.dev/docs/svelte/svelte-reactivity]` |
| `svelte` `$effect.root()` | (built-in, Svelte 5) | Detached effect scope outside component setup; manual cleanup | Already used at `(located)/+layout.svelte:119-133` for `awaitNominationsSettled`. Reference pattern for ANY non-component reactive scope; would also work to wrap the `initFilterContext` `$effect` if Phase 64 audit deems it necessary. `[CITED: https://svelte.dev/docs/svelte/$effect]` |
| `svelte` `untrack` | (built-in) | Read a `$state` without establishing a reactive edge | Already used at `voterContext.svelte.ts:230` and `(located)/+layout.svelte:114`. Reach for it ONLY if reproduction shows a recursive update; otherwise pure `$derived` is preferred. `[CITED: Phase 60 RESEARCH §Common Pitfalls; svelte.dev/docs/svelte/svelte 'untrack']` |
| `vitest` | ^3.2.4 | Frontend unit test runner; mounts Svelte 5 components | `[VERIFIED: .yarnrc.yml line 8]` Existing harness at `filterContext.svelte.test.ts` already proves the bridge. |
| Existing `parseParams` util | (in repo) | Merges route params + persistent search params (`electionId`, `constituencyId`) | Used at `filterContext.svelte.ts:65` and `+layout.svelte:102`. Re-use for any new param reads. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Option B version counter (current) | `createSubscriber` from `svelte/reactivity` | createSubscriber is the official idiom; arguably cleaner. BUT requires wrapping `FilterGroup` in a `class` that calls `subscribe()` inside its `filterGroup` getter. Currently `filterContext` exposes `filterGroup` as a `$derived` slice from the FilterTree — refactoring to wrap each FilterGroup is more code than the version counter. Existing unit tests pass on Option B; switching would invalidate them. **Default: keep Option B unless reproduction shows the version counter is the actual culprit.** |
| Increase fixture `waitForURL` to 10s | Diagnose & shorten the reactive-chain settling time in `voterContext` | The 5s budget at `voter.fixture.ts:68` is for ONE question advance (urlBefore→urlAfter). 350ms `setTimeout` + `goto` + page mount = realistically 500-1500ms in normal cases. 5s should be plenty UNLESS the auto-advance fires before reactive state is ready. Increasing the budget masks the real problem. Diagnosing the chain is harder but correct. |
| Add a "wait for matches available" gate before rendering EntityListWithControls in `+layout.svelte` | Trust the existing `{:else} <Loading />` branch at line 385 to handle matches=undefined | The `<Loading />` branch only fires when `activeMatches` is undefined. If `activeMatches` is a non-empty array but the inner FilterGroup is still being constructed, the test could find a card but no filter button. Verify in reproduction whether this race exists. |
| Pre-render the party filter with deterministic seed coverage | Add a Playwright `expect.poll(filterButton.count()).toBeGreaterThan(0)` wait | Both work; the second is more robust to seed-content-change. D-11 directs replacement of `test.skip(true, ...)` with hard assertions; `toBeGreaterThan(0)` IS a hard assertion. |

**Installation:** No new dependencies. All tools already in the project.

**Version verification (verified 2026-04-27):**
- `svelte@^5.53.12` — catalog pin; `npm view svelte version` → `5.55.5` (published 2026-04-23). Project will pull 5.55.5 inside the ^5.53.x range. `createSubscriber` available since 5.7.0; `$effect.root()` available since 5.0.
- `@sveltejs/kit@^2.55.0` — catalog pin; latest 2.58.0.
- `@playwright/test@^1.58.2` — catalog pin; latest 1.59.1.
- Svelte 5 `createSubscriber` + `$derived` interaction bug (issue #15888) was fixed via PR #16466 — present in 5.55.5, NOT a concern for Phase 64. `[CITED: https://github.com/sveltejs/svelte/issues/15888]`

---

## Architecture Patterns

### System Architecture Diagram

```
                       ┌──────────────────────────────────────┐
   Playwright          │  test.use({ ...VoterFixtureOptions }) │
   spawns voter-app    │  voterTest.extend({ answeredVoterPage })│
   project             └─────────────┬────────────────────────┘
                                     │
                                     ▼
   ┌────────────────── answeredVoterPage fixture (voter.fixture.ts) ──────────────────┐
   │ 1. navigateToFirstQuestion(page)  → /questions/[firstId]                         │
   │ 2. for i in 0..voterAnswerCount-1 (default 16):                                  │
   │      answerOption.click()                                                       │
   │      page.waitForURL(url ≠ urlBefore, 5000ms) ◀──── FAILURE POINT (line 68)    │
   │      waitForNextQuestion(...) for i < count-1                                    │
   │ 3. (if not on /results) click next button + waitForURL /results 10s              │
   │ 4. page.getByTestId('voter-results-list').waitFor(visible, 10000ms)              │
   └─────────────────────────────────────────────────┬───────────────────────────────┘
                                                     │
   App rendering pipeline                            ▼
   ┌──────────────────────────────────────────────────────────────────────┐
   │ Question page rendering during fixture (the slow path)               │
   │                                                                      │
   │ /questions/[questionId]/+page.svelte                                 │
   │   handleAnswer({ question, value })                                  │
   │     answers.setAnswer(...)                                           │
   │     setTimeout(handleJump, 350ms)  ── DELAY.md                       │
   │   handleJump(steps=1)                                                │
   │     newIndex = block.index + 1                                       │
   │     if (newIndex >= questions.length) goto($getRoute('Results'))     │
   │     else goto(getRoute({route: 'Question', questionId: ...}))        │
   │                                                                      │
   │   Behind: voterContext $effect chain                                 │
   │     • selectedElections    (effect over reactiveDataRoot+params)     │
   │     • selectedConstituencies                                         │
   │     • _questionCategories  / _opinion / _info                        │
   │     • _selectedQuestionBlocks (depends on selected categories)       │
   │     • _matches             (heavy: matching algorithm)               │
   │     • _entityFilters       (depends on _nominationsAndQuestions)     │
   │     • initFilterContext()  (called once, $effect attaches onChange)  │
   └──────────────────────────────────────────────────────────────────────┘
                                                     │
                                                     ▼
   ┌──────────────────────────────────────────────────────────────────────┐
   │ Results page rendering (warm + cold paths)                           │
   │                                                                      │
   │ /results/[[plural]]/[[singular]]/[[id]]/+layout.svelte               │
   │   $derived activeElectionId / activeEntityType / activeMatches       │
   │   {#if activeMatches} <EntityListWithControls/> {:else} <Loading/>   │
   │                                                                      │
   │ EntityListWithControls.svelte                                        │
   │   activeFilterGroup = $derived(fctx.filterGroup)                     │
   │   filtered = $derived.by(() => { void fctx.version; ... })           │
   │   numActiveFilters = $derived(countActiveFilters(activeFilterGroup)) │
   │   {#if activeFilterGroup?.filters.length} <Button data-testid="…" /> │
   │                                                                      │
   │ filterContext.svelte.ts                                              │
   │   _filterGroup = $derived.by(() => entityFilters()[eid][type])       │
   │   $effect(() => { fg.onChange(handler); return () => fg.onChange... })│
   │   version $state(0) bumped inside handler                            │
   └──────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure (no changes from Phase 62)

```
apps/frontend/src/
├── params/                                  # UNCHANGED
│   ├── entityTypePlural.ts
│   └── entityTypeSingular.ts
├── lib/contexts/
│   ├── filter/                              # MODIFIED IN PHASE 64 (D-02 audit)
│   │   ├── filterContext.svelte.ts
│   │   ├── filterContext.type.ts
│   │   ├── filterContext.svelte.test.ts
│   │   ├── __tests__/
│   │   │   ├── FilterContextHarness.svelte
│   │   │   └── GetFilterContextHarness.svelte
│   │   └── index.ts
│   └── voter/
│       └── voterContext.svelte.ts           # POSSIBLY ADJUSTED for init order (D-02)
├── lib/dynamic-components/entityList/
│   ├── EntityListWithControls.svelte        # POSSIBLY ADJUSTED (consumer-side bridge)
│   ├── EntityListWithControls.helpers.ts    # UNCHANGED
│   └── EntityListWithControls.test.ts       # POSSIBLY EXTENDED
└── routes/(voters)/(located)/results/
    ├── +layout.svelte                       # POSSIBLY ADJUSTED (Plan 64-02)
    ├── +layout.ts
    └── [[entityTypePlural=…]]/[[entityTypeSingular=…]]/[[id]]/
        ├── +page.svelte                     # UNCHANGED (empty placeholder)
        └── +page.ts                         # POSSIBLY ADJUSTED (Plan 64-02)

packages/filters/                            # POSSIBLY ADJUSTED (D-01)
├── src/group/filterGroup.ts
├── src/filter/base/filter.ts
└── src/index.ts

tests/tests/
├── fixtures/voter.fixture.ts                # POSSIBLY ADJUSTED (Plan 64-02)
└── specs/voter/voter-results.spec.ts        # MODIFIED (D-11 skip-path removal)

.planning/phases/64-voter-results-reactivity-completion/
└── post-fix/
    ├── playwright-report.json               # NEW (D-08 baseline artifact)
    ├── playwright.stderr.txt                # NEW
    └── diff.md                              # NEW

.planning/phases/59-e2e-fixture-migration/scripts/
└── diff-playwright-reports.ts               # MODIFIED (constants regen, D-08)
```

### Pattern 1: Svelte 5 External Subscription — `createSubscriber` (canonical idiom; Plan 64-01 candidate)

**What:** `createSubscriber` from `svelte/reactivity` is the official Svelte 5 bridge for integrating non-runes external event sources (callback registries, event emitters, MediaQuery, IntersectionObserver) into the `$state` graph. Returns a `subscribe: () => void` function; calling it inside any `$derived`/`$effect` establishes a reactive edge. The `start` callback runs on first subscriber, the cleanup return runs when subscriber count hits zero.

**When to use:** When wrapping an external state source as a class with reactive getters. The class encapsulates lifecycle; consumers just read `instance.value` inside `$derived`.

**Example (from official docs):**
```ts
// Source: https://svelte.dev/docs/svelte/svelte-reactivity (CITED)
import { createSubscriber } from 'svelte/reactivity';
import { on } from 'svelte/events';

export class MediaQuery {
	#query;
	#subscribe;

	constructor(query) {
		this.#query = window.matchMedia(`(${query})`);
		this.#subscribe = createSubscriber((update) => {
			const off = on(this.#query, 'change', update);
			return () => off();   // teardown when no subscribers remain
		});
	}

	get current() {
		this.#subscribe();        // establish reactive edge
		return this.#query.matches;
	}
}
```

**Hypothetical adaptation for FilterGroup (Plan 64-01 alternative; NOT recommended as default):**
```ts
// Hypothetical wrapper class — NOT recommended unless reproduction surfaces a real
// bridge bug. Adds a per-FilterGroup wrapper class managed entirely consumer-side
// (D-01 agnosticism preserved — no svelte primitives inside @openvaa/filters).
import { createSubscriber } from 'svelte/reactivity';
import type { FilterGroup } from '@openvaa/filters';
import type { MaybeWrappedEntityVariant } from '$types';

export class ReactiveFilterGroup {
	#fg: FilterGroup<MaybeWrappedEntityVariant>;
	#subscribe;

	constructor(fg: FilterGroup<MaybeWrappedEntityVariant>) {
		this.#fg = fg;
		this.#subscribe = createSubscriber((update) => {
			const handler = () => update();
			this.#fg.onChange(handler, true);
			return () => this.#fg.onChange(handler, false);
		});
	}

	get filterGroup() { this.#subscribe(); return this.#fg; }
	get filters()     { this.#subscribe(); return this.#fg.filters; }
	get active()      { this.#subscribe(); return this.#fg.active; }
}
```

**Tradeoff vs current Option B (version counter):**
- createSubscriber: idiomatic, lifecycle-correct by construction, slightly more code (per-FilterGroup wrapper instances), invalidates `filterContext.svelte.test.ts` lines 203-235 (version-counter assertions become wrapper-class assertions).
- Option B (current): unit-test-proven, 3 lines of bridge code in `filterContext`, the `void fctx.version` "defensive dependency edge" is non-idiomatic but explicit.

**Decision recommendation (research-grounded):** Default to Option B; switch to createSubscriber ONLY if Plan 64-01 reproduction shows the version counter exhibits the actual failure mode. Failure analysis below shows the failures are NOT bridge-correctness bugs — they are FIXTURE timing bugs. Switching bridge architecture without a proven defect risks invalidating green unit tests for no symptomatic gain.

**Known bug to be aware of:** `svelte#15888` reported `$derived` reactivity breaking with `createSubscriber` after teardown when the value is not used elsewhere. Fixed in PR #16466 (closed). `[CITED: https://github.com/sveltejs/svelte/issues/15888]` Project Svelte version (resolves 5.55.5) is past the fix.

### Pattern 2: `$effect.root()` for non-component scope (existing in this codebase)

**What:** Creates a detached reactive scope that doesn't auto-cleanup with a parent component. Useful when reactive logic must outlive the component or when initializing reactive code outside a component setup phase.

**When to use:** When initializing a reactive scope in a non-component module, OR when the reactive logic should persist across navigation. Most contexts in this app DO run inside `(voters)/+layout.svelte`'s setup, so `$effect.root()` isn't required for `initFilterContext` itself — but it IS used elsewhere.

**Example (existing in codebase):**
```ts
// Source: apps/frontend/src/routes/(voters)/(located)/+layout.svelte:99-135
function awaitNominationsSettled(): Promise<NominationStatus> {
  return new Promise((resolve) => {
    let resolved = false;
    let debounceTimer: ReturnType<typeof setTimeout>;

    function done(status) { /* ... clean up safetyTimer + cleanupEffect ... */ }
    const safetyTimer = setTimeout(/* ... */, NOMINATIONS_SETTLE_TIMEOUT);

    const cleanupEffect = $effect.root(() => {
      $effect(() => {
        const value = voterCtx.nominationsAvailable;
        const status = checkNominations(value);
        if (status === 'all') {
          queueMicrotask(() => done(status));
        } else {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => done(checkNominations(untrack(() => voterCtx.nominationsAvailable))), 100);
        }
      });
    });
  });
}
```

**Implication for Phase 64:** If Plan 64-01's audit finds `initFilterContext` is being called outside a component setup (it's not — `(voters)/+layout.svelte:36` calls `initVoterContext()` which calls `initFilterContext()`), `$effect.root()` would be the fix. **Verified: `initFilterContext` IS called inside a component setup phase**, so the current `$effect` is valid. D-02 audit may still confirm there's no bug.

### Pattern 3: Version-counter bridge (current Option B; Phase 62 incumbent)

**What:** A consumer-side `$effect` subscribes to the external callback registry; the handler bumps a `$state` counter; consumers read the counter inside their `$derived` to establish a reactive edge.

**When to use:** When the external library exposes only a callback registry (not an event emitter or store). This IS the @openvaa/filters surface today.

**Example (current code):**
```ts
// Source: apps/frontend/src/lib/contexts/filter/filterContext.svelte.ts:45-88 (VERIFIED)
let version = $state(0);

const _filterGroup = $derived.by<FilterGroup<MaybeWrappedEntityVariant> | undefined>(() => {
  void version;     // defensive dependency edge — even consumers that only read filterGroup re-run on mutations
  const tree = entityFilters();
  const params = parseParams(page);
  // ... resolve to active FilterGroup by (electionId, plural) tuple
});

$effect(() => {
  const fg = _filterGroup;
  if (!fg) return;
  const handler = () => { version++; };
  fg.onChange(handler, true);
  return () => fg.onChange(handler, false);   // Pitfall 2 cleanup
});
```

**Tested:** `filterContext.svelte.test.ts` line 203-235 verifies the bump; line 264-288 verifies cleanup detaches the handler on unmount.

### Anti-Patterns to Avoid

- **Don't move bridge logic into `@openvaa/filters` source.** D-01 hard-constrains. Consumers manage their own framework's reactivity primitive.
- **Don't write `$state` inside an `$effect` that depends on its own write.** Phase 60's classic `effect_update_depth_exceeded`. The version counter idiom avoids this because `version++` does not feed back into the `$effect` dependency.
- **Don't bind `$derived` values with `bind:`.** Phase 62 Pitfall 3 — `Tabs activeIndex={derivedIdx}` is correct; `Tabs bind:activeIndex={derivedIdx}` errors at compile time.
- **Don't reach for `untrack` preemptively.** Phase 60 RESEARCH explicitly notes `untrack` masks rather than fixes the root cause. Use only when reproduction shows recursion.
- **Don't increase Playwright timeouts as the first fix.** Symptom-masking. Phase 64 D-07's PASS criterion is "deterministic," not "flaky-but-eventually-green."

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| External-callback → Svelte reactivity bridge | Custom `Set<callback>` listener + manual cleanup tracking | Either Option B (existing 3-line version counter) OR `createSubscriber` from `svelte/reactivity` | Both have correct teardown semantics. Custom subscription tracking leaks handlers (Phase 62 Pitfall 2). |
| FilterGroup result computation | Re-compute inside `$effect` with manual state writes | `$derived.by(() => filterGroup.apply(entities))` (existing) | `FilterGroup.apply` is pure (`packages/filters/src/group/filterGroup.ts:46-52` VERIFIED). `$derived` is the runes-mode primitive. |
| URL → state synchronization | `$effect` that reads `page.params` and writes `$state` | `$derived(page.params.X)` directly | Phase 62 D-13 (URL-as-SoT). All Phase 64 work inherits this. |
| Drawer-first paint | Streaming SSR or prioritized load function | Source-order rendering + `content-visibility: auto` (D-10 already shipped) | Test 10 (`drawer paints before list...`) PASSES today. Don't change a working mechanism. |
| Test JSON parsing for parity script | Custom JSON parser | `flattenReport` + `categorizeStatus` already in `diff-playwright-reports.ts` lines 200-253 | The script is the canonical source of truth for the v2.5/v2.6 contract. |
| Constants regeneration logic | Manual edit of three arrays | Generate by running diff-script in "regen mode" OR a one-shot tsx that reads the post-fix JSON | Phase 63 D-14 + Phase 64 D-08 specify the methodology — same pattern, new input. |

**Key insight:** Every "obvious" hand-roll temptation in Phase 64 has an existing, tested, idiomatic alternative. The phase is small in surface but rich in invariants — preserve them.

---

## Real Failure Analysis (CRITICAL — supersedes CONTEXT.md hypothesis directions)

### §1: Empirical Ground Truth (from `post-v2.6/playwright-report.json`)

I extracted error locations + statuses + durations for the 5 failing tests directly from the report:

| Test | Status | Failure Location | Duration | Implication |
|------|--------|------------------|----------|-------------|
| RESULTS-01 + RESULTS-02 (`filter toggle narrows…`) | failed | `voter.fixture.ts:68` `page.waitForURL(url ≠ urlBefore, 5000ms)` | 96977ms | Fixture timed out during answer-advance loop. NOT a body assertion failure. NOT `effect_update_depth_exceeded`. Test budget hit on retry × 30s = ~96s. |
| D-14 (`filter state resets on plural tab switch`) | skipped | (no error — `test.skip(true, …)` triggered) | 21776ms | Filter button OR checkbox NOT found in modal. Body executed; skip path engaged at line 169-181 of spec. |
| D-15 (`filter state survives drawer open/close`) | failed | `voter.fixture.ts:68` (same as RESULTS-01) | 226361ms | Same fixture timeout. Multiple retries × 30s test budget. |
| D-08 shape 3 (`deeplink list+drawer URL renders both`) | timedOut | "Test timeout of 30000ms exceeded while setting up answeredVoterPage" | 35604ms | Fixture hit 30s test budget. NOT in deeplink rendering code. |
| D-08 shape 4 (`deeplink edge case…`) | timedOut | Same as shape 3 | 74617ms | Same; one retry. NOT in deeplink rendering code. |

**Ground truth:** 4 of 5 failures are fixture-setup timeouts. The fifth (D-14) is a test.skip due to filter button/checkbox absence. `effect_update_depth_exceeded` does NOT appear anywhere in the report — Phase 62's `$derived` refactor IS sound under Playwright. The deeplink rendering paths in `+layout.svelte`, `+layout.ts`, `+page.ts` are NOT exercised by the failing deeplink tests because the fixture hung BEFORE the test body's `page.goto(deeplink)` call.

**Cross-check:** Test 10 (`drawer paints before list on cold deeplink (D-10 …)`) uses the SAME `answeredVoterPage` fixture and PASSES with status=passed. Test 1 (`canonical URL: /results redirects…`) uses the same fixture and PASSES. Tests for tabs, candidates section, etc., all pass. The fixture is intermittently flaky — not deterministically broken.

### §2: Fixture Flake Mechanism (likely but not yet proven)

The voter journey: **navigate to first question → answer 16 questions sequentially → land on /results → wait for `voter-results-list` testid**. Each question advance:

```ts
// voter.fixture.ts:60-68 — VERIFIED
const answerOption = page.getByTestId(testIds.voter.questions.answerOption).nth(voterAnswerIndex);
await answerOption.waitFor({ state: 'visible' });
const urlBefore = page.url();
await answerOption.click();
// Wait for auto-advance: URL changes to the next question or results page
await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 5000 });
```

The app's auto-advance:

```ts
// /questions/[questionId]/+page.svelte:115-119 — VERIFIED
function handleAnswer({ question, value }) {
  disabled = true;
  answers.setAnswer(question.id, value);
  setTimeout(handleJump, DELAY.md);   // DELAY.md = 350ms
}

function handleJump(steps = 1) {
  if (!questionBlock) return;   // ← BAILS if questionBlock undefined
  const newIndex = questionBlock.index + steps;
  // ... goto(...)
}
```

**Hypothesis (likely; reproduce to confirm):** `questionBlock` is derived from `voterCtx.selectedQuestionBlocks.getByQuestion(question)`. `selectedQuestionBlocks` is built by an `$effect` chain in `voterContext.svelte.ts:239-287` that depends on `_opinionQuestionCategories`, `_selectedQuestionCategoryIds`, `selectedElections`, `selectedConstituencies`, etc. If any upstream `$state` changes during the answer click (e.g., `_matches` recomputes after `setAnswer`), the chain re-derives `_selectedQuestionBlocks`; the `setTimeout(handleJump, 350ms)` may fire while `questionBlock` is briefly undefined and the navigation is silently skipped (the `if (!questionBlock) return;` early-return). Next question is never reached → `urlBefore === urlAfter` → 5s timeout.

**Phase 64 implication:** This is an indirect side effect of `voterContext`'s reactive chain — NOT a Phase 62 reactivity bug per se. Phase 64 D-13's plan boundaries explicitly exclude "deeper voter-app reactivity refactor". A reasonable Phase 64 fix:
- (Option F1) **Increase `voter.fixture.ts:68` budget to 10s** as a pragmatic hedge. Symptomatic but cheap.
- (Option F2) **Make `handleAnswer` await `questionBlock` settling** before scheduling `handleJump` — small change in `[questionId]/+page.svelte`.
- (Option F3) **Reduce `voterAnswerCount` from 16 to 12** (the parametric default; spec-level `test.use({ voterAnswerCount: 12 })`) so fewer races accumulate. Minimum needed for results = `appSettings.matching.minimumAnswers` (verify default; likely ≤ 8).

The user's CONTEXT D-05 directs reproduce-first investigation. Fixture-cause is the empirical reading of the JSON; reproduction confirms which hypothesis class.

### §3: Filter Rendering for D-14 (the skipped test)

D-14 was skipped via `test.skip(true, ...)` at one of three skip paths:
- Line 203-205: `filterButton.count() === 0` — no filter trigger button on the page.
- Line 209-211: `firstCheckbox.count() === 0` — modal opened but no checkbox inside.

The party `ObjectFilter` IS built in `apps/frontend/src/lib/contexts/voter/filters/buildParentFilters.ts:30-62` from candidates' `nomination.organization` references. The e2e seed has 4 parties with candidate nominations (verified at `packages/dev-seed/src/templates/e2e.ts:192-228`). Candidates carry `organization: { external_id: 'test-party-X' }` (verified). So in principle:

```ts
// EntityListWithControls.svelte:153 — VERIFIED
{#if activeFilterGroup?.filters.length}
  <Button data-testid="entity-list-filter" .../>
```

The filter button SHOULD render IF `activeFilterGroup` resolved AND has filters. **Failure modes that explain "filter button not found":**

1. **Race A — `activeFilterGroup` undefined at test inspection time.** filterContext's `_filterGroup = $derived.by(() => entityFilters()[eid][type])`; `entityFilters` is itself a `$derived` over the `_nominationsAndQuestions` chain. On a slightly slow machine, the chain may not have settled when the test asserts.
2. **Race B — `activeFilterGroup.filters` empty briefly during reactive settle.** `filterStore` rebuilds the FilterTree on every reactive recalc; an intermediate state could yield `filters.length === 0` for a tick.
3. **EnumeratedEntityFilter dynamic import not resolved.** `EntityFilters.svelte:53` uses `{#await import('./enumerated') then { EnumeratedEntityFilter }}` — if the test clicks the modal trigger before the chunk loads, the modal renders empty briefly.

**Phase 64 implication for D-11:** the `test.skip(true, …)` paths are honest signals during data-uncertainty; D-11 directs replacing them with `await expect(filterButton).toHaveCount(1)` or a polling assertion that gives the reactive chain time to settle. The fix is in the spec, not in the production code, IFF the data is genuinely deterministic. Plan 64-01 reproduction confirms.

### §4: testid Forwarding in EntityListWithControls (UI-SPEC pre-flagged concern)

The UI-SPEC flagged `EntityListWithControls.svelte:143` as a possible testid-prop-override hazard:

```svelte
<div data-testid="entity-list-with-controls" {...concatClass(restProps, 'flex flex-col')}>
```

**Resolution (verified):** Svelte 5 attribute spread order is "later wins" for duplicates. `[CITED: https://svelte.dev/docs/svelte/v5-migration-guide]` `{...concatClass(restProps, 'flex flex-col')}` is AFTER the hardcoded `data-testid`, so `restProps['data-testid']="voter-results-list"` (passed by `+layout.svelte:381`) overrides the hardcoded value. The terminal fixture wait at `voter.fixture.ts:84` for `voter-results-list` resolves correctly on warm-nav. **This is not the bug.** The fixture's terminal wait passes when reached; failures happen earlier in the answer-loop.

(That said: `concatClass` spreads ALL of restProps including `data-testid`. The hardcoded `entity-list-with-controls` is dead code — it never wins because the spread always overrides. A small clarity improvement, but not a behavioral bug. Phase 64 may opt to remove the hardcoded value or move it after the spread; OUT OF SCOPE for the failure surface.)

### §5: Plan 64-01 Reproduction Recipe

The user's D-05 reproduce-first directive maps to:

```bash
# Clean stack
yarn dev:reset-with-data
yarn dev   # leave running in background

# Reproduce 1 — a fixture-failed test
yarn playwright test -c ./tests/playwright.config.ts \
  --grep "filter toggle narrows" \
  --workers=1 --reporter=line --retries=0 \
  --timeout=60000   # double the test budget so we see whether 30s was the constraint

# Reproduce 2 — a deeplink-failed test
yarn playwright test -c ./tests/playwright.config.ts \
  --grep "deeplink list\\+drawer" \
  --workers=1 --reporter=line --retries=0 --timeout=60000

# Reproduce 3 — D-14 specifically
yarn playwright test -c ./tests/playwright.config.ts \
  --grep "filter state resets on plural" \
  --workers=1 --reporter=line --retries=0 --timeout=60000

# Diagnostic instrumentation: temp console.log inside answeredVoterPage
# at line 67-68 to see urlBefore vs current url; remove before commit.
```

Run 5x each. If failure is consistent → deterministic bug; if intermittent → flake (likely matches §2 race). Both branches dictate different fix paths.

---

## Common Pitfalls

### Pitfall 1: Treating fixture timeouts as reactivity bugs

**What goes wrong:** Phase 64's CONTEXT.md frames the failures as Phase 62 reactivity-refactor bugs (loop detection, scope reset, drawer persistence). The JSON ground truth shows 4 of 5 tests fail in the FIXTURE, not in the body. Pursuing the wrong root cause wastes plan budget and produces no improvement.

**Why it happens:** The TEST NAMES describe the behavior the test would assert IF it ran. The test bodies do exercise filter scope reset (D-14), drawer cycle (D-15), deeplink rendering (D-08 shapes 3+4) — but the fixture's preamble (answer 16 questions) often hangs first.

**How to avoid:** Always read the failure error locations from the JSON report, not the test names. `voter.fixture.ts:68` is the actual failure point for 4 of 5.

**Warning signs:** Plan tasks that touch `filterContext.svelte.ts`, `EntityListWithControls.svelte`, or `+layout.svelte` rendering branches as "the fix" when no actual rendering bug has been reproduced.

### Pitfall 2: Adding a Svelte primitive to `@openvaa/filters` when surveying createSubscriber

**What goes wrong:** A naive read of D-03 might tempt the planner to write `import { createSubscriber } from 'svelte/reactivity'` inside `packages/filters/src/group/filterGroup.ts`. This violates D-01's hard agnosticism constraint.

**Why it happens:** `createSubscriber` IS the canonical Svelte 5 idiom and the obvious place to attach it is the FilterGroup class. But the constraint forbids Svelte imports from the package.

**How to avoid:** Wrap the FilterGroup in a CONSUMER-side class (e.g., `apps/frontend/src/lib/contexts/filter/reactiveFilterGroup.svelte.ts`) that imports `createSubscriber`. The package stays pure-TS.

**Warning signs:** Any `import 'svelte/...'` line inside `packages/filters/src/`. Acceptance-gate this with `grep -rn "from 'svelte" packages/filters/src/` returning zero results.

### Pitfall 3: Replacing the working bridge architecture without empirical justification

**What goes wrong:** D-03's narrowing-the-package option is enticing — drop `_onChange` from `@openvaa/filters`, force consumers to use immutable snapshots. But Phase 62's Option B is unit-test-proven (see `filterContext.svelte.test.ts:203-235, 264-288`). Switching architectures invalidates the tests and adds risk for no symptomatic gain.

**Why it happens:** The narrowing option is the clean architectural choice in isolation. But the failures DO NOT prove the bridge is broken; they prove the FIXTURE is racy.

**How to avoid:** Default branch: keep Option B. Switch to createSubscriber wrapper (Pattern 1) ONLY if Plan 64-01 reproduction shows a specific bridge-layer defect that the version counter cannot fix. Make the planner specify the symptom that requires switching, not just "it's more idiomatic."

**Warning signs:** A planner task description that says "switch to createSubscriber for cleanliness" without a reproduced defect citation.

### Pitfall 4: Removing `test.skip(true, …)` paths before guaranteeing the prerequisite (D-11)

**What goes wrong:** D-11 directs replacing skip paths with hard assertions. But if the underlying prerequisite (filter button rendering) is genuinely racy, a hard `expect(filterButton).toHaveCount(1)` fails consistently — converting "silently skipped" into "deterministic failure" without fixing the underlying issue.

**Why it happens:** D-11 is a quality-of-signal improvement; it presumes the prerequisite IS guaranteed.

**How to avoid:** Use `await expect.poll(() => filterButton.count(), { timeout: 5000 }).toBeGreaterThan(0)` (poll-with-timeout) rather than `expect(...).toHaveCount(1)` (point-in-time). This gives the reactive chain time to settle while still failing deterministically if the button never appears.

**Warning signs:** A tight `expect(...).toHaveCount(1)` immediately after a `page.waitForURL`. Add a generous polling wait OR use `.toBeVisible({ timeout: 5000 })`.

### Pitfall 5: Conflating data-race-pool semantics in parity-script regeneration (D-09)

**What goes wrong:** D-09 classifies imgproxy upload + 13 cascades into `DATA_RACE_TESTS`. But the `DATA_RACE_TESTS` set has a strict semantic in the diff script: tests in it are EXEMPT from the pool-growth check (rule 2 at `diff-playwright-reports.ts:336-339`). If we casually add the cascades, future runs that PASS some of them won't trigger any signal — the pool is too elastic.

**Why it happens:** The 14 imgproxy-related tests behave like data-race (intermittent) — but they ARE deterministically tied to a single upstream (the imgproxy container). Re-classifying them collectively is the simplest move; finer classification (e.g., "imgproxy-cascade" subset) would require a script change.

**How to avoid:** Implement D-09 as a one-shot regeneration that creates the post-fix-baseline 3 sets verbatim from the JSON status counts. The 14 imgproxy tests go into `DATA_RACE_TESTS`. Document the rationale inline in `diff-playwright-reports.ts` so a future maintainer doesn't expand the pool further.

**Warning signs:** Changes to the diff script's RULES (rules 1/2/3) — those are scope-locked to v2.5/v2.6 contract; only the EMBEDDED CONSTANTS change.

### Pitfall 6: Running the full suite twice in Phase 64 verification

**What goes wrong:** D-07 (PASS criterion) and D-08 (parity baseline) both want a full `--workers=1 --reporter=json` invocation. Running twice doubles the wall time AND introduces flake variance between captures.

**Why it happens:** Two purposes feel like two captures.

**How to avoid:** D-07 + D-08 are explicitly served by ONE canonical capture (CONTEXT.md "Specific Ideas" section: "single full-suite capture serves dual purpose"). Plan 64-03 task: run once, verify the 5 named tests pass in that JSON, save the JSON as `post-fix/playwright-report.json`, regenerate constants from the same JSON.

**Warning signs:** Plan 64-03 has 2 separate "run full suite" tasks. Collapse to 1.

---

## Code Examples

### Example 1: Existing Option B bridge (PRESERVE; Phase 62 incumbent)
```ts
// Source: apps/frontend/src/lib/contexts/filter/filterContext.svelte.ts:40-88 (VERIFIED)
export function initFilterContext({ entityFilters }: InitFilterContextArgs): FilterContext {
  if (hasContext(CONTEXT_KEY)) error(500, 'initFilterContext() called for a second time');

  let version = $state(0);

  const _filterGroup = $derived.by<FilterGroup<MaybeWrappedEntityVariant> | undefined>(() => {
    void version;     // defensive dependency edge
    const tree = entityFilters();
    const params = parseParams(page);
    const electionId = Array.isArray(params.electionId) ? params.electionId[0] : params.electionId;
    const plural = Array.isArray(params.entityTypePlural) ? params.entityTypePlural[0] : params.entityTypePlural;
    const entityType =
      plural === 'candidates' ? 'candidate' : plural === 'organizations' ? 'organization' : undefined;
    if (!electionId || !entityType) return undefined;
    return tree?.[electionId]?.[entityType];
  });

  $effect(() => {
    const fg = _filterGroup;
    if (!fg) return;
    const handler = () => { version++; };
    fg.onChange(handler, true);
    return () => fg.onChange(handler, false);   // Pitfall 2 cleanup
  });

  // ... rest of context
}
```

### Example 2: Hypothetical createSubscriber adaptation (DO NOT ADOPT unless reproduction demands it)
```ts
// Source: derived from svelte.dev docs createSubscriber + Phase 64 D-01 agnosticism
// File: apps/frontend/src/lib/contexts/filter/reactiveFilterGroup.svelte.ts (HYPOTHETICAL)
import { createSubscriber } from 'svelte/reactivity';
import type { FilterGroup } from '@openvaa/filters';

/**
 * Consumer-side wrapper. @openvaa/filters source is unchanged.
 * Each FilterTree resolution returns a fresh ReactiveFilterGroup wrapper.
 */
export class ReactiveFilterGroup {
  #fg: FilterGroup<MaybeWrappedEntityVariant>;
  #subscribe: () => void;

  constructor(fg: FilterGroup<MaybeWrappedEntityVariant>) {
    this.#fg = fg;
    this.#subscribe = createSubscriber((update) => {
      const handler = () => update();
      this.#fg.onChange(handler, true);
      return () => this.#fg.onChange(handler, false);
    });
  }

  get filterGroup() { this.#subscribe(); return this.#fg; }
  get filters()     { this.#subscribe(); return this.#fg.filters; }
  get active()      { this.#subscribe(); return this.#fg.active; }
  apply<T extends MaybeWrappedEntityVariant>(targets: Array<T>) { this.#subscribe(); return this.#fg.apply(targets); }
  reset() { this.#fg.reset(); }
}
```

### Example 3: Existing $effect.root pattern (reference; do NOT change)
```ts
// Source: apps/frontend/src/routes/(voters)/(located)/+layout.svelte:99-135 (VERIFIED)
const cleanupEffect = $effect.root(() => {
  $effect(() => {
    const value = voterCtx.nominationsAvailable;
    const status = checkNominations(value);
    if (status === 'all') queueMicrotask(() => done(status));
    else {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => done(checkNominations(untrack(() => voterCtx.nominationsAvailable))), 100);
    }
  });
});
// Later: cleanupEffect?.()  to dispose
```

### Example 4: Hard-assertion replacement for `test.skip(true, ...)` (D-11)
```ts
// REPLACE this skip path:
const filterButton = page.getByTestId('entity-list-filter');
if ((await filterButton.count()) === 0) {
  test.skip(true, 'No filters available in the seed.');
  return;
}

// WITH this poll-with-timeout (gives reactive chain time to settle):
const filterButton = page.getByTestId('entity-list-filter');
await expect.poll(() => filterButton.count(), { timeout: 5000, message: 'Party filter button must render — e2e seed has 4 parties' })
  .toBeGreaterThan(0);
```

### Example 5: Parity-script constants regeneration shape (D-08)
```ts
// Source: derived from .planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts:53-138
// One-shot regen (NOT a script change — only the embedded arrays change):
//
// const PASS_LOCKED_TESTS = [
//   '<projectName> :: <specFile> > <specTitle>',  // every test that PASSED in post-fix JSON
//   ...
// ];
// const DATA_RACE_TESTS = [
//   ...imgproxy upload + 13 cascades + any test status === 'flaky' on post-fix JSON
// ];
// const CASCADE_TESTS = [
//   ...every test that cascaded (skipped) in post-fix JSON
// ];
//
// Regen workflow:
//   1. cd to repo root
//   2. node -e "
//        const r = require('./.planning/phases/64-voter-results-reactivity-completion/post-fix/playwright-report.json');
//        const tests = flattenReport(r);   // import flattenReport
//        const pass = tests.filter(t => t.status === 'pass').map(t => t.id).sort();
//        const fail = tests.filter(t => t.status === 'fail').map(t => t.id).sort();
//        const cascade = tests.filter(t => t.status === 'cascade').map(t => t.id).sort();
//        // Classify imgproxy + 13 cascades into DATA_RACE; rest into CASCADE; pass into PASS_LOCKED.
//        ..."
//   3. Patch the 3 const arrays in diff-playwright-reports.ts.
//   4. Smoke test: tsx diff-playwright-reports.ts post-fix/playwright-report.json post-fix/playwright-report.json
//      Expected: PARITY GATE: PASS (self-identity).
```

---

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — Phase 64 makes no schema or seed-shape changes. The dev-seed e2e template MAY be extended (D-04) IF needed, but only additive (new `filterable: true` flags on existing `customData`, never destructive). Supabase data is reset by `yarn dev:reset-with-data` between test runs. | None — verified by reading `packages/dev-seed/src/templates/e2e.ts:84-991` and confirming the 4-party + 13-candidate shape already produces a renderable party filter through `buildParentFilters()`. |
| Live service config | None — Phase 64 doesn't touch Supabase Edge Functions, Cloudflare, Datadog, or any external service config. The Supabase local instance is purely dev-time and reset on each `yarn dev:reset`. | None. |
| OS-registered state | None — Phase 64 introduces no OS-level registrations. Playwright uses ephemeral browser instances; no launchd/systemd/Task Scheduler entries. | None — verified. |
| Secrets/env vars | None — no new secret keys or env var names are introduced. The Supabase admin key + JWT secret used by `tests/seed-test-data.ts` are pre-existing and unchanged. | None — verified. |
| Build artifacts | The `.turbo/` build cache will become stale for `@openvaa/filters` IF Phase 64 modifies the package source. Turborepo handles this automatically (cache miss → rebuild). The `dist/` directory inside `packages/filters/` is regenerated on `yarn build`. | None — Turborepo handles invalidation. Verify post-build by `yarn build --filter=@openvaa/frontend` exits 0 (Phase 62 acceptance gate). |

(This is not a rename or migration phase — but the inventory is included because Phase 64 may modify `@openvaa/filters`, and dev-seed extension is conditionally in scope.)

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All workspaces | ✓ | v22.4.0 | — (project requires Node 20+) |
| Yarn | Workspace install + scripts | ✓ | 4.13.0 | — |
| Docker (daemon) | Supabase local stack (Postgres, Auth, Storage, imgproxy) | ✓ | 29.1.2 client; daemon running | imgproxy known-flaky (STATE.md blocker); workaround `supabase stop && supabase start` |
| Supabase CLI | `supabase start`, `db reset`, `migration` | (assumed via `yarn supabase:*`; actual binary not directly verified in this audit but referenced in `.yarnrc.yml:38` `supabase: ^2.78.1`) | 2.78.1 catalog | — |
| Playwright browsers | `yarn playwright test` | (assumed installed via `yarn playwright install`) | Chromium per @playwright/test 1.58.2 | Run `yarn playwright install` if needed before Plan 64-03 capture |
| `tsx` (TypeScript execute) | `diff-playwright-reports.ts` direct invocation | ✓ (catalog ^4.19.2) | — | Use `node --import tsx/esm` if direct binary not on PATH |

**Missing dependencies with no fallback:** None confirmed missing.

**Missing dependencies with fallback:** imgproxy intermittent (Docker container 502s; existing known issue per STATE.md; D-09 reclassifies to DATA_RACE).

**Pre-flight for Plan 64-03 (parity capture):**
- Verify `docker ps` shows imgproxy container healthy: `docker ps | grep imgproxy`
- If unhealthy, `yarn supabase:stop && yarn supabase:start` before running the canonical capture
- After capture, classify imgproxy-cascades per D-09; do NOT retry the capture to "get a green run" — that masks the data-race semantic.

---

## Validation Architecture

**workflow.nyquist_validation:** key absent in `.planning/config.json` → treat as enabled. Section included.

### Test Framework

| Property | Value |
|----------|-------|
| Framework (E2E) | Playwright `^1.58.2` (catalog) `[VERIFIED: .yarnrc.yml line 22]` |
| Framework (unit) | Vitest `^3.2.4` (catalog) `[VERIFIED: .yarnrc.yml line 8]` |
| E2E config file | `tests/playwright.config.ts` |
| Unit config file (frontend) | `apps/frontend/vitest.config.ts` |
| Quick run command (single test) | `yarn playwright test -c ./tests/playwright.config.ts --grep "filter toggle narrows" --workers=1 --reporter=line` |
| Full suite command (D-07 canonical) | `yarn playwright test -c ./tests/playwright.config.ts --workers=1 --reporter=json > post-fix/playwright-report.json` |
| Unit test (Phase 64 surface) | `yarn workspace @openvaa/frontend test:unit` (or focused: `vitest run apps/frontend/src/lib/contexts/filter/filterContext.svelte.test.ts`) |
| Filters package unit test | `yarn workspace @openvaa/filters test:unit` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RESULTS-01 | Filter toggle does not emit `effect_update_depth_exceeded`; list narrows | E2E | `yarn playwright test --grep "filter toggle narrows"` | ✅ `tests/tests/specs/voter/voter-results.spec.ts:150` |
| RESULTS-02 | Filter narrows list deterministically | E2E | (same as RESULTS-01) | ✅ same |
| RESULTS-02 (D-14) | Filter scope resets on plural-tab switch | E2E | `yarn playwright test --grep "filter state resets"` | ✅ line 199 |
| RESULTS-02 (D-15) | Filter survives drawer cycle | E2E | `yarn playwright test --grep "filter state survives"` | ✅ line 230 |
| RESULTS-03 (D-08 shape 3) | Cold deeplink renders list + drawer | E2E | `yarn playwright test --grep "deeplink list\\+drawer"` | ✅ line 267 |
| RESULTS-03 (D-08 shape 4) | Cold deeplink orgs+candidate-drawer renders | E2E | `yarn playwright test --grep "deeplink edge case"` | ✅ line 288 |
| filterContext bridge correctness | Version counter bumps on filter mutation; cleanup detaches handler on unmount | unit | `vitest run apps/frontend/src/lib/contexts/filter/filterContext.svelte.test.ts` | ✅ already passes 7/7 |
| Optional: createSubscriber wrapper (IF Plan 64-01 chooses it) | Wrapper proxies onChange via createSubscriber | unit | NEW: `apps/frontend/src/lib/contexts/filter/reactiveFilterGroup.svelte.test.ts` | ❌ Wave 0 if option chosen |
| @openvaa/filters API additions (IF D-01 modifications land) | New `getSnapshot()`/etc. API contract | unit | extend `packages/filters/tests/filter.test.ts` | ✅ exists; extend if needed |
| Parity script self-identity | `tsx diff-playwright-reports.ts post-fix/p.json post-fix/p.json` exits 0 | smoke | `yarn tsx .planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts <a> <b>` | ✅ existing script |

### Sampling Rate

- **Per task commit (Plan 64-01 dev loop):** `yarn workspace @openvaa/frontend test:unit -- --run apps/frontend/src/lib/contexts/filter/` (≤30s) + targeted Playwright grep run (~60s).
- **Per wave merge:** `yarn lint:check && yarn test:unit && yarn workspace @openvaa/frontend build` (≤4min cached).
- **Phase gate (Plan 64-03):** Full `--workers=1 --reporter=json` capture (~15-25min). MUST be green for the 5 named tests; the 14-test imgproxy data-race pool is acceptable.

### Wave 0 Gaps

- (Conditional, IF Plan 64-01 adopts createSubscriber wrapper per Pattern 1)
  - [ ] `apps/frontend/src/lib/contexts/filter/reactiveFilterGroup.svelte.ts` — wrapper class
  - [ ] `apps/frontend/src/lib/contexts/filter/reactiveFilterGroup.svelte.test.ts` — mount + subscribe + unmount lifecycle assertions
- (Conditional, IF D-01 modifications add `getSnapshot()` or similar to `@openvaa/filters`)
  - [ ] Extend `packages/filters/tests/filter.test.ts` with snapshot-shape + immutability assertions
- (Default — if Phase 64 keeps Option B + only modifies test specs)
  - **None — existing test infrastructure covers all phase requirements.** Plan 64-01 modifies `voter-results.spec.ts` (D-11 skip-path removal); existing `filterContext.svelte.test.ts` already proves the bridge.

---

## Security Domain

**`security_enforcement` is absent from `.planning/config.json` → treated as enabled. Section included.**

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Phase 64 surface is voter UI; voter app does not authenticate users (anonymous browsing). Candidate auth is unchanged and out-of-scope. |
| V3 Session Management | no | No session changes. SvelteKit hooks unchanged. |
| V4 Access Control | no | Voter results page is publicly accessible by design. |
| V5 Input Validation | yes | URL parameter validation via SvelteKit param matchers (`entityTypePlural.ts`, `entityTypeSingular.ts`). Phase 64 does NOT modify matchers; existing whitelist-based validation (`candidates`/`organizations`, `candidate`/`organization`) stays intact. Coupling-guard at `+page.ts:32-39` rejects malformed URL shapes. |
| V6 Cryptography | no | No crypto in Phase 64 surface. |
| V8 Data Protection | no | No data export/persistence changes. Filter state is session-scoped. |
| V11 Business Logic | yes (sanity) | Filter logic is read-only (no mutations to user-visible business state). `FilterGroup.apply` is pure (verified). The bridge's `version++` is a counter, not a privilege check. |
| V12 Files | no | No file uploads in Phase 64 surface. |
| V14 Configuration | yes (sanity) | `@openvaa/filters` D-01 hard constraint = a configuration policy: "no Svelte primitives may leak in." Acceptance gate: `grep -rn "from 'svelte" packages/filters/src/` returns 0 results. |

### Known Threat Patterns for SvelteKit + Svelte 5 + URL-driven Filter State

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Open redirect via crafted `entityTypePlural` URL segment | Tampering | SvelteKit matchers reject non-whitelisted values BEFORE route resolution (Phase 62 D-11; verified at `+page.ts:32-34`: matcher fallthrough → 404). Phase 64 does not modify matchers. |
| Filter state leakage across voter sessions | Information Disclosure | Filter state is session-scoped (`SPA-scoped per browser tab`), keyed on `(electionId, plural)` tuple via the FilterTree rebuild. `localStorage` not used for filter state. Phase 64 does not introduce persistence. |
| `goto(...)` URL injection via filter UI | Tampering | All `goto` targets in `+layout.svelte` are constructed from `_urlPlural` (whitelisted by matcher) and `activeElectionId` (validated UUID from `voterCtx.selectedElections`). Persistent search params preserved via `new URLSearchParams(page.url.searchParams)`. Phase 62 threat-register accepted T-62-07. |
| Test fixture exposing seed credentials | Information Disclosure | E2E tests run only against local Supabase. CLAUDE.md: "Never commit sensitive data (API keys, tokens, .env files)". Phase 64 does NOT touch credentials. |
| `@openvaa/filters` consumed in a multi-tenant context where filter state could cross-pollute | Tampering / Information Disclosure | Each `FilterGroup` instance is per-(election × plural) — no global singleton. Filter mutation onChange dispatches synchronously to registered listeners; listeners are per-context. Phase 64 D-01 hard constraint protects this property by forbidding Svelte primitives that could create implicit globals. |

**No new attack surface introduced.** Phase 64 work is internal correctness fixes inside an already-public results-page surface. The voter results page exposes only data already on the page (matches, filter UI). No new endpoints, no new auth boundaries.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual `onMount` + `onDestroy` for callback subscription cleanup | `$effect` with cleanup return + `createSubscriber` for canonical lifecycle | Svelte 5.0 (`$effect`) and 5.7 (`createSubscriber`) | Both available. Codebase uses both patterns; `createSubscriber` more idiomatic but `$effect` cleanup is fully equivalent. |
| `effect_update_depth_exceeded` from `$effect` writing to its own dependency | `$derived.by(() => ...)` with `void version` defensive edge OR `createSubscriber` wrapper class | Svelte 5 introduced `$derived` to replace state-writes-inside-$effect | Phase 60 documented the trap; Phase 62 RESEARCH §Pattern 2 + Pitfall 1 codify the avoidance. |
| `bind:activeIndex` on `$derived` value | Non-bound `activeIndex={derivedValue}` + `onChange` callback → `goto` → URL → re-derive | Svelte 5 introduced runes-mode strictness on `bind:` to writable targets | Phase 62 D-13 + Pitfall 3 codify the URL-driven-Tabs idiom. |
| Phase 62 RESULTS-02 `// TODO: Restore EntityListControls` | `<EntityListWithControls>` end-to-end | Phase 62 Plan 62-03 | Filter UI re-enabled; the 5 failing E2E tests are next surface. |

**Deprecated/outdated:**
- `EntityListControls.svelte` (legacy): Still on disk (Phase 62 Pitfall 4 — 2 non-results callers `EntityChildren.svelte`, `nominations/+page.svelte` haven't migrated). Phase 64 does NOT delete it. Sweep is deferred.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The `voter.fixture.ts:68` timeouts are caused by `voterContext`'s `$effect` chain (selectedElections → ... → selectedQuestionBlocks) settling slowly enough that `handleJump` fires while `questionBlock` is undefined. | Real Failure Analysis §2 | If wrong, the Plan 64-01 fix path is misdirected. Reproduction in Plan 64-01 task 1 confirms or refutes. Mitigation: instrumented reproduction recipe in §5 explicitly seeks the symptom. |
| A2 | D-14's skip-path is triggered by Race A (`activeFilterGroup` undefined) or Race B (filters.length === 0) at the moment the test asserts, not by a deterministic absence of the party filter. | Real Failure Analysis §3 | If wrong (e.g., `buildParentFilters()` actually returns no filters in some edge state), the fix is in the filterStore/buildParentFilters layer rather than the spec. Mitigation: temporary `console.log(activeFilterGroup?.filters.length)` in EntityListWithControls during reproduction. |
| A3 | `createSubscriber` is NOT necessary for the 5 failing tests — the version counter bridge is provably correct under unit tests, and the failures don't exhibit bridge defects. | Pattern 1 + Pitfall 3 | If wrong, Plan 64-01 should switch architectures — but the evidence threshold is "reproduce a bridge defect," not "we like createSubscriber more." |
| A4 | The 14 imgproxy-related tests should be classified as `DATA_RACE_TESTS` collectively in the regenerated constants (D-09). | Pitfall 5 | If wrong (e.g., a finer classification is mandated), the diff-script would need a 4th category — out of scope. CONTEXT.md D-09 explicitly endorses this classification, so risk is low. |
| A5 | `EntityListWithControls.svelte:143` testid prop-forwarding works correctly via Svelte 5 spread-order semantics (later wins). | Real Failure Analysis §4 | If wrong, the fixture's terminal wait at `voter.fixture.ts:84` would never resolve and ALL voter-results tests would fail — but most pass, so this is empirically refuted as a bug. |
| A6 | The dev-seed e2e template provides sufficient party-filter coverage today. No template extension is required for D-04. | Standard Stack §`@openvaa/dev-seed` | If wrong, Plan 64-01 must extend the template (additive). The 4-party seed is verified; only edge cases (e.g., requiring a question-attribute filter for a categorical question) would force template change. |
| A7 | The Phase 64 fix for the 5 tests does NOT involve modifying `@openvaa/filters` source. The package stays untouched; D-01 latitude is preserved as a fallback. | Plan 64-01 Default Branch | If wrong (e.g., `_onChange` dispatch order is genuinely buggy), targeted package mutations land. Not load-bearing — D-01 explicitly permits the change. |

---

## Open Questions

1. **Is the `voter.fixture.ts:68` timeout deterministic on a slower machine, or only on CI?**
   - What we know: 4 of 5 tests timed out on the post-v2.6 capture (CI). Locally, the same fixture passes for the 8+ other voter-results tests in the same spec.
   - What's unclear: whether the failures correlate with workers=1 (serial dependency on data-setup), with CPU load during JSON reporter buffering, or with a real reactive-chain defect.
   - Recommendation: Plan 64-01 Task 1 reproduces locally with `--workers=1` (matches CI). If reproducible: pursue A1's fix path. If not: increase fixture budget to 10s as a hedge AND document the flake in DATA_RACE_TESTS.

2. **Should Phase 64 narrow `@openvaa/filters` per D-03, or keep the full subscription model?**
   - What we know: Option B (version counter) is unit-test-proven; createSubscriber is more idiomatic but adds a wrapper class.
   - What's unclear: whether the additional ceremony of a wrapper class is worth abandoning unit-test coverage that already passes.
   - Recommendation: Default to keeping the subscription model. The narrowing option is a research-gated decision (D-03) that requires a SYMPTOM, not a preference. If reproduction surfaces a specific bridge defect that the version counter cannot fix, planner switches; otherwise, no change to `@openvaa/filters`.

3. **D-08 shape 3+4 deeplink path — does it actually have a rendering bug, or does it ride on the fixture flake?**
   - What we know: Both deeplink tests timed out in `answeredVoterPage` setup, never executed body. Test 10 (drawer paints before list on cold deeplink) PASSES — same fixture, same deeplink shape — proving the cold-deeplink rendering is sound.
   - What's unclear: whether shape 4 (cross-type orgs+candidate-drawer) has subtle issues distinct from shape 3.
   - Recommendation: Plan 64-02 reproduces shape 3 + shape 4 INDEPENDENTLY via `page.goto(deeplink)` from a clean session (skip the answeredVoterPage fixture). If both render correctly, Plan 64-02's only fix is the shared fixture (Plan 64-01's territory). If shape 4 specifically fails, separate fix.

4. **Should the parity script's `DATA_RACE_TESTS` classification be ALPHABETICALLY sorted in the regenerated file?**
   - What we know: Existing arrays are NOT alphabetically sorted (PASS_LOCKED at lines 54-96 is by spec-folder grouping).
   - What's unclear: maintainer preference for diff-stability vs. semantic grouping.
   - Recommendation: Match the existing convention (folder-grouped). Document the convention inline in a `// FORMAT:` comment at the top of each constant.

5. **Is there a residual need for the Phase 62 `EntityListControls.svelte` legacy file after Phase 64?**
   - What we know: Phase 62 Pitfall 4 documented that 2 non-results callers (`EntityChildren.svelte`, `nominations/+page.svelte`) still import it. Phase 62 Plan 62-03 SUMMARY confirms file stayed on disk. Sweep is deferred.
   - What's unclear: whether Phase 64's manual smoke (D-10, step 9 retired-TODO audit) flags this.
   - Recommendation: OUT OF SCOPE for Phase 64. Step 9 only checks `+layout.svelte` for the original TODO — not other files. Sweep remains a deferred follow-up.

---

## Sources

### Primary (HIGH confidence)

- **Code (verified by direct read 2026-04-27):**
  - `apps/frontend/src/lib/contexts/filter/filterContext.svelte.ts` (123 lines)
  - `apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.svelte` (221 lines)
  - `apps/frontend/src/routes/(voters)/(located)/results/+layout.svelte` (414 lines)
  - `apps/frontend/src/routes/(voters)/(located)/results/+layout.ts` (27 lines)
  - `apps/frontend/src/routes/(voters)/(located)/results/[[entityTypePlural=…]]/[[entityTypeSingular=…]]/[[id]]/+page.ts` (43 lines)
  - `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts` (~458 lines)
  - `apps/frontend/src/lib/contexts/voter/filters/filterStore.svelte.ts` (81 lines)
  - `apps/frontend/src/lib/contexts/voter/filters/buildParentFilters.ts` (64 lines)
  - `apps/frontend/src/routes/(voters)/(located)/+layout.svelte` (lines 99-135 `awaitNominationsSettled`)
  - `apps/frontend/src/routes/(voters)/(located)/questions/[questionId]/+page.svelte` (lines 113-159)
  - `apps/frontend/src/lib/components/questions/QuestionChoices.svelte` (lines 100-280)
  - `apps/frontend/src/lib/components/entityFilters/EntityFilters.svelte` (62 lines)
  - `apps/frontend/src/lib/components/entityFilters/enumerated/EnumeratedEntityFilter.svelte` (filter rendering)
  - `apps/frontend/src/lib/utils/components.ts` (concatClass + concatProps semantics)
  - `apps/frontend/src/lib/contexts/filter/filterContext.svelte.test.ts` (312 lines, 7 tests passing)
  - `tests/tests/specs/voter/voter-results.spec.ts` (385 lines)
  - `tests/tests/fixtures/voter.fixture.ts` (89 lines)
  - `tests/tests/utils/testIds.ts` (155 lines)
  - `tests/tests/utils/voterNavigation.ts` (lines 53-220)
  - `packages/filters/src/group/filterGroup.ts` (127 lines)
  - `packages/filters/src/filter/base/filter.ts` (204 lines)
  - `packages/filters/src/utils/typeGuards.ts` (71 lines)
  - `packages/dev-seed/src/templates/e2e.ts` (992 lines — verified party + candidate + nomination shape)
  - `.planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts` (lines 1-440)
  - `.planning/phases/63-e2e-template-extension-greening/post-v2.6/playwright-report.json` (4550 lines — extracted error locations + statuses + durations)
  - `.planning/phases/63-e2e-template-extension-greening/post-v2.6/diff.md` (123 lines)
  - `.planning/phases/62-results-page-consolidation/62-RESEARCH.md` (Patterns 1–5; Pitfalls 1–7)
  - `.planning/phases/62-results-page-consolidation/62-03-SUMMARY.md` (Phase 62 implementation log)

- **Svelte 5 official documentation:**
  - https://svelte.dev/docs/svelte/svelte-reactivity (createSubscriber API)
  - https://svelte.dev/docs/svelte/$effect ($effect.root semantics)
  - https://svelte.dev/docs/svelte/v5-migration-guide (attribute spread order)
  - https://svelte.dev/docs/kit/advanced-routing (matcher + optional bracket semantics — already cited in Phase 62)

### Secondary (MEDIUM confidence — verified against official sources)

- **Svelte GitHub:**
  - https://github.com/sveltejs/svelte/issues/15888 ($derived + createSubscriber teardown bug; fixed in PR #16466 — present in 5.55.5)
  - https://github.com/sveltejs/svelte/issues/13647 ($effect on modules — referenced for non-component scope discussion)

- **Mat Simon "Svelte in Depth" series:**
  - https://www.matsimon.dev/blog/svelte-in-depth-create-subscriber (createSubscriber idiomatic patterns)
  - https://www.matsimon.dev/blog/svelte-in-depth-effect-root ($effect.root use cases)

- **Joy of Code — "Different Ways to Share State in Svelte 5":**
  - https://joyofcode.xyz/how-to-share-state-in-svelte-5 (state-sharing patterns; module-scope reactivity)

### Tertiary (LOW confidence — informational only, not load-bearing)

- WebJose Hashnode "Svelte v5 $effect() in Detail" — used for cross-checking $effect cleanup semantics.
- Sveltevietnam blog "Reactive Local/Session Storage in Svelte 5" — used for reactive-bridge survey only; pattern not adopted.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every version verified via `npm view` or `.yarnrc.yml` read.
- Architecture: HIGH — every pattern grounded in a verified Svelte 5 doc page (createSubscriber, $effect.root) plus an in-codebase precedent (Phase 62 Option B + Phase 60 awaitNominationsSettled $effect.root).
- Real Failure Analysis: HIGH — JSON ground truth extracted from `post-v2.6/playwright-report.json`. Failure locations + durations + statuses cited verbatim.
- Pitfalls: HIGH — every pitfall references either a verified line of code, an existing Phase 62/60 RESEARCH note, or a project memory entry.
- D-09 imgproxy classification: MEDIUM — endorsed by CONTEXT.md but the fine-grained semantic distinction (intermittent vs cascade) is judgment-call.
- A1 (voterContext settling cause of fixture timeout): MEDIUM — empirically observable in JSON (snapshot stuck on Q6/Q14) but root cause attribution to questionBlock undefined needs reproduction to confirm.

**Research date:** 2026-04-27
**Valid until:** 7 days for the failure-mode interpretation (re-run JSON if a new capture is taken before Phase 64 starts); 30 days for Svelte 5 patterns (stable but `createSubscriber` is comparatively new).

---

*Phase: 64-voter-results-reactivity-completion*
*Researched: 2026-04-27*
