# Phase 22: Schema Migrations - Research

**Researched:** 2026-03-18
**Domain:** PostgreSQL schema extensions (Supabase), pgTAP testing, RLS policies, RPC functions
**Confidence:** HIGH

## Summary

Phase 22 adds four schema objects to the existing Supabase database that the frontend adapter depends on: (1) a `customization` JSONB column on `app_settings`, (2) a new `feedback` table with anonymous insert RLS and DB-level rate limiting, (3) a `terms_of_use_accepted` timestamp column on `candidates`, and (4) an `upsert_answers()` RPC function for atomic answer writes. All four additions are additive schema changes -- no destructive migrations, no table drops, no column renames.

The existing codebase has extremely well-established patterns for all of these operations. The database skill documentation at `.claude/skills/database/SKILL.md` and the extension guide at `.claude/skills/database/extension-patterns.md` provide step-by-step playbooks. The 204 existing pgTAP tests and 18 schema source files provide clear reference implementations for every pattern needed.

**Primary recommendation:** Follow the established schema extension patterns exactly. The feedback table is the only non-trivial addition (new table + custom RLS + rate limiting trigger). The other three are straightforward column additions or function definitions that match existing patterns closely.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Customization storage:** Add a `customization jsonb` column to the existing `app_settings` table (not a separate table). No DB-level validation on the customization JSONB -- app layer handles parsing/validation. Image references inside customization use the same format as image-type answer values. Existing app_settings RLS policies cover the new column automatically (anon SELECT, admin INSERT/UPDATE/DELETE).
- **Feedback table:** New `feedback` table with columns: `id`, `project_id`, `rating` (integer, nullable), `description` (text, nullable), `date` (timestamptz), `url` (text, nullable), `user_agent` (text, nullable), `created_at`. At least one of `rating` or `description` must be present (CHECK constraint). Anonymous insert-only: RLS allows INSERT for anon, SELECT/DELETE for admin only. No UPDATE policy. DB-level rate limiting to prevent spam.
- **Terms-of-use tracking:** Add `terms_of_use_accepted timestamptz` column to the `candidates` table (nullable, null = not yet accepted). Existing candidate RLS policies cover the column -- candidates can update their own row.
- **Answer upsert RPC:** Single `upsert_answers(entity_id uuid, answers jsonb, overwrite boolean)` function. `SECURITY INVOKER` -- relies on existing RLS. When `overwrite = false`: merges new answers into existing JSONB (`||` operator). When `overwrite = true`: replaces entire answers JSONB. Returns the updated answers JSONB. Existing `validate_answers_jsonb()` trigger fires on the underlying UPDATE.
- **Migration strategy:** Append all additions to the existing `00001_initial_schema.sql` (pre-production, single consolidated migration). Also update/create schema source files. Include pgTAP tests. Regenerate `@openvaa/supabase-types`.

### Claude's Discretion
- Exact rate limiting mechanism for feedback (IP-based cooldown, session fingerprint, or other lightweight approach)
- Whether the upsert RPC needs explicit `project_id` parameter or derives it from the candidate row
- pgTAP test file organization (new file vs extending existing test files)
- Exact CHECK constraint syntax for feedback (rating OR description required)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SCHM-01 | app_customization storage added to Supabase schema (customization JSONB column or equivalent) | Simple `ALTER TABLE app_settings ADD COLUMN customization jsonb DEFAULT '{}'::jsonb`. Existing RLS covers it. Update `007-app-settings.sql` and append to migration. |
| SCHM-02 | feedback table added to Supabase schema | New table in `018-feedback.sql`, RLS in `010-rls.sql`, rate limiting trigger function, indexes in `009-indexes.sql`. Most complex requirement. |
| SCHM-03 | terms_of_use_accepted column added to candidates table | `ALTER TABLE candidates ADD COLUMN terms_of_use_accepted timestamptz`. Add to `013-auth-rls.sql` column-level GRANT. Update `003-entities.sql`. |
| SCHM-04 | Answer upsert RPC for atomic answer writes | New function in `006-answers-jsonb.sql`. SECURITY INVOKER, no `project_id` parameter needed (derive from row). GRANT to authenticated. |
</phase_requirements>

