# Phase 6: CI Integration and Test Organization - Research

**Researched:** 2026-03-09
**Domain:** GitHub Actions CI, Playwright test tagging, HTML reporting
**Confidence:** HIGH

## Summary

Phase 6 adds CI integration and test tagging to an already-mature E2E test suite (16 spec files across candidate, voter, and variant categories, plus 7 setup/teardown projects). The existing `main.yaml` GitHub Actions workflow already has a working `e2e-tests` job that starts Docker services via `yarn dev:start`, runs `yarn test:e2e`, and uploads the HTML report as an artifact. The primary work is adapting this existing job to the new test structure (project dependencies pattern, variant projects, multi-dataset setup) and adding the Playwright `{ tag: }` property to all spec files for `--grep`-based selective execution.

Playwright 1.58.2 (installed in this project) fully supports the `{ tag: }` property on both `test()` and `test.describe()` (available since Playwright 1.42). Tags are filtered via `--grep @tagname` on the CLI. The existing CI workflow already uses `actions/upload-artifact@v4` with `if: always()` for report upload, which is the correct pattern. The main changes needed are: (1) ensuring `yarn playwright install --with-deps` is used instead of bare `yarn playwright install` to install OS-level browser dependencies on the CI runner, (2) adding tags to all 16 spec files plus 4 variant spec files, and (3) verifying the `yarn dev:start` + `--wait` pattern still works with the new test structure.

**Primary recommendation:** Add `{ tag: ['@voter'] }` or `{ tag: ['@candidate'] }` to every `test.describe()` block, add `@smoke` tags to a curated subset (home page load, candidate login, voter journey start), update the CI workflow to use `--with-deps` for Playwright install, and verify the existing HTML report artifact upload works unchanged.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CI-01 | Existing CI pipeline updated to work with new test structure | Existing `e2e-tests` job in `main.yaml` needs `--with-deps` flag, health check timing review, and verification that project dependencies pattern works in CI (workers: 1) |
| CI-02 | HTML test report artifact uploaded from CI runs | Already implemented in `main.yaml` lines 192-205 with `actions/upload-artifact@v4` -- needs verification that `playwright-report/` path still matches config output |
| CI-03 | Test tagging system for selective test runs (smoke, full, per-app) | Playwright 1.58.2 `{ tag: }` property on `test.describe()`, filtered via `--grep @smoke`, `--grep @voter`, `--grep @candidate` |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @playwright/test | 1.58.2 | Test framework with built-in tag support | Already installed, tags available since 1.42 |
| actions/upload-artifact | v4 | GitHub Actions artifact upload for HTML reports | Already used in main.yaml, current stable |
| actions/checkout | v4 | Git checkout in CI | Already used in main.yaml |
| actions/setup-node | v4 | Node.js setup in CI | Already used in main.yaml |
| threeal/setup-yarn-action | v2 | Yarn 4.6 setup in CI | Already used in main.yaml |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| docker compose | (built-in) | Service orchestration in CI | Already used via `yarn dev:start` |
| jwalton/gh-docker-logs | v2 | Docker log collection on failure | Already used in main.yaml |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tag-based filtering | Playwright projects for selective runs | Tags are simpler, don't require config changes, work with `--grep` CLI |
| `actions/upload-artifact@v4` | `actions/upload-artifact@v5` | v4 works fine, v5 adds Node 24 prelim support -- no benefit for this project |
| Title-based tags (`@smoke` in title) | `{ tag: }` property | Property-based tags are the official Playwright approach since 1.42, appear in reports, don't pollute test names |

## Architecture Patterns

### Tagging Strategy

The Playwright tag system uses the `{ tag: }` property on `test()` and `test.describe()`:

```typescript
// Source: https://playwright.dev/docs/test-annotations
test.describe('candidate authentication', { tag: ['@candidate', '@smoke'] }, () => {
  test('should login with valid credentials', async ({ page }) => {
    // ...
  });
});
```

