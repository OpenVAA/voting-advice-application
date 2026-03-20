# Phase 30: Strapi Removal and Dev Environment - Research

**Researched:** 2026-03-20
**Domain:** Codebase cleanup, Docker/CI pipeline, dev environment migration
**Confidence:** HIGH

## Summary

Phase 30 is a removal and reconfiguration phase, not a feature-building phase. The primary work is deleting the Strapi adapter, backend directory, and Docker services, then rewiring `yarn dev` to use `supabase start` + SvelteKit dev server. The technical risk is low because Phase 29 already proved the Supabase-only workflow works for E2E tests.

The main complexity lies in completeness: Strapi references are scattered across 243+ files (most in `backend/vaa-strapi/` itself, but also in root `package.json`, `.env.example`, `docker-compose.dev.yml`, CI workflow, documentation, frontend adapter switch files, test utilities, static settings types, `render.example.yaml`, `.github/dependabot.yml`, `frontend/Dockerfile`, and frontend route comments). Missing any reference will leave broken imports, dead code, or confusing documentation.

**Primary recommendation:** Execute removal in dependency order (adapter switch files first, then adapter directory, then backend directory, then Docker/env/CI, then docs/cleanup) and verify with `yarn install`, `yarn build:shared`, `yarn build:app-shared`, and `yarn workspace @openvaa/frontend build` after each wave.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- `yarn dev` runs `supabase start` then starts the SvelteKit dev server (`yarn workspace @openvaa/frontend dev`) -- no Docker compose for daily development
- Dev data seeding uses `supabase/seed.sql` which runs automatically on `supabase db reset` -- no separate seed script needed
- `.env` stripped to essentials: remove all Strapi/LocalStack vars (~70 lines), keep only Supabase public vars (URL, anon key) and frontend config; local defaults come from `supabase/config.toml`
- Root `docker-compose.dev.yml` is rewritten (not removed) as a minimal production-build test tool
- Delete Strapi-specific docs pages in `docs/src/routes/(content)/developers-guide/` (~15 pages)
- Leave stub files with key references (relevant file paths, commit hashes, brief notes on what Supabase equivalent would cover)
- CLAUDE.md fully updated: dev commands point to `supabase start`, architecture removes dual-backend mention, troubleshooting reflects Supabase-only stack
- Remove `backend-validation` job entirely from CI
- Remove Strapi paths from lint commands
- Add a new Supabase pgTAP CI job that runs `supabase start` + `supabase test` -- triggered only on relevant path changes
- `jose` and `qs` packages confirmed used outside Strapi adapter -- do NOT remove

### Claude's Discretion
- Dev script naming and supabase CLI command mapping
- Docker compose scope for production testing (frontend-only vs full stack)
- Exact stub content format for removed docs pages
- Order of removal operations (adapter first vs backend first)
- Whether `backend/vaa-strapi/docker-compose.dev.yml` needs any migration or just deletion
- Strapi test file cleanup (`strapiDataProvider.test.ts`)

### Deferred Ideas (OUT OF SCOPE)
- Write comprehensive Supabase developer documentation (replacements for removed Strapi docs) -- future documentation phase
- Add Supabase pgTAP tests to CI as a required check (start with optional/non-blocking) -- evaluate after initial CI integration
- Production deployment guide rewrite for Supabase -- separate docs effort
- Admin app support (`supportsAdminApp: true` in adapter config) -- post v3.0 milestone
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ENVR-01 | Local dev via supabase CLI (`supabase start`) replacing Docker compose for backend | Supabase CLI already configured in `apps/supabase/supabase/config.toml` with all service ports (API 54321, DB 54322). Existing `supabase:start`/`stop`/`reset` scripts in root `package.json` proven by Phase 29 E2E tests. Dev script rewrite pattern documented below. |
| ENVR-02 | Strapi adapter code removed (`frontend/src/lib/api/adapters/strapi/`) | 23 files in adapter directory, plus `case 'strapi':` in 3 switch files (`dataProvider.ts`, `dataWriter.ts`, `feedbackWriter.ts`), plus `StrapiDataAdapter` type in `staticSettings.type.ts`. All references catalogued below. |
| ENVR-03 | `backend/vaa-strapi/` directory removed | 18K+ files. Workspace entry on lines 69-70 of root `package.json`. Referenced by `frontend/Dockerfile` line 17, `docker-compose.dev.yml`, `dependabot.yml`, lint scripts, `render.example.yaml`, `sync:translations` script. |
| ENVR-04 | Docker services for Strapi removed from compose files | Root `docker-compose.dev.yml` has 4 services (frontend, strapi, postgres, awslocal). `backend/vaa-strapi/docker-compose.dev.yml` defines 4 services (awslocal, strapi, postgres, adminer). Root compose extends from backend compose. Decision: rewrite root as production-build test tool, delete backend compose. |
| ENVR-05 | Strapi-specific packages removed if unused elsewhere | `jose` used in `frontend/src/lib/api/utils/auth/getIdTokenClaims.ts` (identity provider auth) -- KEEP. `qs` used in 7 files outside Strapi adapter (universalAdapter, route utils, admin API routes) -- KEEP. No Strapi-only packages to remove. Requirement satisfied by analysis. |
</phase_requirements>

