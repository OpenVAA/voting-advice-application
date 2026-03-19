# Phase 26: DataWriter - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement candidate write operations in the Supabase adapter so candidates can manage questionnaire answers, profile properties, and account registration. This covers: _setAnswers (partial + overwrite), _updateEntityProperties (termsOfUseAccepted only), _register (password set after invite), _getBasicUserData, _getCandidateUserData, and image upload via the answers flow. Also includes interface cleanup: removing _checkRegistrationKey, changing return types for write methods, and moving image handling from entity properties to answers.

Admin write operations (Phase 27), Edge Function integration for invites (Phase 28), and preregistration (_preregister) are out of scope.

</domain>

<decisions>
## Implementation Decisions

### Registration flow
- Remove `_checkRegistrationKey` entirely from the DataWriter interface, abstract class, and both adapter implementations. Registration validity is implicit: user arrives via invite link, auth callback exchanges token, they go straight to password set
- `_register` just calls `updateUser({password})` — the invite session is already established by the auth callback's `verifyOtp`. No candidate row updates needed (row already exists, created by admin)
- Clean up the interface: remove `registrationKey` parameter from `_register` signature (and update both Strapi and Supabase implementations). Don't keep Strapi compatibility shims — clean break
- `_preregister` remains a stub (needs invite-candidate Edge Function from Phase 28)
- TODO: Registration is auto-triggered when the user arrives with a token — no separate "check" step

### Candidate user data derivation
- `_getBasicUserData`: extract role from JWT `user_roles` claim (no DB query). User id and email from session. Username = email. Language from user_metadata or default
- `_getCandidateUserData`: create a new `get_candidate_user_data` RPC that returns the candidate row + optionally nominations in one call
- The RPC must be generic/composable so it can be extended to work for organizations (parties) too. The Candidate App will be generalized to apply to both candidates and organizations
- Image is NOT a special entity column anymore — it's a regular answer to a question. The RPC does not need to handle image fields specially
- Nominations loading (when `loadNominations=true`) can reuse the existing `get_nominations` RPC from Phase 25, scoped to the current user's candidate