Tags inherit: if `test.describe()` has `{ tag: ['@voter'] }`, all tests inside inherit `@voter`. Individual tests can add additional tags.

**Filtering via CLI:**
```bash
# Run only smoke tests
playwright test --grep @smoke

# Run only voter tests
playwright test --grep @voter

# Run only candidate tests
playwright test --grep @candidate

# Exclude smoke tests (run full suite minus smoke)
playwright test --grep-invert @smoke

# Combine tags (OR)
playwright test --grep "@voter|@candidate"
```

### Tag Assignment Plan

Every spec file gets exactly one app-level tag (`@voter`, `@candidate`, or `@variant`) on its top-level `test.describe()`. A curated subset also gets `@smoke`.

| Spec File | Tags | Rationale |
|-----------|------|-----------|
| candidate-auth.spec.ts | `@candidate`, `@smoke` | Login is the most basic candidate flow |
| candidate-profile.spec.ts | `@candidate` | Full flow, too slow for smoke |
| candidate-questions.spec.ts | `@candidate` | Full flow, too slow for smoke |
| candidate-registration.spec.ts | `@candidate` | Involves email, not smoke |
| candidate-settings.spec.ts | `@candidate` | Settings mutation, not smoke |
| voter-journey.spec.ts | `@voter`, `@smoke` | Core happy path, essential smoke test |
| voter-results.spec.ts | `@voter` | Depends on answered fixture, not smoke |
| voter-detail.spec.ts | `@voter` | Depends on answered fixture, not smoke |
| voter-matching.spec.ts | `@voter` | Algorithm verification, not smoke |
| voter-static-pages.spec.ts | `@voter`, `@smoke` | Fast page-load tests, good smoke candidates |
| voter-settings.spec.ts | `@voter` | Settings mutation, not smoke |
| voter-popups.spec.ts | `@voter` | Settings mutation, not smoke |
| multi-election.spec.ts | `@variant` | Config variant |
| results-sections.spec.ts | `@variant` | Config variant |
| constituency.spec.ts | `@variant` | Config variant |
| startfromcg.spec.ts | `@variant` | Config variant |

### Tag-Aware Project Dependencies

The `--grep` filter works alongside project dependencies. When running `--grep @smoke`, Playwright still runs the required setup projects (data-setup, auth-setup) because they are dependencies of the projects that contain smoke-tagged specs. Setup/teardown files use `setup()` not `test()`, so they are not affected by `--grep` filtering.

**Key insight:** Tags filter individual tests within projects. Project dependencies (setup/teardown) execute regardless of tag filtering because they are separate projects matched by `testMatch`, not by `test()` calls.

### CI Workflow Changes

The existing `e2e-tests` job in `.github/workflows/main.yaml` needs these specific changes:

1. **Playwright install with deps:** Change `yarn playwright install` to `yarn playwright install --with-deps` to install OS-level browser dependencies (libgbm, libnss3, etc.) on the Ubuntu runner.

2. **Remove the 30-second sleep:** The current workflow has a hardcoded `sleep 30s` "to allow mock data generation to complete". The new test structure uses API-based data setup (data.setup.ts project), so mock data generation timing is irrelevant -- tests import their own data. However, `GENERATE_MOCK_DATA_ON_INITIALISE` must be set to `false` in the CI `.env` to prevent mock data from interfering with test data. Currently the `.env.example` has it set to `true`.

3. **HTML report paths:** The Playwright config outputs to `tests/playwright-report/` which matches the existing artifact upload path. No change needed.

4. **Setup report path:** The workflow also uploads `tests/playwright-setup-report/` but the current Playwright config only specifies one reporter output at `tests/playwright-report/`. The setup report upload step may be a leftover from the old globalSetup pattern.

### Anti-Patterns to Avoid

