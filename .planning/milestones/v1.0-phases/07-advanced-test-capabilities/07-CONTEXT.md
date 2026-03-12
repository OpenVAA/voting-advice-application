# Phase 7: Advanced Test Capabilities - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Visual regression baselines and performance benchmarks established as first-class test suite members. Two target pages (voter results, candidate preview) get screenshot comparison tests. Voter results page gets performance budget enforcement. Both capabilities are gated and excluded from default test runs.

</domain>

<decisions>
## Implementation Decisions

### Visual Regression Scope
- **Pages:** Voter results page + candidate preview page only
- **Capture:** Full-page screenshots (entire scrollable page)
- **Data:** Reuse existing datasets (default-dataset.json + voter-dataset.json), no dedicated visual dataset
- **Masking:** Mask dynamic areas (timestamps, avatars, non-deterministic content) using Playwright's mask option
- **Viewports:** Both Desktop Chrome (1280x720) and a mobile viewport (e.g., iPhone 14) — 4 screenshots total (2 pages x 2 viewports)

### Screenshot Comparison Tuning
- **Pixel diff threshold:** Claude's discretion — pick a reasonable threshold based on Playwright defaults and page complexity
- **Animation handling:** Wait for network idle + disable CSS animations (Playwright's `animations: 'disabled'` option and `waitForLoadState('networkidle')`) before capture
- **Viewport config:** Desktop Chrome 1280x720 + one mobile device viewport
- **Baseline storage:** Git-tracked in test directory (committed to repo, standard Playwright `__screenshots__` approach)
- **Baseline updates:** Manual `--update-snapshots` flag — developer runs locally, reviews diff, commits new baselines

### Performance Metrics & Budgets
- **Target page:** Voter results page only (heaviest page with all matched candidates and scores)
- **Metrics:** Claude's discretion — pick the approach that makes sense (page load timing, Web Vitals, or custom milestones)
- **Budget strategy:** Claude's discretion — pick hard fail vs. warn threshold based on test environment characteristics
- **Environment:** Docker dev environment (same as all other E2E tests), budgets calibrated to dev mode

### Gating Strategy
- **Exclusion method:** Tag-based grep exclusion using `@visual` and `@perf` tags (consistent with existing `@smoke`, `@voter`, `@candidate`, `@variant` tags from Phase 6)
- **Default run:** Visual and perf tests excluded from default `yarn test:e2e`
- **Explicit run:** `playwright test --grep @visual` and `playwright test --grep @perf`
- **CI integration:** Run in CI as optional (non-blocking) status check — failures visible but don't block merging

### Claude's Discretion
- Pixel diff threshold value
- Performance metric selection and budget values
- Budget enforcement strategy (hard fail vs. warn)
- Mobile viewport device choice
- Exact masking selectors for dynamic content
- Screenshot file organization within test directory
- Performance test implementation approach (Performance Observer, navigation timing, etc.)

</decisions>

<specifics>
## Specific Ideas

- User wants both desktop and mobile visual regression to catch responsive regressions
- Baseline screenshots committed to repo so PRs show screenshot diffs
- CI runs visual/perf as informational — not gating merges initially

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `answeredVoterPage` fixture (Phase 3): Navigates through voter journey to results — reusable for both visual and perf tests
- `devices['Desktop Chrome']` config: Used by all existing projects, provides consistent 1280x720 viewport
- Playwright 1.58.2 `toHaveScreenshot()`: Built-in visual comparison with configurable threshold, animations option, mask option
- `@smoke`, `@voter`, `@candidate`, `@variant` tags: Established tagging pattern on `test.describe()` blocks

### Established Patterns
- Project dependency chain: data-setup -> test projects -> data-teardown
- Tag-based test selection via `--grep` flag
- `fullyParallel: false` for state-dependent specs
- `testIgnore` for excluding files from default runs

### Integration Points
- Playwright config at `tests/playwright.config.ts`: Add visual/perf projects with `@visual`/`@perf` tags
- GitHub Actions workflow: Add optional visual/perf job (non-blocking)
- Existing data-setup project: Visual/perf tests can depend on same data-setup
- `tests/tests/specs/` directory: New visual/ and perf/ subdirectories

</code_context>

<deferred>
## Deferred Ideas

- Multi-viewport visual regression beyond 2 viewports (tablet, etc.) — future phase
- CI auto-update baselines via GitHub label trigger — future enhancement
- Production build performance testing — future phase
- Performance testing on candidate preview page — reconsider if results page perf is stable

</deferred>

---

*Phase: 07-advanced-test-capabilities*
*Context gathered: 2026-03-11*
