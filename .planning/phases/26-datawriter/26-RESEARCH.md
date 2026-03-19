# Phase 26: DataWriter - Research

**Researched:** 2026-03-19
**Domain:** Supabase adapter write operations (answers, profile, registration, user data)
**Confidence:** HIGH

## Summary

Phase 26 implements candidate write operations in the Supabase DataWriter adapter: answer management via the existing `upsert_answers` RPC, profile updates (termsOfUseAccepted only -- image moves to answers flow), candidate registration (password set after invite), and user data retrieval from Supabase session/JWT. It also involves significant interface cleanup: removing `_checkRegistrationKey`, changing return types for write methods from `LocalizedCandidateData` to narrower types, and updating `candidateUserDataStore` to handle partial returns.

The codebase already provides most infrastructure: the `upsert_answers` RPC handles merge/overwrite with null-stripping and returns the updated answers JSONB directly; Storage RLS policies allow candidates to upload to their own folder (`{project_id}/candidates/{entity_id}/filename`); auth callback already handles invite token exchange and redirects to `/candidate/register`. The primary new SQL artifact is a `get_candidate_user_data` RPC designed to be generic for both candidates and organizations.

**Primary recommendation:** Implement in layers: (1) interface changes and registration simplification first, (2) user data retrieval (RPC + methods), (3) write operations (_setAnswers with image upload, _updateEntityProperties), (4) candidateUserDataStore adaptation for partial return types.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Remove `_checkRegistrationKey` entirely from the DataWriter interface, abstract class, and both adapter implementations. Registration validity is implicit: user arrives via invite link, auth callback exchanges token, they go straight to password set
- `_register` just calls `updateUser({password})` -- the invite session is already established by the auth callback's `verifyOtp`. No candidate row updates needed (row already exists, created by admin)
- Clean up the interface: remove `registrationKey` parameter from `_register` signature (and update both Strapi and Supabase implementations). Don't keep Strapi compatibility shims -- clean break
- `_preregister` remains a stub (needs invite-candidate Edge Function from Phase 28)
- `_getBasicUserData`: extract role from JWT `user_roles` claim (no DB query). User id and email from session. Username = email. Language from user_metadata or default
- `_getCandidateUserData`: create a new `get_candidate_user_data` RPC that returns the candidate row + optionally nominations in one call
- The RPC must be generic/composable so it can be extended to work for organizations (parties) too
- Image is NOT a special entity column anymore -- it's a regular answer to a question
- Image upload happens inside `_setAnswers`: detect answers containing File objects, upload to Storage, replace File with Storage path string, then call `upsert_answers`
- `_updateEntityProperties` no longer handles image upload -- it only handles `termsOfUseAccepted`
- Remove `ImageWithFile` from `EditableEntityProps` (or deprecate)
- `_setAnswers` / `updateAnswers` / `overwriteAnswers`: change return type from `LocalizedCandidateData` to `LocalizedAnswers`
- `_updateEntityProperties` / `updateEntityProperties`: change return type from `LocalizedCandidateData` to just the updated properties
- `candidateUserDataStore.save()` must be updated to handle the new return types
- These are interface-level changes affecting: `dataWriter.type.ts`, `universalDataWriter.ts`, both Strapi and Supabase implementations, and `candidateUserDataStore.ts`

### Claude's Discretion
- Exact RPC SQL implementation for `get_candidate_user_data` (how to make it generic for candidates + organizations)
- Whether `_setAnswers` detects File objects by `instanceof File` check or by a type guard on the answer value structure
- Storage path generation strategy (UUID filename vs original filename)
- How to update `candidateUserDataStore` to work with partial return types (answers-only, props-only)
- Test approach: unit tests for each DataWriter method, mocking Supabase client responses

