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

## Cross-Milestone Trends

### Process Evolution

| Milestone | Commits | Phases | Key Change |
|-----------|---------|--------|------------|
| v1.0      | 147     | 7      | First milestone — established GSD workflow patterns |

### Cumulative Quality

| Milestone | Requirements | Coverage | Plans |
|-----------|-------------|----------|-------|
| v1.0      | 56/56       | 100%     | 31    |

### Top Lessons (Verified Across Milestones)

1. Infrastructure before features — invest in foundations first
2. API over UI for test data management
3. Gap closure plans are a healthy part of the workflow
