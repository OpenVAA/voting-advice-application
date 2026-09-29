# Phase 19: Integration Validation - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Verify the complete infrastructure migration (Phases 15-18: Svelte 5 scaffold, CSS architecture, i18n/Paraglide, dependency modernization) works across all integration points. Fix all migration-caused issues and opportunistically fix easy pre-existing issues. Produce a validation report documenting results.

</domain>

<decisions>
## Implementation Decisions

### Fix vs document scope
- Fix ALL migration-caused issues found during validation — the phase goal is "verified working", not "documented broken"
- Pre-existing failures: fix if easy (< 30 min), otherwise document in validation report
- Create a VALIDATION-REPORT.md in the phase directory summarizing: what was tested, what passed, what was fixed, any remaining pre-existing issues

### CI pipeline updates
- Remove or replace the `generate:translation-key-type` CI step — Paraglide handles type safety at compile time; if Paraglide has a CI-verifiable check, add that instead
- Upgrade CI Node version from 20.18.1 to Node 22 (align with @types/node ^22 from Phase 18)
- Keep Yarn 4.13 unless install issues surface
- Validate by running CI steps locally first (yarn build, yarn test:unit, yarn format:check, yarn lint:check), then push to verify GitHub Actions passes
- Include visual regression and performance test CI jobs in validation scope (not just functional E2E)

### E2E test tolerance
- Fix ALL E2E test failures — migration-caused and pre-existing
- Run full E2E suite locally with Docker stack (`yarn dev` + `yarn test:e2e`) before pushing to CI
- Visual regression baselines: regenerate all baselines, create before/after screen captures for manual review before committing
- Performance budgets: run and fix or adjust thresholds if CSS migration changed timing

### Docker verification depth
- Full stack verification: frontend serves pages, Strapi admin loads at /admin, mock data generates, candidate login works, API endpoints respond
- Fix Dockerfiles and docker-compose configs as needed to make the stack work (aligns with "fix everything" scope)
- Verify all 4 services: frontend, strapi, postgres, awslocal

### Visual baseline review
- Before committing regenerated visual baselines, create easy-to-review before/after screen captures
- Present visual diffs for user review to catch unexpected regressions from CSS migration

### Claude's Discretion
- Exact sequence of validation steps (build → Docker → E2E → CI push)
- How to create before/after visual comparison (side-by-side images, HTML report, etc.)
- Which Node 22 LTS version to pin in CI
- Whether Yarn version needs bumping alongside Node upgrade
- Specific Paraglide CI check to replace TranslationKey generation step (if any)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### CI pipeline
- `.github/workflows/main.yaml` — Main CI workflow: frontend validation, backend validation, E2E tests, visual/perf tests. TranslationKey step needs removal.

### Docker infrastructure
- `docker-compose.dev.yml` — Root Docker Compose orchestrating all 4 services
- `apps/frontend/docker-compose.dev.yml` — Frontend service definition and Dockerfile
- `apps/strapi/docker-compose.dev.yml` — Strapi, Postgres, LocalStack service definitions

### E2E test infrastructure
- `tests/playwright.config.ts` — Full Playwright config with project dependencies, variant setups, visual/perf opt-in projects
- `tests/tests/specs/` — All 18 E2E spec files (voter, candidate, variants, visual, perf)

### Prior phase artifacts (migration context)
- `.planning/phases/15-scaffold-and-build/15-CONTEXT.md` — Scaffold decisions affecting Docker/CI
- `.planning/phases/16-css-architecture/16-CONTEXT.md` — CSS changes affecting visual baselines
- `.planning/phases/17-internationalization/17-CONTEXT.md` — Paraglide migration affecting CI checks and E2E selectors
- `.planning/phases/18-dependency-modernization/18-CONTEXT.md` — Dependency changes affecting build/CI

### Environment
- `.env.example` — Environment variable template used by CI and Docker

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `tests/playwright.config.ts`: Complex project dependency graph with data setup/teardown, auth setup, variant configurations — well-structured for selective test runs
- `.github/workflows/main.yaml`: 4-job CI pipeline (frontend validation, backend validation, E2E, visual/perf) — update in-place

### Established Patterns
- CI uses `yarn install --frozen-lockfile` for reproducible installs
- E2E tests use `yarn dev:start` / `yarn dev:down` lifecycle commands
- Visual regression baselines stored at `{testDir}/__screenshots__/{testFileName}/`
- CI uploads Playwright reports and Docker logs as artifacts on failure

### Integration Points
- `yarn build` — Turborepo builds all workspaces in dependency order (core → data/matching/filters → app-shared → frontend/strapi)
- `yarn dev` / `yarn dev:start` — Docker Compose start commands
- `yarn test:unit` — Vitest across all workspaces
- `yarn test:e2e` — Playwright E2E suite
- `yarn format:check` / `yarn lint:check` — Prettier and ESLint checks

</code_context>

<specifics>
## Specific Ideas

- Before/after visual screen captures must be easy to review — create a clear comparison format so the user can quickly spot unexpected regressions from the CSS migration
- Phase 17 replaced sveltekit-i18n with Paraglide — E2E test utilities may reference old i18n patterns ($t(), translation key paths) that need updating
- Phase 18 pinned Strapi vitest to ^2.1.8 overriding catalog ^3.2.4 — verify this override works correctly in CI
- The validation report should be the final artifact of the milestone, confirming all v1.2 requirements are met

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 19-integration-validation*
*Context gathered: 2026-03-16*
