---
phase: 177-define-nominations
step: review-fix
batch: review-fix-B
findings_fixed: [CR-01, WR-01, WR-02, IN-01, IN-02, IN-04, IN-05, IN-06, IN-07]
findings_skipped: [IN-03]
base: 19374478c
gates: tests/e2e-runs/179-gates/review-fix-B-r3
e2e_close: tests/e2e-runs/179-e2e/review-fix-B-r2
status: complete
---

# Phase 177 review fix

Fixed in review-fix batch B, with phases 173 (a second section), 175 and 176. Each finding a test can show got a failing test first, committed with the exit of its red run, then the fix, then the green run. A doc-only finding got no red. The SQL changes are two migrations, `00006_nomination_write_guards.sql` and `00007_nomination_write_kept_constituency.sql`, each holding the replaced functions byte-for-byte from the schema files, with its manifest line, as batch A's `00005` does; the second narrows WR-01 after the first gate set.

| Finding | Disposition | Commits |
| --- | --- | --- |
| CR-01 | fixed | 4f7d2c1ba and 6fe022f46 (red), a4be1eaaf (fix) |
| WR-01 | fixed, in the writer function | 4f7d2c1ba (red), a4be1eaaf (fix), 3ca2fa7bf (red, kept rows), 456b5ee17 (fix, kept rows) |
| WR-02 | fixed | 4f7d2c1ba (red), a4be1eaaf (fix), 98d66dd33 (parity test) |
| IN-01 | fixed, documented | a4be1eaaf |
| IN-02 | fixed | 4f7d2c1ba (red), a4be1eaaf (fix) |
| IN-03 | skipped: recorded decision, operator | none |
| IN-04 | fixed | f88096a89 (red), effc5d211 (fix) |
| IN-05 | fixed | 6d144f3f8, a633bf167 (guard listing) |
| IN-06 | fixed | 1f768826b (red), 17a714b9d (fix) |
| IN-07 | fixed | 4f7d2c1ba (red), a4be1eaaf (fix) |

## The red runs

- **SQL** (4f7d2c1ba): the new pgTAP file `50-nomination-write-guards.test.sql`, run with `00-helpers` against the unfixed schema: **exit 1**, 25 of 31 failed. Log `tests/e2e-runs/179-unit/review-fix-B-177-db-red.log`.
- **Client of CR-01** (6fe022f46): vitest over `entityNominations.test.ts`, `supabaseDataWriter.test.ts`, `nominationDraft.test.ts` and the details page test: **exit 1**, 21 of 457 failed. Log `review-fix-B-177-cr01-client-red.log`.

## CR-01: the whole-set write is checked against the read it was computed from

**Verified.** `set_entity_nominations` read the reach afresh and deleted every row of it the set left out; the details page built its set from cards read at page open and re-read nothing before the write. A nomination created since the read was deleted, and one moved since was moved back, each answered as saved.

**Design.** The function takes a fourth parameter, `p_expected_reach`: a JSON object that maps the id of every nomination in reach, as the caller read it, to its `updated_at`. Right after the reach is read, before any object of the set is checked, the two are compared; a nomination the expectation does not name, an id it names that is no longer in reach, and an `updated_at` that differs each refuse the call with SQLSTATE `40001` and `set_entity_nominations: the nominations have changed since they were read`. `updated_at` is bumped by the table's trigger on every update, so an administrator's creation, move, edit, confirmation or deletion all count, and the comparison is exact (`timestamptz`). The parameter is required (no default, as for the function's other parameters); a malformed one is `22023`. The reach is read without a lock, so a write committed by another transaction in the microseconds between that read and the call's own statements is not seen; stated in the header.

- `get_entity_nominations` states `updated_at` in its allow-listed projection.
- The writer's `setEntityNominations` takes `readFrom` (each read nomination's `id` and `updatedAt`), sends it as `p_expected_reach`, and maps the `40001` refusal, by code and whole message, to `{ type: 'refused', reason: 'changed' }`; a `40001` with another message still rejects.
- The details page passes the nominations its cards were built on (`builtOn`); `notStoredOutcome` treats a refusal as `changed` like a re-read that differs, and rebuilds the cards. `sameNominations` compares `updatedAt` too.

