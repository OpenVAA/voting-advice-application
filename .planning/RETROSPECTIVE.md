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

## Cross-Milestone Trends

### Process Evolution

| Milestone | Commits | Phases | Plans | Avg/Plan | Key Change |
|-----------|---------|--------|-------|----------|------------|
| v1.0      | 147     | 7      | 31    | ~15min   | First milestone — established GSD workflow patterns |
| v1.1      | 87      | 6      | 15    | 7min     | Faster velocity — research-first, smaller phases |

### Cumulative Quality

| Milestone | Requirements | Coverage | Plans | Deferred |
|-----------|-------------|----------|-------|----------|
| v1.0      | 56/56       | 100%     | 31    | 0        |
| v1.1      | 23/24       | 96%      | 15    | 1 (VER-04, user choice) |

### Top Lessons (Verified Across Milestones)

1. Infrastructure before features — invest in foundations first (v1.0 Phase 1, v1.1 Phase 8)
2. Research-first approach prevents backtracking — thorough upfront evaluation leads to confident decisions (v1.1)
3. Milestone audits catch real issues — gap closure phases are a natural and valuable workflow pattern (v1.0 gap closures, v1.1 Phase 13)
4. End-to-end verification reveals what unit checks miss — fresh install tests (v1.1), E2E tests (v1.0)
5. Document deferred items with "why" — conscious deferral is fine, silent gaps accumulate
