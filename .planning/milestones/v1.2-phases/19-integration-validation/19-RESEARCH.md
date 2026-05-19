# Phase 19: Integration Validation - Research

**Researched:** 2026-03-16
**Domain:** Monorepo build validation, Docker orchestration, CI pipeline, E2E testing
**Confidence:** HIGH

## Summary

Phase 19 validates the complete infrastructure migration (Phases 15-18: Svelte 5 scaffold, CSS architecture, Paraglide i18n, dependency modernization) by running the full build, Docker stack, E2E tests, and CI pipeline. The phase is primarily a verification and fix-forward phase -- the work is running each integration point, diagnosing failures, and fixing them.

The CI pipeline requires two targeted updates: (1) removing the obsolete `generate:translation-key-type` step (Paraglide handles type safety at compile time), and (2) upgrading Node.js from 20.18.1 to Node 22 LTS. The Docker infrastructure needs its Dockerfiles updated from `node:20.18.1-alpine` to Node 22. Visual regression baselines must be regenerated since CSS architecture changed in Phase 16. The E2E test files use `assert { type: 'json' }` import syntax (12 files), which produces deprecation warnings on Node 22 -- these should be migrated to the standard `with { type: 'json' }` syntax.

**Primary recommendation:** Execute validation in a strict sequence: local build -> local Docker stack -> local E2E -> CI pipeline push. Fix all issues at each stage before proceeding to the next.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Fix ALL migration-caused issues found during validation -- the phase goal is "verified working", not "documented broken"
- Pre-existing failures: fix if easy (< 30 min), otherwise document in validation report
- Create a VALIDATION-REPORT.md in the phase directory summarizing: what was tested, what passed, what was fixed, any remaining pre-existing issues
- Remove or replace the `generate:translation-key-type` CI step -- Paraglide handles type safety at compile time; if Paraglide has a CI-verifiable check, add that instead
- Upgrade CI Node version from 20.18.1 to Node 22 (align with @types/node ^22 from Phase 18)
- Keep Yarn 4.13 unless install issues surface
- Validate by running CI steps locally first (yarn build, yarn test:unit, yarn format:check, yarn lint:check), then push to verify GitHub Actions passes
- Include visual regression and performance test CI jobs in validation scope (not just functional E2E)
- Fix ALL E2E test failures -- migration-caused and pre-existing
- Run full E2E suite locally with Docker stack (`yarn dev` + `yarn test:e2e`) before pushing to CI
- Visual regression baselines: regenerate all baselines, create before/after screen captures for manual review before committing
- Performance budgets: run and fix or adjust thresholds if CSS migration changed timing
- Full stack verification: frontend serves pages, Strapi admin loads at /admin, mock data generates, candidate login works, API endpoints respond
- Fix Dockerfiles and docker-compose configs as needed to make the stack work
- Verify all 4 services: frontend, strapi, postgres, awslocal
- Before committing regenerated visual baselines, create easy-to-review before/after screen captures
- Present visual diffs for user review to catch unexpected regressions from CSS migration

### Claude's Discretion
- Exact sequence of validation steps (build -> Docker -> E2E -> CI push)
- How to create before/after visual comparison (side-by-side images, HTML report, etc.)
- Which Node 22 LTS version to pin in CI
- Whether Yarn version needs bumping alongside Node upgrade
- Specific Paraglide CI check to replace TranslationKey generation step (if any)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| VAL-01 | Frontend builds successfully with `yarn build` | Build validation sequence documented; known issues from prior phases (Strapi vitest pin, DaisyUI 5 pre-built CSS, Paraglide Vite plugin) identified |
| VAL-02 | Docker dev stack starts and serves the frontend correctly | Dockerfile Node version upgrade path documented; all 4 services mapped; healthcheck endpoints identified |
| VAL-03 | CI pipeline passes with updated dependencies | CI workflow fully analyzed; 3 required changes identified (Node upgrade, TranslationKey step removal, `engine` field updates) |
| VAL-04 | Existing E2E tests pass (or failures documented as pre-existing) | All 18 spec files catalogued; Playwright 1.58 compatibility confirmed; import assertion deprecation risk identified; visual baseline regeneration process documented |
</phase_requirements>

## Standard Stack

No new libraries are introduced in this phase. The phase validates existing stack:

