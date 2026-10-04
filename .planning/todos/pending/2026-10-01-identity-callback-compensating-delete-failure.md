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
