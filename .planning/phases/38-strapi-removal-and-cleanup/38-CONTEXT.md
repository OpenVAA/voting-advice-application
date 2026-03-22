# Phase 38: Strapi Removal and Cleanup - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Remove Strapi entirely from the codebase and rewire the development environment to supabase CLI. Thorough cleanup everywhere — code, config, docs, comments. Nothing Strapi-related survives unless it's a historical mention.

</domain>

<decisions>
## Implementation Decisions

### Strapi workspace removal (CLEN-01)
- **D-01:** Delete `apps/strapi/` directory entirely
- **D-02:** Remove workspace entry from root `package.json` (Strapi plugins glob)
- **D-03:** Remove any Strapi-specific tasks from `turbo.json` if present
- **D-04:** Remove `@openvaa/strapi` and Strapi plugin workspace entries

### Frontend Strapi code removal (CLEN-02)
- **D-05:** Delete Strapi adapter directory (`apps/frontend/src/lib/api/adapters/strapi/` or equivalent)
- **D-06:** Remove `AUTH_TOKEN_KEY` and `authToken.ts` from `apps/frontend/src/lib/auth/`
- **D-07:** Remove Strapi auth token references from hooks.server.ts (`candidateAuthHandle` JWT cookie check)
- **D-08:** Remove `token?: string` from `App.PageData` in `app.d.ts`
- **D-09:** Remove adapter switch mechanism — Supabase is the only adapter
- **D-10:** Clean up any Strapi-related imports, constants, or utilities across the frontend

### Dev environment (CLEN-03)
- **D-11:** `supabase start` + `yarn dev` (vite) replaces Docker Compose for development
- **D-12:** Remove or update any `yarn dev` scripts that reference Docker Strapi/Postgres

### Docker Compose (CLEN-04)
- **D-13:** Rewrite Docker Compose to single-service frontend production build verifier (matching parallel branch)
- **D-14:** Remove Strapi, standalone Postgres, and LocalStack/awslocal services
- **D-15:** Prerequisites: `supabase start` must be running for backend services

### Environment variables (CLEN-05)
- **D-16:** Update `.env.example` with all required Supabase variables (URL, anon key, service role key, etc.)
- **D-17:** Remove Strapi-specific env vars (STRAPI_*, backend URLs, admin credentials, SES config)

### Thorough cleanup scope
- **D-18:** Grep entire codebase for remaining Strapi references — code, comments, docs, configs
- **D-19:** Clean up documentation files that reference Strapi as active backend
- **D-20:** Update CLAUDE.md Strapi sections (rewrite for Supabase workflow, not just delete)
- **D-21:** Only historical mentions allowed (e.g., "migrated from Strapi" in retrospectives)
- **D-22:** Clean up any remaining dual-path code (adapter switches, if-strapi branches)

### Claude's Discretion
- Order of removal (workspace first, then frontend code, then config, then docs)
- Whether to keep jose/qs packages (verified used outside Strapi adapter in parallel branch)
- Exact .env.example variable list

</decisions>

<specifics>
## Specific Ideas

- Thorough means thorough — grep for "strapi", "Strapi", "STRAPI", "strapi-" across the entire repo
- CLAUDE.md needs a rewrite not just deletion — it's the primary dev guide
- Docker Compose becomes a simple production build test tool, not the dev environment
- jose and qs were verified used outside Strapi adapter on parallel branch — keep them

</specifics>

<canonical_refs>
## Canonical References

### Parallel branch (post-Strapi removal)
- `git show feat-gsd-supabase-migration:docker-compose.dev.yml` — Single-service frontend build verifier
- `git show feat-gsd-supabase-migration:.env.example` — Supabase-only env vars (if exists)
- `git show feat-gsd-supabase-migration:package.json` — Workspace entries without Strapi

### Current branch targets
- `apps/strapi/` — Entire Strapi workspace to delete
- `apps/frontend/src/lib/api/adapters/` — Strapi adapter to delete
- `apps/frontend/src/lib/auth/authToken.ts` — AUTH_TOKEN_KEY to delete
- `apps/frontend/src/hooks.server.ts` — candidateAuthHandle JWT check to remove
- `apps/frontend/src/app.d.ts` — token in PageData to remove
- `docker-compose*.yml` — Rewrite for Supabase-only
- `.env.example` — Rewrite for Supabase env vars
- `CLAUDE.md` — Rewrite Backend, Docker, and related sections

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Parallel branch already did this removal — use as reference for what to delete and what to keep
- 285 files deleted on parallel branch during equivalent cleanup

### Established Patterns
- Parallel branch kept jose and qs packages (verified used in identity provider and route utils)
- Docker Compose reduced to production-build test only

### Integration Points
- Phase 37 must be complete — all E2E tests passing before removal
- After removal, `supabase start` + `yarn dev` is the only dev workflow
- CI pipeline update follows in Phase 39

</code_context>

<deferred>
## Deferred Ideas

- Admin app migration (Strapi plugin → frontend Admin App) — separate milestone (ADMIN-01/02/03)
- TSConfig-based adapter loading — captured as TODO

</deferred>

---

*Phase: 38-strapi-removal-and-cleanup*
*Context gathered: 2026-03-22*