### Core (Validation Tooling)
| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| Playwright | ^1.58.2 | E2E testing framework | Already installed via yarn catalog |
| Docker Compose | (system) | Container orchestration | Uses docker-compose.dev.yml at root |
| GitHub Actions | N/A | CI pipeline | `.github/workflows/main.yaml` |
| Turborepo | ^2.8.17 | Build orchestration | Handles dependency-ordered builds |

### Version Updates Required
| Component | Current | Target | Reason |
|-----------|---------|--------|--------|
| Node.js (CI) | 20.18.1 | 22.22.1 | Align with @types/node ^22 from Phase 18 |
| Node.js (Dockerfiles) | 20.18.1-alpine | 22-alpine | Align with CI; use major tag for patch flexibility |
| Yarn (CI + Docker) | 4.13.0 | 4.13.0 | Keep unchanged unless install issues surface |

## Architecture Patterns

### Validation Execution Sequence

The validation MUST proceed in dependency order. Each stage must pass before advancing:

```
Stage 1: Local Build Validation
  yarn build                    # Full Turborepo build (all workspaces)
  yarn test:unit               # All unit tests across workspaces
  yarn format:check            # Prettier formatting
  yarn lint:check              # ESLint across all workspaces
    |
Stage 2: Docker Stack Validation
  yarn dev:down                # Clean slate
  yarn dev                     # Build + start all 4 services
  Manual verification:
    - Frontend: http://localhost:5173
    - Strapi admin: http://localhost:1337/admin
    - Mock data generation
    - Candidate login flow
    - API endpoint responses
    |
Stage 3: E2E Test Validation
  yarn test:e2e                # Full Playwright suite (18 spec files)
  PLAYWRIGHT_VISUAL=1 ...      # Visual regression tests
  PLAYWRIGHT_PERF=1 ...        # Performance budget tests
    |
Stage 4: CI Pipeline Validation
  Push branch, verify GitHub Actions passes all 4 jobs:
    - frontend-and-shared-module-validation
    - backend-validation
    - e2e-tests
    - e2e-visual-perf
```

### CI Pipeline Structure (4 jobs)

```
Job 1: frontend-and-shared-module-validation
  - checkout -> yarn install -> yarn build -> format:check -> lint:check
  - [REMOVE] generate:translation-key-type step
  - test:unit -> build frontend

Job 2: backend-validation
  - checkout -> yarn install -> yarn build
  - yarn workspace @openvaa/strapi build

Job 3: e2e-tests
  - checkout -> configure .env -> yarn install -> playwright install
  - yarn dev:start -> yarn test:e2e -> yarn dev:down
  - Artifacts: playwright-report, docker logs on failure

Job 4: e2e-visual-perf (continue-on-error: true)
  - Same setup as e2e-tests
  - PLAYWRIGHT_VISUAL=1 PLAYWRIGHT_PERF=1 npx playwright test --grep "@visual|@perf"
```

### Visual Baseline Regeneration Process

1. Save current baselines as "before" snapshots (copy from `tests/tests/specs/visual/__screenshots__/`)
2. Run `PLAYWRIGHT_VISUAL=1 npx playwright test -c tests/playwright.config.ts --grep @visual --update-snapshots`
3. Copy new baselines as "after" snapshots
4. Create a side-by-side comparison for user review
5. Only commit after user approval

Current baselines (4 files):
- `candidate-preview-desktop.png`
- `candidate-preview-mobile.png`
- `voter-results-desktop.png`
- `voter-results-mobile.png`

### File Modification Map

**CI Pipeline** (`.github/workflows/main.yaml`):
- All 4 jobs: Change `node-version: 20.18.1` to `node-version: 22.22.1`
- Job 1: Remove the `generate:translation-key-type` step (lines 58-59)
- No Paraglide-specific CI check needed -- `yarn build` validates message compilation via the Paraglide Vite plugin

**Dockerfiles** (2 files):
- `apps/frontend/Dockerfile` line 1: `FROM node:20.18.1-alpine` -> `FROM node:22-alpine`
- `apps/strapi/Dockerfile` line 1: `FROM node:20.18.1-alpine` -> `FROM node:22-alpine`
- Both files: Update `ENV YARN_VERSION=4.13.0` (keep as-is unless issues)

**Husky pre-commit hook** (`.husky/pre-commit`):
- Remove the `generate:translation-key-type` check (lines 3-4)

**Package.json `engine` fields** (3 files):
- `package.json`: `"node": "20.18.1"` -> `"node": ">=22"`
- `apps/frontend/package.json`: Same change
- `apps/strapi/package.json`: Same change

