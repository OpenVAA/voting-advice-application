# Phase 27: AdminWriter - Research

**Researched:** 2026-03-19
**Domain:** Supabase adapter admin methods (question custom data merge + job result persistence)
**Confidence:** HIGH

## Summary

Phase 27 implements two existing stub methods in the Supabase DataWriter: `_updateQuestion` (JSONB merge of question custom_data) and `_insertJobResult` (persisting completed job records to a new admin_jobs table). Both are used by LLM-powered admin features (argument condensation and question-info generation) that run server-side.

The scope is narrow and well-defined. The question custom_data merge follows the established `upsert_answers` RPC pattern (SECURITY INVOKER, JSONB merge, existing RLS enforcement). The admin_jobs table is a new table but simpler than typical content tables -- it stores historical job records with no published/anon-access pattern. The in-memory job management (start/abort/progress) stays unchanged.

**Primary recommendation:** Create a single migration file with the admin_jobs table + question custom_data merge RPC, then implement the two TypeScript adapter methods using PostgREST insert for jobs and RPC call for question update.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Implement only the two existing stubs: `_updateQuestion()` and `_insertJobResult()`
- No new admin CRUD methods (createQuestion, deleteQuestion, entity management) -- deferred to later
- These LLM-powered admin features (question-info generation, argument condensation) are experimental/low priority -- straightforward implementation is fine
- Create a merge RPC for updating question `custom_data` JSONB column (arguments, infoSections, terms, video)
- RPC does JSONB merge: preserves existing custom_data keys not in the update
- If a generic JSONB merge approach is feasible (similar pattern to `upsert_answers`), prefer that -- but not required
- RPC uses SECURITY INVOKER so existing `admin_update_questions` RLS policy handles authorization -- no duplicate `can_access_project()` check in the RPC
- Create a new `admin_jobs` table in Supabase for storing job results
- Table stores: jobId, jobType, electionId, author, endStatus, timestamps, input/output JSONB, messages, metadata
- RLS: admin-only access (project_admin, account_admin, super_admin via `can_access_project()`)
- `_insertJobResult()` writes to this table via PostgREST or RPC
- Leave the in-memory job store and SvelteKit API routes (start/abort/progress/active/past) as-is

### Claude's Discretion
- Exact admin_jobs table schema (column types, indexes, constraints)
- Whether the question custom data RPC is generic or question-specific
- Migration file naming and placement
- Test approach for the two adapter methods
- Whether to update `supportsAdminApp` flag from false to true

### Deferred Ideas (OUT OF SCOPE)
- Migrate in-memory job management (start/abort/progress) to Supabase admin_jobs table -- future phase
- Admin CRUD methods for questions (create, delete, reorder) -- future phase
- Admin CRUD methods for entities (candidates, organizations) -- future phase
- Admin app UI -- separate milestone after adapter migration (already noted in PROJECT.md)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ADMN-01 | AdminWriter adapter for question/entity management operations | Question custom_data merge RPC + `_updateQuestion` implementation. Entity management deferred per CONTEXT.md -- only question custom_data update is in scope. |
| ADMN-02 | Job management operations (start, abort, progress) | `_insertJobResult` implementation writing to new admin_jobs table. Start/abort/progress stay in-memory (per CONTEXT.md locked decision). |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | (existing) | PostgREST client for admin_jobs insert + RPC call for question update | Already in use throughout adapter |
| PostgreSQL (JSONB `||` operator) | 15+ | Deep merge of custom_data JSONB column | Native, performant, consistent with upsert_answers pattern |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| pgTAP | (existing) | Database testing for new table + RPC | Required for all schema changes |
| vitest | (existing) | TypeScript unit tests for adapter methods | If testing adapter methods (discretionary) |

No new dependencies needed. All tooling is already established.

## Architecture Patterns

### Recommended File Structure
```
apps/supabase/supabase/
  schema/
    019-admin-jobs.sql                    # New: admin_jobs table + merge_custom_data RPC
  migrations/
    00004_admin_jobs_and_merge_rpc.sql    # New: migration for above
  tests/database/
    10-schema-migrations.test.sql         # Extend: add admin_jobs + RPC tests

frontend/src/lib/api/adapters/supabase/dataWriter/
    supabaseDataWriter.ts                 # Modify: replace 2 stubs
```