### Deferred Ideas (OUT OF SCOPE)
- _preregister implementation -- needs invite-candidate Edge Function (Phase 28)
- Generalization of Candidate App to also work for organizations/parties -- future phase after adapter migration
- candidateUserDataStore may need deeper refactoring when image moves fully to answers flow (removing editedImage internal store)

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| WRIT-01 | Answer updates (partial and overwrite modes) via RPC | `upsert_answers` RPC already exists; `_setAnswers` calls it with `overwrite` param. Image detection and Storage upload happen before RPC call. Return type changes to `LocalizedAnswers`. |
| WRIT-02 | Entity property updates (profile fields, image upload via Storage) | `_updateEntityProperties` simplified to only handle `termsOfUseAccepted`. Direct `UPDATE candidates SET terms_of_use_accepted = $1 WHERE id = $2`. Image upload moved to `_setAnswers` per locked decision. |
| WRIT-03 | Candidate registration flow (invite link -> exchange token -> set password) | `_checkRegistrationKey` removed. `_register` simplified to `updateUser({password})`. Auth callback already handles `verifyOtp` for invite tokens. Registration page flow needs updating to skip key-check step. |
| WRIT-04 | getCandidateUserData and getBasicUserData from Supabase session | `_getBasicUserData` extracts from session + JWT claims (no DB query). `_getCandidateUserData` uses new `get_candidate_user_data` RPC with optional nomination loading. |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.99.1 | Supabase client (PostgREST, Auth, Storage) | Already installed in frontend; provides typed client via `Database` generic |
| @openvaa/supabase-types | workspace | Generated DB types, COLUMN_MAP, PROPERTY_MAP | Project convention for type-safe DB queries |
| vitest | ^3.0.5 | Unit testing | Already configured in frontend/vitest.config.ts |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @supabase/storage-js | (bundled) | Storage upload API | Part of supabase-js; `supabase.storage.from('public-assets').upload()` |

### Alternatives Considered
None -- all libraries are already established in the project.

## Architecture Patterns

### Recommended File Structure
```
frontend/src/lib/api/
  base/
    dataWriter.type.ts          # Interface changes (remove checkRegistrationKey, change return types)
    universalDataWriter.ts       # Abstract class updates
  adapters/
    supabase/
      dataWriter/
        supabaseDataWriter.ts    # Implementation of all write methods
        supabaseDataWriter.test.ts # Extended with new method tests
    strapi/
      dataWriter/
        strapiDataWriter.ts      # Updated for interface changes (register signature, return types)

frontend/src/lib/contexts/candidate/
  candidateUserDataStore.ts      # Adapted for partial return types
  candidateContext.ts            # Remove checkRegistrationKey, update register signature

apps/supabase/supabase/schema/
  005-nominations.sql            # get_candidate_user_data RPC added (or new file)

apps/supabase/supabase/migrations/
  00003_get_candidate_user_data_rpc.sql  # Migration for the new RPC
```

### Pattern 1: RPC-based writes with existing infrastructure
**What:** All write operations use Supabase's typed RPC calls or direct PostgREST queries. The `upsert_answers` RPC already handles merge/overwrite with validation.
**When to use:** Always for answer writes.
**Example:**
```typescript
// Source: existing upsert_answers RPC in 006-answers-jsonb.sql
const { data, error } = await this.supabase.rpc('upsert_answers', {
  entity_id: target.id,
  answers: cleanedAnswers,
  overwrite
});
if (error) throw new Error(`setAnswers: ${error.message}`);
// data is the updated answers JSONB -- return directly as LocalizedAnswers
```

### Pattern 2: Storage upload within answer flow
**What:** When `_setAnswers` receives answers containing File objects, it uploads them to Supabase Storage first, replaces the File with the storage path string, then calls the RPC.
**When to use:** For image-type question answers.
**Example:**
```typescript
// Detect File objects in answers, upload, replace with path
for (const [questionId, answer] of Object.entries(answers)) {
  if (answer?.value instanceof File) {
    const file = answer.value;
    const storagePath = `${projectId}/candidates/${entityId}/${crypto.randomUUID()}.${extension}`;
    const { error } = await this.supabase.storage
      .from('public-assets')
      .upload(storagePath, file, { upsert: true });
    if (error) throw new Error(`Image upload failed: ${error.message}`);
    // Replace File with StoredImage-compatible path object
    cleanedAnswers[questionId] = { ...answer, value: { path: storagePath } };
  }
}
```