**E2E test files** (12 files with `assert { type: 'json' }`):
- Migrate `assert { type: 'json' }` to `with { type: 'json' }` to avoid Node 22 deprecation warnings
- Files: `data.setup.ts`, `testCredentials.ts`, `voter-results.spec.ts`, `voter-matching.spec.ts`, `voter-detail.spec.ts`, `candidate-registration.spec.ts`, `candidate-profile.spec.ts`, `variant-multi-election.setup.ts`, `variant-constituency.setup.ts`, `variant-startfromcg.setup.ts` (plus 2 debug files)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Visual comparison report | Custom HTML diff viewer | Playwright's built-in `--update-snapshots` + manual before/after copy | Playwright already handles screenshot comparison; manual review of before/after PNGs is sufficient |
| Translation type validation CI step | Custom Paraglide lint step | `yarn build` (includes Paraglide Vite plugin compilation) | Paraglide compiles messages as part of the Vite build; if any message key is invalid, the build fails |
| Docker health checking | Custom wait scripts | `docker compose ... --wait` flag | The `yarn dev:start` script already uses `--wait` which blocks until healthchecks pass |

## Common Pitfalls

### Pitfall 1: Node 22 + Import Assertions Deprecation
**What goes wrong:** Node 22 logs `ExperimentalWarning: Import assertions are not a standard feature` for every `assert { type: 'json' }` import, polluting test output and potentially causing CI noise.
**Why it happens:** TC39 changed the keyword from `assert` to `with`. Node 22 supports both but warns on `assert`.
**How to avoid:** Migrate all 12 E2E test files from `assert { type: 'json' }` to `with { type: 'json' }`.
**Warning signs:** Yellow warnings in console output during `yarn test:e2e`.
**Confidence:** HIGH -- verified via Node.js 22 release notes and V8 documentation.

### Pitfall 2: Dockerfile Corepack + Node 22 Compatibility
**What goes wrong:** `corepack enable && corepack prepare yarn@4.13.0` may behave differently on Node 22 due to corepack being marked experimental and behavior changes between Node versions.
**Why it happens:** Corepack is still experimental in Node 22 and its behavior can change between major versions.
**How to avoid:** Test Docker build locally before pushing. If corepack fails, add `--activate` flag or use `corepack install` instead of `corepack prepare`.
**Warning signs:** Docker build fails at the corepack step.
**Confidence:** MEDIUM -- corepack is experimental and may have changed behavior.

### Pitfall 3: Visual Baseline Platform Dependency
**What goes wrong:** Visual regression screenshots generated on macOS look different from those generated on Linux (CI runs Ubuntu). Font rendering, anti-aliasing, and subpixel rendering differ between platforms.
**Why it happens:** Playwright screenshots are pixel-dependent on the rendering engine, which varies by OS.
**How to avoid:** Generate baselines on the CI platform (Ubuntu/Linux) or use generous thresholds. The current config uses `threshold: 0.2, maxDiffPixelRatio: 0.01`. For local testing, use `--update-snapshots` only in a Linux Docker container matching CI, or accept that local visual tests may differ from CI.
**Warning signs:** Visual tests pass locally but fail on CI (or vice versa).
**Confidence:** HIGH -- this is a well-known Playwright issue.

### Pitfall 4: Docker Build Cache Stale After Node Upgrade
**What goes wrong:** Docker uses cached layers from the old `node:20.18.1-alpine` image, causing confusion when the base image changes.
**Why it happens:** Docker layer caching is based on the instruction hash, and a new base image tag forces a full rebuild.
**How to avoid:** Use `yarn dev:down` followed by `docker compose ... --no-cache --build` for the first build after the Node version change.
**Warning signs:** Mysterious errors during container startup that don't match local Node behavior.
**Confidence:** HIGH -- standard Docker behavior.

### Pitfall 5: Strapi Vitest Pin Interaction with CI
**What goes wrong:** Phase 18 pinned Strapi's vitest to `^2.1.8` (overriding catalog `^3.2.4`) because vitest 3's config loader is ESM-only, incompatible with Strapi's CJS context. This override must survive the CI build.
**Why it happens:** Yarn catalog overrides in workspace package.json may not resolve correctly if the yarn.lock is not properly updated.
**How to avoid:** Verify `yarn build` succeeds for Strapi workspace specifically: `yarn workspace @openvaa/strapi build`. Check that vitest resolution for Strapi is 2.x not 3.x.
**Warning signs:** Strapi build fails with ESM/CJS error related to vitest config.
**Confidence:** HIGH -- documented in Phase 18 decisions.