### Image handling (moved to answers)
- Image is a regular question answer, not a special `candidates.image` column property
- Image upload happens inside `_setAnswers`: detect answers containing File objects, upload to Storage (path: `{project_id}/candidates/{candidate_id}/filename`), replace File with Storage path string, then call `upsert_answers` with the path
- `_updateEntityProperties` no longer handles image upload — it only handles `termsOfUseAccepted`
- Remove `ImageWithFile` from `EditableEntityProps` (or deprecate — Claude's discretion on cleanup scope)

### Write method return types (interface changes)
- `_setAnswers` / `updateAnswers` / `overwriteAnswers`: change return type from `LocalizedCandidateData` to `LocalizedAnswers` (just the answers dict). The `upsert_answers` RPC already returns exactly this
- `_updateEntityProperties` / `updateEntityProperties`: change return type from `LocalizedCandidateData` to just the updated properties (`{termsOfUseAccepted: string | null}` or equivalent)
- `candidateUserDataStore.save()` must be updated to handle the new return types — update only the answers portion or termsOfUseAccepted field respectively, not the entire candidate object
- These are interface-level changes affecting: `dataWriter.type.ts`, `universalDataWriter.ts`, both Strapi and Supabase implementations, and `candidateUserDataStore.ts`

### Claude's Discretion
- Exact RPC SQL implementation for `get_candidate_user_data` (how to make it generic for candidates + organizations)
- Whether `_setAnswers` detects File objects by `instanceof File` check or by a type guard on the answer value structure
- Storage path generation strategy (UUID filename vs original filename)
- How to update `candidateUserDataStore` to work with partial return types (answers-only, props-only)
- Test approach: unit tests for each DataWriter method, mocking Supabase client responses

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### DataWriter interface and types
- `frontend/src/lib/api/base/dataWriter.type.ts` — DataWriter interface with all method signatures, WithAuth, LocalizedCandidateData, EditableEntityProps (all being modified)
- `frontend/src/lib/api/base/universalDataWriter.ts` — Abstract base class with public methods delegating to protected _methods (return types changing)
- `frontend/src/lib/api/adapters/strapi/dataWriter/strapiDataWriter.ts` — Strapi implementation (must be updated for interface changes)

### Existing Supabase adapter
- `frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` — Current stub class with auth methods implemented, write stubs to replace
- `frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts` — supabaseAdapterMixin providing Supabase client
- `frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts` — Existing auth method tests

### Candidate data store (affected by return type changes)
- `frontend/src/lib/contexts/candidate/candidateUserDataStore.ts` — Calls getCandidateUserData, updateAnswers, updateEntityProperties. save() method must adapt to new return types
- `frontend/src/lib/contexts/candidate/candidateContext.type.ts` — CandidateContext type with userData store

### Database schema (write operations)
- `apps/supabase/supabase/schema/006-answers-jsonb.sql` — upsert_answers RPC (merge/overwrite, null-stripping, SECURITY INVOKER)
- `apps/supabase/supabase/schema/003-entities.sql` — Candidates table with auth_user_id, image JSONB, terms_of_use_accepted
- `apps/supabase/supabase/schema/010-rls.sql` — candidate_update_own policy (auth_user_id match)
- `apps/supabase/supabase/schema/014-storage.sql` — Storage RLS policies, upload path format: {project_id}/candidates/{entity_id}/filename

### Auth infrastructure
- `apps/supabase/supabase/schema/012-auth-hooks.sql` — Custom access token hook injecting user_roles into JWT claims
- `frontend/src/routes/[[lang=locale]]/candidate/auth/callback/+server.ts` — Auth callback handling invite token exchange

### DataProvider utilities (reusable)
- `frontend/src/lib/api/adapters/supabase/utils/localizeRow.ts` — Row localization utility
- `frontend/src/lib/api/adapters/supabase/utils/mapRow.ts` — mapRow/mapRowToDb utilities
- `frontend/src/lib/api/adapters/supabase/utils/storageUrl.ts` — Storage path to URL conversion

### Existing nominations RPC
- `apps/supabase/supabase/schema/get_nominations.sql` or equivalent — get_nominations RPC from Phase 25 (reusable for loadNominations)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `upsert_answers` RPC: Already handles merge + overwrite with null-stripping. Returns updated answers JSONB — matches new return type
- `localizeRow` / `toDataObject` / `mapRow`: Phase 25 utilities for transforming DB rows to domain objects
- `parseStoredImage` / `storageUrl`: Phase 25 utility for converting Storage paths to absolute URLs (for reading; upload path construction will follow same convention)
- `get_nominations` RPC: Phase 25 RPC for loading nomination data — can be scoped per candidate
- Auth callback route: Already handles `invite` type OTP verification and redirect to `/candidate/register`

### Established Patterns
- Supabase adapter exposes client directly — PostgREST query builder is the abstraction (Phase 23)
- Auth is cookie-based; `authToken` params ignored by Supabase adapter (Phase 24)
- `candidate_update_own` RLS policy ensures candidates can only update their own row via auth_user_id match
- Storage upload path: `{project_id}/{entity_type}/{entity_id}/filename.ext`
- candidateUserDataStore derives composite state from savedData + editedAnswers + editedImage + editedTermsOfUseAccepted

### Integration Points
- `frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` — Replace 7 stub methods with implementations
- `frontend/src/lib/api/base/dataWriter.type.ts` — Remove checkRegistrationKey, change return types, clean up register signature
- `frontend/src/lib/api/base/universalDataWriter.ts` — Update abstract methods and public wrappers
- `frontend/src/lib/contexts/candidate/candidateUserDataStore.ts` — Adapt save() to partial return types
- `apps/supabase/supabase/` — New RPC: get_candidate_user_data (generic for candidates + organizations)

</code_context>

<specifics>
## Specific Ideas

- The get_candidate_user_data RPC should be generic/composable so it works for both candidates and organizations — the Candidate App will be generalized to apply to both entity types
- Image is no longer a special prop on the candidate entity — it's a regular answer to a question, stored in the answers JSONB with a Storage path value
- _setAnswers should handle File detection and Storage upload internally — the caller passes answers that may contain File objects and gets back clean answers with Storage paths
- Registration check is implicit: no separate "is this token valid?" step. User arrives via invite link, auth callback exchanges token, and they set their password

</specifics>

<deferred>
## Deferred Ideas

- _preregister implementation — needs invite-candidate Edge Function (Phase 28)
- Generalization of Candidate App to also work for organizations/parties — future phase after adapter migration
- candidateUserDataStore may need deeper refactoring when image moves fully to answers flow (removing editedImage internal store)

</deferred>

---

*Phase: 26-datawriter*
*Context gathered: 2026-03-19*