### Pattern 3: Session-based user data (no DB query)
**What:** `_getBasicUserData` extracts user info entirely from the Supabase session object and JWT claims, avoiding a database round trip.
**When to use:** For basic user identification (role, email, id).
**Example:**
```typescript
const { data: { session }, error } = await this.supabase.auth.getSession();
if (error || !session) throw new Error('No active session');

const user = session.user;
const userRoles = (session.access_token
  ? JSON.parse(atob(session.access_token.split('.')[1]))
  : {}).user_roles ?? [];

// Extract role from JWT claims
const role = userRoles.some((r: any) =>
  r.role === 'candidate' || r.role === 'party'
) ? 'candidate' : userRoles.some((r: any) =>
  ['project_admin', 'account_admin', 'super_admin'].includes(r.role)
) ? 'admin' : null;
```

### Pattern 4: Generic get_candidate_user_data RPC
**What:** A new SQL RPC that accepts an entity type parameter, queries the appropriate table (candidates or organizations) filtered by `auth_user_id = auth.uid()`, and returns the entity row. Designed to work for both candidates and organizations.
**When to use:** For `_getCandidateUserData` implementation.
**Example:**
```sql
CREATE OR REPLACE FUNCTION get_candidate_user_data(
  p_entity_type entity_type DEFAULT 'candidate'
)
RETURNS TABLE (
  id uuid, project_id uuid, name jsonb, short_name jsonb, info jsonb,
  color jsonb, image jsonb, sort_order integer, subtype text,
  custom_data jsonb, answers jsonb, terms_of_use_accepted timestamptz,
  first_name text, last_name text, organization_id uuid
)
LANGUAGE sql STABLE SECURITY INVOKER
AS $$
  SELECT c.id, c.project_id, c.name, c.short_name, c.info,
         c.color, c.image, c.sort_order, c.subtype,
         c.custom_data, c.answers, c.terms_of_use_accepted,
         c.first_name, c.last_name, c.organization_id
  FROM candidates c
  WHERE c.auth_user_id = (SELECT auth.uid())
    AND p_entity_type = 'candidate'
  UNION ALL
  SELECT o.id, o.project_id, o.name, o.short_name, o.info,
         o.color, o.image, o.sort_order, o.subtype,
         o.custom_data, o.answers, NULL::timestamptz,
         NULL::text, NULL::text, NULL::uuid
  FROM organizations o
  WHERE o.auth_user_id = (SELECT auth.uid())
    AND p_entity_type = 'organization'
  LIMIT 1;
$$;
```

### Anti-Patterns to Avoid
- **Returning full entity data from write operations:** The old pattern returned `LocalizedCandidateData` from answer/property writes. The new pattern returns only what changed (answers dict or updated properties). Do NOT fetch the full entity row after writes.
- **Using `getUser()` for basic user data when session is sufficient:** `getUser()` makes a server round trip. For basic info (email, id), use `getSession()` which reads from local state. Only use `getUser()` when you need verified server-side user data.
- **Treating image as a special entity column:** Image is now a regular answer value. Do NOT update `candidates.image` column for candidate profile images -- store the image path in the answers JSONB as a question answer.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Answer merge/overwrite | Custom JSONB merge logic | `upsert_answers` RPC | Already handles null-stripping, validation trigger, RLS enforcement |
| Storage path permissions | Custom auth checks | Storage RLS policies | 15 policies already configured in `014-storage.sql` |
| Column name mapping | Manual rename logic | `mapRow` / `mapRowToDb` from utils | Centralized COLUMN_MAP/PROPERTY_MAP |
| Row localization | Per-field locale resolution | `localizeRow` / `toDataObject` | Handles dot-notation nested JSONB, 3-tier fallback |
| Answer validation | Client-side validation | `validate_answers_jsonb` trigger | Fires automatically on UPDATE, validates against question types |

**Key insight:** The database layer (RPC, triggers, RLS) already handles the complex parts of write operations. The TypeScript layer should be a thin adapter that calls these and transforms results.

## Common Pitfalls