### Pitfall 6: E2E Data Setup Fragility
**What goes wrong:** The `data.setup.ts` file imports JSON data and communicates with Strapi's Admin Tools API. If the API schema changed during dependency modernization or the mock data format changed, setup fails and all E2E tests are blocked.
**Why it happens:** E2E tests depend on the full stack (frontend + backend + database) being correctly configured and compatible.
**How to avoid:** Run `yarn test:e2e` after Docker stack is healthy. If data.setup fails, check Strapi logs (`docker compose -f docker-compose.dev.yml logs strapi`).
**Warning signs:** All E2E projects fail because `data-setup` project fails.
**Confidence:** HIGH -- observed pattern from prior test runs.

## Code Examples

### CI Node Version Update
```yaml
# .github/workflows/main.yaml - all 4 jobs
# Before:
- name: Setup Node.js 20.18.1
  uses: actions/setup-node@v4
  with:
    node-version: 20.18.1
    cache: "yarn"

# After:
- name: Setup Node.js 22.22.1
  uses: actions/setup-node@v4
  with:
    node-version: 22.22.1
    cache: "yarn"
```

### Remove TranslationKey CI Step
```yaml
# .github/workflows/main.yaml - Job 1, remove these 2 lines:
#   - name: "Check that TranslationKey type is up to date"
#     run: yarn workspace @openvaa/frontend generate:translation-key-type && git diff --exit-code
```

### Husky Pre-commit Hook Update
```bash
# .husky/pre-commit - remove lines 3-4:
#   cd apps/frontend
#   yarn generate:translation-key-type && git diff --quiet src/lib/types/generated/translationKey.ts || (echo "Run 'yarn generate:translation-key-type' and 'git add' generated file" && exit 1)
```

### Dockerfile Node Version Update
```dockerfile
# apps/frontend/Dockerfile and apps/strapi/Dockerfile
# Before:
FROM node:20.18.1-alpine AS base

# After:
FROM node:22-alpine AS base
```

### Import Assertion Migration
```typescript
// Before (12 E2E test files):
import defaultDataset from '../data/default-dataset.json' assert { type: 'json' };

// After:
import defaultDataset from '../data/default-dataset.json' with { type: 'json' };
```

