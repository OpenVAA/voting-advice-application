---
phase: 166-retire-auth-user-id-entity-identity-from-grants
step: review-fix
batch: review-fix-D
findings_fixed: [WR-01, IN-03]
findings_no_change: [IN-01, IN-02]
findings_out_of_scope: [WR-02]
base: 2fb65aab2
gates: tests/e2e-runs/179-gates/review-fix-D
e2e_close: tests/e2e-runs/179-e2e/review-fix-D-r2
status: complete
---

# Phase 166 review fix

Fixed in review-fix batch D, with phases 167, 168 and 169. Each finding was first checked against the tree at `2fb65aab2`. A finding a test can show got a failing test first, committed with the exit of its red run, then the fix and the green run. A comment-only finding got no red. The SQL change is migration `00010_claim_grant_key_conflict_target.sql`, which holds the replaced `claim_invitations` and its header byte-for-byte from `schema/506-invitation-rpcs.sql`, with its manifest line, as `00005` to `00009` do.

| Finding | Disposition | Commits |
| --- | --- | --- |
| WR-01 | fixed, in both writers of a grant | 44f66d311 (red), 519fd57bc (fix) |
| WR-02 | not in this batch: deferred by D-12, an operator decision | none |
| IN-01 | no change needed: the function it names no longer exists | none |
| IN-02 | no change needed: already fixed | none |
| IN-03 | fixed, comment | 5a0bdeadf |

## WR-01: the grant key is the conflict target, in the Edge Function and in the claim

**Verified.** The finding holds at `2fb65aab2`, and in two places, not one. `writeEntityGrant` (`identity-callback/entityGrant.ts`) still read a `23505` as success only when its message named `grants_user_scope_target_role_key`. Its consequence is narrower than the review's: `identity-callback` now writes the grant only on the branch that has just created the entity, so a returning login no longer writes it and cannot meet a duplicate. The second writer is the one with a live consequence. `claim_invitations` (added later, in `schema/506-invitation-rpcs.sql`) read `CONSTRAINT_NAME` after a unique violation the same way: a caller who already holds exactly the grant an open invitation promises is marked as having claimed it only while the table's own key is probed first. With the order reversed, that invitation is skipped as `candidate_has_editor` and stays open. The schema comment on `idx_grants_one_candidate_editor` stated the order as a fact ("which is checked first").

**Fix.**

- `writeEntityGrant` writes through `upsert` with `onConflict` on the grant key's five columns and `ignoreDuplicates: true`, which PostgREST sends as `INSERT … ON CONFLICT (user_id, scope, target_type, target_id, role) DO NOTHING`. A row the key already holds is skipped before any other unique index is probed, and every violation that does raise is a refusal. The message matching and its constants are gone. `GrantWriteClient` declares `upsert`.
- `claim_invitations` inserts with `ON CONFLICT ON CONSTRAINT grants_user_scope_target_role_key DO NOTHING`, and reads the constraint name only to recognise `idx_grants_one_candidate_editor`; any other violation is still raised. The header says why the key is the conflict target.
- The comment on the partial index in `schema/300-auth-tables.sql` and the database skill's schema reference say that PostgreSQL names whichever index it probes first, in OID order, which a rebuild changes. The comment in the frozen `00001` keeps the old wording: a migration is never edited, and a comment there changes nothing in a database. A pgTAP case title in `39-invitations.test.sql` that named the constraint was reworded.

**Red** (44f66d311):

- New pgTAP file `52-grant-conflict-index-order.test.sql`, run with `00-helpers`: **exit 1**, 2 of 9 failed (cases 5 and 7: the invitation for a grant its user already holds was skipped as `candidate_has_editor` and left unclaimed). The file rebuilds `grants_user_scope_target_role_key` inside its transaction so that its index gets the larger OID, and two premise cases show the rebuild took: the partial index now has the smaller OID, and a plain duplicate insert is refused naming it. Log `tests/e2e-runs/179-unit/review-fix-D-166-wr01-db-red.log`.
- `entityGrant.test.ts` gained a fake of the grants table with both unique indexes, probed in either order: **exit 1**, 1 of 15 failed (an exact duplicate threw `ERR_GRANT_WRITE_FAILED` when the partial index was probed first). Log `review-fix-D-166-wr01-unit-red.log`.

**Green** (519fd57bc): after `supabase db reset`, pgTAP `00`, `07`, `26`, `39` and `52`: **exit 0**, PASS. The `identity-callback` vitest suite: **exit 0**, 346 passed. `assert:schema-migration-parity`: exit 0, ten migrations. No signature changed, so `packages/supabase-types` was not regenerated, and no function was added, so the `07-rpc-security` census did not move. The PostgREST form of the Edge Function's write is exercised end to end by the bank-auth E2E projects, whose first login creates a candidate and writes its grant.

## WR-02: not in this batch

The concurrent first login that can create two candidates for one identity is the write-time constraint D-12 defers. It stays open for the operator, as the brief for this batch states.

## IN-01: no change needed

`get_candidate_user_data` and its `ERR_ENTITY_IDENTITY_AMBIGUOUS` raise no longer exist in the schema, the frontend, the packages or the tests. Their successor, `get_entity_user_data` (`schema/503-entity-rpcs.sql`), takes the entity's type and id together and never raises: a faction or an alliance has no arm and returns no row, as its header states.

## IN-02: no change needed

`tests/tests/utils/supabaseAdminClient.ts` already reads the candidate's current editor before the insert (`grantEntityToUser` calls `userIdForCandidate`) and refuses by name: "candidate <external id> already has an editor (user <id>); a candidate admits one. Unregister that user first, or grant a candidate that no identity of the run edits." `forceRegister` and `grantEntity` both go through it.

## IN-03: CA-AA-1 is described as the seed describes it

`tests/tests/utils/testCredentials.ts` now calls CA-AA-1 the base dataset's registered test candidate with the generic answers, as `packages/dev-seed/src/templates/e2e/base.ts` does, and keeps the reason it has a full answer set.

## Gates and E2E close

See `167-REVIEW-FIX.md` § Gates and E2E close of batch D; the four phases of the batch share one gate set and one E2E run.
