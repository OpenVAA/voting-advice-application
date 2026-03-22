# Phase 39: CI/CD and Documentation - Research

**Researched:** 2026-03-22
**Status:** Complete

## Executive Summary

Phase 39 is the final phase of the v2.0 milestone. It updates CI pipeline, documentation, and deployment configuration to reflect the completed Supabase migration. The parallel branch (`feat-gsd-supabase-migration`) provides a reference CI workflow that needs version adaptation (Node 22 / Yarn 4.13 instead of Node 20 / Yarn 4.6).

## Key Findings

### 1. Current CI Workflow (`.github/workflows/main.yaml`)

The current workflow has 3 jobs:
- **`frontend-and-shared-module-validation`**: Build, lint, format, test, frontend build. Uses Node 22.22.1, Yarn 4.13, Turborepo remote caching.
- **`e2e-tests`**: Docker Compose stack (yarn dev:start), Playwright E2E. Uses Docker logs collection on failure.
- **`e2e-visual-perf`**: Same Docker stack, visual/perf tests with `continue-on-error: true`.

No `backend-validation` job exists on current branch (already removed). The main changes needed are:
1. Add `skill-drift-check` job
2. Add `supabase-tests` (pgTAP) job
3. Update E2E jobs to use Supabase CLI instead of Docker Compose

### 2. Parallel Branch CI Reference