## Standard Stack

### Core
| Library/Tool | Version | Purpose | Why Standard |
|-------------|---------|---------|--------------|
| Supabase CLI | ^2.78.1 | DB management, type generation, test runner | Already in devDependencies of supabase-types package |
| pgTAP | (Supabase bundled) | PostgreSQL unit testing framework | 204 existing tests use this; loaded in `00-helpers.test.sql` |
| PostgREST | (Supabase bundled) | Auto-generated REST API from PostgreSQL schema | All CRUD operations go through PostgREST; RLS policies enforced automatically |

### Supporting
| Tool | Purpose | When to Use |
|------|---------|-------------|
| `supabase db reset` | Reload schema from migrations | After modifying migration file, before running tests |
| `supabase test db` | Run pgTAP test suite | After adding/modifying tests |
| `supabase gen types typescript --local` | Regenerate TypeScript types | After schema changes, via `yarn workspace @openvaa/supabase-types generate` |
| Prettier | Format generated types | Runs automatically as part of generate script |

**No new packages needed.** All tooling is already installed.

## Architecture Patterns

### File Modification Map

```
apps/supabase/supabase/
  schema/
    003-entities.sql              # Add terms_of_use_accepted column comment
    006-answers-jsonb.sql         # Add upsert_answers() RPC function
    007-app-settings.sql          # Add customization column
    009-indexes.sql               # Add feedback table indexes
    010-rls.sql                   # Add feedback table RLS policies
    013-auth-rls.sql              # Add terms_of_use_accepted to GRANT
    018-feedback.sql              # NEW: feedback table + rate limiting
  migrations/
    00001_initial_schema.sql      # Append all new schema objects
  tests/database/
    00-helpers.test.sql           # Add feedback test_id, create_test_data() entries
    10-schema-migrations.test.sql # NEW: pgTAP tests for all 4 requirements

packages/supabase-types/
  src/
    database.ts                   # Regenerated
    column-map.ts                 # Add terms_of_use_accepted -> termsOfUseAccepted
```

### Pattern 1: Column Addition to Existing Table (SCHM-01, SCHM-03)
**What:** Add a column via ALTER TABLE in the schema source file, then append the same ALTER to the migration.
**When to use:** When adding fields to existing tables.
**Example (from `011-auth-tables.sql` pattern):**
```sql
-- In schema source file (e.g., 007-app-settings.sql)
-- Add after the CREATE TABLE statement
ALTER TABLE app_settings ADD COLUMN customization jsonb DEFAULT '{}'::jsonb;

-- In 013-auth-rls.sql (for candidates column-level grant)
-- Update the GRANT statement to include the new column
GRANT UPDATE (
  name, short_name, info, color, image, sort_order, subtype,
  custom_data, first_name, last_name, answers, created_at, updated_at,
  terms_of_use_accepted  -- NEW
) ON candidates TO authenticated;
```

### Pattern 2: New Table with Custom RLS (SCHM-02)
**What:** Create a non-content table (no published/external_id/common columns) with specialized RLS.
**When to use:** For supporting tables that don't follow the standard content pattern.
**Key difference from standard pattern:** The feedback table is NOT a content table -- it lacks `name`, `short_name`, `info`, `color`, `image`, `sort_order`, `subtype`, `custom_data`, `is_generated`, `published`, `external_id`. It follows a simpler pattern closer to `app_settings` but with even more restricted access.

