# Phase 14: Service & Auth Bug Fixes - Research

**Researched:** 2026-03-15
**Domain:** PostgreSQL schema fixes, SvelteKit route correction, Docker/env configuration
**Confidence:** HIGH

## Summary

Phase 14 addresses four specific bugs identified in the v2.0 milestone audit. All four are well-scoped, low-risk fixes to existing code. No new libraries or architectural patterns are needed -- this is purely corrective work on files created in Phases 10 and 12.

The bugs are: (1) `bulk_import` ON CONFLICT clause incompatible with partial unique indexes, (2) `cleanup_entity_storage_files` and `cleanup_old_image_file` triggers calling `delete_storage_object` without schema qualification while `search_path` is empty, (3) forgot-password page redirecting to nonexistent `/candidate/update-password` instead of existing `/candidate/password-reset`, and (4) missing Supabase env vars in `.env.example` and Docker compose.

**Primary recommendation:** Fix all four bugs in the source schema files (014-storage.sql, 016-bulk-operations.sql), the SvelteKit page (forgot-password/+page.svelte), and config files (.env.example, docker-compose.dev.yml), then regenerate the migration and run `supabase db reset` to verify.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SRVC-01 (fix) | Storage cleanup trigger calls unresolvable function | Bug #2: `cleanup_entity_storage_files()` and `cleanup_old_image_file()` call `delete_storage_object()` without `public.` prefix while `SET search_path = ''`. Fix by adding schema qualification. |
| SRVC-04 (fix) | bulk_import ON CONFLICT incompatible with partial indexes | Bug #1: `ON CONFLICT (project_id, external_id)` does not match partial unique indexes with `WHERE external_id IS NOT NULL`. Fix by adding matching WHERE predicate. |
| AUTH-02 (fix) | Password reset redirect to nonexistent route | Bug #3: `redirectTo` in forgot-password page points to `/candidate/update-password` (does not exist). Existing route is `/candidate/password-reset`. |
| INFRA-02 (fix) | Missing Supabase env vars in .env.example and Docker compose | Bug #4: `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` not in root `.env.example` or `docker-compose.dev.yml`. Frontend needs these for Supabase client. |
</phase_requirements>

## Bug Analysis

### Bug 1: bulk_import ON CONFLICT with Partial Unique Indexes (SRVC-04)

**What goes wrong:** The `_bulk_upsert_record` function in `016-bulk-operations.sql` (line 197) generates:
```sql
INSERT INTO ... ON CONFLICT (project_id, external_id) DO UPDATE SET ...
```

But the unique indexes in `015-external-id.sql` are partial:
```sql
CREATE UNIQUE INDEX idx_elections_external_id
  ON elections (project_id, external_id) WHERE external_id IS NOT NULL;
```

PostgreSQL requires that `ON CONFLICT` column-based inference exactly matches an index, including its WHERE predicate. Without the predicate, PostgreSQL raises: `"there is no unique or exclusion constraint matching the ON CONFLICT specification"`.

**Root cause:** The `ON CONFLICT` clause was written as a standard composite unique constraint match without accounting for the partial index's `WHERE` clause.

**Fix:** Add the matching WHERE predicate to the ON CONFLICT clause:
```sql
ON CONFLICT (project_id, external_id) WHERE external_id IS NOT NULL DO UPDATE SET ...
```

This is the PostgreSQL-recommended approach (index inference with predicate) rather than naming the index directly, because inference is resilient to index renames.