The parallel branch workflow has these key differences from current:
- **`skill-drift-check`** job: `fetch-depth: 0`, runs `.claude/scripts/audit-skill-drift.sh`
- **`supabase-tests`** job: Uses `dorny/paths-filter@v3` for conditional execution, `supabase/setup-cli@v1`, runs `supabase start` + `supabase test db`
- **E2E jobs** use `supabase/setup-cli@v1` + `supabase start` instead of Docker Compose
- **E2E approach**: Builds shared packages (`yarn build:shared`), starts Supabase, starts frontend via `yarn workspace @openvaa/frontend dev &`, waits with curl loop
- Uses Node 20 / Yarn 4.6 (must be updated to Node 22.22.1 / Yarn 4.13)
- No Turborepo remote caching in frontend job (must keep current TURBO_TOKEN/TURBO_TEAM)
- Uses `build:shared` instead of `build` (current branch uses `build` which is Turborepo-managed)
- No `submodules: recursive` in checkout (current E2E has it, parallel doesn't)

### 3. Skill Drift Script

The `audit-skill-drift.sh` script is well-structured:
- Parses `targets:` from SKILL.md YAML frontmatter
- Compares git history (commits since skill was last updated vs target directories)
- Reports DRIFT/OK/SKIP per skill
- Exits 1 if any drift detected (fails CI)
- Location on parallel branch: `.claude/scripts/audit-skill-drift.sh`
- Current branch has `.claude/skills/` directory with 5 skill directories (architect, components, data, database, filters, matching)
- No `.claude/scripts/` directory exists yet on current branch

### 4. CLAUDE.md Status

Phase 38 has already rewritten CLAUDE.md for Supabase-only workflow. Current CLAUDE.md:
- References Supabase throughout (not Strapi)
- Documents `supabase start`, migrations, Edge Functions
- Has correct env vars (`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`)
- Mentions `render.example.yaml`
- Uses `apps/supabase/` workspace paths
- Docker Compose noted as production build testing only

Remaining gaps to verify:
- pgTAP testing instructions (present: "pgTAP tests in `apps/supabase/tests/`")
- Mailpit/Inbucket email documentation (present: "Inbucket: http://127.0.0.1:54324")
- CI-specific documentation may need updating after workflow changes

### 5. Render Blueprint (`render.example.yaml`)

Already updated for Supabase-only deployment:
- Single frontend service (no Strapi service)
- `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` env vars
- No Strapi-related env vars
- Docker context and Dockerfile path correct

This file appears complete. No changes needed.

### 6. Documentation Site Strapi References

Extensive Strapi references found in docs site:

**Navigation config** (`apps/docs/src/lib/navigation.config.ts`):
- Backend section title "Strapi" (line 155)
- "OpenVAA admin tools plugin for Strapi" nav item
- "Localization in Strapi" nav item
- "Registration Process in Strapi" nav item

**Content pages with Strapi-as-active-backend references** (need updating):
- `publishers-guide/app-settings/+page.md` — "edit in Strapi dashboard"
- `developers-guide/configuration/app-settings/+page.md` — Strapi settings workflow
- `developers-guide/configuration/app-customization/+page.md` — Strapi content type instructions
- `developers-guide/configuration/environmental-variables/+page.md` — "Strapi configuration"
- `developers-guide/frontend/data-api/+page.md` — StrapiDataProvider class diagrams
- `developers-guide/frontend/accessing-data-and-state-management/+page.md` — Strapi backend references
- `developers-guide/deployment/+page.md` — Strapi deployment instructions
- `developers-guide/development/testing/+page.md` — "created on Strapi bootstrap"
- `developers-guide/development/running-the-development-environment/+page.md` — Docker/Strapi references
- `developers-guide/troubleshooting/+page.md` — Multiple Strapi troubleshooting sections
- `developers-guide/app-and-repo-structure/+page.md` — @openvaa/strapi references
- `developers-guide/candidate-user-management/*.md` — Strapi-based instructions
- `developers-guide/localization/supported-locales/+page.md` — Strapi path reference
- `about/features/+page.md` — "Using Strapi Admin UI"

**Pages already marked as legacy** (have the "documents legacy Strapi backend" note):
- `developers-guide/backend/intro/+page.md`
- `developers-guide/backend/customized-behaviour/+page.md`
- `developers-guide/backend/openvaa-admin-tools-plugin-for-strapi/+page.md`
- `developers-guide/backend/plugins/+page.md`
- `developers-guide/backend/default-data-loading/+page.md`
- `developers-guide/backend/security/+page.md`
- `developers-guide/backend/running-the-backend-separately/+page.md`
- `developers-guide/backend/preparing-backend-dependencies/+page.md`
- `developers-guide/backend/re-generating-types/+page.md`
- `developers-guide/backend/authentication/+page.md`
- `developers-guide/backend/mock-data-generation/+page.md`
- `developers-guide/localization/localization-in-strapi/+page.md`
- `developers-guide/candidate-user-management/registration-process-in-strapi/+page.md`

### 7. Other Workflows

- **`release.yml`**: Node 22.22.1, Yarn 4.13, Turborepo caching. No Strapi references. No changes needed.
- **`docs.yml`**: Node 22.22.1, Yarn 4.13, Turborepo caching. No Strapi references. No changes needed.
- **`claude.yml`**, **`claude-code-review.yml`**, **`claude-solve-issue.yml`**: Claude AI workflows. No Strapi references.

### 8. Build Command Differences

Current branch uses `yarn build` (Turborepo) while parallel branch uses `yarn build:shared`. Need to check if `build:shared` exists on current branch or if we should use `yarn build`.

## Validation Architecture

### Dimension 1: CI Pipeline Correctness
- Verify `skill-drift-check` job runs and can detect drift
- Verify `supabase-tests` job runs pgTAP tests successfully
- Verify E2E jobs start Supabase correctly

### Dimension 2: Version Consistency
- Node 22.22.1 used across all jobs
- Yarn 4.13 used across all jobs
- Turborepo caching preserved in frontend validation job

### Dimension 3: Documentation Accuracy
- CLAUDE.md matches actual development workflow
- No Strapi-as-active-backend in docs pages (legacy notices acceptable)
- Render blueprint matches actual deployment needs

### Dimension 4: Deployment Readiness
- render.example.yaml has correct Supabase env vars
- No Strapi service references in deployment config

## Risks and Mitigations

1. **E2E jobs need `yarn build` not `yarn build:shared`**: Current branch uses Turborepo `yarn build`, not `yarn build:shared`. Use `yarn build` in all jobs.
2. **Docker Compose references in E2E**: `yarn dev:start` and `yarn dev:down` won't work without Docker Compose stack. Need to replace with Supabase CLI approach.
3. **Docs site pages**: Many pages have deeply embedded Strapi instructions. Strategy: Add legacy notice to all remaining Strapi-reference pages, update navigation titles, but don't rewrite full content (too risky for final phase).
4. **Skill drift script path**: Script needs to go to `.claude/scripts/audit-skill-drift.sh`. Directory doesn't exist yet.

## RESEARCH COMPLETE