### Pattern 3: SECURITY INVOKER RPC (SCHM-04)
**What:** A function that executes with the caller's permissions, so RLS policies enforce access control automatically.
**When to use:** When the function modifies RLS-protected tables and the caller's identity matters.
**Reference:** `bulk_import()` and `bulk_delete()` in `016-bulk-operations.sql` are both SECURITY INVOKER.
**Example:**
```sql
-- Source: existing pattern from 016-bulk-operations.sql
CREATE OR REPLACE FUNCTION upsert_answers(
  entity_id uuid,
  answers jsonb,
  overwrite boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
-- SECURITY INVOKER is the default, but state it explicitly for clarity
SECURITY INVOKER
AS $$
DECLARE
  updated_answers jsonb;
BEGIN
  IF overwrite THEN
    UPDATE candidates
    SET answers = upsert_answers.answers
    WHERE id = entity_id
    RETURNING candidates.answers INTO updated_answers;
  ELSE
    UPDATE candidates
    SET answers = COALESCE(candidates.answers, '{}'::jsonb) || upsert_answers.answers
    WHERE id = entity_id
    RETURNING candidates.answers INTO updated_answers;
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Entity not found or access denied: %', entity_id;
  END IF;

  RETURN updated_answers;
END;
$$;

GRANT EXECUTE ON FUNCTION upsert_answers(uuid, jsonb, boolean) TO authenticated;
```

### Anti-Patterns to Avoid
- **Adding `project_id` parameter to upsert_answers:** The candidate's `project_id` is already on the row. SECURITY INVOKER + RLS means only the candidate's own row is visible/updatable. Adding a redundant parameter creates a mismatch risk.
- **Using SECURITY DEFINER for the upsert RPC:** This would bypass RLS entirely, removing the safety guarantee that candidates can only update their own answers.
- **Creating the feedback table as a content table:** It lacks all common columns (name, published, etc.). Forcing the content pattern would add useless columns and wrong RLS policies.
- **Using bare `auth.uid()` or `auth.jwt()` in RLS policies:** Always wrap in `(SELECT ...)` for query planner optimization (evaluated once per query, not per row).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Rate limiting | Custom Redis/external service | PostgreSQL trigger with advisory lock + counter table | Stays within the DB layer; no external dependencies; simple; tested pattern from Neon guide |
| Answer validation in RPC | Duplicate validation logic inside upsert function | Let existing `validate_answers_jsonb()` trigger fire on UPDATE | Trigger already validates changed keys only, handles INSERT and UPDATE; DRY principle |
| IP extraction from PostgREST | Custom middleware or Edge Function | `current_setting('request.headers', true)::json ->> 'x-forwarded-for'` in trigger | PostgREST injects HTTP headers into PostgreSQL session settings; available in all functions/triggers |
| Type generation | Manual TypeScript type updates | `yarn workspace @openvaa/supabase-types generate` | Automated pipeline already exists; generates from live schema |

**Key insight:** The existing schema has triggers, RLS, and conventions that handle most complexity automatically. The upsert RPC can be simple because `validate_answers_jsonb()` runs on the underlying UPDATE, and `candidate_update_own` RLS policy restricts to own-row access.

## Common Pitfalls

### Pitfall 1: Forgetting Column-Level GRANT for terms_of_use_accepted
**What goes wrong:** Candidates get "permission denied" when trying to accept terms of use via PostgREST UPDATE.
**Why it happens:** `013-auth-rls.sql` has `REVOKE UPDATE ON candidates FROM authenticated` followed by explicit column-level GRANTs. A new column not listed in the GRANT is admin-only by default.
**How to avoid:** Add `terms_of_use_accepted` to the GRANT UPDATE statement in `013-auth-rls.sql`.
**Warning signs:** Candidate self-update tests fail with permission errors.

### Pitfall 2: Rate Limiting Table Visibility
**What goes wrong:** Rate limit counter table is visible/modifiable by anonymous users through PostgREST API.
**Why it happens:** PostgREST exposes all tables in the `public` schema. If the rate_limits table is in `public` without RLS, anyone can read/clear counters.
**How to avoid:** Either: (a) create the rate_limits table in a private schema not exposed via PostgREST, or (b) enable RLS with no policies (denies all access from API), or (c) REVOKE ALL from anon and authenticated.
**Warning signs:** Rate limit counters appear in the auto-generated API docs.