**Confidence:** HIGH -- verified via [PostgreSQL official documentation](https://www.postgresql.org/docs/current/sql-insert.html) and [community analysis](https://betakuang.medium.com/why-postgresqls-on-conflict-cannot-find-my-partial-unique-index-552327b85e1).

**Affected file:** `apps/supabase/supabase/schema/016-bulk-operations.sql` (line 197 in `_bulk_upsert_record`)

**Safety:** The function already validates `ext_id IS NOT NULL` (line 141-143 raises exception if `external_id` is null), so the WHERE predicate will always be satisfied for valid inputs. This means the fix is semantically safe -- it only enables the index match, it does not change behavior for valid data.

### Bug 2: Storage Cleanup Trigger search_path Bug (SRVC-01)

**What goes wrong:** Two functions in `014-storage.sql` have `SET search_path = ''` (a security best practice for SECURITY DEFINER functions) but call `delete_storage_object()` without schema qualification:

1. `cleanup_entity_storage_files()` (line 401-402):
   ```sql
   PERFORM delete_storage_object('public-assets', path_prefix);
   PERFORM delete_storage_object('private-assets', path_prefix);
   ```

2. `cleanup_old_image_file()` (line 482, 490):
   ```sql
   PERFORM delete_storage_object('public-assets', old_path);
   PERFORM delete_storage_object('public-assets', old_path_dark);
   ```

With `search_path = ''`, PostgreSQL cannot resolve `delete_storage_object` because it only exists in the `public` schema. This causes entity DELETE triggers and image UPDATE triggers to fail at runtime.

**Root cause:** The `delete_storage_object` function itself correctly uses `public.storage_config` and `net.http_post` (schema-qualified). But its callers (`cleanup_entity_storage_files` and `cleanup_old_image_file`) were not updated to use `public.delete_storage_object`.

**Fix:** Change all calls to use the schema-qualified name `public.delete_storage_object(...)`:
```sql
PERFORM public.delete_storage_object('public-assets', path_prefix);
PERFORM public.delete_storage_object('private-assets', path_prefix);
```

**Confidence:** HIGH -- this is a straightforward PostgreSQL search_path resolution issue. The `SET search_path = ''` pattern is established in the codebase (used in 10+ functions) and all other cross-function calls already use schema qualification.

**Affected file:** `apps/supabase/supabase/schema/014-storage.sql` (4 call sites in 2 functions)

**Note on pgTAP workarounds:** Phase 13 tests (04-admin-crud.test.sql) explicitly avoided entity DELETE tests because of this bug, using `app_settings` instead. After fixing, those tests could be expanded, but that is not in scope for Phase 14.

### Bug 3: Password Reset Redirect URL (AUTH-02)

**What goes wrong:** In `frontend/src/routes/[[lang=locale]]/candidate/forgot-password/+page.svelte` (line 39):
```typescript
redirectTo: `${window.location.origin}/${$page.params.lang ?? 'en'}/candidate/update-password`
```

The route `/candidate/update-password` does not exist. The actual password reset form is at:
```
frontend/src/routes/[[lang=locale]]/candidate/password-reset/+page.svelte
```

**Fix:** Change `update-password` to `password-reset`:
```typescript
redirectTo: `${window.location.origin}/${$page.params.lang ?? 'en'}/candidate/password-reset`
```

**Confidence:** HIGH -- the route existence is verified by filesystem inspection.

**Affected file:** `frontend/src/routes/[[lang=locale]]/candidate/forgot-password/+page.svelte` (line 39)

**Note on Supabase auth callback:** The existing password-reset page uses the Strapi `resetPassword` function from candidate context and expects a `?code=` query param. The full Supabase PKCE code exchange flow (auth callback route, `exchangeCodeForSession`) is frontend adapter work deferred to v3+ (ADPT-01/ADPT-02). For Phase 14, only the redirect URL fix is in scope -- it makes the redirect point to a real page rather than a 404.

### Bug 4: Missing Supabase Env Vars (INFRA-02)

**What goes wrong:** The SvelteKit frontend creates a Supabase browser client (in `$lib/supabase/browser.ts`) that needs `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY`. These are not present in:
1. Root `.env.example` -- developers don't know to set them
2. Root `docker-compose.dev.yml` -- frontend container doesn't receive them

**Fix:**
1. Add to `.env.example` under a new Supabase section:
   ```
   PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
   ```
   (The anon key value is the standard Supabase local dev default, hardcoded in the Supabase CLI.)

2. Add to `docker-compose.dev.yml` frontend service environment:
   ```yaml
   PUBLIC_SUPABASE_URL: ${PUBLIC_SUPABASE_URL}
   PUBLIC_SUPABASE_ANON_KEY: ${PUBLIC_SUPABASE_ANON_KEY}
   ```

**Confidence:** HIGH -- the env var names and default local dev values are from the [Supabase CLI standard configuration](https://supabase.com/docs/guides/local-development/cli/config). The anon key is the same for all local Supabase installations.

**Affected files:**
- `.env.example`
- `docker-compose.dev.yml`

**Default values:** The local Supabase dev API URL is `http://127.0.0.1:54321` (from `config.toml` `[api] port = 54321`). The anon key is a well-known default that ships with every Supabase CLI installation -- it is not a secret.

## Architecture Patterns

### Migration Regeneration Pattern

After modifying schema files, the migration must be regenerated by concatenating all schema/*.sql files in dependency order:

```
000-functions.sql
001-tenancy.sql
002-elections.sql
003-entities.sql
004-questions.sql
005-nominations.sql
006-answers-jsonb.sql
007-app-settings.sql
008-views.sql
009-indexes.sql
011-auth-tables.sql
012-auth-hooks.sql
010-rls.sql          # After 012 because RLS policies reference auth helpers
013-auth-rls.sql
014-storage.sql
015-external-id.sql
016-bulk-operations.sql
017-email-helpers.sql
```

Command:
```bash
cd apps/supabase/supabase
cat schema/000-functions.sql schema/001-tenancy.sql schema/002-elections.sql \
    schema/003-entities.sql schema/004-questions.sql schema/005-nominations.sql \
    schema/006-answers-jsonb.sql schema/007-app-settings.sql schema/008-views.sql \
    schema/009-indexes.sql schema/011-auth-tables.sql schema/012-auth-hooks.sql \
    schema/010-rls.sql schema/013-auth-rls.sql schema/014-storage.sql \
    schema/015-external-id.sql schema/016-bulk-operations.sql \
    schema/017-email-helpers.sql > migrations/00001_initial_schema.sql
```

Then verify: `cd apps/supabase && npx supabase db reset`

### SECURITY DEFINER + search_path Pattern

The project uses a consistent pattern for security-sensitive functions:
```sql
CREATE OR REPLACE FUNCTION some_function(...)
RETURNS ...
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- All table references use public.table_name
  -- All function calls use public.function_name or schema.function_name
  -- Built-in functions (jsonb_build_object, etc.) don't need qualification (pg_catalog is always searched)
END;
$$;
```

Cross-function calls within `SET search_path = ''` functions MUST use `public.function_name()`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ON CONFLICT with partial index | Custom existence check + INSERT/UPDATE | `ON CONFLICT (cols) WHERE predicate DO UPDATE` | PostgreSQL handles race conditions atomically; custom check-then-insert has TOCTOU bugs |
| Migration regeneration | New script | Existing concatenation command from 12-03-PLAN | Proven pattern, tested across 3 phases |

## Common Pitfalls

### Pitfall 1: Forgetting WHERE predicate in ON CONFLICT
**What goes wrong:** PostgreSQL silently fails to match a partial unique index when the ON CONFLICT clause omits the WHERE predicate
**Why it happens:** ON CONFLICT column syntax looks complete without WHERE; error only appears at runtime
**How to avoid:** Always mirror the index definition's WHERE clause in ON CONFLICT
**Warning signs:** "there is no unique or exclusion constraint matching the ON CONFLICT specification" error

### Pitfall 2: Schema qualification in search_path = '' functions
**What goes wrong:** Functions within the same schema cannot find each other when search_path is empty
**Why it happens:** `SET search_path = ''` removes all schemas from resolution, including `public`
**How to avoid:** Always use `public.function_name()` for cross-function calls; built-in functions resolve via `pg_catalog` which is always implicit
**Warning signs:** "function X does not exist" errors in AFTER DELETE/UPDATE triggers

### Pitfall 3: Updating schema file but not regenerating migration
**What goes wrong:** `supabase db reset` uses the migration file, not the schema files directly
**Why it happens:** The schema files are source-of-truth for authoring; the migration is what actually runs
**How to avoid:** Always regenerate and verify after any schema file change
**Warning signs:** Schema file changes not reflected after `supabase db reset`

### Pitfall 4: Supabase local dev default values
**What goes wrong:** Using production-style env vars for local Supabase dev
**Why it happens:** Developers copy production patterns
**How to avoid:** Use standard Supabase CLI defaults: port 54321, well-known anon key
**Warning signs:** Frontend cannot connect to local Supabase

## Code Examples

### Fix 1: ON CONFLICT with partial index predicate
```sql
-- Source: PostgreSQL docs https://www.postgresql.org/docs/current/sql-insert.html
-- BEFORE (broken):
ON CONFLICT (project_id, external_id) DO UPDATE SET ...

-- AFTER (fixed):
ON CONFLICT (project_id, external_id) WHERE external_id IS NOT NULL DO UPDATE SET ...
```

### Fix 2: Schema-qualified function call
```sql
-- Source: existing pattern in delete_storage_object (014-storage.sql line 352-353)
-- BEFORE (broken):
PERFORM delete_storage_object('public-assets', path_prefix);

-- AFTER (fixed):
PERFORM public.delete_storage_object('public-assets', path_prefix);
```

### Fix 3: Password reset redirect URL
```typescript
// Source: existing route at frontend/src/routes/[[lang=locale]]/candidate/password-reset/
// BEFORE (broken):
redirectTo: `${window.location.origin}/${$page.params.lang ?? 'en'}/candidate/update-password`

// AFTER (fixed):
redirectTo: `${window.location.origin}/${$page.params.lang ?? 'en'}/candidate/password-reset`
```

### Fix 4: Env vars in .env.example
```bash
# Source: Supabase CLI config.toml [api] port = 54321
# Standard Supabase local dev defaults
PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pgTAP (via `supabase test db`) |
| Config file | `apps/supabase/supabase/config.toml` |
| Quick run command | `cd apps/supabase && npx supabase test db` |
| Full suite command | `cd apps/supabase && npx supabase test db` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SRVC-04 (fix) | bulk_import upsert works with partial indexes | integration | `cd apps/supabase && npx supabase db reset` (migration applies cleanly) | Wave 0: manual SQL verification after reset |
| SRVC-01 (fix) | Entity DELETE triggers resolve delete_storage_object | integration | `cd apps/supabase && npx supabase db reset` (function creation succeeds) | Wave 0: manual SQL verification |
| AUTH-02 (fix) | Redirect URL points to existing route | manual | Visual inspection of forgot-password page source | N/A (frontend change, no backend test) |
| INFRA-02 (fix) | Env vars present in config files | manual | `grep PUBLIC_SUPABASE .env.example` | N/A (config file check) |

### Sampling Rate
- **Per task commit:** `cd apps/supabase && npx supabase db reset 2>&1 | tail -5`
- **Per wave merge:** `cd apps/supabase && npx supabase test db`
- **Phase gate:** `supabase db reset` succeeds + `supabase test db` passes

### Wave 0 Gaps
None -- existing test infrastructure covers the critical path (migration applies cleanly). The schema bug fixes are validated by `supabase db reset` succeeding. Functional testing of bulk_import upsert and DELETE trigger storage cleanup requires either manual SQL testing or new pgTAP tests, but the primary verification is that the functions are syntactically valid and the migration applies.

## Open Questions

1. **Should new pgTAP tests be added for the fixed bugs?**
   - What we know: The Phase 13 tests explicitly worked around these bugs (using app_settings instead of entity tables for DELETE, testing RLS via direct SQL instead of bulk_import RPC)
   - What's unclear: Whether fixing the bugs warrants adding new targeted tests or if existing coverage + migration reset is sufficient
   - Recommendation: The planner should decide based on time budget. Minimal viable fix is schema changes + migration regeneration + `supabase db reset` verification. Optional enhancement is adding pgTAP tests for bulk_import upsert and entity DELETE with trigger.

## Sources

### Primary (HIGH confidence)
- [PostgreSQL INSERT documentation](https://www.postgresql.org/docs/current/sql-insert.html) - ON CONFLICT with partial index predicates
- [PostgreSQL Schema documentation](https://www.postgresql.org/docs/current/ddl-schemas.html) - search_path function resolution
- Direct source file inspection: `014-storage.sql`, `015-external-id.sql`, `016-bulk-operations.sql`, `forgot-password/+page.svelte`
- `apps/supabase/supabase/config.toml` - local dev port and configuration defaults

### Secondary (MEDIUM confidence)
- [Medium: PostgreSQL ON CONFLICT with partial unique indexes](https://betakuang.medium.com/why-postgresqls-on-conflict-cannot-find-my-partial-unique-index-552327b85e1) - community confirmation of behavior
- [Supabase password reset docs](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail) - resetPasswordForEmail redirectTo flow

## Metadata

**Confidence breakdown:**
- Bug 1 (ON CONFLICT): HIGH - verified via PostgreSQL official docs + source code inspection
- Bug 2 (search_path): HIGH - verified via source code inspection + established codebase pattern
- Bug 3 (redirect URL): HIGH - verified via filesystem (route exists at password-reset, not update-password)
- Bug 4 (env vars): HIGH - verified via .env.example inspection + Supabase CLI defaults

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (stable -- PostgreSQL behavior and Supabase CLI defaults do not change frequently)
