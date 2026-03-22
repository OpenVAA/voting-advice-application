# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — E2E Testing Framework

**Shipped:** 2026-03-12
**Phases:** 7 | **Plans:** 31 | **Commits:** 147

### What Was Built
- Complete Playwright E2E infrastructure: project dependencies, API data management, 53+ testIds, fixture layer, ESLint enforcement
- Full candidate app coverage: auth, registration, profile, questions, settings, app modes (15 CAND requirements)
- Full voter app coverage: landing through results, matching verification, entity details, settings, popups, static pages (19 VOTE requirements)
- Configuration variant testing via base+overlay dataset composition (8 CONF requirements)
- CI pipeline with GitHub Actions, HTML reports, smoke/voter/candidate/variant tagging (3 CI requirements)
- Visual regression and performance benchmarks as opt-in capabilities (2 INFRA requirements)

### What Worked
- Infrastructure-first approach: Phase 1 foundations (testIds, data management, fixtures) enabled all subsequent phases to move fast
- API-based data management instead of UI automation: StrapiAdminClient with `/import-data` and `/delete-data` was faster and more reliable
- Base+overlay dataset pattern: shared default dataset with thin overlays for variants avoided dataset duplication
- Gap closure plans: inserting additional plans (01-09 through 01-11, 04-04, 04-05) to fix verification gaps kept quality high
- Parallel phase execution where dependencies allowed (Phases 4+5 after Phase 3)

### What Was Inefficient
- Phases 3 and 4 had the longest individual plan executions (up to 47 min) due to debugging flaky voter journey interactions
- ROADMAP.md plan checkboxes got out of sync with disk state — some phases showed `[ ]` for completed plans
- Phase 3 VERIFICATION initially marked gaps_found, but those gaps were deliberately deferred to Phases 4/5 — could have been documented clearer upfront
- 32 hardcoded testId strings in candidate spec files could have been centralized in testIds.ts from the start

### Patterns Established
- Kebab-case testId naming with page-prefix pattern (e.g., `login-submit`, `register-code`)
- Data lifecycle: delete-by-prefix then import-fresh for clean state isolation
- Complete sibling settings in every `updateAppSettings` call (overwrite, not merge)
- Env-gated test projects (PLAYWRIGHT_VISUAL, PLAYWRIGHT_PERF) for opt-in capabilities
- Sequential variant dependency chain for multi-config test execution
- Tags on `test.describe()` blocks for inheritance to contained tests

### Key Lessons
1. Infrastructure investments pay off exponentially — the 11-plan Phase 1 enabled 20 subsequent plans to execute in 1-5 minutes each
2. API-based data management is strictly better than UI automation for test setup/teardown
3. Gap closure plans are a natural and valuable workflow pattern — don't fight them, embrace them
4. Voter app tests are inherently more complex than candidate tests due to multi-step journeys and settings permutations
5. Tier-based ranking comparison (grouping by equal distance) is essential for matching verification — exact ordering is too fragile

### Cost Observations
- Model mix: primarily opus for execution, sonnet for research/planning agents
- 147 commits over 11 days
- Most plans completed in 2-5 minutes; outliers were debugging-heavy voter journey specs

---

## Milestone: v1.1 — Monorepo Refresh

**Shipped:** 2026-03-15
**Phases:** 6 | **Plans:** 15 | **Commits:** 87

### What Was Built
- Turborepo integration with cached parallel builds and dependency-aware task orchestration
- Monorepo restructured to apps/ + packages/ convention with full Docker/CI/E2E path updates
- Changesets for automated versioning, changelogs, and GitHub Actions release PRs
- npm publishing readiness — tsup builds, metadata, LICENSE files, verified fresh install for 4 packages
- Yarn 4.13 with dependency catalogs and Vercel remote caching in CI
- Per-workspace lint/typecheck pipelines via Turborepo
- Tech debt cleanup — 9 audit items resolved across pre-commit hooks, version strings, docs

### What Worked
- Research-first approach: thorough ecosystem research (Turborepo vs alternatives, Changesets vs semantic-release) led to confident decisions with no backtracking
- Milestone audit + gap closure: auditing before completion found 9 tech debt items and 2 integration gaps; Phase 13 closed all tech debt cleanly
- Phase ordering was optimal: build orchestration → directory restructure → versioning → publishing → polish → cleanup followed natural dependency order
- tsup migration was clean: replaced complex tsc + tsc-esm-fix with simpler config, verified with fresh install tests
- Big-bang atomic moves (Phase 9) avoided broken intermediate states in directory restructure

### What Was Inefficient
- Phase 9 (Directory Restructure) took 46min — longest phase by far — due to cascading path updates across Docker, CI, TypeScript, and E2E tests
- Some ROADMAP progress table columns got misaligned during updates (missing milestone column values)
- Phase 14 (Trusted Publishing) had to be postponed because it requires initial manual publish first — could have been identified earlier in research
- NODE_AUTH_TOKEN integration gap in release.yml wasn't caught until milestone audit — would have been caught by running the release workflow