- **Tagging setup/teardown files:** Setup projects use `setup()` from `@playwright/test`, not `test()`. Tags on setup files would have no effect and add confusion.
- **Overloading `@smoke` with too many tests:** Smoke should be < 2 minutes total. With `workers: 1` in CI and 30s timeout per test, that means at most 3-4 individual tests.
- **Using `--grep` in the default CI run:** The default CI should run the full suite (`yarn test:e2e`). Tag filtering is for manual/selective runs only.
- **Adding tags to variant spec test.describe blocks without considering project isolation:** Variant specs run in their own Playwright projects with dedicated datasets. Running `--grep @variant` outside of the full project dependency chain would fail because variant data setup projects would not run.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Test filtering | Custom grep scripts or test lists | Playwright `{ tag: }` + `--grep` | Built-in, appears in HTML reports, maintained by Playwright team |
| HTML reports | Custom report generation | Playwright HTML reporter (already configured) | Already set up in `playwright.config.ts` line 58 |
| Artifact upload | Custom storage solutions | `actions/upload-artifact@v4` (already used) | Standard GitHub Actions pattern, already in workflow |
| Service health checks | Custom polling scripts | Docker Compose `--wait` flag via `yarn dev:start` | Already used, waits for all healthcheck conditions |

**Key insight:** Nearly everything needed is already in place. The CI workflow runs E2E tests with Docker services and uploads reports. The work is adaptation, not creation.

## Common Pitfalls

### Pitfall 1: Missing OS Dependencies for Playwright Browsers
**What goes wrong:** `yarn playwright install` downloads browser binaries but does not install OS-level shared libraries (libgbm1, libnss3, etc.) required to run them on headless Ubuntu.
**Why it happens:** The current CI workflow uses bare `yarn playwright install` without `--with-deps`.
**How to avoid:** Use `yarn playwright install --with-deps` which installs both browsers and system dependencies.
**Warning signs:** Errors like `error while loading shared libraries: libgbm.so.1` or `browserType.launch: Error: Failed to launch chromium`.

### Pitfall 2: Mock Data Conflicting with Test Data
**What goes wrong:** The CI environment copies `.env.example` to `.env`, which sets `GENERATE_MOCK_DATA_ON_INITIALISE=true`. This generates random mock data before tests run, polluting the database.
**Why it happens:** The old test approach relied on mock data. The new approach imports deterministic test datasets via the Admin Tools API.
**How to avoid:** Set `GENERATE_MOCK_DATA_ON_INITIALISE=false` in the CI step that creates `.env`, or override it after copying `.env.example`.
**Warning signs:** Tests fail with unexpected data, candidate counts don't match, elections have extra entries.

### Pitfall 3: Tag Filtering Bypassing Project Dependencies
**What goes wrong:** Running `playwright test --grep @smoke` might skip setup projects if the runner doesn't understand that tagged tests still need their project dependencies.
**Why it happens:** Misunderstanding of Playwright's project dependency resolution.
**How to avoid:** Playwright handles this correctly -- when a test matches `--grep`, its containing project runs, which triggers all dependency projects. No action needed, but document this behavior.
**Warning signs:** Tests fail because data isn't loaded or auth state is missing.

### Pitfall 4: Variant Tags Not Working with --grep Alone
**What goes wrong:** Running `--grep @variant` doesn't work because variant projects have chained dependencies (multi-election -> results-sections -> constituency -> startfromcg). The `--grep` filter applies to tests within projects, but variant setup projects must still run.
**Why it happens:** Variant setup projects are separate Playwright projects with their own teardown chains.
**How to avoid:** For variant-only runs, use `--project` filtering instead of `--grep`: `playwright test --project=variant-multi-election --project=variant-results-sections ...`. Or just use `--grep @variant` and accept that all variant setup/teardown projects will also run (which is correct behavior).
**Warning signs:** Variant tests fail due to missing variant datasets.

