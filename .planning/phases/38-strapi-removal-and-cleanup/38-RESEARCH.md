# Phase 38: Strapi Removal and Cleanup - Research

**Researched:** 2026-03-22
**Status:** Complete

## Executive Summary

Phase 38 removes all Strapi infrastructure from the codebase. The parallel branch (feat-gsd-supabase-migration) already completed an equivalent cleanup and serves as the authoritative reference. This research catalogs every Strapi artifact that must be removed, modified, or rewritten.

## 1. Strapi Workspace Artifacts (CLEN-01)

### apps/strapi/ directory
Full directory with 280+ files including:
- Strapi v5 app (`src/`, `config/`, `types/`, `tests/`)
- Custom plugins: `src/plugins/openvaa-admin-tools/`
- Docker files: `docker-compose.dev.yml`, `Dockerfile`
- Package: `@openvaa/strapi` workspace

### Root package.json workspace entries
```json
"workspaces": [
  "packages/*",
  "apps/*",
  "apps/strapi/src/plugins/*"  // <-- REMOVE this line
]
```

### Root package.json scripts
```json
"sync:translations": "rsync ... apps/strapi/..."  // REMOVE
```

### turbo.json
No Strapi-specific entries found. Generic task definitions only.

### .github/dependabot.yml
```yaml
directory: "/apps/strapi"  // REMOVE this entry
```

## 2. Frontend Strapi Adapter Code (CLEN-02)

### Strapi adapter directory
`apps/frontend/src/lib/api/adapters/strapi/` — entire directory to delete:
- `strapiAdapter.ts`, `strapiAdapter.type.ts`, `strapiApi.ts`, `strapiData.type.ts`
- `dataProvider/strapiDataProvider.ts`, `dataProvider/index.ts`
- `dataWriter/strapiDataWriter.ts`, `dataWriter/index.ts`
- `feedbackWriter/strapiFeedbackWriter.ts`, `feedbackWriter/index.ts`
- `utils/` — 10 parse/build utility files

### Strapi adapter test file
`apps/frontend/tests/strapiDataProvider/` — entire directory to delete:
- `strapiDataProvider.test.ts`
- `data/` subdirectory

### Adapter switch files (remove Strapi cases)
Three files contain switch statements with `case 'strapi':`:
1. `apps/frontend/src/lib/api/dataProvider.ts`
2. `apps/frontend/src/lib/api/dataWriter.ts`
3. `apps/frontend/src/lib/api/feedbackWriter.ts`

**Target state:** Remove switch entirely. Direct Supabase import only (matching parallel branch pattern).

### AUTH_TOKEN_KEY and authToken.ts
- `apps/frontend/src/lib/auth/authToken.ts` — exports `AUTH_TOKEN_KEY = 'token'`
- `apps/frontend/src/lib/auth/index.ts` — re-exports from `authToken`

Files importing AUTH_TOKEN_KEY:
1. `apps/frontend/src/routes/api/auth/logout/+server.ts` — uses AUTH_TOKEN_KEY to delete cookie
2. `apps/frontend/src/routes/admin/(protected)/question-info/+page.server.ts` — uses to get auth token from cookie
3. `apps/frontend/src/routes/admin/(protected)/argument-condensation/+page.server.ts` — uses to get auth token from cookie
4. `apps/frontend/src/routes/admin/+layout.server.ts` — reads token from cookie, returns in page data

### token in App.PageData
`apps/frontend/src/app.d.ts` line 33-34:
```typescript
/** The jwt auth token */
token?: string;
```

### hooks.server.ts
Already rewritten for Supabase — no Strapi JWT references remain. **No changes needed.**

### admin protected layout
`apps/frontend/src/routes/admin/(protected)/+layout.ts` line 44:
```typescript
const authToken = (await parent()).token;
```
Uses `token` from page data. Needs to be updated to use Supabase session instead.

## 3. staticSettings data adapter type

`packages/app-shared/src/settings/staticSettings.type.ts`:
- `StrapiDataAdapter` type definition (lines 133-134)
- Union type includes `StrapiDataAdapter` (line 34)

Must remove `StrapiDataAdapter` type and its union inclusion.

## 4. Dev Environment (CLEN-03)

### Current root scripts (package.json)
```json
"dev": "yarn dev:start && yarn watch:shared",
"dev:start": "turbo run build --filter='./packages/*' && docker compose ... up ...",
"dev:attach": "docker compose ... up ...",
"dev:down": "docker compose ... down ...",
"dev:stop": "docker compose ... stop",
"dev:restart-frontend": "docker restart ...",
"docker:delete-all": "docker rm ...",
"prod": "docker compose ...",
```