## Standard Stack

This phase does not introduce new libraries. It removes dependencies and reconfigures existing tooling.

### Core Tools
| Tool | Version | Purpose | Status |
|------|---------|---------|--------|
| Supabase CLI | 2.78.1 | Local dev backend (replaces Docker compose) | Already installed as devDep in `apps/supabase/package.json` |
| supabase/setup-cli | v1 | CI GitHub Action for pgTAP tests | New -- add to CI workflow |
| Yarn 4.6 | 4.6.0 | Workspace management | Existing -- workspace entries need update |
| Vite/SvelteKit | 5.x/2.x | Frontend dev server | Existing -- no changes |

### Packages to Remove (from workspace)
| Package | Location | Reason |
|---------|----------|--------|
| `@openvaa/strapi` | `backend/vaa-strapi/` workspace | Entire Strapi backend removed |
| All Strapi plugins | `backend/vaa-strapi/src/plugins/*` workspace | Removed with backend directory |

### Packages to KEEP (confirmed used outside Strapi)
| Package | Location | Used In |
|---------|----------|---------|
| `jose` | `frontend/package.json` | `frontend/src/lib/api/utils/auth/getIdTokenClaims.ts` (Signicat OIDC) |
| `qs` | `frontend/package.json` | `universalAdapter.ts`, `parseParams.ts`, `buildRoute.ts`, admin API routes (7 files) |

## Architecture Patterns

### New Dev Workflow

```
Developer machine
  |
  +-- supabase start (runs PostgreSQL, PostgREST, GoTrue, Storage, Inbucket in Docker)
  |     Port 54321: API
  |     Port 54322: Database
  |     Port 54323: Inbucket (email testing)
  |     Port 54324: Studio
  |
  +-- yarn workspace @openvaa/frontend dev (SvelteKit on port 5173)
        Uses PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
        Uses PUBLIC_SUPABASE_ANON_KEY=<local dev key from supabase start>
```

### Dev Script Mapping (recommendation)

| Script | Command | Purpose |
|--------|---------|---------|
| `yarn dev` | `yarn supabase:start && yarn workspace @openvaa/frontend dev` | Full dev environment |
| `yarn dev:stop` | `yarn supabase:stop` | Stop Supabase containers |
| `yarn dev:reset` | `yarn supabase:reset` | Reset DB + re-seed |
| `yarn dev:status` | `yarn supabase:status` | Show running services |
| `yarn dev:down` | `yarn supabase:stop --no-backup` | Full cleanup (no backup prompt) |

Note: `supabase:start`, `supabase:stop`, `supabase:reset`, `supabase:status` scripts already exist in root `package.json`. The `yarn dev` script just needs rewiring.

### Removal Execution Order (recommended)

**Wave 1: Code removal (adapter + backend)**
1. Remove `case 'strapi':` from `dataProvider.ts`, `dataWriter.ts`, `feedbackWriter.ts`
2. Remove `StrapiDataAdapter` type from `staticSettings.type.ts` and its union usage
3. Delete `frontend/src/lib/api/adapters/strapi/` directory (23 files)
4. Delete `frontend/tests/strapiDataProvider/` directory (test + data)
5. Delete `tests/tests/utils/strapiAdminClient.ts`
6. Delete `tests/tests/global-setup.ts` (dead code -- no longer referenced in playwright.config.ts)
7. Remove `backend/vaa-strapi` and `backend/vaa-strapi/src/plugins/*` from root `package.json` workspaces
8. Delete `backend/vaa-strapi/` directory

