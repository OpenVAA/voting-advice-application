# Phase 27: AdminWriter - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement the two existing admin-specific adapter stubs in the Supabase DataWriter: `_updateQuestion` (question custom data merge) and `_insertJobResult` (job result persistence). Create supporting database infrastructure (admin_jobs table, question custom data merge RPC). The in-memory job management API routes (start/abort/progress) are left as-is.

There is no separate AdminWriter class — admin methods are part of the DataWriter interface. This phase does NOT add new CRUD methods; future entity/question CRUD will be added later.

</domain>

<decisions>
## Implementation Decisions

### Scope
- Implement only the two existing stubs: `_updateQuestion()` and `_insertJobResult()`
- No new admin CRUD methods (createQuestion, deleteQuestion, entity management) — deferred to later
- These LLM-powered admin features (question-info generation, argument condensation) are experimental/low priority — straightforward implementation is fine

### Question custom data update
- Create a merge RPC for updating question `custom_data` JSONB column (arguments, infoSections, terms, video)
- RPC does JSONB merge: preserves existing custom_data keys not in the update
- If a generic JSONB merge approach is feasible (similar pattern to `upsert_answers`), prefer that — but not required
- RPC uses SECURITY INVOKER so existing `admin_update_questions` RLS policy handles authorization — no duplicate `can_access_project()` check in the RPC

### Job result persistence
- Create a new `admin_jobs` table in Supabase for storing job results
- Table stores: jobId, jobType, electionId, author, endStatus, timestamps, input/output JSONB, messages, metadata
- RLS: admin-only access (project_admin, account_admin, super_admin via `can_access_project()`)
- `_insertJobResult()` writes to this table via PostgREST or RPC

### Job management routes
- Leave the in-memory job store and SvelteKit API routes (start/abort/progress/active/past) as-is
- TODO: migrate in-memory job management to Supabase admin_jobs table in a future phase

### Claude's Discretion
- Exact admin_jobs table schema (column types, indexes, constraints)
- Whether the question custom data RPC is generic or question-specific
- Migration file naming and placement
- Test approach for the two adapter methods
- Whether to update `supportsAdminApp` flag from false to true

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### DataWriter interface (admin methods)
- `frontend/src/lib/api/base/dataWriter.type.ts` — SetQuestionOptions type (customData: {arguments, infoSections, terms, video}), InsertJobResultOptions, AdminJobRecord, JobInfo types
- `frontend/src/lib/api/base/universalDataWriter.ts` — Abstract base class; `_updateQuestion` and `_insertJobResult` are adapter-specific protected methods

### Strapi implementation (reference for behavior)
- `frontend/src/lib/api/adapters/strapi/dataWriter/strapiDataWriter.ts` — Strapi's `_updateQuestion` posts to `api/question/:id/update-custom-data`; `_insertJobResult` posts to `api/admin-jobs`

### Supabase adapter (stubs to replace)
- `frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` — Current stubs throwing 'not implemented'

### Database schema
- `apps/supabase/supabase/schema/004-questions.sql` — Questions table with `custom_data` JSONB column
- `apps/supabase/supabase/schema/010-rls.sql` — `admin_update_questions` RLS policy using `can_access_project()`
- `apps/supabase/supabase/schema/006-answers-jsonb.sql` — `upsert_answers` RPC as reference pattern for JSONB merge approach
- `apps/supabase/supabase/schema/012-auth-hooks.sql` — `can_access_project()` helper function for admin role validation

### Admin routes (context, not modified)
- `frontend/src/routes/[[lang=locale]]/api/admin/jobs/` — In-memory job management API routes (not modified in this phase)
- `frontend/src/routes/[[lang=locale]]/admin/(protected)/question-info/+page.server.ts` — Uses startJob, getJobProgress, insertJobResult, updateQuestion
- `frontend/src/routes/[[lang=locale]]/admin/(protected)/argument-condensation/+page.server.ts` — Uses startJob, getJobProgress, insertJobResult

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `upsert_answers` RPC: Reference for JSONB merge pattern with SECURITY INVOKER — similar approach can be used for question custom_data
- `can_access_project()`: Admin role checker already used by question RLS policies — no new auth infrastructure needed
- `mapRow` / `mapRowToDb`: Row mapping utilities for snake_case/camelCase conversion
- Existing admin RLS policies: `admin_insert_questions`, `admin_update_questions`, `admin_delete_questions` already handle question access control

### Established Patterns
- Supabase adapter exposes client directly — PostgREST query builder is the abstraction (Phase 23)
- Auth is cookie-based; `authToken` params ignored by Supabase adapter (Phase 24)
- SECURITY INVOKER RPCs let RLS handle authorization (Phase 22, 26)
- Questions table has both `questions` and `question_categories` — custom_data is on the `questions` table

### Integration Points
- `frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` — Replace 2 stub methods with implementations
- `apps/supabase/supabase/migrations/` — New migration for admin_jobs table and question custom data merge RPC
- `apps/supabase/supabase/tests/` — pgTAP tests for new table and RPC

</code_context>

<specifics>
## Specific Ideas

- The question custom data merge RPC should ideally follow a generic JSONB merge pattern similar to upsert_answers, but a question-specific implementation is acceptable
- Job result persistence is for historical records only — active job management stays in-memory for now

</specifics>

<deferred>
## Deferred Ideas

- Migrate in-memory job management (start/abort/progress) to Supabase admin_jobs table — future phase
- Admin CRUD methods for questions (create, delete, reorder) — future phase
- Admin CRUD methods for entities (candidates, organizations) — future phase
- Admin app UI — separate milestone after adapter migration (already noted in PROJECT.md)

</deferred>

---

*Phase: 27-adminwriter*
*Context gathered: 2026-03-19*