### Parallel branch scripts (target state)
```json
"dev": "yarn supabase:start && yarn workspace @openvaa/frontend dev",
"dev:start": "yarn build:shared && yarn supabase:start && yarn workspace @openvaa/frontend dev",
"dev:down": "yarn supabase:stop",
"dev:stop": "yarn supabase:stop",
"dev:reset": "yarn supabase:reset",
"dev:status": "yarn supabase:status",
"supabase:start": "yarn workspace @openvaa/supabase start",
"supabase:stop": "yarn workspace @openvaa/supabase stop",
"supabase:reset": "yarn workspace @openvaa/supabase reset",
"supabase:status": "yarn workspace @openvaa/supabase status",
"supabase:types": "yarn workspace @openvaa/supabase-types generate",
"supabase:lint": "yarn workspace @openvaa/supabase lint:all",
```

### build scripts differences
Parallel branch uses direct `yarn workspaces foreach` instead of turbo for some build tasks:
```json
"build:app-shared": "yarn workspaces foreach -Rt --from '@openvaa/app-shared' run build && true",
"build:shared": "yarn workspaces foreach -At --include 'packages/*' run build && true",
```

## 5. Docker Compose (CLEN-04)

### Current state
`docker-compose.dev.yml` defines 4 services: frontend, strapi, postgres, awslocal
Plus 4 volumes: postgres, strapi-uploads, awslocal, cache

### Target state (from parallel branch)
Single-service production build verifier:
```yaml
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
      ...
```

### apps/strapi/docker-compose.dev.yml
Currently referenced by root docker-compose.dev.yml — will be deleted with apps/strapi/

## 6. Environment Variables (CLEN-05)

### Current .env.example sections to REMOVE:
- Backend: Strapi configuration (STRAPI_HOST, STRAPI_PORT, APP_KEYS, etc.)
- Backend: AWS LocalStack
- Backend: AWS SES email
- Backend: AWS S3 storage
- Backend: Mock data generation
- Backend/Tests: Dev user credentials
- Frontend: PUBLIC_BROWSER_BACKEND_URL, PUBLIC_SERVER_BACKEND_URL

### Target .env.example (from parallel branch):
- Supabase configuration (PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY)
- Frontend configuration (frontend URLs, port)
- Cache settings (unchanged)
- Local data adapter (unchanged)
- Pre-registration / Signicat (unchanged)
- LLM settings (unchanged)
- Debugging (unchanged)

## 7. Thorough Cleanup Scope

### Code files with Strapi references to clean:
1. `apps/frontend/src/lib/api/base/dataWriter.type.ts` — comment about Strapi fields (line 389)
2. `apps/frontend/src/lib/utils/route/route.ts` — 2 comments referencing Strapi config paths
3. `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` — 3 comments mentioning Strapi
4. `apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts` — 1 comment comparing to Strapi
5. `apps/frontend/src/lib/api/README.md` — likely documents Strapi adapter
6. `apps/frontend/src/lib/contexts/auth/authContext.type.ts` — may have Strapi references
7. `tests/tests/utils/supabaseAdminClient.ts` — may reference Strapi

### Documentation files (apps/docs/):
20+ page.md files in `apps/docs/src/routes/(content)/developers-guide/` that reference Strapi as active backend. Many of these are entire pages about Strapi (e.g., `localization-in-strapi/`, `registration-process-in-strapi/`, `openvaa-admin-tools-plugin-for-strapi/`).

### Config files:
1. `render.example.yaml` — Backend service section uses Strapi Dockerfile
2. `.github/workflows/main.yaml` — `backend-validation` job builds Strapi
3. `.github/dependabot.yml` — `/apps/strapi` directory entry

### CLAUDE.md
Major rewrite needed. Current sections that reference Strapi:
- Architecture > Applications section
- Backend section
- Docker Development section
- Common Workflows section
- Frontend Data Flow section
- Settings Architecture section
- Deployment section
- Troubleshooting section

## 8. Package Dependencies

### jose and qs
**Keep both.** Verified used outside Strapi adapter:
- `jose` — used in identity provider JWT verification
- `qs` — used in route/URL utilities

## 9. Parallel Branch Reference

The parallel branch (feat-gsd-supabase-migration) deleted 285 files in the equivalent cleanup. Key differences from our branch:
- Parallel branch uses `frontend/` path (not `apps/frontend/`)
- Parallel branch workspaces: `["packages/*", "frontend", "docs", "apps/*"]`
- Our branch uses `apps/frontend/`, `apps/docs/`, etc.

Docker Compose location: parallel branch has it at root but with `dockerfile: frontend/Dockerfile` path.

## Validation Architecture

### Dimension Coverage
1. **Deletion verification:** `ls apps/strapi/ 2>/dev/null` should fail (directory gone)
2. **Reference scan:** `grep -ri 'strapi' --include='*.ts' --include='*.js' --include='*.json' --include='*.yml' --include='*.yaml' --include='*.env*' . | grep -v '.planning/' | grep -v 'node_modules/' | grep -v '.git/'` should return zero matches (excluding docs historical mentions)
3. **Adapter integrity:** `yarn test:unit` should pass (Supabase adapter only)
4. **Type safety:** `yarn build` should succeed with no Strapi types
5. **Dev workflow:** `supabase start && yarn dev` scripts present in package.json

---

## RESEARCH COMPLETE

*Phase: 38-strapi-removal-and-cleanup*
*Researched: 2026-03-22*
