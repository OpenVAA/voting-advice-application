# Phase 30: Supabase Backend Foundation - Research

**Researched:** 2026-03-22
**Status:** Complete

## Source Branch Analysis

### apps/supabase/ workspace (106 files)

**File inventory from `feat-gsd-supabase-migration`:**

| Category | Count | Key files |
|----------|-------|-----------|
| Schema SQL | 24 | `supabase/schema/000-enums.sql` through `900-test-helpers.sql` |
| pgTAP tests | 11 | `supabase/tests/database/00-helpers.test.sql` through `10-schema-migrations.test.sql` |
| Edge Functions | 3 | `invite-candidate/`, `send-email/`, `signicat-callback/` |
| Benchmarks | ~60 | `benchmarks/` directory (data gen, k6, pgbench, results, scripts) |
| Config | 3 | `package.json`, `supabase/config.toml`, `supabase/seed.sql` |
| Scripts | 1 | `scripts/lint-schema.mjs` |
| Migrations | 1 | `supabase/migrations/00001_initial_schema.sql` |
| Git config | 1 | `supabase/.gitignore` |

**package.json scripts:** start, stop, reset, diff, status, lint, lint:schema, lint:all
**Supabase CLI version:** `^2.78.1` (devDependency)

### packages/supabase-types/ (5 files)

| File | Purpose |
|------|---------|
| `package.json` | Raw .ts source package, no build step, `"build": "echo 'Raw .ts source'"` |
| `src/database.ts` | Generated Supabase Database types (auto-generated from schema) |
| `src/column-map.ts` | COLUMN_MAP, PROPERTY_MAP, TABLE_MAP, COLLECTION_NAME_MAP |
| `src/index.ts` | Re-exports all types and maps |
| `tsconfig.json` | Extends `@openvaa/shared-config/ts`, noEmit |

**Exports:** `Database`, `Tables`, `TablesInsert`, `TablesUpdate`, `Enums`, `Json`, `CompositeTypes`, `Constants`, `COLUMN_MAP`, `PROPERTY_MAP`, `TABLE_MAP`, `COLLECTION_NAME_MAP` and associated types.

### Supabase config.toml key settings

- `project_id = "openvaa-local"`
- DB port: `54322` (avoids conflict with existing Postgres on 5432)
- Shadow DB port: `54320`
- API port: `54321`
- Studio port: `54323`
- Inbucket (email testing): port `54324` (web), `54325` (SMTP), `54326` (POP3)
- Edge runtime: `policy = "oneshot"`, `deno_version = 2`
- Storage: Two buckets defined (`public-assets`, `private-assets`)
- Auth: Site URL = `http://127.0.0.1:5173`, custom_access_token hook enabled
- DB major version: `15`

## Current Branch State

### Workspace globs
Root `package.json` has `"workspaces": ["packages/*", "apps/*", "apps/strapi/src/plugins/*"]`
- `apps/*` already covers `apps/supabase/`
- `packages/*` already covers `packages/supabase-types/`
- No workspace config changes needed (confirmed by D-02, D-06)

### Yarn catalog
`.yarnrc.yml` has 30 catalog entries. Neither `supabase` CLI nor `@supabase/supabase-js` is present. Both need to be added.

### turbo.json
Only defines `build`, `test:unit`, `lint`, `typecheck` tasks. The `apps/supabase/` workspace has `"build"` undefined (not needed), so Turbo will just skip it during `turbo run build`. The `supabase` workspace's scripts (`start`, `stop`, `reset`, etc.) are supabase CLI commands, not Turbo tasks. No changes needed.

## Integration Approach

### File extraction strategy
Use `git checkout feat-gsd-supabase-migration -- <path>` to extract entire directories from the parallel branch. This preserves file permissions and binary content exactly.

Alternative: `git show feat-gsd-supabase-migration:<path> > <path>` for individual files. But for 106 files, bulk checkout is faster and more reliable.

**Important:** After checkout, files are automatically staged. Need to commit them as a batch.

### Yarn catalog additions
Two entries needed in `.yarnrc.yml` catalog section:
1. `supabase: ^2.78.1` — used by `apps/supabase` and `packages/supabase-types`
2. `'@supabase/supabase-js': ^2.49.4` — will be consumed by frontend in Phase 34+ (not used directly in this phase, but catalog entry needed per BACK-04)

The supabase-types package.json needs updating to use `catalog:` references instead of pinned versions.

### TypeScript project references
`packages/supabase-types/tsconfig.json` extends `@openvaa/shared-config/ts` — this is already resolved through workspace dependency. No cross-package references needed in Phase 30 (consumers come later).

## Verification Architecture

### pgTAP test execution
```bash
cd apps/supabase
supabase start  # Launches local Supabase stack
supabase test db  # Runs pgTAP tests
```

pgTAP tests are in `supabase/tests/database/` (11 files, 229 tests). They test:
- Helper functions (00)
- Tenant isolation (01)
- Candidate self-edit RLS (02)
- Anonymous read access (03)
- Admin CRUD operations (04)
- Party admin operations (05)
- Storage RLS (06)
- RPC security (07)
- Triggers (08)
- Column restrictions (09)
- Schema migrations (10)

### Edge Function verification
Edge Functions run on Deno 2. They import from `https://esm.sh/@supabase/supabase-js@2`:
- `invite-candidate` — Creates candidate record + sends invite email
- `send-email` — Bulk transactional email via SMTP
- `signicat-callback` — Bank auth (JWE/JWT) callback

Verification approach: `supabase functions serve` + curl each endpoint. For Phase 30, we verify they're deployable and respond (not full E2E flows).

### Type package verification
```bash
cd packages/supabase-types
npx tsc --noEmit  # Should exit 0
```

Also verify imports work:
```bash
node -e "import('@openvaa/supabase-types').then(m => console.log(Object.keys(m)))"
```

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Supabase CLI not installed globally | CLI is a devDependency in apps/supabase, runs via `npx supabase` or `yarn supabase` |
| Docker required for `supabase start` | Document prerequisite; Docker must be running |
| Port conflicts (54321-54327) | config.toml already uses non-standard ports; document if conflicts arise |
| database.ts may be stale | Re-generate after schema changes in Phase 31; Phase 30 uses as-is from branch |
| Edge Functions need Deno runtime | Supabase CLI bundles Deno; `edge_runtime.deno_version = 2` in config.toml |
| Benchmark files are large (~60 files) | Copy as-is; they're reference data, not executable code |

## Validation Architecture

### Dimension 1: Schema Integrity
- All 24 schema files present in `apps/supabase/supabase/schema/`
- Migration file `00001_initial_schema.sql` present
- `supabase start` applies migrations without error

### Dimension 2: Test Coverage
- pgTAP test suite runs and all 229 tests pass
- Test files present in `supabase/tests/database/`

### Dimension 3: Edge Function Deployability
- Three Edge Functions present in `supabase/functions/`
- Each function responds to HTTP requests when served

### Dimension 4: Type Package Correctness
- `@openvaa/supabase-types` exports all expected types and maps
- Zero TypeScript errors on `tsc --noEmit`

### Dimension 5: Dependency Catalog
- `supabase` and `@supabase/supabase-js` in Yarn catalog
- Workspace package.json files use `catalog:` references

---

## RESEARCH COMPLETE

*Phase: 30-supabase-backend-foundation*
*Researched: 2026-03-22*
