# Phase 30: Strapi Removal and Dev Environment - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Remove all Strapi code, adapter, backend directory, and Docker services. Replace the Docker-compose-based dev workflow with `supabase start` + SvelteKit dev server. Update CI/CD pipeline, environment configuration, and documentation to reflect the Supabase-only world. After this phase, no Strapi dependency exists anywhere in the repository.

</domain>

<decisions>
## Implementation Decisions

### Dev workflow design
- `yarn dev` runs `supabase start` then starts the SvelteKit dev server (`yarn workspace @openvaa/frontend dev`) — no Docker compose for daily development
- Dev data seeding uses `supabase/seed.sql` which runs automatically on `supabase db reset` — no separate seed script needed
- `.env` stripped to essentials: remove all Strapi/LocalStack vars (~70 lines), keep only Supabase public vars (URL, anon key) and frontend config; local defaults come from `supabase/config.toml`

### Docker compose fate
- Root `docker-compose.dev.yml` is rewritten (not removed) as a minimal production-build test tool
- Purpose: lets developers verify the frontend production Dockerfile works correctly
- Claude decides whether it's frontend-only (with devs running `supabase start` separately) or includes Supabase containers, based on what's practical for Dockerfile testing

### Dev script naming
- Claude's discretion: determine appropriate `yarn dev:*` script names based on what supabase CLI supports (stop, reset, etc.)

### Documentation cleanup
- Delete Strapi-specific docs pages in `docs/src/routes/(content)/developers-guide/` (~15 pages covering plugins, mock data, Strapi auth, etc.)
- Leave stub files with key references (relevant file paths, commit hashes, brief notes on what Supabase equivalent would cover) so Claude can write proper Supabase docs in a later phase
- CLAUDE.md fully updated: dev commands point to `supabase start`, architecture removes dual-backend mention, troubleshooting reflects Supabase-only stack

### CI/CD pipeline
- Remove `backend-validation` job entirely (Strapi build + cache)
- Remove Strapi paths from lint commands (`backend/vaa-strapi/src`, `backend/vaa-strapi/tests`)
- Remove Strapi workspace install/build steps
- Add a new Supabase pgTAP CI job that runs `supabase start` + `supabase test` — triggered only on relevant path changes (migrations, seed, supabase dependency bumps via path filter: `apps/supabase/**`, `packages/supabase-types/**`)

### Claude's Discretion
- Dev script naming and supabase CLI command mapping
- Docker compose scope for production testing (frontend-only vs full stack)
- Exact stub content format for removed docs pages
- Order of removal operations (adapter first vs backend first)
- Whether `backend/vaa-strapi/docker-compose.dev.yml` needs any migration or just deletion
- Strapi test file cleanup (`strapiDataProvider.test.ts`)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Strapi adapter (being removed)
- `frontend/src/lib/api/adapters/strapi/` — 23 files: strapiAdapter, dataProvider, dataWriter, feedbackWriter, 14 utils — entire directory deleted
- `frontend/src/lib/api/dataProvider.ts` — Dynamic import switch with `case 'strapi':` to remove
- `frontend/src/lib/api/dataWriter.ts` — Dynamic import switch with `case 'strapi':` to remove
- `frontend/src/lib/api/feedbackWriter.ts` — Dynamic import switch with `case 'strapi':` to remove

### Backend directory (being removed)
- `backend/vaa-strapi/` — 18K+ files, entire directory deleted
- `backend/vaa-strapi/package.json` — Workspace entry to remove from root package.json

### Docker compose (being rewritten)
- `docker-compose.dev.yml` — Root compose with 4 services (frontend, strapi, postgres, awslocal); rewrite as production-build test tool
- `backend/vaa-strapi/docker-compose.dev.yml` — Strapi-specific compose, delete entirely

### Package.json and workspace config
- `package.json` (root) — Lines 69-70: workspace entries for backend/vaa-strapi; Lines 7-12: dev scripts; Lines 15, 18, 22-23: Strapi references in scripts
- `frontend/package.json` — `jose` and `qs` packages: KEEP (used outside Strapi adapter in auth and routing utils)

### Environment configuration
- `.env.example` — ~70 lines of Strapi/LocalStack vars to remove; restructure for Supabase-only
- `.env` — Same cleanup as .env.example

### Supabase CLI (replacement infrastructure)
- `apps/supabase/supabase/config.toml` — Already configured: API on 54321, DB on 54322, Inbucket, Storage
- `apps/supabase/supabase/seed.sql` — Seed data for dev environment

### CI/CD
- `.github/workflows/main.yaml` — Lines 98-129: backend-validation job, Strapi cache, install, build steps; lint paths including backend/vaa-strapi

### Documentation (being cleaned up)
- `CLAUDE.md` — ~8 Strapi references in dev commands, architecture, troubleshooting
- `docs/src/routes/(content)/developers-guide/backend/` — Multiple Strapi-specific pages
- `docs/src/routes/(content)/developers-guide/development/running-the-development-environment/+page.md` — Dev environment setup docs
- `docs/src/routes/(content)/developers-guide/deployment/+page.md` — Deployment docs with Strapi references

### Test files
- `frontend/tests/strapiDataProvider/strapiDataProvider.test.ts` — Strapi-specific test to remove
- `tests/tests/utils/strapiAdminClient.ts` — Already replaced by supabaseAdminClient.ts in Phase 29; confirm removal

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/supabase/supabase/config.toml`: Supabase CLI already fully configured with all service ports
- `apps/supabase/supabase/seed.sql`: Existing seed data ready for dev environment
- `supabaseAdminClient.ts`: Already exists from Phase 29, replaces strapiAdminClient
- `frontend/src/lib/api/adapters/supabase/`: Complete Supabase adapter (20 files) — already the active adapter

### Established Patterns
- Phase 29 E2E tests already run against `supabase start` — proven that the CLI-based workflow works
- Adapter switch pattern in dataProvider.ts/dataWriter.ts/feedbackWriter.ts — remove `'strapi'` case, keep `'supabase'` case
- `@openvaa/supabase-types` package provides all type definitions — no Strapi types needed

### Integration Points
- Root `package.json` workspaces array — remove `backend/vaa-strapi` entries
- Root `package.json` scripts — rewrite dev/lint/test scripts
- `yarn.lock` — will shrink significantly after removing Strapi workspace dependencies
- `.github/workflows/main.yaml` — remove backend-validation job, add Supabase pgTAP job with path filter

</code_context>

<specifics>
## Specific Ideas

- Docker compose stays but is rewritten as a production-build Dockerfile testing tool — not for daily dev
- Removed docs pages should have stubs with file/commit references so future Claude sessions can write Supabase docs without starting from scratch
- `jose` and `qs` packages confirmed used outside Strapi adapter — do NOT remove (ENVR-05 satisfied by analysis)
- pgTAP CI job should use path filtering (`apps/supabase/**`, `packages/supabase-types/**`) to avoid running on every PR

</specifics>

<deferred>
## Deferred Ideas

- Write comprehensive Supabase developer documentation (replacements for removed Strapi docs) — future documentation phase
- Add Supabase pgTAP tests to CI as a required check (start with optional/non-blocking) — evaluate after initial CI integration
- Production deployment guide rewrite for Supabase — separate docs effort
- Admin app support (`supportsAdminApp: true` in adapter config) — post v3.0 milestone

</deferred>

---

*Phase: 30-strapi-removal-and-dev-environment*
*Context gathered: 2026-03-20*