### Pitfall 5: 30-Second Sleep Masking Real Timing Issues
**What goes wrong:** The current CI workflow has a 30-second sleep between Docker startup and test execution. This may be insufficient if Strapi takes longer to bootstrap, or wasteful if it's faster.
**Why it happens:** The `yarn dev:start` command uses `docker compose up -d --wait` which waits for healthchecks, but the mock data generation runs after the healthcheck passes.
**How to avoid:** Since the new test structure does not rely on mock data (data.setup.ts imports its own data via API), the 30s sleep can be removed entirely. The `--wait` flag already ensures services are healthy before returning.
**Warning signs:** Tests fail intermittently on CI with "connection refused" or Strapi API errors.

### Pitfall 6: Stale Artifact Names Overwriting Between Runs
**What goes wrong:** If artifact names are identical across matrix builds or concurrent runs, they can overwrite each other.
**Why it happens:** GitHub Actions requires unique artifact names within a workflow run.
**How to avoid:** The current workflow uses fixed names (`playwright-report`, `playwright-setup-report`). Since there's no matrix strategy, this is fine. If a matrix is added later, use `${{ matrix.* }}` in artifact names.
**Warning signs:** Missing reports in GitHub Actions artifact list.

## Code Examples

Verified patterns from official sources:

### Adding Tags to test.describe
```typescript
// Source: https://playwright.dev/docs/test-annotations
// Applied to an existing spec file (voter-journey.spec.ts)
test.describe('voter journey', { tag: ['@voter', '@smoke'] }, () => {
  test.describe.configure({ mode: 'serial' });
  // ... existing tests unchanged
});
```

### Adding Tags to Individual Tests (Not Recommended for This Project)
```typescript
// Source: https://playwright.dev/docs/test-annotations
// Prefer describe-level tags for consistency
test('should login with valid credentials', { tag: '@smoke' }, async ({ page }) => {
  // ...
});
```

### CI Workflow: Playwright Install with Dependencies
```yaml
# Source: https://playwright.dev/docs/ci
- name: "Install Playwright browsers and dependencies"
  run: yarn playwright install --with-deps
```

### CI Workflow: Upload HTML Report
```yaml
# Source: https://playwright.dev/docs/ci-intro
# Already in main.yaml -- no changes needed
- name: "Upload playwright report"
  uses: actions/upload-artifact@v4
  if: always()
  with:
    name: playwright-report
    path: tests/playwright-report/
    retention-days: 30
```

### CI Workflow: Override Mock Data Generation
```yaml
# Prevent mock data from conflicting with test-imported data
- name: "Configure environment"
  run: |
    cp .env.example .env
    sed -i 's/GENERATE_MOCK_DATA_ON_INITIALISE=true/GENERATE_MOCK_DATA_ON_INITIALISE=false/' .env
```