**Wave 2: Docker, env, Dockerfile**
1. Rewrite root `docker-compose.dev.yml` as production-build test tool
2. Strip `.env.example` (and `.env` if present) of Strapi/LocalStack vars
3. Update `frontend/Dockerfile` -- remove `COPY backend backend` line
4. Rewrite dev scripts in root `package.json`
5. Remove `sync:translations` script (Strapi-specific)
6. Update lint scripts to remove `backend/vaa-strapi/src backend/vaa-strapi/tests` paths
7. Update `test:unit` script to remove `yarn workspace @openvaa/strapi test:unit`

**Wave 3: CI + Deployment**
1. Remove `backend-validation` job from `.github/workflows/main.yaml`
2. Update `e2e-tests` and `e2e-visual-perf` jobs (they use `yarn dev:start` which will change)
3. Add pgTAP CI job with path filtering
4. Update `.github/dependabot.yml` -- remove `backend/vaa-strapi` entry
5. Update `render.example.yaml` -- remove backend service and Strapi env vars

**Wave 4: Documentation + cleanup**
1. Update `CLAUDE.md` -- remove all Strapi references
2. Delete/stub Strapi docs pages in `docs/src/routes/(content)/developers-guide/backend/`
3. Update `docs/src/lib/navigation.config.ts` -- remove Strapi navigation entries
4. Update other docs pages with Strapi references (deployment, dev environment, troubleshooting, etc.)
5. Clean up route.ts comments referencing Strapi config paths
6. Run `yarn install` to regenerate `yarn.lock` without Strapi dependencies

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Local Postgres + PostgREST | Custom docker-compose | `supabase start` | Already manages 7+ services (DB, API, Auth, Storage, Inbucket, Studio, Edge Functions) with one command |
| Dev data seeding | Custom seed scripts | `supabase db reset` (runs `seed.sql` automatically) | Built-in, already configured |
| pgTAP CI runner | Custom test runner | `supabase/setup-cli@v1` + `supabase test db` | Official GitHub Action, handles Docker setup |

## Common Pitfalls

### Pitfall 1: Missing Strapi References in Obscure Files
**What goes wrong:** After removing Strapi, stale references cause build failures or confusing dead code
**Why it happens:** Strapi references exist in 243+ files, many outside obvious locations
**How to avoid:** The comprehensive reference list below covers ALL non-obvious locations. After removal, run `grep -r "strapi\|STRAPI\|vaa-strapi" --include='*.{ts,js,json,yaml,yml,md,toml}' . | grep -v node_modules | grep -v .planning | grep -v .git` to catch stragglers
**Warning signs:** TypeScript compilation errors mentioning missing modules, `yarn install` workspace resolution failures

### Pitfall 2: Frontend Dockerfile Still Copies Backend Directory
**What goes wrong:** `frontend/Dockerfile` line 17 (`COPY backend backend`) fails because `backend/` directory is gone
**Why it happens:** Dockerfile was designed for monorepo that includes Strapi
**How to avoid:** Remove `COPY backend backend` from `frontend/Dockerfile`. The Dockerfile only needs `packages` and `frontend` directories for the build

### Pitfall 3: yarn.lock Workspace Resolution After Removing Workspaces
**What goes wrong:** `yarn install --frozen-lockfile` fails in CI because lockfile references removed workspaces
**Why it happens:** The lockfile contains entries for `backend/vaa-strapi` and its plugins
**How to avoid:** After removing workspace entries from `package.json`, run `yarn install` locally to regenerate `yarn.lock`, then commit the updated lockfile. The lockfile will shrink significantly.

### Pitfall 4: E2E Tests Still Use Docker Compose-Based Start
**What goes wrong:** CI `e2e-tests` job uses `yarn dev:start` which currently runs `docker compose up`
**Why it happens:** E2E CI job hasn't been updated to use Supabase CLI
**How to avoid:** The `e2e-tests` job needs to: (1) install Supabase CLI via `supabase/setup-cli@v1`, (2) run `supabase start` in the `apps/supabase` directory, (3) start the frontend separately. The E2E tests already work against `supabase start` (proven in Phase 29).

