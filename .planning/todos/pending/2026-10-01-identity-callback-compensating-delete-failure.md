---
title: identity-callback leaves an ungranted candidate when both the grant write and its compensating delete fail
priority: low
created: 2026-10-01
context: Residue of Phase 166 (decision D-09). With the editor grant as the only link from an auth user to an entity, a candidate that identity-callback creates but fails to grant can never be found again. Phase 166 added a compensating delete for that case; the one case left open is when the delete fails too.
---

# identity-callback: grant write and compensating delete both fail

## The case

`apps/supabase/supabase/functions/identity-callback/index.ts`, on the create branch (no existing candidate was
found through the identity's `(entity, candidate, <id>, editor)` grant):

1. `createCandidate` inserts a new candidate (`first_name`, `last_name`, `project_id`, `confirmed: true`; no
   `external_id`).
2. `writeEntityGrant` writes the editor grant. If it throws, the catch block calls
   `deleteCandidate(supabaseAdmin, { projectId, candidateId })` (`candidateRecord.ts`, throws
   `ERR_CANDIDATE_DELETE_FAILED`) and then rethrows the grant error.
3. If `deleteCandidate` also fails, its error is only logged, under the fixed message
   `identity-callback: the candidate whose grant write failed could not be deleted:`, and the grant error is
   still thrown.

In that case a candidate remains that no grant names. Nothing can reach it through the identity: the
identity's next login finds no grant, takes the create branch again and creates another candidate. The
orphan stays in the project's data until someone deletes it.

## Detecting it

Run as the service role (or in psql) per project:

```sql
SELECT c.id, c.first_name, c.last_name, c.created_at
FROM public.candidates c
WHERE c.project_id = '<project id>'
  AND c.external_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.grants g
    WHERE g.scope = 'entity'
      AND g.target_type = 'candidate'
      AND g.target_id = c.id
      AND g.role = 'editor'
  );
```

Candidates an admin created by hand without an `external_id` and never invited also match, so read the
result against the container log line above before deleting anything.

## The alternative D-09 rejected

A transactional service-role RPC that inserts the candidate and writes the grant in one transaction would
remove the case entirely. Phase 166 did not take it because it adds a new function to the exposed `public` schema,
moves the insert out of `candidateRecord.ts`, and leaves that module's vitest row-shape tests without their
subject. Revisit if the log line above is ever observed in a deployment.

## Update 2026-10-22 — the organization branch repeats the pattern; re-anchored (Phase 179, decision D-10)

Still open. Phase 179 made the function create organizations as well as candidates, and both branches share one compensating delete. In `apps/supabase/supabase/functions/identity-callback/index.ts` today:

1. **The create branch.** It is taken only when the account's own record (`registered_entities` in `app_metadata`, read by `readRegisteredEntity` and confirmed by `resolveOwnEntity` in `ownEntity.ts`) names no entity of the requested type in the project. It calls `createCandidate` (`candidateRecord.ts`, `confirmed: true`) or `createOrganization` (`organizationRecord.ts`, `confirmed: false`, with no name).
2. **Two writes inside one `try`.** `writeEntityGrant` writes the editor grant, and `updateUserById` writes the account's `app_metadata` with the record of the new entity (`ERR_RECORD_WRITE_FAILED`). The record write is new: it runs on every branch, and on the create branch a failure in it now triggers the delete too.
3. **The compensating delete.** In the catch, an entity this request created is deleted, by `deleteCandidate` (`ERR_CANDIDATE_DELETE_FAILED`) or `deleteOrganization` (`ERR_ORGANIZATION_DELETE_FAILED`). A failed delete is only logged, under the fixed message `identity-callback: the entity whose grant or record write failed could not be deleted:`, and the write's error is still thrown.

So the residual case is now wider in one way. A grant that committed, followed by a record write that failed and a delete that failed, leaves an entity that the grant names but the record does not. On the next sign-in `resolveOwnEntity` finds no record for the type and the create branch runs again. A second entity is made, while the first stays reachable from the selection screen through its grant. (Read from the code, not run: `resolveOwnEntity` answers `none` for a missing record before it reads any grant.) `deleteOrganization`'s docblock says the `cleanup_grants_on_delete` trigger removes the grant when the delete succeeds.

**Detecting it** now needs an organization variant beside the query above, and the candidate query also misses an entity that has a grant but no record:

```sql
SELECT o.id, o.created_at
FROM public.organizations o
WHERE o.project_id = '<project id>'
  AND o.external_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.grants g
    WHERE g.scope = 'entity'
      AND g.target_type = 'organization'
      AND g.target_id = o.id
      AND g.role = 'editor'
  );
```

Read the result against the container log line above, as before. An organization that an administrator created by hand, without an `external_id`, also matches.

**The transactional alternative** would now also have to write the record. The record lives in `auth.users.raw_app_meta_data`, so a `public` RPC would have to write into the `auth` schema, which makes D-09's argument against it stronger.
