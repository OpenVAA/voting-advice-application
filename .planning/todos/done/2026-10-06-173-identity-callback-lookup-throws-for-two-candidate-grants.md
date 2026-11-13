---
created: 2026-10-06T19:00:27.000Z
title: identity-callback's findExistingCandidate throws for a returning user who edits two candidates in the project (named input to Phase 179)
area: Edge Functions / bank authentication
severity: major
source: Phase 173 (173-CONTEXT.md fact 14 and obligation O-8; filed by 173-13)
owner: Phase 179
files:
  - apps/supabase/supabase/functions/identity-callback/candidateRecord.ts
  - apps/supabase/supabase/functions/identity-callback/index.ts
  - apps/supabase/supabase/schema/300-auth-tables.sql
---

## Problem

`findExistingCandidate` in `apps/supabase/supabase/functions/identity-callback/candidateRecord.ts` reads the caller's `(entity, candidate, editor)` grants, then selects from `candidates` with `.eq('project_id', projectId).in('id', ids).maybeSingle()`. `.maybeSingle()` returns an error when the filter matches more than one row, and the function turns that error into `lookupFailed`.

Before Phase 173 a user could edit one candidate in a project, so the filter matched at most one row. Phase 173 lets one user hold editor grants on several entities of a project (D-01, D-02: the unique index `idx_grants_one_candidate_editor` limits a candidate to one editor, not a user to one candidate). A returning identity-provider user who edits two candidates in the project the deployment serves therefore fails the lookup, and the sign-in ends in an error instead of a session.

This is a **named input to Phase 179, not a fix**: Phase 179 owns `identity-callback`.

## What Phase 179 has to decide

- What "the existing candidate" means for a user with several. `index.ts` uses the result for two things: to decide whether to create a candidate, and as the `candidateId` of the grant it writes after both branches, which on the existing branch re-writes the grant that found the candidate and is an idempotent no-op. Any one of the user's candidates answers the first; a `.limit(1)` read would do. Whether the grant write should then be skipped on the existing branch is the second decision.
- The redirect target does not need the id: `identity-callback` redirects to `/contestant`, which since Phase 173 is the app root's three-way decision (one entity: its home; several: the selection screen; none: the "nothing to edit" view).
- Organizations: the lookup filters on `target_type = 'candidate'`. By the code as read (not run), a returning user who edits an organization only is "not found" and takes the create branch, so a candidate is created for them. Whether that is wanted is Phase 179's question too.

## Evidence still missing

The two opt-in bank-auth projects were last green at Phase 172's close and were not run in Phase 173, which changed the login gate, the app root and the route tree. Run them before changing the function, so the starting state is known.

## Resolution

**Closed 2026-10-22 by Phase 179** (plans 179-09 and 179-13; the scenario of 179-20; moved by 179-23).

- **What was done.** `findExistingCandidate` is gone. `identity-callback` finds the identity's own entity through a per-project, per-type record in the account's `app_metadata` (`registered_entities`), confirmed by a live editor grant: `resolveOwnEntity` in `identity-callback/ownEntity.ts` (`a6f25b415`, `feat(179-09)`), wired into the function in `0b6ab0cec` (`feat(179-13)`). A user who edits several candidates is found through the one the record names, and no `.maybeSingle()` over the grants remains. A record whose grant or row is gone answers `no_entity` and creates nothing. Organizations have a record of their own, so a user who edits an organization alone no longer takes the candidate create branch.
- **Test.** `contestant-identity-provider.spec.ts` › `an identity whose account an administrator gave a second candidate comes back to its own, gets no third, and meets the profile selection listing both` (`d12a1b657`, `test(179-20)`), in the default E2E run; and the unit cases of `ownEntity.test.ts`.