### Pitfall 5: Dead global-setup.ts Import from Removed Directory
**What goes wrong:** `tests/tests/global-setup.ts` imports from `../../backend/vaa-strapi/src/functions/mockData/mockUsers.json`
**Why it happens:** Legacy file, no longer referenced in `playwright.config.ts` but still exists
**How to avoid:** Delete `global-setup.ts` -- it's dead code replaced by the project dependency pattern

### Pitfall 6: docker-compose.dev.yml Extends from Backend Compose
**What goes wrong:** Root `docker-compose.dev.yml` extends services from `./backend/vaa-strapi/docker-compose.dev.yml`
**Why it happens:** The root compose delegates service definitions to the backend compose
**How to avoid:** The root compose must be completely rewritten, not just have services removed. All `extends: file: ./backend/vaa-strapi/docker-compose.dev.yml` references will break when the backend directory is deleted.

### Pitfall 7: render.example.yaml References Backend Service
**What goes wrong:** `render.example.yaml` defines a backend service using `./backend/vaa-strapi/Dockerfile` and a separate Postgres database
**Why it happens:** Production deployment blueprint hasn't been updated for Supabase
**How to avoid:** Remove the backend service and database sections. Add a note pointing to Supabase cloud for production deployments. Full production guide rewrite is deferred.

## Code Examples

### Adapter Switch Cleanup Pattern

Current `dataProvider.ts` with Strapi case to remove:
```typescript
// BEFORE: Remove the 'strapi' case
switch (type) {
  case 'strapi':
    module = import('./adapters/strapi/dataProvider');  // DELETE
    break;                                               // DELETE
  case 'local':
    module = import('./adapters/apiRoute/dataProvider');
    break;
  case 'supabase':
    module = import('./adapters/supabase/dataProvider');
    break;
  default:
    throw new Error(`Unsupported data provider: ${type}`);
}
```

### staticSettings.type.ts Cleanup

```typescript
// REMOVE this entire type:
export type StrapiDataAdapter = {
  readonly type: 'strapi';
  readonly supportsCandidateApp: true;
  readonly supportsAdminApp: true;
};

// KEEP these types:
export type LocalDataAdapter = { ... };
export type SupabaseDataAdapter = { ... };

// UPDATE the DataAdapter union type to remove StrapiDataAdapter
```

### New docker-compose.dev.yml (production-build test)

Recommendation: frontend-only compose for Dockerfile validation. Developers run `supabase start` separately.

```yaml
# Production build test compose
# Purpose: verify the frontend production Dockerfile builds and runs correctly
# Usage: docker compose -f docker-compose.dev.yml up --build
# Prerequisites: supabase start (for backend services)
services:
  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
      target: production
    ports:
      - "3000:3000"
    environment:
      PUBLIC_SUPABASE_URL: ${PUBLIC_SUPABASE_URL:-http://host.docker.internal:54321}
      PUBLIC_SUPABASE_ANON_KEY: ${PUBLIC_SUPABASE_ANON_KEY}
      PUBLIC_BROWSER_FRONTEND_URL: ${PUBLIC_BROWSER_FRONTEND_URL:-http://localhost:3000}
      PUBLIC_SERVER_FRONTEND_URL: ${PUBLIC_SERVER_FRONTEND_URL:-http://localhost:3000}
```

### pgTAP CI Job

```yaml
supabase-tests:
  runs-on: ubuntu-latest
  # Only run when Supabase-related files change
  if: |
    github.event_name == 'push' ||
    contains(github.event.pull_request.changed_files, 'apps/supabase/') ||
    contains(github.event.pull_request.changed_files, 'packages/supabase-types/')
  steps:
    - uses: actions/checkout@v4

    - uses: supabase/setup-cli@v1
      with:
        version: latest

    - name: Start Supabase
      working-directory: apps/supabase
      run: supabase start

    - name: Run pgTAP tests
      working-directory: apps/supabase
      run: supabase test db
```

Note: GitHub Actions `contains()` on `changed_files` requires a `paths` filter instead. Use the workflow-level `paths` filter or a `dorny/paths-filter` action for path-based triggering.

