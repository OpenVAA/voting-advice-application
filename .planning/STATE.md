---
gsd_state_version: 1.0
milestone: v3.0
milestone_name: Frontend Adapter
status: phase_complete
stopped_at: Phase 26 verified and complete
last_updated: "2026-03-19T15:32:00.000Z"
progress:
  total_phases: 9
  completed_phases: 5
  total_plans: 16
  completed_plans: 16
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-18)

**Core value:** A reliable, well-tested VAA framework that developers can confidently extend, customize, and deploy for real elections.
**Current focus:** Phase 26 — datawriter

## Current Position

Phase: 26 (datawriter) — COMPLETED
Plan: 3 of 3 (all complete)

## Performance Metrics

**Velocity:**

- Total plans completed: 4 (v3.0)
- Average duration: 6min
- Total execution time: 22min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 22 | 4 | 22min | 6min |

*Updated after each plan completion*
| Phase 22 P01 | 6min | 3 tasks | 5 files |
| Phase 22 P02 | 8min | 3 tasks | 4 files |
| Phase 22 P03 | 6min | 1 tasks | 2 files |
| Phase 22 P04 | 2min | 2 tasks | 2 files |
| Phase 22 P04 | 2min | 2 tasks | 2 files |
| Phase 23 P01 | 3min | 3 tasks | 7 files |
| Phase 23 P02 | 2min | 3 tasks | 10 files |
| Phase 24 P01 | 3min | 2 tasks | 3 files |
| Phase 24 P02 | 4min | 2 tasks | 9 files |
| Phase 24 P03 | 6min | 2 tasks | 17 files |
| Phase 25 P02 | 2min | 2 tasks | 3 files |
| Phase 25 P01 | 2 | 2 tasks | 6 files |
| Phase 25 P03 | 3min | 2 tasks | 2 files |
| Phase 25 P04 | 6min | 2 tasks | 2 files |
| Phase 26 P01 | 10min | 2 tasks | 9 files |
| Phase 26 P02 | 5min | 2 tasks | 4 files |
| Phase 26 P03 | 3min | 2 tasks | 2 files |

## Accumulated Context

### Decisions