### Selective Test Execution via grep
```bash
# Smoke tests only (target: < 2 minutes)
playwright test --grep @smoke

# All voter tests
playwright test --grep @voter

# All candidate tests
playwright test --grep @candidate

# Everything except variants
playwright test --grep-invert @variant
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Title-based tags (`test('login @smoke')`) | `{ tag: ['@smoke'] }` property | Playwright 1.42 (Jan 2024) | Tags appear in HTML report filter UI, don't pollute test names |
| `globalSetup` for test setup | Project dependencies pattern | Playwright 1.31+ | Setup failures appear in HTML report with traces |
| `actions/upload-artifact@v3` | `actions/upload-artifact@v4` | Nov 2023 | 98% faster uploads, immutable artifacts |
| `yarn playwright install` (bare) | `yarn playwright install --with-deps` | Playwright 1.8+ (recommended) | Installs OS-level browser dependencies automatically |

**Deprecated/outdated:**
- `playwright-github-action` (the GitHub Action): Deprecated in favor of CLI `playwright install --with-deps`
- `globalSetup/globalTeardown`: Replaced by project dependencies for better reporting integration

## Open Questions

1. **Should the 30s sleep be removed or replaced?**
   - What we know: `yarn dev:start` uses `docker compose up --wait` which waits for healthchecks. The 30s sleep was for mock data generation.
   - What's unclear: Whether Strapi is fully ready to accept API calls immediately after the healthcheck passes (healthcheck only checks that the port responds).
   - Recommendation: Remove the sleep. The data.setup.ts project sends API calls to Strapi and will naturally wait/retry. If Strapi is not yet ready, the setup project will fail with a clear error, not a cascading test failure.

2. **Should variant specs get the `@variant` tag or app-level tags?**
   - What we know: Variant specs test voter journeys under different configurations. They are voter-focused but run in isolated projects.
   - What's unclear: Whether users want `--grep @voter` to include variant voter tests.
   - Recommendation: Use `@variant` tag only. Variant specs have their own project dependency chains and datasets. Including them in `@voter` would confuse the selective run semantics.

3. **Should the `playwright-setup-report` artifact be kept?**
   - What we know: The current workflow uploads both `playwright-setup-report/` and `playwright-report/`. The Playwright config only defines one reporter output at `playwright-report/`.
   - What's unclear: Whether the old globalSetup pattern created a separate report at `playwright-setup-report/`.
   - Recommendation: Remove the `playwright-setup-report` upload step. Setup project results now appear in the main HTML report thanks to the project dependencies pattern.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright 1.58.2 |
| Config file | `tests/playwright.config.ts` |
| Quick run command | `yarn test:e2e --grep @smoke` |
| Full suite command | `yarn test:e2e` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CI-01 | CI workflow runs full E2E suite on PRs | manual-verify | Open PR, check GitHub Actions | N/A (workflow file) |
| CI-02 | HTML report artifact downloadable | manual-verify | Download artifact from Actions run page | N/A (workflow file) |
| CI-03 | `--grep @smoke` runs only smoke-tagged tests in < 2 min | smoke | `yarn test:e2e --grep @smoke` | Wave 0 (tags not yet added) |

### Sampling Rate
- **Per task commit:** `yarn test:e2e --grep @smoke` (verify tags work locally)
- **Per wave merge:** `yarn test:e2e` (full suite to ensure no regressions)
- **Phase gate:** Open a test PR to verify CI runs end-to-end

### Wave 0 Gaps
- [ ] No tags exist on any spec file yet -- all 16 spec files need `{ tag: }` added to `test.describe()` blocks
- [ ] CI workflow `yarn playwright install` needs `--with-deps` flag
- [ ] CI workflow mock data override needs `GENERATE_MOCK_DATA_ON_INITIALISE=false`

## Sources

### Primary (HIGH confidence)
- [Playwright Annotations Docs](https://playwright.dev/docs/test-annotations) - Tag syntax, `--grep` filtering, `test.describe` tag property
- [Playwright CI Intro Docs](https://playwright.dev/docs/ci-intro) - GitHub Actions setup, artifact upload, `--with-deps` flag
- [Playwright CI Docs](https://playwright.dev/docs/ci) - Container image, artifact upload with `!cancelled()`
- Existing codebase: `.github/workflows/main.yaml` - Current CI workflow structure
- Existing codebase: `tests/playwright.config.ts` - Project dependencies, reporter config, worker settings

### Secondary (MEDIUM confidence)
- [Playwright Reporter Docs](https://playwright.dev/docs/test-reporters) - HTML reporter options, output folder configuration
- [GitHub Actions upload-artifact](https://github.com/actions/upload-artifact) - v4 API, retention settings

### Tertiary (LOW confidence)
- None. All findings verified against official sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All tools already in use, just need minor adaptations
- Architecture: HIGH - Playwright tag system is well-documented and straightforward
- Pitfalls: HIGH - Based on direct examination of existing CI workflow and test structure

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (stable -- Playwright tag API unlikely to change)