Better approach using workflow `paths` filter at job level or as a separate workflow:
```yaml
# Either use paths filter on the workflow trigger or use dorny/paths-filter
# For a job within the existing workflow, use dorny/paths-filter:
supabase-tests:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4

    - uses: dorny/paths-filter@v3
      id: changes
      with:
        filters: |
          supabase:
            - 'apps/supabase/**'
            - 'packages/supabase-types/**'

    - uses: supabase/setup-cli@v1
      if: steps.changes.outputs.supabase == 'true'
      with:
        version: latest

    - name: Start Supabase
      if: steps.changes.outputs.supabase == 'true'
      working-directory: apps/supabase
      run: supabase start

    - name: Run pgTAP tests
      if: steps.changes.outputs.supabase == 'true'
      working-directory: apps/supabase
      run: supabase test db
```

### Updated .env.example Structure

```bash
################################################################
# Supabase configuration (local dev defaults from `supabase start`)
################################################################

PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

################################################################
# Frontend configuration
################################################################

PUBLIC_BROWSER_FRONTEND_URL=http://localhost:5173
PUBLIC_SERVER_FRONTEND_URL=http://localhost:5173

FRONTEND_PORT=5173

################################################################
# Cache settings
################################################################

PUBLIC_CACHE_ENABLED=false
CACHE_DIR=/var/data/cache
CACHE_TTL=86400000
CACHE_LRU_SIZE=1000
CACHE_EXPIRATION_INTERVAL=3600000

################################################################
# Local data adapter (optional)
################################################################

LOCAL_DATA_DIR=/var/data/local

################################################################
# Pre-registration (Signicat)
################################################################

PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT=...
IDENTITY_PROVIDER_TOKEN_ENDPOINT=...
IDENTITY_PROVIDER_JWKS_URI=...
IDENTITY_PROVIDER_ISSUER=...
PUBLIC_IDENTITY_PROVIDER_CLIENT_ID=client_id
IDENTITY_PROVIDER_CLIENT_SECRET=client_secret
IDENTITY_PROVIDER_DECRYPTION_JWKS='[...]'

################################################################
# LLM settings (Admin App)
################################################################

LLM_OPENAI_API_KEY=""

################################################################
# Debugging
################################################################

PUBLIC_DEBUG=false
```

Variables removed: All `STRAPI_*`, `DATABASE_*`, `APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `JWT_SECRET`, all `AWS_*` (LocalStack), `MAIL_*`, `GENERATE_MOCK_DATA_*`, `DEV_ADMIN_*`, `DEV_CANDIDATE_*`, `LOCALSTACK_*`, `STATIC_*`, `BACKEND_API_TOKEN`, `PUBLIC_BROWSER_BACKEND_URL`, `PUBLIC_SERVER_BACKEND_URL`.

### E2E CI Job Updates

The `e2e-tests` and `e2e-visual-perf` jobs currently use `yarn dev:start` (Docker compose). They need to be updated to:

1. Install Supabase CLI
2. Start Supabase services
3. Build shared packages
4. Start SvelteKit in background
5. Wait for frontend to be ready
6. Run tests

```yaml
e2e-tests:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4

    - uses: supabase/setup-cli@v1
      with:
        version: latest

    - name: Setup Yarn 4.6
      uses: threeal/setup-yarn-action@v2
      with:
        version: 4.6

    - name: Setup Node.js 20.18.1
      uses: actions/setup-node@v4
      with:
        node-version: 20.18.1
        cache: "yarn"

    - name: Configure environment
      run: cp .env.example .env

    - name: Install dependencies
      run: yarn install --frozen-lockfile

    - name: Install Playwright
      run: yarn playwright install --with-deps

    - name: Start Supabase
      working-directory: apps/supabase
      run: supabase start

    - name: Build shared packages
      run: yarn build:shared

    - name: Start frontend
      run: yarn workspace @openvaa/frontend dev --host &
      env:
        PUBLIC_SUPABASE_URL: http://127.0.0.1:54321
        PUBLIC_SUPABASE_ANON_KEY: ${{ env.SUPABASE_ANON_KEY }}

    - name: Wait for frontend
      run: |
        for i in $(seq 1 30); do
          curl -s http://localhost:5173 > /dev/null && break
          sleep 2
        done

    - name: Run E2E tests
      run: yarn test:e2e