### Pitfall 1: Session vs JWT claims for role extraction
**What goes wrong:** Using `getSession()` returns the session object, but the `user_roles` custom claim is in the JWT access token, not directly on the session user object. Developers may look at `session.user.role` (which doesn't exist) or `session.user.app_metadata`.
**Why it happens:** Supabase custom claims via Access Token Hook are injected into the JWT, not into the user object.
**How to avoid:** Decode the JWT access token (`session.access_token`) to read `user_roles` from claims. Or use `session.user.app_metadata` if the hook also writes there -- but in this project, the hook writes to JWT claims only (`012-auth-hooks.sql`).
**Warning signs:** `undefined` role values, auth checks failing silently.

### Pitfall 2: File detection in answers
**What goes wrong:** Checking `instanceof File` may fail in SSR context where `File` global doesn't exist, or across different window contexts.
**Why it happens:** SvelteKit runs code on both server and client. `File` is a browser API.
**How to avoid:** Guard with `typeof File !== 'undefined' && value instanceof File`. Since answers are edited client-side and `_setAnswers` is called from client-side context (candidateUserDataStore.save()), this should only run in browser. But defensive check is prudent.
**Warning signs:** `ReferenceError: File is not defined` in SSR.

### Pitfall 3: Storage upload path uniqueness
**What goes wrong:** Uploading with the same filename overwrites the previous file. If two candidates have different images with the same original filename, the path convention `{project_id}/candidates/{candidate_id}/filename` prevents cross-candidate collision, but re-uploads by the same candidate overwrite.
**Why it happens:** Storage paths are deterministic based on entity ID.
**How to avoid:** Use UUID-based filenames (`crypto.randomUUID()`) or use `upsert: true` option in `upload()` to intentionally allow overwrite (since we want the latest image). The `cleanup_old_image_file` trigger only fires on the entity `image` column, not on answers -- so old answer-based images won't be auto-cleaned. This is acceptable since images-as-answers is a new pattern.
**Warning signs:** Stale images in Storage after re-upload.

### Pitfall 4: Return type changes breaking candidateUserDataStore
**What goes wrong:** `candidateUserDataStore.save()` currently calls `dataWriter.updateAnswers()` and expects `LocalizedCandidateData` back, then passes it to `updateCandidateData()` which replaces the entire `saved.candidate` object. If the return type changes to `LocalizedAnswers`, this breaks.
**Why it happens:** The store's `updateCandidateData` function expects a full `LocalizedCandidateData`.
**How to avoid:** After the return type changes, `save()` must update only the specific parts: merge returned answers into `savedData.candidate.answers`, or update only `termsOfUseAccepted` from property update. Do not try to replace the entire candidate object with partial data.
**Warning signs:** TypeScript compile errors, undefined candidate fields after save.

### Pitfall 5: Strapi adapter breaking during interface changes
**What goes wrong:** Removing `checkRegistrationKey` and changing `register` signature breaks `StrapiDataWriter` compilation.
**Why it happens:** Both adapters implement the same interface.
**How to avoid:** Update Strapi adapter simultaneously with interface changes. For `_register`, the Strapi adapter can keep its existing implementation but drop the `registrationKey` parameter from the method signature -- it can use a different internal mechanism to pass it (or this can be deferred since Strapi is being sunset). The CONTEXT.md says "clean break" -- update both adapters.
**Warning signs:** TypeScript errors in `strapiDataWriter.ts`.

### Pitfall 6: upsert_answers only works for candidates table
**What goes wrong:** The existing `upsert_answers` RPC only updates the `candidates` table. If this phase needs to support organization answers, the RPC would need modification.
**Why it happens:** The RPC was written specifically for candidates in Phase 22.
**How to avoid:** For Phase 26, only candidate answers are in scope. Organization support is deferred. No changes to `upsert_answers` needed.
**Warning signs:** N/A for this phase.

## Code Examples

Verified patterns from the existing codebase:

### Calling upsert_answers RPC
```typescript
// Source: apps/supabase/supabase/schema/006-answers-jsonb.sql
// The RPC returns the updated answers JSONB
const { data, error } = await this.supabase.rpc('upsert_answers', {
  entity_id: target.id,
  answers: answersJsonb,  // Record<QuestionId, {value, info?}>
  overwrite: false        // false = merge, true = replace
});
if (error) throw new Error(`setAnswers: ${error.message}`);
// data is jsonb -- cast to LocalizedAnswers
return data as unknown as LocalizedAnswers;
```

### Supabase Storage upload
```typescript
// Source: @supabase/storage-js upload API, 014-storage.sql path convention
const ext = file.name.split('.').pop() ?? 'jpg';
const storagePath = `${projectId}/candidates/${entityId}/${crypto.randomUUID()}.${ext}`;
const { data, error } = await this.supabase.storage
  .from('public-assets')
  .upload(storagePath, file, {
    cacheControl: '3600',
    upsert: true  // Allow overwrite
  });
if (error) throw new Error(`Storage upload failed: ${error.message}`);
// Returns { id, path, fullPath }
```

### Getting session for basic user data
```typescript
// Source: @supabase/supabase-js auth API
const { data: { session }, error } = await this.supabase.auth.getSession();
if (error || !session) throw new Error('No active session');
// session.user.id, session.user.email are available
// JWT claims need decoding from session.access_token
```

### Direct PostgREST update for termsOfUseAccepted
```typescript
// Source: 003-entities.sql (candidates table), 013-auth-rls.sql (column grants)
const { data, error } = await this.supabase
  .from('candidates')
  .update({ terms_of_use_accepted: value })
  .eq('id', target.id)
  .select('terms_of_use_accepted')
  .single();
if (error) throw new Error(`updateEntityProperties: ${error.message}`);
```

### Registration (password set after invite)
```typescript
// Source: existing _resetPassword pattern in supabaseDataWriter.ts
// Invite session is already established by auth callback verifyOtp
const { error } = await this.supabase.auth.updateUser({ password });
if (error) throw new Error(error.message);
return { type: 'success' as const };
```

### Mock Supabase client pattern (for tests)
```typescript
// Source: supabaseDataWriter.test.ts existing pattern
function createMockSupabaseClient() {
  return {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      getUser: vi.fn(),
      getSession: vi.fn()
    },
    rpc: vi.fn(),
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn()
          }))
        }))
      }))
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn()
      }))
    }
  };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Registration key check step | Implicit via invite token exchange | Phase 26 | Remove `checkRegistrationKey` from interface, simplify registration flow |
| Image as special entity property | Image as regular answer to question | Phase 26 | `_setAnswers` handles File upload; `_updateEntityProperties` drops image handling |
| Write methods return full entity | Write methods return only changed data | Phase 26 | `LocalizedAnswers` from answer writes, properties-only from property writes |
| Strapi JWT for user data | Supabase session + JWT claims | Phase 24-26 | No DB query needed for basic user data |

**Deprecated/outdated:**
- `checkRegistrationKey`: Removed entirely. Registration validity is implicit via invite link flow.
- `registrationKey` parameter on `register()`: Removed. Supabase session is already established.
- `ImageWithFile` in `EditableEntityProps`: Removed or deprecated. Image upload moves to answers flow.

## Open Questions

1. **How should the register page UI change?**
   - What we know: The current register page (`/candidate/register/+page.svelte`) shows a form to input a registration key, calls `checkRegistrationKey`, then redirects to password page. With `checkRegistrationKey` removed, this page needs rethinking.
   - What's unclear: Should the registration code input page be removed entirely? The invite link already redirects via auth callback to `/candidate/register` -- should it go directly to the password page?
   - Recommendation: The auth callback for `invite` type already redirects to `/candidate/register`. This page should be simplified to just show the password setter (merge current `register/password/+page.svelte` into `register/+page.svelte`), or the auth callback should redirect directly to `/candidate/register/password`. Mark as a separate task. The UI change may need discussion but can be implemented with minimal risk.

2. **Project ID needed for Storage paths -- where does it come from?**
   - What we know: Storage paths use `{project_id}/candidates/{entity_id}/filename`. The candidate's `project_id` is on the candidate row but isn't part of `LocalizedCandidateData`.
   - What's unclear: How does `_setAnswers` obtain the project_id for the storage path?
   - Recommendation: The `get_candidate_user_data` RPC should include `project_id` in its return. Or query it from the candidate row. Since `_setAnswers` has the target entity ID, it can query `candidates.project_id` before uploading. Alternatively, include `project_id` in the `CandidateUserData` returned by `_getCandidateUserData` and cache it.

3. **Old image cleanup when image moves to answers**
   - What we know: The `cleanup_old_image_file` trigger fires on `candidates.image` column changes. But images-as-answers are stored in the `answers` JSONB, not the `image` column.
   - What's unclear: When a candidate re-uploads an image answer, the old file in Storage is not automatically cleaned up.
   - Recommendation: Accept this for now. Old files accumulate but don't cause functional issues. Cleanup can be addressed in a future phase with a scheduled task or on-upload cleanup logic.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 3.0.5 |
| Config file | `frontend/vitest.config.ts` |
| Quick run command | `cd frontend && yarn test:unit -- --run supabaseDataWriter` |
| Full suite command | `yarn test:unit` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WRIT-01 | _setAnswers calls upsert_answers RPC with correct params (merge mode) | unit | `cd frontend && npx vitest run src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts` | Exists (extend) |
| WRIT-01 | _setAnswers calls upsert_answers RPC with overwrite=true | unit | same file | Exists (extend) |
| WRIT-01 | _setAnswers detects File objects, uploads to Storage, replaces with path | unit | same file | Exists (extend) |
| WRIT-02 | _updateEntityProperties updates termsOfUseAccepted via PostgREST | unit | same file | Exists (extend) |
| WRIT-03 | _register calls updateUser with password | unit | same file | Exists (extend) |
| WRIT-04 | _getBasicUserData extracts user data from session and JWT claims | unit | same file | Exists (extend) |
| WRIT-04 | _getCandidateUserData calls get_candidate_user_data RPC | unit | same file | Exists (extend) |
| WRIT-04 | _getCandidateUserData loads nominations when loadNominations=true | unit | same file | Exists (extend) |

### Sampling Rate
- **Per task commit:** `cd frontend && npx vitest run src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts`
- **Per wave merge:** `yarn test:unit`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Extend mock Supabase client in `supabaseDataWriter.test.ts` with `rpc`, `from`, `storage.from.upload`, `auth.getSession` mocks
- [ ] pgTAP test for `get_candidate_user_data` RPC -- new test file or extend existing (if desired, but CONTEXT.md doesn't require it)

## Sources

### Primary (HIGH confidence)
- `apps/supabase/supabase/schema/006-answers-jsonb.sql` -- upsert_answers RPC implementation, return type, parameters
- `apps/supabase/supabase/schema/014-storage.sql` -- Storage RLS policies, path conventions, cleanup triggers
- `apps/supabase/supabase/schema/003-entities.sql` -- candidates table schema (terms_of_use_accepted, auth_user_id)
- `apps/supabase/supabase/schema/012-auth-hooks.sql` -- JWT custom claims (user_roles), helper functions
- `apps/supabase/supabase/schema/013-auth-rls.sql` -- Column-level UPDATE grants for candidates
- `apps/supabase/supabase/schema/005-nominations.sql` -- get_nominations RPC (reusable for loadNominations)
- `frontend/src/lib/api/base/dataWriter.type.ts` -- Current DataWriter interface, types
- `frontend/src/lib/api/base/universalDataWriter.ts` -- Abstract base class
- `frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` -- Current Supabase implementation
- `frontend/src/lib/api/adapters/strapi/dataWriter/strapiDataWriter.ts` -- Strapi implementation (reference for interface changes)
- `frontend/src/lib/contexts/candidate/candidateUserDataStore.ts` -- Store consuming DataWriter methods
- `frontend/src/lib/api/adapters/supabase/utils/` -- storageUrl.ts, mapRow.ts, localizeRow.ts, toDataObject.ts
- `@supabase/storage-js` type definitions -- upload API signature verification
- `@supabase/auth-js` type definitions -- getSession/getUser API verification

### Secondary (MEDIUM confidence)
- `.claude/skills/database/SKILL.md` -- Database patterns, RLS conventions, pgTAP testing patterns

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and used in prior phases
- Architecture: HIGH -- patterns directly follow existing Phase 24/25 conventions, all canonical files read
- Pitfalls: HIGH -- identified from actual codebase analysis (return types, File detection, Storage paths)
- RPC design: MEDIUM -- `get_candidate_user_data` RPC is new; SQL pattern follows `get_nominations` precedent but exact implementation is Claude's discretion

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable -- all patterns established in prior phases)
