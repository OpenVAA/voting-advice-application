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

## Cross-Milestone Trends

### Process Evolution

| Milestone | Commits | Phases | Plans | Avg/Plan | Key Change |
|-----------|---------|--------|-------|----------|------------|
| v1.0      | 147     | 7      | 31    | ~15min   | First milestone — established GSD workflow patterns |
| v1.1      | 87      | 6      | 15    | 7min     | Faster velocity — research-first, smaller phases |
| v1.2      | 96      | 7      | 14    | ~10min   | Largest codebase impact (861 files) — framework upgrade patterns |

### Cumulative Quality

| Milestone | Requirements | Coverage | Plans | Deferred |
|-----------|-------------|----------|-------|----------|
| v1.0      | 56/56       | 100%     | 31    | 0        |
| v1.1      | 23/24       | 96%      | 15    | 1 (VER-04, user choice) |
| v1.2      | 31/31       | 100%     | 14    | 0 (tech debt tracked, all reqs met) |

### Top Lessons (Verified Across Milestones)

1. Infrastructure before features — invest in foundations first (v1.0 Phase 1, v1.1 Phase 8, v1.2 scaffold-first)
2. Research-first approach prevents backtracking — thorough upfront evaluation leads to confident decisions (v1.1, v1.2 OXC eval)
3. Milestone audits catch real issues — gap closure phases are a natural and validated 3-milestone pattern (v1.0, v1.1, v1.2)
4. End-to-end verification reveals what unit checks miss — fresh install tests (v1.1), E2E tests (v1.0), integration validation phase (v1.2)
5. Document deferred items with "why" — conscious deferral is fine, silent gaps accumulate
6. Fresh scaffold over in-place upgrade for major framework migrations — clean config, no legacy remnants (v1.2)
7. Dedicated evaluation phases are cheap insurance — 4 minutes to avoid premature migration (v1.2 OXC)