```

## Complete Strapi Reference Map

### Files to DELETE

| File/Directory | Reason |
|----------------|--------|
| `backend/vaa-strapi/` | Entire Strapi backend (18K+ files) |
| `frontend/src/lib/api/adapters/strapi/` | Strapi adapter (23 files) |
| `frontend/tests/strapiDataProvider/` | Strapi-specific test + data |
| `tests/tests/utils/strapiAdminClient.ts` | Replaced by `supabaseAdminClient.ts` |
| `tests/tests/global-setup.ts` | Dead code (imports from deleted backend directory) |
| `backend/vaa-strapi/docker-compose.dev.yml` | Deleted with backend directory |

### Files to MODIFY

| File | Change |
|------|--------|
| `package.json` (root) | Remove workspace entries for `backend/vaa-strapi` and its plugins; rewrite dev/lint/test scripts |
| `frontend/src/lib/api/dataProvider.ts` | Remove `case 'strapi':` |
| `frontend/src/lib/api/dataWriter.ts` | Remove `case 'strapi':` |
| `frontend/src/lib/api/feedbackWriter.ts` | Remove `case 'strapi':` |
| `packages/app-shared/src/settings/staticSettings.type.ts` | Remove `StrapiDataAdapter` type, update union |
| `docker-compose.dev.yml` (root) | Rewrite as production-build test tool |
| `.env.example` | Strip Strapi/LocalStack vars (~70 lines removed) |
| `.env` (if exists) | Same cleanup as .env.example |
| `frontend/Dockerfile` | Remove `COPY backend backend` |
| `.github/workflows/main.yaml` | Remove `backend-validation` job, update `e2e-tests` and `e2e-visual-perf`, add `supabase-tests` |
| `.github/dependabot.yml` | Remove `backend/vaa-strapi` entry |
| `render.example.yaml` | Remove backend service, update for Supabase |
| `CLAUDE.md` | Remove all Strapi references (~8 locations) |
| `docs/src/lib/navigation.config.ts` | Remove Strapi navigation entries |
| `frontend/src/lib/utils/route/route.ts` | Remove Strapi-referencing comments (2 lines) |

### Docs Pages to Delete/Stub

All in `docs/src/routes/(content)/developers-guide/`:

| Page | Action |
|------|--------|
| `backend/intro/+page.md` | Stub: "Backend migrated to Supabase. See apps/supabase/" |
| `backend/authentication/+page.md` | Stub: GoTrue auth reference |
| `backend/customized-behaviour/+page.md` | Stub: "See RLS policies in apps/supabase/supabase/schema/" |
| `backend/default-data-loading/+page.md` | Stub: "See seed.sql and bulk_import RPC" |
| `backend/mock-data-generation/+page.md` | Stub: "Use supabase db reset to seed dev data" |
| `backend/openvaa-admin-tools-plugin-for-strapi/+page.md` | Stub: "Admin tools replaced by Edge Functions and RPCs" |
| `backend/plugins/+page.md` | Stub: "Strapi plugins replaced by Supabase Edge Functions" |
| `backend/preparing-backend-dependencies/+page.md` | Stub: "Run supabase start instead" |
| `backend/re-generating-types/+page.md` | Stub: "Use yarn supabase:types" |
| `backend/running-the-backend-separately/+page.md` | Stub: "Use supabase start" |
| `backend/security/+page.md` | Stub: "See RLS policies in apps/supabase/supabase/schema/" |
| `development/running-the-development-environment/+page.md` | Rewrite for Supabase workflow |
| `deployment/+page.md` | Update: remove Strapi deployment steps |
| `troubleshooting/+page.md` | Update: remove Docker/Strapi troubleshooting |
| `localization/localization-in-strapi/` | Stub: "JSONB localization, see database skill" |
| `candidate-user-management/registration-process-in-strapi/` | Stub: "GoTrue + invite-candidate Edge Function" |
| `frontend/data-api/+page.md` | Update: remove Strapi adapter references |
| `frontend/accessing-data-and-state-management/+page.md` | Update: remove Strapi mentions |
| `configuration/app-customization/+page.md` | Update: remove Strapi mentions |
| `configuration/app-settings/+page.md` | Update: remove Strapi mentions |
| `app-and-repo-structure/+page.md` | Update: remove backend/vaa-strapi from structure |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Docker compose with 4 services | `supabase start` + SvelteKit dev | Phase 30 (now) | Single command replaces multi-container orchestration |
| Strapi + PostgreSQL + LocalStack | Supabase CLI (includes DB, Auth, Storage, Inbucket) | v3.0 migration (Phases 22-30) | Unified backend, fewer moving parts |
| Strapi Admin Tools API for test data | Supabase Admin Client (service_role) | Phase 29 | Stateless, no login/dispose lifecycle |

## Open Questions

1. **E2E CI startup sequence**
   - What we know: `supabase start` works locally, E2E tests pass against it (Phase 29)
   - What's unclear: Exact CI startup timing -- `supabase start` may need more time in CI, and the frontend needs to wait for both Supabase and the SvelteKit build
   - Recommendation: Use a wait loop with health check against `http://127.0.0.1:54321/rest/v1/` for Supabase and `http://localhost:5173` for frontend