### Pattern 1: Question Custom Data Merge RPC

**What:** A SECURITY INVOKER RPC that merges caller-provided JSONB keys into the question's `custom_data` column, preserving existing keys not in the update.

**When to use:** When admin features (question-info, argument-condensation) generate new custom_data fields and need to save them without overwriting unrelated custom_data.

**Design decision -- generic vs. question-specific:** A generic approach is feasible. The RPC accepts a question id and a JSONB patch object. It uses the `||` merge operator on the `custom_data` column. This is simpler than the `upsert_answers` RPC because there is no null-stripping or overwrite-mode needed -- just a shallow JSONB merge.

```sql
-- Source: modeled after upsert_answers in 006-answers-jsonb.sql
CREATE OR REPLACE FUNCTION merge_custom_data(
  question_id uuid,
  patch       jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  updated_data jsonb;
BEGIN
  UPDATE questions
  SET custom_data = COALESCE(custom_data, '{}'::jsonb) || patch
  WHERE id = question_id
  RETURNING questions.custom_data INTO updated_data;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Question not found or access denied: %', question_id;
  END IF;

  RETURN updated_data;
END;
$$;

GRANT EXECUTE ON FUNCTION merge_custom_data(uuid, jsonb) TO authenticated;
```

**Key design points:**
- SECURITY INVOKER: existing `admin_update_questions` RLS policy on the questions table enforces `can_access_project(project_id)`. No duplicate auth check in the RPC.
- `COALESCE(custom_data, '{}'::jsonb) || patch`: handles NULL custom_data safely, merges at top level.
- Returns the updated custom_data for potential use by caller (though current callers don't need it).
- The `set_updated_at` trigger fires automatically on the UPDATE.

### Pattern 2: Admin Jobs Table

**What:** A purpose-built table for storing completed job results. NOT a content table (no published/anon access, no external_id, no localized columns).

**When to use:** After a background job (argument condensation, question-info generation) completes, fails, or is aborted, the result record is persisted here.

**Design decision -- table design:**

The admin_jobs table differs from standard content tables:
- No `published` column (admin-only visibility)
- No `external_id` system (not bulk-imported)
- No localized JSONB columns (name, short_name, info)
- No `image` column (no storage cleanup triggers)
- No `sort_order`, `subtype`, `color`, `is_generated`

It is a simpler admin audit/history table.

```sql
CREATE TABLE admin_jobs (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid          NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  job_id          text          NOT NULL,
  job_type        text          NOT NULL,
  election_id     uuid          REFERENCES elections(id) ON DELETE SET NULL,
  author          text          NOT NULL,
  end_status      text          NOT NULL CHECK (end_status IN ('completed', 'failed', 'aborted')),
  start_time      timestamptz,
  end_time        timestamptz,
  input           jsonb,
  output          jsonb,
  messages        jsonb,
  metadata        jsonb,
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON admin_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_admin_jobs_project_id ON admin_jobs (project_id);
CREATE INDEX idx_admin_jobs_election_id ON admin_jobs (election_id);
CREATE INDEX idx_admin_jobs_job_type ON admin_jobs (job_type);
```

**Schema mapping to AdminJobRecord type:**

| TypeScript field | DB column | Type | Notes |
|------------------|-----------|------|-------|
| `jobId` | `job_id` | text | UUID string from in-memory job store |
| `jobType` | `job_type` | text | AdminFeature string ('ArgumentCondensation', 'QuestionInfoGeneration') |
| `electionId` | `election_id` | uuid | FK to elections, SET NULL on delete |
| `author` | `author` | text | Admin email address |
| `endStatus` | `end_status` | text | CHECK constraint: completed/failed/aborted |
| `startTime` | `start_time` | timestamptz | ISO string from caller |
| `endTime` | `end_time` | timestamptz | ISO string from caller |
| `input` | `input` | jsonb | Serializable input params |
| `output` | `output` | jsonb | Serializable output data |
| `messages` | `messages` | jsonb | Array of JobMessage objects |
| `metadata` | `metadata` | jsonb | Extra context (questionsProcessed, error, etc.) |

### Pattern 3: Admin Jobs RLS

**What:** Admin-only access using `can_access_project()` -- no anon access, no public reads.

```sql
ALTER TABLE admin_jobs ENABLE ROW LEVEL SECURITY;

-- Only admins can read job results for their project
CREATE POLICY "admin_select_admin_jobs" ON admin_jobs
  FOR SELECT TO authenticated
  USING ((SELECT can_access_project(project_id)));

-- Only admins can insert job results
CREATE POLICY "admin_insert_admin_jobs" ON admin_jobs
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT can_access_project(project_id)));

-- Only admins can delete job results (cleanup)
CREATE POLICY "admin_delete_admin_jobs" ON admin_jobs
  FOR DELETE TO authenticated
  USING ((SELECT can_access_project(project_id)));
```

No anon SELECT policy (unlike content tables). No UPDATE policy needed -- job records are immutable once inserted.

### Pattern 4: TypeScript Adapter Methods

**_updateQuestion implementation:**

```typescript
protected async _updateQuestion({
  id,
  data: { customData }
}: SetQuestionOptions): DWReturnType<DataApiActionResult> {
  if (!customData || typeof customData !== 'object')
    throw new Error(`Expected a customData object but got type: ${typeof customData}`);

  const { error } = await this.supabase.rpc('merge_custom_data', {
    question_id: id,
    patch: customData
  });
  if (error) throw new Error(`updateQuestion: ${error.message}`);
  return { type: 'success' as const };
}
```

**_insertJobResult implementation:**

The challenge: `AdminJobRecord` does not include `project_id`, but the admin_jobs table requires it. The caller (generateQuestionInfo / condenseArguments) provides `electionId` but not `projectId`. The adapter needs to resolve project_id from election_id.

```typescript
protected async _insertJobResult({
  data
}: InsertJobResultOptions): DWReturnType<DataApiActionResult> {
  // Resolve project_id from election_id
  const { data: election, error: electionError } = await this.supabase
    .from('elections')
    .select('project_id')
    .eq('id', data.electionId)
    .single();
  if (electionError || !election)
    throw new Error(`Failed to resolve project for election: ${electionError?.message ?? 'not found'}`);

  const { error } = await this.supabase.from('admin_jobs').insert({
    project_id: election.project_id,
    job_id: data.jobId,
    job_type: data.jobType,
    election_id: data.electionId,
    author: data.author,
    end_status: data.endStatus,
    start_time: data.startTime ?? null,
    end_time: data.endTime ?? null,
    input: data.input ?? null,
    output: data.output ?? null,
    messages: data.messages ?? null,
    metadata: data.metadata ?? null
  });
  if (error) throw new Error(`insertJobResult: ${error.message}`);
  return { type: 'success' as const };
}
```

### Anti-Patterns to Avoid
- **Adding all content table columns to admin_jobs:** This is an audit/history table, not a content table. Don't add published, external_id, name, short_name, info, image, etc.
- **Checking can_access_project() inside the RPC:** SECURITY INVOKER + existing RLS handles this. Duplicate checks add latency and maintenance burden.
- **Using SECURITY DEFINER for merge_custom_data:** Would bypass RLS and require manual auth checks.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSONB merge | Manual key-by-key SQL loop | PostgreSQL `||` operator | Native, atomic, handles NULL coalescing |
| Admin authorization | Custom auth check in RPC | SECURITY INVOKER + existing RLS | `admin_update_questions` policy already exists |
| Project resolution | Store project_id in AdminJobRecord type | Query from elections table | AdminJobRecord type is shared with Strapi; adding project_id would require interface changes |

## Common Pitfalls

### Pitfall 1: Forgetting project_id for admin_jobs INSERT
**What goes wrong:** AdminJobRecord type doesn't include project_id, but the table requires it for RLS.
**Why it happens:** The TypeScript type was designed for Strapi where project context was implicit.
**How to avoid:** Resolve project_id from election_id before inserting. Every job has an electionId.
**Warning signs:** RLS silently blocks the INSERT (no error thrown, but row not created) if project_id doesn't match the admin's project.

### Pitfall 2: Deep merge vs. shallow merge for custom_data
**What goes wrong:** The `||` operator does a shallow merge at the top level. If custom_data already has `{"arguments": [...existing...]}` and the update provides `{"arguments": [...new...]}`, the existing arguments are replaced entirely.
**Why it happens:** JSONB `||` replaces top-level keys, it doesn't recursively merge nested objects/arrays.
**How to avoid:** This is actually the **desired behavior** for this use case. The callers (condenseArguments, generateQuestionInfo) always provide complete replacement values for their respective keys. The RPC preserves *other* top-level keys (e.g., updating `arguments` doesn't touch `terms` or `video`).
**Warning signs:** None -- this is correct for the current callers.

### Pitfall 3: Not granting EXECUTE to authenticated role
**What goes wrong:** RPC call returns permission denied.
**Why it happens:** New functions default to public EXECUTE in some configs, but Supabase revokes default grants.
**How to avoid:** Always add `GRANT EXECUTE ON FUNCTION merge_custom_data(uuid, jsonb) TO authenticated;`

### Pitfall 4: supportsAdminApp flag decision
**What goes wrong:** If set to true prematurely, the admin app loads but other admin features may not work (Edge Functions not yet migrated in Phase 28).
**Why it happens:** The flag gates the entire admin app UI in `admin/+layout.svelte`.
**How to avoid:** Keep `supportsAdminApp: false` for now. The two methods being implemented are called from server-side code (page server actions), not from the admin app UI directly. The admin app already works with the Strapi adapter for the full admin experience. Changing this flag should wait until all admin adapter methods are complete.

## Code Examples

### Existing upsert_answers RPC (reference pattern)
```sql
-- Source: apps/supabase/supabase/schema/006-answers-jsonb.sql
CREATE OR REPLACE FUNCTION upsert_answers(
  entity_id uuid,
  answers   jsonb,
  overwrite boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
-- ... merge logic with || operator, null stripping, RETURNING ...
$$;
GRANT EXECUTE ON FUNCTION upsert_answers(uuid, jsonb, boolean) TO authenticated;
```

### How callers invoke updateQuestion
```typescript
// Source: frontend/src/lib/server/admin/features/condenseArguments.ts
const result = await dataWriter.updateQuestion({
  id: question.id,
  authToken,
  data: {
    customData: {
      arguments: condensedArguments  // Array<LocalizedQuestionArguments>
    }
  }
});
```

### How callers invoke insertJobResult
```typescript
// Source: frontend/src/lib/server/admin/features/generateQuestionInfo.ts
await dataWriter.insertJobResult({
  authToken,
  data: {
    jobId,
    jobType,
    electionId,
    author,
    startTime,
    endTime: new Date().toISOString(),
    input: inputParams,
    output: results as unknown as Array<Serializable>,
    messages: getAllMessagesFromJob(jobId),
    endStatus: 'completed',
    metadata: { questionsProcessed: results.length }
  }
});
```

### AdminJobRecord type (from dataWriter.type.ts)
```typescript
export type AdminJobRecord = {
  jobId: JobInfo['id'];
  jobType: AdminFeature;
  electionId: Id;
  author: string;
  endStatus: 'completed' | 'failed' | 'aborted';
  startTime?: string;
  endTime?: string;
  input?: Serializable;
  output?: Serializable;
  messages?: Array<JobMessage>;
  metadata?: Serializable;
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Strapi custom endpoint for question update | Supabase RPC for JSONB merge | Phase 27 | Direct DB operation, no middleware layer |
| Strapi API for job result storage | Supabase PostgREST insert to admin_jobs | Phase 27 | RLS-protected, tenant-isolated |

**No deprecated/outdated patterns to flag.** The SECURITY INVOKER + RLS approach was established in Phase 22 and used consistently since.

## Open Questions

1. **COLUMN_MAP entries for admin_jobs**
   - What we know: The admin_jobs table uses snake_case columns (job_id, job_type, etc.) that differ from the AdminJobRecord's camelCase properties.
   - What's unclear: Whether COLUMN_MAP entries are needed depends on whether we use `toDataObject`/`mapRow` utilities for the admin_jobs table.
   - Recommendation: No COLUMN_MAP entries needed. The `_insertJobResult` method manually maps properties inline (like `_updateEntityProperties` does). The admin_jobs table is not read through the data provider pipeline that uses COLUMN_MAP. Add entries `job_id: 'jobId'`, `job_type: 'jobType'`, `end_status: 'endStatus'`, `start_time: 'startTime'`, `end_time: 'endTime'`, `election_id: 'electionId'` only if future phases need to read admin_jobs through the standard mapping utilities.

2. **supportsAdminApp flag**
   - What we know: Currently false for Supabase adapter. The admin UI checks this flag.
   - What's unclear: Whether implementing these two methods is sufficient to warrant changing it to true.
   - Recommendation: Keep false. The two methods are called from server-side code that runs regardless of this flag. The flag gates the admin UI, which needs more than just these two methods to work fully. Changing it would be premature.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pgTAP (database tests) + vitest (TypeScript tests) |
| Config file | apps/supabase/supabase/config.toml (pgTAP) |
| Quick run command | `cd apps/supabase && supabase test db` |
| Full suite command | `cd apps/supabase && supabase db reset && supabase test db` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ADMN-01 | merge_custom_data RPC merges JSONB keys correctly | unit (pgTAP) | `cd apps/supabase && supabase test db` | Extend 10-schema-migrations.test.sql |
| ADMN-01 | merge_custom_data RPC respects RLS (admin-only) | unit (pgTAP) | `cd apps/supabase && supabase test db` | Extend 10-schema-migrations.test.sql |
| ADMN-01 | _updateQuestion calls RPC and returns success | manual-only | -- | TypeScript method is thin wrapper; tested via pgTAP RPC tests |
| ADMN-02 | admin_jobs table exists with correct schema | unit (pgTAP) | `cd apps/supabase && supabase test db` | Extend 10-schema-migrations.test.sql |
| ADMN-02 | admin_jobs RLS blocks non-admin access | unit (pgTAP) | `cd apps/supabase && supabase test db` | Extend 10-schema-migrations.test.sql |
| ADMN-02 | admin can insert and select job records | unit (pgTAP) | `cd apps/supabase && supabase test db` | Extend 10-schema-migrations.test.sql |
| ADMN-02 | _insertJobResult resolves project_id and inserts | manual-only | -- | TypeScript method is thin wrapper; tested via pgTAP table/RLS tests |

### Sampling Rate
- **Per task commit:** `cd apps/supabase && supabase test db`
- **Per wave merge:** Full suite with `supabase db reset && supabase test db`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Extend `apps/supabase/supabase/tests/database/10-schema-migrations.test.sql` -- covers ADMN-01 (RPC) and ADMN-02 (admin_jobs table + RLS)
- [ ] Add test_id entry for admin_jobs test data in `00-helpers.test.sql`

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis of all referenced files in CONTEXT.md canonical_refs
- `apps/supabase/supabase/schema/006-answers-jsonb.sql` -- upsert_answers RPC pattern
- `apps/supabase/supabase/schema/012-auth-hooks.sql` -- can_access_project() function
- `apps/supabase/supabase/schema/010-rls.sql` -- admin_update_questions RLS policy
- `apps/supabase/supabase/schema/004-questions.sql` -- questions table with custom_data column
- `frontend/src/lib/api/base/dataWriter.type.ts` -- AdminJobRecord, SetQuestionOptions types
- `frontend/src/lib/api/adapters/strapi/dataWriter/strapiDataWriter.ts` -- Strapi reference implementation
- `frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` -- Current stubs
- `frontend/src/lib/server/admin/features/generateQuestionInfo.ts` -- updateQuestion + insertJobResult caller
- `frontend/src/lib/server/admin/features/condenseArguments.ts` -- updateQuestion + insertJobResult caller

### Secondary (MEDIUM confidence)
- `.claude/skills/database/SKILL.md` -- Schema conventions, RLS patterns, pgTAP testing conventions
- `.claude/skills/database/extension-patterns.md` -- New table and RLS checklist

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all patterns established in prior phases
- Architecture: HIGH -- follows existing RPC and table patterns; callers are well understood
- Pitfalls: HIGH -- based on direct code analysis of existing patterns and caller behavior

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable domain, no external dependencies)