- [22-01] upsert_answers uses SECURITY INVOKER so RLS candidate_update_own policy enforces row-level access
- [22-01] Null-value stripping in upsert_answers supports remove-answer semantics from the frontend adapter
- [22-01] Single UPDATE per branch ensures validate_answers_jsonb trigger fires exactly once
- [22-02] Private schema for rate limit counter table (not exposed by PostgREST API)
- [22-02] Advisory lock prevents race conditions on concurrent feedback inserts
- [22-03] RLS silent deny pattern (lives_ok + verify-unchanged) for UPDATE without policy, vs throws_ok for INSERT without policy
- [Phase 22-04]: customization column needs no COLUMN_MAP entry (single word, identical in snake/camel case)
- [Phase 22-04]: feedback table columns already covered by existing COLUMN_MAP entries
- [Phase 23-01]: SupabaseDataAdapter has supportsAdminApp: false (admin app not yet supported by Supabase backend)
- [Phase 23-01]: getLocalized defaults to 'en' as defaultLocale parameter, matching SQL function convention
- [Phase 23-01]: mapRow casts COLUMN_MAP/PROPERTY_MAP to Record<string,string> for index signature flexibility
- [Phase 23]: supabaseAdapterMixin exposes Supabase client directly (no apiGet/apiPost wrappers) -- PostgREST query builder IS the abstraction
- [Phase 23]: Stub methods throw descriptive errors ('ClassName._methodName not implemented') for clear debugging during incremental development
- [Phase 24]: Supabase _logout uses signOut({ scope: 'local' }) for current-session-only termination
- [Phase 24]: Public logout override bypasses UniversalDataWriter dual POST+backendLogout (Supabase handles everything via signOut)
- [Phase 24]: _setPassword and _resetPassword ignore legacy params (currentPassword, authToken, code); Supabase uses session-based auth
- [Phase 24]: Auth callback redirectTo uses window.location.origin client-side, empty string server-side
- [Phase 24]: AuthContext.isAuthenticated derived via derived(page, (p) => !!p.data.session) -- single source of truth for auth state
- [Phase 24]: Empty string authToken passed to DataWriter methods -- Supabase adapter ignores it (cookie-based auth)
- [Phase 24]: Unified candidate/admin route guard in hooks.server.ts section 4 instead of separate blocks
- [Phase 24]: Login form actions use DataWriter.login() with role verification via getBasicUserData
- [Phase 24]: candidateUserDataStore takes isAuthenticated: Readable<boolean> instead of authToken: Readable<string|undefined>
- [Phase 24]: Admin server pages use serverClient: locals.supabase for session-based auth instead of AUTH_TOKEN_KEY cookie
- [Phase 24]: hasAuthHeaders inlined into universalAdapter.ts; authHeaders.ts deleted per user decision
- [Phase 25]: LANGUAGE sql (not plpgsql) for get_nominations RPC -- simpler and inlineable by query planner
- [Phase 25]: SECURITY INVOKER for get_nominations RPC enforces RLS on nominations and all entity tables
- [Phase 25]: entity_answers COALESCE from candidates and organizations only (factions/alliances have no answers column)
- [Phase 25]: DPDataType uses Array | Tree union types to match DataRoot provision methods
- [Phase 25-01]: parseStoredImage takes supabaseUrl as parameter for pure testability -- caller provides from constants.PUBLIC_SUPABASE_URL
- [Phase 25-01]: STANDARD_LOCALIZED_FIELDS constant centralizes the 3 common localized columns (name, short_name, info)
- [Phase 25-01]: localizeRow shallow-clones nested objects at each level to guarantee zero mutation of input rows
- [Phase 25]: ElectionData uses date/round/subtype (not electionDate/currentRound/electionType) -- manual renames after toDataObject override COLUMN_MAP
- [Phase 25]: Constituency keywords localized as single string then split by comma+whitespace regex -- matches existing data convention
- [Phase 25]: _getConstituencyData fetches all constituencies unfiltered while id filter only applies to constituency_groups
- [Phase 25]: parseAnswers mocked in tests to isolate from svelte/store dependency chain
- [Phase 25]: Entity deduplication in getNominationData uses Map for O(1) lookup instead of array-based dedup
- [Phase 25]: Question category electionId filtering done client-side (JSONB array fields not easily filterable via PostgREST)
- [Phase 26-01]: Write methods return narrower types (LocalizedAnswers, UpdatedEntityProps) instead of full LocalizedCandidateData -- enables adapters to return only what RPC provides
- [Phase 26-01]: candidateUserDataStore.save() uses inline savedData.update() for partial merges instead of full-entity replacement via updateCandidateData
- [Phase 26-01]: Register page redirects to password page when email param present (invite-based flow) instead of registration key form
- [Phase 26-02]: _getBasicUserData decodes JWT access_token to extract user_roles -- no DB query for basic user data
- [Phase 26-02]: Role mapping: candidate/party -> 'candidate', admin roles -> 'admin', else null
- [Phase 26-02]: Nominations loaded via PostgREST from('nominations') filtered by candidate_id, not via get_nominations RPC
- [Phase 26]: _setAnswers uses lazy project_id fetch from candidates table (only when File objects detected) to avoid unnecessary DB queries for text-only answers
- [Phase 26]: _updateEntityProperties does NOT handle image upload -- property updates are text-only (termsOfUseAccepted)
- [Phase 26]: Storage path uses crypto.randomUUID() for collision-free filenames under {projectId}/candidates/{entityId}/

### Pending Todos

None.

### Blockers/Concerns

- Research flag: Phase 25 getNominationData may need RPC instead of PostgREST query (polymorphic table)
- Research flag: Phase 28 registration flows (GoTrue invite + Signicat OIDC) need targeted research before implementation

## Session Continuity

Last session: 2026-03-19T15:32:00Z
Stopped at: Completed 26-02-PLAN.md (all phase 26 plans complete)
Resume file: None