**Green:** pgTAP 50, 31/31; the full pgTAP suite **exit 0**, 50 files, 2688 tests (log `review-fix-B-177-db-green.log`); vitest over the four red files **exit 0**, 457 passed; the writer integration test against the local stack **exit 0**, 33 passed, among them a new case that a save computed from a stale read is refused as `changed` and stores nothing (log `review-fix-B-177-integration.log`). pgTAP 42 (the projection's eleven keys), 43 and 46 (their call helpers state a current read; the catalogue assertions name the four-argument signature) were updated in the fix commit. `packages/supabase-types` regenerated after a reset. `check:schema-equivalence`: **EQUAL**.

## WR-01: the constituency must be one of its election's

**Verified.** Nothing checked that a nomination's constituency belongs to one of its election's constituency groups.

**Fix:** in `set_entity_nominations`, beside the election read, for a new nomination and for a move: `22023`, `p_nominations[<index>] names a constituency_id that is no constituency of its election`. A stored nomination that stays in its constituency is not judged by it: the first form of the fix (a4be1eaaf) asked every object, so a kept nomination an earlier writer had stored outside its election could not be saved at all, not even its symbol. Red for that (3ca2fa7bf): pgTAP 50 **exit 1**, 1 of 32 failed; fix (456b5ee17) with migration `00007_nomination_write_kept_constituency.sql`, the function byte-for-byte from schema 503; green: full pgTAP **exit 0**, 2689 tests. **Not in `validate_nomination`**, as the review preferred: the dev-seed writer imports nominations through `bulk_import` and links the elections' constituency groups afterwards (`writer.ts`, step 5, `linkJoinTables`), so a trigger would refuse every seeded nomination. The direct table insert through `entity_insert_nominations` keeps the gap it had before the phase. The writer integration fixture now links each contest's constituency to its election, as a real project does.

## WR-02: a round that is not stored is round 1, and the matrices are held equal

**Verified.** The SQL reach compared the raw nullable rounds with `IS NOT DISTINCT FROM`, the client read both as 1 when not stored; no test held `nomination_shape_rule` and `isNominableInShape` equal.

**Fix:**
- The comparison, not the column: `COALESCE(round, 1)` on both sides in the reach, in `nomination_exists_in_contest`, `nomination_id_in_contest`, `caller_nominated_in_contest` and in `validate_nomination`'s parent-round check, so a nomination with no round in an election at round 1 is in reach and can be linked to its party's round-1 nomination. `NOT NULL` on the columns was not chosen: `10-schema-migrations.test.sql` pins that `nominations` accepts a NULL round, and an import that states a null round would start failing.
- `nominationShapeParity.test.ts` (98d66dd33) reads the sixteen cells of `nomination_shape_rule` from schema 011 and asserts `isNominableInShape` on all of them and `allowedParentTypes().required` on the candidate and organization cells. No red is possible, the two agree; with one cell of the schema file planted to drift it is **exit 1** (log `review-fix-B-177-wr02-planted-drift.log`), then restored.

## IN-01: the call leaves the constraint deferred

Documented in the function's header and on the authentication docs page: PostgreSQL offers no way to read a constraint's mode, so a caller that had set `nominations_parent_required` immediate finds it deferred after the call.

## IN-02: the parent options read is bounded

`get_nomination_parent_options` answers `NULL` for more than 1000 contests, the bound a writer's nominations array has. pgTAP 50: 1000 are answered, 1001 are `NULL`.

## IN-03: skipped, an operator decision

The finding holds: the database enforces `nominationsLocked` alone, and a direct write under `answersLocked` succeeds. It is recorded in `177-VERIFICATION.md`: "The answers lock closes the editor in the frontend alone; the database enforces the nominations lock only", and the developers' page `defining-nominations` states it in its table. Adding `project_answers_locked` to the entity nomination policies would reverse that. **Decision for the operator.** The cap of ten unconfirmed parent nominations is not a finding of this review; it is the recorded OD08-E4 decision (RQ-8 for the operator) and was not touched.

## IN-04: the chosen parent's own type

**Red** (f88096a89): `nominationDraft.test.ts`, **exit 1**, 2 of 126 failed. **Fix** (effc5d211): `desiredSetOf(cards, listed)` names a chosen entity by its listed type among the rule's types, and throws for an id that is not listed. **Green:** vitest over the nominations module and routes **exit 0**, 362 passed.

## IN-05: one narrowing of RPC answers

`rpcAnswer.ts` `parseRpcAnswer(schema, raw, call)`; the three nomination parsers and the invitation operations' local copy use it. No behaviour change, so no red. vitest over the Supabase adapter **exit 0**, 643 passed. The first gate set then found the new source unlisted in `assert-project-scoped-queries.mjs` (rows `lint` and `unit`); a633bf167 lists it in `GUARDED_SOURCES` with the other utils.

## IN-06: a name the details step cannot resolve

**Red** (1f768826b): details page test, **exit 1**, 1 of 42 failed: a stored nomination at a constituency the data root does not hold left the page `loading`. **Fix** (17a714b9d): once the options are read, a failed lookup of a parent option, an election or a constituency is logged and puts the page in its `error` state with no main button. **Green:** the nominations routes **exit 0**, 205 passed.

## IN-07: a requested parent name is a string that is not blank

**Verified:** `validate_nomination_parent_required` and rule 1 of `enforce_nomination_confirmation` tested only that the key exists. **Fix:** both require `jsonb_typeof = 'string'` and a character that is not white space. A JSON null, a blank and a number no longer satisfy the deferred parent rule; a JSON-null key no longer blocks an administrator's confirmation where no parent is required, and a named request still does. pgTAP 50 holds the six cases.

## Gates and E2E close of batch B

- **Gate set `review-fix-B`**, on 444778c0e: 20 of 22 rows exit 0. `lint` and `unit` were red for one cause: the new adapter source `utils/rpcAnswer.ts` was in neither list of `assert-project-scoped-queries.mjs` (the guard itself, and dev-seed `projectScopingGate.test.ts`); fixed in a633bf167. Before the second run, WR-01 of phase 177 was narrowed to new and moved nominations (3ca2fa7bf red, 456b5ee17 fix, migration `00007`).
- **Gate set `review-fix-B-r2`**, on 456b5ee17: all 22 rows exit **0**; `179-verdict gates review-fix-B`: **PASS**, no Sleep entry in the window.
- The stack was restarted (`yarn db:stop && yarn db:start` through the key filter, exit 0; the edge runtime up) before the E2E.
- **E2E close `review-fix-B`**, on 456b5ee17, under `caffeinate`: **red, not void** (no Sleep entry, no void marker): 2 failed, 383 did not run, 228 passed of 613. The two failures were `contestant-entity-selection`'s draft tests: its fixture read a draft at `<stem>-<type>-<id>`, the key form before 173 WR-01 added the user; the 383 are the perm chain anchored on that project. Fixed in the fixture (a9f7c2511), which finds the one key that ends `-<type>-<id>`.
- **E2E close `review-fix-B-r2`**, on a9f7c2511, under `caffeinate`: **613 passed**, 0 failed, 0 flaky, 0 skipped, 0 did not run, 128 projects, 16.2 min. Wrapper exit 0, the restore ran (`db:stop`, `db:start`, edge runtime running). Not void; `sleep_entries_in_window: 0`. `179-verdict e2e review-fix-B --same-projects-as review-fix-A`: **PASS**, 128 projects compared, 0 not as expected. New E2E test count delta: 0.
- **Gate set `review-fix-B-r3`**, on a9f7c2511, the tree the E2E close ran on: all 22 rows exit **0**; `179-verdict gates review-fix-B`: **PASS**, not stale, no Sleep entry in the window. This is the gate verdict of record for batch B.
- `yarn db:seed:default` exit 0 afterwards.