### Pitfall 3: Feedback INSERT Failing Due to Missing SELECT Policy
**What goes wrong:** Anonymous INSERT into feedback table fails with "new row violates row-level security policy."
**Why it happens:** In PostgreSQL, INSERT with RETURNING or INSERT with a WITH CHECK that references the table may require SELECT permission. Also, PostgREST may attempt to read back the inserted row.
**How to avoid:** Use `INSERT ... WITH CHECK (true)` for anon and ensure PostgREST `Prefer: return=minimal` or add a limited anon SELECT policy that returns nothing useful (e.g., `USING (false)` on SELECT -- which silently returns no rows while not blocking INSERT).
**Warning signs:** 403 errors on feedback submission from the voter app.

### Pitfall 4: Missing GRANT for RPC Function
**What goes wrong:** `upsert_answers()` returns "permission denied" when called by authenticated users.
**Why it happens:** PostgreSQL functions require explicit GRANT EXECUTE to specific roles. Without it, only the owner (postgres) can execute.
**How to avoid:** Add `GRANT EXECUTE ON FUNCTION upsert_answers(uuid, jsonb, boolean) TO authenticated;` after the function definition.
**Warning signs:** RPC calls from the frontend adapter return 403.

### Pitfall 5: Upsert RPC Not Handling Null Answer Values
**What goes wrong:** Sending `{"question-id": null}` to remove an answer doesn't work with the `||` merge operator.
**Why it happens:** JSONB `||` keeps keys with null values rather than removing them. The frontend adapter expects `null` values to mean "remove this answer."
**How to avoid:** After the `||` merge, strip keys with null values: `answers = (SELECT jsonb_object_agg(k, v) FROM jsonb_each(merged) WHERE v IS NOT NULL AND v != 'null'::jsonb)`. Or use `jsonb_strip_nulls()` if null values should never appear.
**Warning signs:** Deleted answers reappear in the UI; answer count grows but never shrinks.

### Pitfall 6: Migration File and Schema Source Drift
**What goes wrong:** Schema source files (`schema/*.sql`) and the consolidated migration (`00001_initial_schema.sql`) contain different SQL.
**Why it happens:** Editing one but forgetting the other. Pre-production means there's a single consolidated migration, and schema source files serve as the "readable" reference.
**How to avoid:** Always edit both simultaneously. The schema source files define intent; the migration file is the executable.
**Warning signs:** `supabase db reset` produces a different schema than expected when reading source files.

## Code Examples

### SCHM-01: Customization Column on app_settings
```sql
-- In 007-app-settings.sql, add after the CREATE TABLE:
-- No separate ALTER needed if adding to CREATE TABLE directly.
-- If using ALTER (to match existing pattern of additions in later files):

ALTER TABLE app_settings ADD COLUMN customization jsonb DEFAULT '{}'::jsonb;
```

No RLS changes needed -- existing `anon_select_app_settings USING (true)` and admin INSERT/UPDATE/DELETE policies automatically cover new columns.

### SCHM-02: Feedback Table
```sql
-- 018-feedback.sql

CREATE TABLE feedback (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  rating      integer,
  description text,
  date        timestamptz NOT NULL DEFAULT now(),
  url         text,
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT feedback_rating_or_description CHECK (
    rating IS NOT NULL OR description IS NOT NULL
  )
);

CREATE TRIGGER set_feedback_updated_at
  BEFORE UPDATE ON feedback
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

Note: The feedback table does NOT need `updated_at` since there's no UPDATE policy. The `set_updated_at` trigger can be omitted. But `created_at` should still be present.

### SCHM-02: Feedback Rate Limiting
```sql
-- Recommended approach: Lightweight time-window check using the feedback table itself
-- No separate counter table needed -- just count recent inserts from same IP.

CREATE OR REPLACE FUNCTION check_feedback_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  client_ip text;
  recent_count integer;
BEGIN
  -- Extract client IP from PostgREST request headers
  client_ip := SPLIT_PART(
    COALESCE(
      current_setting('request.headers', true)::json ->> 'x-forwarded-for',
      'unknown'
    ) || ',',
    ',', 1
  );

  -- Count feedback submissions from this IP in the last 5 minutes
  SELECT count(*) INTO recent_count
  FROM feedback
  WHERE user_agent = client_ip  -- Reuse user_agent temporarily, or:
    AND created_at > now() - interval '5 minutes';

  -- Actually, better to check by IP stored temporarily or use a separate approach.
  -- See recommendation below.

  IF recent_count > 5 THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please try again later.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;