2. **Docker compose scope for production-build testing**
   - What we know: Decision is to rewrite `docker-compose.dev.yml` as a production-build test tool
   - What's unclear: Whether to include Supabase containers or require `supabase start` separately
   - Recommendation: Frontend-only compose is simpler and avoids duplicating Supabase config. Developers run `supabase start` separately. This keeps the compose file minimal.

3. **render.example.yaml backend replacement**
   - What we know: The current file has a full Strapi backend service
   - What's unclear: What the Supabase production equivalent looks like (Supabase cloud? Self-hosted?)
   - Recommendation: Remove backend service, add comment pointing to Supabase cloud. Full production guide is deferred.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright 1.58.2 (E2E) + Vitest 2.1.8 (unit) |
| Config file | `tests/playwright.config.ts` (E2E), `vitest.config.ts` (unit) |
| Quick run command | `yarn test:unit` |
| Full suite command | `yarn test:unit && yarn test:e2e` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ENVR-01 | Local dev starts with supabase start + vite dev | manual | Manual verification: `yarn dev` works | N/A |
| ENVR-02 | Strapi adapter directory gone | smoke | `test ! -d frontend/src/lib/api/adapters/strapi && echo PASS` | N/A (file existence check) |
| ENVR-03 | backend/vaa-strapi/ gone | smoke | `test ! -d backend/vaa-strapi && echo PASS` | N/A (file existence check) |
| ENVR-04 | No Strapi in compose files | smoke | `! grep -q strapi docker-compose.dev.yml && echo PASS` | N/A (content check) |
| ENVR-05 | Strapi packages removed if unused | unit | `yarn workspace @openvaa/frontend build` (confirms no missing imports) | Existing frontend build |

### Sampling Rate
- **Per task commit:** `yarn test:unit` + `yarn workspace @openvaa/frontend build`
- **Per wave merge:** Full build verification: `yarn install && yarn build:shared && yarn workspace @openvaa/frontend build`
- **Phase gate:** Full build + `grep -r "strapi\|STRAPI\|vaa-strapi" --include='*.{ts,js,json,yaml,yml}' . | grep -v node_modules | grep -v .planning | grep -v .git` returns empty

### Wave 0 Gaps
None -- this phase is a removal phase, not a feature phase. Existing test infrastructure (Playwright + Vitest) is sufficient. The key validation is successful builds and absence of Strapi references.

## Sources

### Primary (HIGH confidence)
- Codebase inspection: root `package.json`, `docker-compose.dev.yml`, `.github/workflows/main.yaml`, `frontend/Dockerfile`, `.env.example`, all adapter switch files, `staticSettings.type.ts`
- Codebase grep: 243+ files with Strapi references catalogued
- `apps/supabase/supabase/config.toml`: Supabase CLI configuration verified
- `apps/supabase/package.json`: supabase CLI v2.78.1 verified

### Secondary (MEDIUM confidence)
- [Supabase setup-cli GitHub Action](https://github.com/supabase/setup-cli) -- verified v1 with version parameter
- [Supabase CLI testing docs](https://supabase.com/docs/guides/local-development/cli/testing-and-linting) -- pgTAP test command reference
- [dorny/paths-filter](https://github.com/dorny/paths-filter) -- path-based CI job filtering (well-established action)

### Tertiary (LOW confidence)
- E2E CI startup sequence timing -- needs real-world testing in CI

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new libraries, just removal and reconfiguration of existing tooling
- Architecture: HIGH - dev workflow proven by Phase 29 E2E tests
- Pitfalls: HIGH - comprehensive codebase grep identified all Strapi references
- CI changes: MEDIUM - pgTAP CI job pattern verified from official docs but E2E startup sequence needs CI testing

**Research date:** 2026-03-20
**Valid until:** 2026-04-20 (stable -- removal patterns don't change)