### Patterns Established
- Yarn catalogs for centralized dependency versions (single source of truth)
- tsup as standard build tool for publishable packages (replaces tsc pipeline)
- Turborepo turbo.json as task orchestration config (build, lint, typecheck, test)
- Per-workspace scripts pattern: each workspace has its own lint/typecheck scripts, Turborepo orchestrates
- Content-based caching (Turborepo hashes file content, not mtime)

### Key Lessons
1. Directory restructure is high-effort but high-value — touch once, benefit forever (apps/ convention, cleaner Docker/CI)
2. Milestone audits before completion catch real issues — Phase 13 closed 9 tech debt items that would have accumulated
3. Publishing readiness requires end-to-end verification — "pack + install + import" test caught issues that build-only checks missed
4. Dependency catalogs reduce cross-workspace version drift — single source of truth prevents silent inconsistencies
5. Deferred items (VER-04, Phase 14) are fine when consciously chosen — document the "why" for future context

### Cost Observations
- Model mix: primarily opus for execution, sonnet for research/planning agents
- 87 commits over 4 days (faster velocity than v1.0)
- Average plan execution: 7 minutes (vs ~15min for v1.0)
- Phase 9 was the outlier at 46min; most phases completed in under 15min total

---

## Milestone: v1.2 — Svelte 5 Migration (Infrastructure)

**Shipped:** 2026-03-18
**Phases:** 7 | **Plans:** 14 | **Commits:** 96

### What Was Built
- Fresh SvelteKit 2 + Svelte 5 scaffold with native TypeScript support and @tailwindcss/vite replacing PostCSS
- Tailwind 4 CSS-first configuration with DaisyUI 5 and full theme token migration from JS to CSS directives
- Migrated i18n from unmaintained sveltekit-i18n to Paraglide JS — 740 call sites, compile-time type safety, runtime override wrapper
- Full monorepo dependency bump with Yarn catalog expansion (13 → 30 entries), Node 22 migration
- Docker, CI, and 92 E2E tests validated end-to-end after migration
- OXC toolchain evaluated and consciously deferred (Svelte template linting not supported)
- Migration cleanup: dead code removal and 7 TypeScript error fixes

### What Worked
- In-place scaffold replacement: fresh Svelte 5 config files over existing code preserved all component files while modernizing build tooling
- DaisyUI 5 @plugin directive: auto-registered colors eliminated manual @theme color block, simplifying CSS architecture
- Paraglide JS with runtime override wrapper: kept backend translationOverrides working while gaining compile-time type safety
- Phased validation: dedicating Phase 19 entirely to integration validation caught real issues (alwaysNotifyStore, nomination settle detection)
- Milestone audit → gap closure: Phase 21 was added after audit found dead code and TS errors, closing integration gaps before shipping
- OXC evaluation as separate phase: quick 4-min evaluation with clear recommendation avoided wasting time on premature migration

### What Was Inefficient
- Phase 19-02 (Docker/E2E/CI validation) took 55 minutes — longest plan in the milestone — due to debugging Svelte 5 store equality changes and DaisyUI 5 class renames in E2E tests
- Nyquist validation was incomplete across phases — draft or missing VALIDATION.md files for most phases
- Some v1.2 decisions accumulated in STATE.md Decisions section (38 entries) — too granular for operational state; better suited for PROJECT.md Key Decisions table only
- 740 i18n call site migration was mechanical but time-consuming — future migrations of this scale should consider codemods

### Patterns Established
- CSS-first Tailwind 4 with @theme directives (no JS config files)
- DaisyUI 5 @plugin directive for color auto-registration
- Paraglide JS with runtime override wrapper for backend translation overrides
- alwaysNotifyStore pattern for bypassing Svelte 5 Object.is() equality on mutable stores
- Subscription-based settle detection for async data (replaces tick+timeout)
- Double assertion via `unknown` for type-incompatible casts (safer than @ts-ignore)

### Key Lessons
1. Fresh scaffold over in-place upgrade is strictly better for major framework upgrades — clean config, no legacy remnants
2. CSS-first config (Tailwind 4) eliminates entire categories of config complexity — JS config, PostCSS plugins, safelist
3. i18n library migration at scale (740 call sites) is feasible with wrapper functions — Paraglide compile-time safety was worth the effort
4. Svelte 5 store equality change (Object.is()) can break stores that hold mutable objects — alwaysNotifyStore pattern is needed until runes migration
5. Dedicated evaluation phases (Phase 20) are cheap and prevent premature migration — 4 minutes to avoid weeks of regret
6. Gap closure after milestone audit is now a validated 3-milestone pattern — always audit before shipping