```

**Recommended rate limiting approach (simplest effective):** Store the IP in the feedback row itself (add a private `client_ip` column, or reuse the `user_agent` column which PostgREST can set from headers). Then the BEFORE INSERT trigger counts recent rows from the same IP. This avoids a separate rate_limits table entirely.

More robust alternative (separate tracking):
```sql
-- Private rate limit tracking (not exposed via PostgREST)
CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE private.feedback_rate_limits (
  ip_address  text        PRIMARY KEY,
  count       integer     NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION check_feedback_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  client_ip text;
  current_count integer;
  window_interval interval := interval '5 minutes';
  max_requests integer := 5;
BEGIN
  client_ip := SPLIT_PART(
    COALESCE(
      current_setting('request.headers', true)::json ->> 'x-forwarded-for',
      'unknown'
    ) || ',',
    ',', 1
  );

  -- Upsert rate limit counter with advisory lock to prevent races
  PERFORM pg_advisory_xact_lock(hashtext('feedback_rate:' || client_ip));

  INSERT INTO private.feedback_rate_limits (ip_address, count, window_start)
  VALUES (client_ip, 1, now())
  ON CONFLICT (ip_address) DO UPDATE
  SET count = CASE
                WHEN private.feedback_rate_limits.window_start + window_interval <= now()
                THEN 1
                ELSE private.feedback_rate_limits.count + 1
              END,
      window_start = CASE
                       WHEN private.feedback_rate_limits.window_start + window_interval <= now()
                       THEN now()
                       ELSE private.feedback_rate_limits.window_start
                     END;

  SELECT count INTO current_count
  FROM private.feedback_rate_limits
  WHERE ip_address = client_ip;

  IF current_count > max_requests THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please try again later.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER check_feedback_rate_limit
  BEFORE INSERT ON feedback
  FOR EACH ROW EXECUTE FUNCTION check_feedback_rate_limit();
```

### SCHM-02: Feedback RLS
```sql
-- In 010-rls.sql
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Anonymous: insert only
CREATE POLICY "anon_insert_feedback" ON feedback
  FOR INSERT TO anon
  WITH CHECK (true);

-- Admin: read and delete
CREATE POLICY "admin_select_feedback" ON feedback
  FOR SELECT TO authenticated
  USING ((SELECT can_access_project(project_id)));

CREATE POLICY "admin_delete_feedback" ON feedback
  FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- No UPDATE policy (locked decision)
-- No anon SELECT policy (locked decision)
```

### SCHM-03: Terms of Use Column
```sql
-- In 003-entities.sql, add as comment/documentation
-- The actual ALTER goes in 011-auth-tables.sql or directly in the migration

ALTER TABLE candidates ADD COLUMN terms_of_use_accepted timestamptz;
```

### SCHM-04: Upsert Answers RPC
```sql
-- In 006-answers-jsonb.sql, after existing functions

CREATE OR REPLACE FUNCTION upsert_answers(
  entity_id uuid,
  answers jsonb,
  overwrite boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  updated_answers jsonb;
BEGIN
  IF overwrite THEN
    -- Replace entire answers JSONB
    UPDATE candidates
    SET answers = upsert_answers.answers
    WHERE id = entity_id
    RETURNING candidates.answers INTO updated_answers;
  ELSE
    -- Merge new answers into existing (|| operator)
    UPDATE candidates
    SET answers = COALESCE(candidates.answers, '{}'::jsonb) || upsert_answers.answers
    WHERE id = entity_id
    RETURNING candidates.answers INTO updated_answers;
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Entity not found or access denied: %', entity_id;
  END IF;

  RETURN updated_answers;
END;
$$;

GRANT EXECUTE ON FUNCTION upsert_answers(uuid, jsonb, boolean) TO authenticated;
```

**Design decision: No `project_id` parameter.** The candidate row already has `project_id`, and the `validate_answers_jsonb()` trigger uses `NEW.project_id` to look up questions. SECURITY INVOKER + RLS (`candidate_update_own` policy) ensures the caller can only update their own row. Adding a `project_id` parameter would be redundant and could create inconsistencies.

### Column Map Update
```typescript
// In packages/supabase-types/src/column-map.ts, add:
terms_of_use_accepted: 'termsOfUseAccepted',
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate customization table | JSONB column on app_settings | Decision in this phase | Simpler, no join needed, existing RLS covers it |
| Client-side read-modify-write for answers | Server-side atomic upsert RPC | Decision in this phase | Eliminates race conditions from concurrent answer submissions |
| No terms tracking | Timestamp column on candidates | Decision in this phase | Enables ToU acceptance tracking in candidate app |

**The existing TODO in `006-answers-jsonb.sql` (line 14) explicitly calls for this RPC:**
> "TODO: Add an RPC function for atomic single-answer upsert to prevent client-side read-modify-write race conditions with concurrent jsonb_set()."

## Open Questions

1. **Null handling in answer merge**
   - What we know: JSONB `||` operator merges objects at the top level. `{"a": null}` as a value is preserved (not stripped).
   - What's unclear: Should the RPC strip null-valued keys after merge (to support "delete answer" semantics), or should null values be preserved?
   - Recommendation: Strip null values after merge. The frontend `FeedbackData` type and `LocalizedCandidateData` type use `| null` to indicate "remove." Implement: after `||` merge, filter out keys where value is JSON `null`.

2. **Rate limit window and threshold for feedback**
   - What we know: Need to prevent spam without blocking legitimate users.
   - What's unclear: Exact values (5 per 5 minutes? 10 per 10 minutes?).
   - Recommendation: Start with 5 requests per 5-minute window per IP. This is generous for legitimate feedback while preventing automated spam. Values can be adjusted by changing constants in the function.

3. **Feedback date column vs created_at**
   - What we know: The CONTEXT.md specifies both `date` and `created_at` columns.
   - What's unclear: Whether `date` is the client-provided timestamp and `created_at` is server-generated.
   - Recommendation: `date` = client-provided feedback timestamp (from `FeedbackData.date`), `created_at` = server-generated insert timestamp. The `date` column defaults to `now()` if the client doesn't provide one, matching the `FeedbackData` type where `date` is optional.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pgTAP (PostgreSQL extension, Supabase-bundled) |
| Config file | `apps/supabase/supabase/config.toml` (pgTAP enabled) |
| Quick run command | `cd apps/supabase && supabase test db` |
| Full suite command | `cd apps/supabase && supabase db reset && supabase test db` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SCHM-01 | customization column exists on app_settings with correct type | unit (pgTAP) | `cd apps/supabase && supabase test db` | Wave 0 |
| SCHM-01 | anon can SELECT customization from app_settings | unit (pgTAP) | `cd apps/supabase && supabase test db` | Wave 0 |
| SCHM-01 | admin can UPDATE customization on app_settings | unit (pgTAP) | `cd apps/supabase && supabase test db` | Wave 0 |
| SCHM-02 | feedback table exists with all columns and CHECK constraint | unit (pgTAP) | `cd apps/supabase && supabase test db` | Wave 0 |
| SCHM-02 | anon can INSERT feedback (valid data) | unit (pgTAP) | `cd apps/supabase && supabase test db` | Wave 0 |
| SCHM-02 | anon cannot SELECT/UPDATE/DELETE feedback | unit (pgTAP) | `cd apps/supabase && supabase test db` | Wave 0 |
| SCHM-02 | admin can SELECT and DELETE feedback | unit (pgTAP) | `cd apps/supabase && supabase test db` | Wave 0 |
| SCHM-02 | CHECK constraint rejects feedback without rating AND description | unit (pgTAP) | `cd apps/supabase && supabase test db` | Wave 0 |
| SCHM-02 | rate limiting rejects excessive inserts from same IP | unit (pgTAP) | `cd apps/supabase && supabase test db` | Wave 0 |
| SCHM-03 | terms_of_use_accepted column exists on candidates | unit (pgTAP) | `cd apps/supabase && supabase test db` | Wave 0 |
| SCHM-03 | candidate can UPDATE own terms_of_use_accepted | unit (pgTAP) | `cd apps/supabase && supabase test db` | Wave 0 |
| SCHM-04 | upsert_answers function is SECURITY INVOKER | unit (pgTAP) | `cd apps/supabase && supabase test db` | Wave 0 |
| SCHM-04 | upsert_answers merges answers when overwrite=false | unit (pgTAP) | `cd apps/supabase && supabase test db` | Wave 0 |
| SCHM-04 | upsert_answers replaces answers when overwrite=true | unit (pgTAP) | `cd apps/supabase && supabase test db` | Wave 0 |
| SCHM-04 | upsert_answers triggers validate_answers_jsonb | unit (pgTAP) | `cd apps/supabase && supabase test db` | Wave 0 |
| SCHM-04 | candidate can upsert own answers, not another's | unit (pgTAP) | `cd apps/supabase && supabase test db` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd apps/supabase && supabase test db`
- **Per wave merge:** `cd apps/supabase && supabase db reset && supabase test db`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/supabase/supabase/tests/database/10-schema-migrations.test.sql` -- covers SCHM-01, SCHM-02, SCHM-03, SCHM-04
- [ ] Update `apps/supabase/supabase/tests/database/00-helpers.test.sql` -- add `feedback_a`/`feedback_b` test_id entries and feedback rows in `create_test_data()`
- [ ] No framework install needed -- pgTAP already configured

## Sources

### Primary (HIGH confidence)
- `apps/supabase/supabase/schema/007-app-settings.sql` -- current app_settings table structure (7 lines, simple table)
- `apps/supabase/supabase/schema/003-entities.sql` -- candidates table with all current columns
- `apps/supabase/supabase/schema/006-answers-jsonb.sql` -- answers JSONB storage, validate_answers_jsonb() trigger, TODO comment for upsert RPC
- `apps/supabase/supabase/schema/010-rls.sql` -- all 80+ RLS policies, patterns for standard and custom policies
- `apps/supabase/supabase/schema/013-auth-rls.sql` -- column-level GRANT pattern for candidates/organizations
- `apps/supabase/supabase/tests/database/00-helpers.test.sql` -- test infrastructure, create_test_data(), test_id() mappings
- `apps/supabase/supabase/tests/database/07-rpc-security.test.sql` -- SECURITY INVOKER/DEFINER testing patterns
- `.claude/skills/database/SKILL.md` -- comprehensive database conventions and patterns
- `.claude/skills/database/extension-patterns.md` -- step-by-step guides for adding tables, RLS, tests
- `frontend/src/lib/api/base/feedbackWriter.type.ts` -- FeedbackData type definition
- `frontend/src/lib/api/base/dataWriter.type.ts` -- LocalizedCandidateData, termsOfUseAccepted, SetAnswersOptions types
- `frontend/src/lib/contexts/app/appCustomization.type.ts` -- AppCustomization type with Image references
- `packages/supabase-types/src/column-map.ts` -- COLUMN_MAP/PROPERTY_MAP bridge

### Secondary (MEDIUM confidence)
- [Neon Rate Limiting Guide](https://neon.com/guides/rate-limiting) -- PostgreSQL trigger-based rate limiting with advisory locks
- [PostgREST Header Hacking](https://dev.to/burggraf/hacking-the-postgrest-headers-oh-the-things-you-can-do-ck2) -- `current_setting('request.headers', true)` for IP extraction
- [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security) -- RLS policy patterns

### Tertiary (LOW confidence)
- None -- all findings verified against primary sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new packages, all tools already in project
- Architecture: HIGH -- all patterns have direct reference implementations in the codebase
- Pitfalls: HIGH -- identified from actual codebase constraints (column-level grants, rate limit table exposure, RLS with INSERT)
- Code examples: HIGH -- derived from existing schema files and established patterns

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (stable domain -- PostgreSQL/Supabase patterns change slowly)