### Visual Baseline Regeneration Commands
```bash
# Step 1: Save "before" baselines
cp -r tests/tests/specs/visual/__screenshots__ /tmp/visual-before/

# Step 2: Start Docker stack
yarn dev

# Step 3: Regenerate baselines
PLAYWRIGHT_VISUAL=1 npx playwright test -c tests/playwright.config.ts --grep @visual --update-snapshots

# Step 4: Compare
# New baselines are now in tests/tests/specs/visual/__screenshots__/
# "Before" copies are in /tmp/visual-before/
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `generate:translation-key-type` CI step | Paraglide compile-time type safety via Vite plugin | Phase 17 | Remove CI step; build validates types |
| `import ... assert { type: 'json' }` | `import ... with { type: 'json' }` | Node 22 (TC39 import attributes) | Migrate 12 E2E files |
| `node:20.18.1-alpine` Docker base | `node:22-alpine` | Phase 18 aligned @types/node ^22 | Update 2 Dockerfiles |
| `[[lang=locale]]` route parameter | Paraglide `localizeHref()` URL strategy | Phase 17 | Routes no longer have lang param in filesystem; E2E `buildRoute` utility already adapted |

**Deprecated/outdated:**
- `generate:translation-key-type` script: Still exists in `apps/frontend/package.json` but generates a deprecated type alias (`TranslationKey = string`). The CI step and pre-commit hook referencing it must be removed.
- `translations.ts` test utility: Reads from old `src/lib/i18n/translations/` directory. Currently unused by any spec files. Can remain as-is.

## Open Questions

1. **Corepack behavior on Node 22**
   - What we know: Corepack is experimental in both Node 20 and 22. Current Dockerfiles use `corepack enable && corepack prepare yarn@4.13.0`.
   - What's unclear: Whether the exact same corepack commands work identically on Node 22-alpine.
   - Recommendation: Test Docker build first. If corepack fails, try `corepack install` or pin corepack version.

2. **Visual baseline CI vs local discrepancy**
   - What we know: Playwright screenshots differ between macOS and Linux due to font rendering. CI baselines must be generated on Linux.
   - What's unclear: Whether existing baselines were generated on Linux or macOS.
   - Recommendation: Regenerate baselines in CI environment (or Docker Linux container) after CSS changes. Use `--update-snapshots` in CI job for initial baseline commit, then switch to assertion mode.

3. **Performance budget thresholds after CSS migration**
   - What we know: Phase 16 migrated from DaisyUI 4 + TW3 to DaisyUI 5 + TW4. CSS delivery may have changed.
   - What's unclear: Whether performance budgets (8s DOMContentLoaded, 15s full load) still hold after CSS changes.
   - Recommendation: Run performance tests, observe timing, adjust thresholds if needed. The budgets are generous (regression detectors, not targets).

## E2E Test Catalog

All 18 E2E spec files that must pass:

| Spec File | Project | Type | Risk Level |
|-----------|---------|------|------------|
| `candidate-auth.spec.ts` | candidate-app | Functional | LOW -- uses testIds, no i18n |
| `candidate-questions.spec.ts` | candidate-app | Functional | LOW |
| `candidate-registration.spec.ts` | candidate-app-mutation | Functional | MEDIUM -- creates users |
| `candidate-profile.spec.ts` | candidate-app-mutation | Functional | MEDIUM -- file upload |
| `candidate-settings.spec.ts` | candidate-app-settings | Functional | LOW |
| `voter-journey.spec.ts` | voter-app | Functional | LOW |
| `voter-results.spec.ts` | voter-app | Functional | LOW |
| `voter-matching.spec.ts` | voter-app | Functional | MEDIUM -- algorithm verification |
| `voter-detail.spec.ts` | voter-app | Functional | LOW |
| `voter-static-pages.spec.ts` | voter-app | Functional | LOW |
| `voter-settings.spec.ts` | voter-app-settings | Functional | LOW |
| `voter-popups.spec.ts` | voter-app-popups | Functional | LOW |
| `multi-election.spec.ts` | variant-multi-election | Variant | MEDIUM -- data overlay |
| `results-sections.spec.ts` | variant-results-sections | Variant | MEDIUM |
| `constituency.spec.ts` | variant-constituency | Variant | MEDIUM |
| `startfromcg.spec.ts` | variant-startfromcg | Variant | MEDIUM |
| `visual-regression.spec.ts` | visual-regression | Visual | HIGH -- baselines need regen |
| `performance-budget.spec.ts` | performance | Perf | MEDIUM -- thresholds may shift |

## Sources

### Primary (HIGH confidence)
- `.github/workflows/main.yaml` -- Full CI pipeline analysis (4 jobs, all steps)
- `tests/playwright.config.ts` -- Playwright project configuration with dependency graph
- `apps/frontend/Dockerfile`, `apps/strapi/Dockerfile` -- Docker build configuration
- `docker-compose.dev.yml` (root + apps) -- Docker orchestration
- `apps/frontend/vite.config.ts` -- Paraglide Vite plugin integration
- `apps/frontend/package.json` -- Frontend dependencies and scripts
- `package.json` (root) -- Workspace scripts and engine constraints

### Secondary (MEDIUM confidence)
- [Node.js 22.22.1 LTS release](https://nodejs.org/en/blog/release/v22.22.0) -- Latest Node 22 LTS version
- [Node.js releases](https://nodejs.org/en/about/previous-releases) -- Node 22 LTS status confirmed
- [Node.js import assertions deprecation](https://github.com/nodejs/node/issues/51622) -- `assert` -> `with` migration requirement
- [V8 import attributes](https://v8.dev/features/import-attributes) -- TC39 standard change from `assert` to `with`
- [Paraglide JS docs](https://inlang.com/m/gerre34r/library-inlang-paraglideJs) -- Compile-time type safety, no separate CI lint needed
- [inlang CLI](https://inlang.com/m/2qj2w8pu/app-inlang-cli/changelog) -- `validate` command validates settings only, not messages

### Tertiary (LOW confidence)
- Corepack Node 22 behavior -- not verified against official release notes, based on general knowledge of experimental status

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all tools already in use, no new introductions
- Architecture: HIGH -- validation sequence is well-defined, all files identified
- Pitfalls: HIGH -- common issues documented from ecosystem knowledge and code analysis
- CI changes: HIGH -- exact line numbers and changes identified from reading the workflow file
- Docker changes: HIGH -- exact Dockerfile changes identified
- E2E compatibility: MEDIUM -- Playwright transpiler should handle `assert` syntax, but Node 22 deprecation warnings may cause CI noise

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (stable domain, validation-focused phase)