### Cost Observations
- Model mix: primarily opus for execution, sonnet for research/planning agents
- 96 commits over 3 days (fastest milestone yet)
- Average plan execution: ~10 minutes; Phase 19-02 was the outlier at 55min
- 861 files modified — largest codebase impact of any milestone (+29.5k/-6.3k lines)

---

## Milestone: v1.3 — Svelte 5 Migration (Content)

**Shipped:** 2026-03-20
**Phases:** 5 | **Plans:** 19 | **Commits:** 99

### What Was Built
- 98 shared and voter-app components migrated to Svelte 5 runes mode ($props, $derived, $effect, $bindable)
- All container components converted from named slots to {#snippet}/{@render} props with 39+ route consumer updates
- All voter route pages and layouts migrated from $: reactive statements to $derived/$effect runes
- createEventDispatcher removed from all 6 dispatching components, replaced with callback props
- All v1.3-scoped TODO[Svelte 5] markers resolved; candidate app call sites updated for API changes
- Full validation gate: zero legacy patterns, zero TypeScript errors, 26/26 voter-app E2E tests passing

### What Worked
- Leaf-first migration order: migrating 98 leaf components first validated runes patterns at scale before tackling containers and routes
- Atomic consumer updates: updating all call sites in the same plan as the component change prevented broken intermediate states
- bind:this pattern for exported functions: cleaner than $bindable callback alternatives, worked well across consumer boundaries
- Validation gate as separate phase: dedicated Phase 26 caught 11 TypeScript errors and E2E regressions that would have shipped silently
- Gap closure plans (22-07, 26-03): again validated as natural workflow — 3 plans were added mid-milestone to close verification gaps
- Milestone audit before completion: caught scope ambiguities (E2E test count, TODO marker classification) before archival

### What Was Inefficient
- Phase 22 had 7 plans (largest phase) due to high component count — could have been split into 2 smaller phases
- Some plans required deviation handling mid-execution (23-02 Button badge slot change triggered 24 route file on:click→onclick fixes)
- E2E test count discrepancy (requirement said "92 tests", actual voter-app scope was 26) — should have been caught during requirements definition
- Nyquist validation incomplete for phases 23-26 — VALIDATION.md files were partial or missing
- Results page required multiple $effect/$derived iterations due to Svelte 5 reactivity edge cases (untrack, $derived.by)

### Patterns Established
- $props() with explicit type interfaces (not inline) for complex components
- $bindable() for all props consumed via bind: (92 occurrences across 40 files)
- bind:this for component exported functions (replacing bind:functionName)
- Callback props for events (onclick, onexpand, oncollapse) replacing createEventDispatcher
- {#snippet children()}/{@render children?.()} for slot replacement
- $derived.by() for multi-statement derivations, $derived() for single-expression
- $effect() with synchronous .then() chains (async $effect callbacks discouraged in Svelte 5)
- untrack() for $state writes inside $effect to break circular dependencies
- Non-null assertions inside Svelte {#if} template guards for $state variables

### Key Lessons
1. Component migration order matters: leaf → container → route follows natural dependency flow and validates patterns before scale
2. Consumer updates must be atomic with component changes — splitting creates broken intermediate states that are hard to debug
3. Svelte 5 reactivity has edge cases: snippet block re-rendering, $effect circular dependencies, $state mutations in event handlers — plan for debugging time
4. Validation gate as a separate phase is now a validated 4-milestone pattern — always verify before shipping
5. E2E tests are the ultimate regression gate — they caught regressions that TypeScript and svelte-check missed
6. Scope precision in requirements prevents confusion at completion — "92 tests" vs "26 voter-app tests" caused unnecessary audit friction

### Cost Observations
- Model mix: primarily opus for execution, sonnet for research/planning/audit agents
- 99 commits over 3 days (consistent with v1.2 velocity)
- 334 files modified (+18.2k/-4.3k lines)
- Phase 22 was the longest (7 plans, 98 components) but each plan was mechanical and fast
- Phase 26 required the most debugging due to Svelte 5 reactivity edge cases

---

## Milestone: v1.4 — Svelte 5 Migration (Candidate App)

**Shipped:** 2026-03-22
**Phases:** 2 | **Plans:** 7 | **Commits:** 21

### What Was Built
- All 25 candidate app route files migrated to Svelte 5 runes ($derived, $effect, $state, snippet children, native events)
- Zero legacy Svelte 4 patterns confirmed across candidate app (no $:, on:event, `<slot>`, createEventDispatcher)
- Zero TypeScript errors (120 warnings, non-blocking)
- All 20 candidate-specific E2E tests passing (including registration flow fixes)
- Fixed E2E test infrastructure: API-based ToU workaround, cookie domain transfer, auth cookie caching, rate limit mitigation

### What Worked
- Patterns established in v1.3 applied directly: $derived.by(), $state for bind:, callback props, snippet children — zero new pattern discovery needed
- Small milestone scope (2 phases, 25 files) enabled single-day completion
- Validation gate phase caught real E2E failures that weren't visible from code analysis alone
- Gap closure plan (28-03) diagnosed 3 root causes (Vite streaming bug, cookie domain mismatch, rate limiter) that the original plan missed
- Complexity ordering within Phase 27: minimal → auth → moderate → complex provided natural learning curve

### What Was Inefficient
- Phase 28 Plan 02 initially misdiagnosed root cause as SES email infrastructure; actual cause was Vite dev-mode streaming bug — wasted one plan on wrong diagnosis
- E2E test debugging required deep Playwright + SvelteKit + Docker networking knowledge — the gap closure plan took 81 minutes (longest plan in milestone)
- Phase 28 needed 3 plans for what was originally scoped as 1 validation plan — E2E test debugging expanded scope significantly

### Patterns Established
- $derived.by() for multi-branch routing logic (nextAction, submitRouting patterns)
- $state() required for any variable consumed by bind: in runes mode
- API-based workarounds in E2E tests for Vite dev-mode streaming bugs (admin API instead of UI interactions)
- Cookie domain transfer pattern for Playwright (localhost → 127.0.0.1) when Docker networking is involved
- Auth cookie caching in serial E2E test suites to avoid rate limiter exhaustion

### Key Lessons
1. Well-established patterns make subsequent milestones dramatically faster — v1.4 was 1 day vs v1.3's 3 days for similar work
2. E2E test debugging can dominate milestone time even when code changes are small — budget for it
3. Root cause diagnosis matters more than fast fixes — Plan 28-02's misdiagnosis cost an extra plan
4. Vite dev-mode and SvelteKit use:enhance have non-obvious interactions that only manifest under E2E test conditions
5. Validation gate phases continue to catch real issues — now validated across 5 milestones

### Cost Observations
- Model mix: opus for execution, sonnet for verification
- 21 commits over 1 day (fastest milestone — patterns fully established)
- 53 files modified (+3.1k/-0.4k lines) — smallest codebase impact, focused on route files
- Plan 28-03 (gap closure) was the outlier at 81min; code migration plans averaged ~10min

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Commits | Phases | Plans | Avg/Plan | Key Change |
|-----------|---------|--------|-------|----------|------------|
| v1.0      | 147     | 7      | 31    | ~15min   | First milestone — established GSD workflow patterns |
| v1.1      | 87      | 6      | 15    | 7min     | Faster velocity — research-first, smaller phases |
| v1.2      | 96      | 7      | 14    | ~10min   | Largest codebase impact (861 files) — framework upgrade patterns |
| v1.3      | 99      | 5      | 19    | ~8min    | Content migration at scale (98 components) — runes patterns validated |
| v1.4      | 21      | 2      | 7     | ~10min   | Fastest milestone — established patterns, focused scope |

### Cumulative Quality

| Milestone | Requirements | Coverage | Plans | Deferred |
|-----------|-------------|----------|-------|----------|
| v1.0      | 56/56       | 100%     | 31    | 0        |
| v1.1      | 23/24       | 96%      | 15    | 1 (VER-04, user choice) |
| v1.2      | 31/31       | 100%     | 14    | 0 (tech debt tracked, all reqs met) |
| v1.3      | 20/20       | 100%     | 19    | 0 (14 tech debt items, all non-blocking) |
| v1.4      | 10/10       | 100%     | 7     | 0 |

### Top Lessons (Verified Across Milestones)

1. Infrastructure before features — invest in foundations first (v1.0 Phase 1, v1.1 Phase 8, v1.2 scaffold-first)
2. Research-first approach prevents backtracking — thorough upfront evaluation leads to confident decisions (v1.1, v1.2 OXC eval)
3. Milestone audits catch real issues — gap closure is a validated 5-milestone pattern (v1.0, v1.1, v1.2, v1.3, v1.4)
4. End-to-end verification reveals what unit checks miss — fresh install tests (v1.1), E2E tests (v1.0, v1.3, v1.4), integration validation phase (v1.2)
5. Document deferred items with "why" — conscious deferral is fine, silent gaps accumulate
6. Fresh scaffold over in-place upgrade for major framework migrations — clean config, no legacy remnants (v1.2)
7. Dedicated evaluation phases are cheap insurance — 4 minutes to avoid premature migration (v1.2 OXC)
8. Migration order follows dependency flow — leaf → container → route prevents broken intermediate states (v1.3)
9. Validation gate as dedicated phase catches regressions other tools miss — now validated across 5 milestones
10. Established patterns compound — each subsequent milestone is faster than the last (v1.4 completed in 1 day vs v1.0's 11 days)
