---
phase: 166-retire-auth-user-id-entity-identity-from-grants
plan: 02
subsystem: auth
tags: [supabase, edge-functions, deno, grants, vitest, playwright, e2e, bank-auth]

requires:
  - phase: 166-01
    provides: get_candidate_user_data reading identity from grants; writeEntityGrant treating only grants_user_scope_target_role_key as idempotent success; idx_grants_one_candidate_editor
provides:
  - identity-callback finds a returning identity's candidate through its (entity, candidate, id, editor) grant (two service-role queries, project filter in the candidates query)
  - createCandidate writes first_name, last_name, project_id, confirmed only
  - deleteCandidate (ERR_CANDIDATE_DELETE_FAILED) and the compensating delete on identity-callback's create branch
  - invite-candidate links the invitee through the grant only (steps 1-7, one rollbackInvite call)
  - SupabaseAdminClient.candidateIdsForUser / userIdForCandidate (public) and five methods rewritten over them, read-ids-before-delete ordering in teardown
  - bank-auth spec asserts the same candidate_id on the second POST and exactly one candidate-editor grant for the new user
  - 166-NEGATIVE-CONTROLS.md rows NC-5, NC-6, NC-7
affects: [166-03, 166-04, identity-callback, invite-candidate, E2E harness teardown]

actuals:
  tokens: 32000
  tasks: 3
  commits: 4
plan_head_before: 18b25f305104b9fd8ab2807a9fef0fe1d0ca981a
plan_head_after: 3f217b7f45b49be0683587a05cb32d230ced4ca6

tech-stack:
  added: []
  patterns:
    - "Identity lookup outside the database = grants by user (scope, target_type, role) then the entity table filtered by project and the granted ids; grants.target_id has no FK, so no PostgREST embed"
    - "Compensating delete on the create branch only, guarded by the existing-row flag, before the rethrow; a failed compensation is logged, never thrown over the original error"
    - "Teardown reads entity ids through the grant BEFORE deleting grants or the user, and resets state by id"
    - "Hand-built thenable fakes for PostgREST chains that are awaited without a terminal call"

key-files:
  created:
    - .planning/phases/166-retire-auth-user-id-entity-identity-from-grants/166-02-SUMMARY.md
  modified:
    - apps/supabase/supabase/functions/identity-callback/candidateRecord.ts
    - apps/supabase/supabase/functions/identity-callback/candidateRecord.test.ts
    - apps/supabase/supabase/functions/identity-callback/index.ts
    - apps/supabase/supabase/functions/identity-callback/flowConformance.test.ts
    - apps/supabase/supabase/functions/invite-candidate/index.ts
    - apps/supabase/supabase/functions/invite-candidate/flowConformance.test.ts
    - tests/tests/utils/supabaseAdminClient.ts
    - tests/tests/specs/candidate/candidate-bank-auth.spec.ts
    - tests/tests/specs/candidate/candidate-bank-auth-journey.spec.ts
    - tests/tests/specs/candidate/candidate-journey.spec.ts
    - tests/tests/setup/admin/admin-access.teardown.ts
    - tests/tests/setup/admin/admin-auth.setup.ts
    - tests/tests/setup/candidate/bank-auth-journey.teardown.ts
    - tests/tests/setup/shared/auth.setup.ts
    - tests/tests/utils/candidateJourneyConstants.ts
    - tests/tests/utils/adminCredentials.ts
    - tests/tests/utils/testCredentials.ts
    - .planning/phases/166-retire-auth-user-id-entity-identity-from-grants/166-NEGATIVE-CONTROLS.md

key-decisions:
  - "candidateRecord.ts models both lookup chains with one exported CandidateLookupFilter (eq, in, maybeSingle, PromiseLike of the grants result); the module stays import-free"
  - "The createCandidate row test compares with toStrictEqual plus an exact key list, so a leftover key holding undefined fails (toEqual would have passed the old code)"
  - "userIdForCandidate narrows user_id with a typeof check instead of a cast: assert:rpc-nullability treats `user_id as string | undefined` as an ad-hoc RPC-column nullability cast"
  - "deleteBankAuthCandidateBySub deletes the candidate filtered by id AND this.projectId, and is documented as having to run before unregisterCandidate"
  - "invite-candidate's flowConformance pins the absence of any `.update(` call instead of naming the removed link message, so the test file carries no link-failure wording"

patterns-established:
  - "Read-ids-before-delete: any teardown that resets entity state for a user resolves the ids through the grant first"

requirements-completed: [AUTHID-02, AUTHID-03]
requirements-partial: [AUTHID-05, AUTHID-07]

coverage:
  - id: D1
    description: "identity-callback finds a returning identity's candidate through its candidate-editor grant, in the served project only; no grant means no candidates query; any query error (including two rows) throws ERR_CANDIDATE_LOOKUP_FAILED without project or user id in the message"
    requirement: AUTHID-02
    verification:
      - kind: unit
        ref: "apps/supabase/supabase/functions/identity-callback/candidateRecord.test.ts#findExistingCandidate (11 cases)"
        status: pass
      - kind: e2e
        ref: "PLAYWRIGHT_BANK_AUTH=1 tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/166-02-bank-auth-nc6-green --project bank-auth --no-db-reset (8 passed)"
        status: pass
    human_judgment: false
  - id: D2
    description: "createCandidate writes exactly first_name, last_name, project_id and confirmed: true"
    requirement: AUTHID-02
    verification:
      - kind: unit
        ref: "candidateRecord.test.ts#writes exactly the name parts, the project and the confirmation flag"
        status: pass
    human_judgment: false
  - id: D3
    description: "A failed grant write on the create branch deletes the just-created candidate (by id and project) before rethrowing; the existing branch never deletes; a failed delete is logged"
    requirement: AUTHID-02
    verification:
      - kind: unit
        ref: "candidateRecord.test.ts#deleteCandidate (3 cases)"
        status: pass
      - kind: unit
        ref: "identity-callback/flowConformance.test.ts#writes the grant once, after both candidate branches, and deletes a just-created candidate when that write fails"
        status: pass
    human_judgment: false
  - id: D4
    description: "A second identity-callback POST returns the same candidate_id with is_new_user false, and the new user holds exactly one (entity, candidate, candidate_id, editor) grant; the new assertion was seen red under an injected lookup fault (NC-6)"
    requirement: AUTHID-02
    verification:
      - kind: e2e
        ref: "tests/e2e-runs/166-02-bank-auth (exit 0), tests/e2e-runs/166-02-bank-auth-nc6 (exit 1, the planned red), tests/e2e-runs/166-02-bank-auth-nc6-green (exit 0)"
        status: pass
    human_judgment: false
  - id: D5
    description: "invite-candidate writes the grant only: no link step, one rollbackInvite call, steps numbered 1-7"
    requirement: AUTHID-03
    verification:
      - kind: unit
        ref: "invite-candidate/flowConformance.test.ts#rolls back the invited auth user as well as the candidate when the grant write fails"
        status: pass
    human_judgment: false
  - id: D6
    description: "The E2E admin client resolves identity through candidateIdsForUser / userIdForCandidate; unregisterCandidate and deleteAllTestUsers read ids before deleting and reset terms of use by id; no file under tests/ or the Edge Functions names the link column"
    requirement: AUTHID-05
    verification:
      - kind: e2e
        ref: "tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/166-02-candidate-journey --project candidate-journey --no-db-reset (5 passed)"
        status: pass
      - kind: e2e
        ref: "tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/166-02-candidate-a11y --project candidate-a11y-scan --no-db-reset (17 passed)"
        status: pass
      - kind: other
        ref: "git grep -l auth_user_id -- tests apps/supabase/supabase/functions (no output, exit 1)"
        status: pass
    human_judgment: false
  - id: D7
    description: "Every file this plan touches passes the scoped hygiene scan as a whole, plus lint:check and format:check"
    requirement: AUTHID-07
    verification:
      - kind: other
        ref: "bash 166-hygiene-scan.sh <17 touched code files> (CLEAN, exit 0); yarn lint:check exit 0; yarn format:check exit 0"
        status: pass
    human_judgment: false

duration: 20min
completed: 2026-10-01
status: complete
---

# Phase 166 Plan 02: Grant-Based Identity in the Edge Functions and the E2E Harness Summary

**identity-callback now finds a returning identity's candidate through its `(entity, candidate, <id>, editor)` grant and deletes a candidate it just created when the grant write fails. invite-candidate links the invitee through the grant alone. The E2E admin client resolves identity through two public grant helpers and reads candidate ids before it deletes anything. No Edge Function or `tests/` file names the link column any more, so only the schema, generated artefacts, seed, dev-seed and pgTAP fixtures still name it, which is the set 166-03 drops.**

## Performance

- **Duration:** about 20 min (2026-10-01T20:44:58Z to 21:04:11Z)
- **Started:** 2026-10-01T20:44:58Z
- **Completed:** 2026-10-01T21:04:11Z
- **Tasks:** 3/3
- **Files modified:** 18 (17 code files and the negative-controls record)

## Accomplishments

- **`candidateRecord.ts`.** `findExistingCandidate` now makes two queries. The first reads grants by `user_id`, `scope='entity'`, `target_type='candidate'` and `role='editor'`, and returns null early if there are none. The second is `candidates` with `.eq('project_id', …).in('id', ids).maybeSingle()`. Either error throws `ERR_CANDIDATE_LOOKUP_FAILED` with only the client's text. `createCandidate` has lost its auth-user parameter and writes four keys. The new `deleteCandidate` deletes by id and project and throws `ERR_CANDIDATE_DELETE_FAILED`. The module docblock describes the grant lookup in the present tense, and the `162`, `D-10`, `162-06` and "Section 11.2" citations are gone.
- **identity-callback `index.ts`.** There is one `await writeEntityGrant(supabaseAdmin` inside a `try`. Its `catch (grantError)` checks `if (!existingCandidate)`, then calls `await deleteCandidate(supabaseAdmin, …)` with a `.catch` that logs a failed delete, then `throw grantError`. All five source-text anchors survive, and the file has no `.from('candidates')`.
- **invite-candidate.** The link update and its rollback arm are deleted, and the success response is now step 7. `rollbackInvite` is still a helper and is called once, from the grant-failure arm.
- **`SupabaseAdminClient`.** Two public helpers were added: `candidateIdsForUser`, scoped to the project, and `userIdForCandidate`. They are used as follows:
  - `forceRegister` now has three steps.
  - `sendEmail` treats a candidate as registered when a grant names it.
  - `unregisterCandidate` and `deleteAllTestUsers` read ids, reset `terms_of_use_accepted` by id, then delete grants and then the user. `deleteAllTestUsers` gains the reset.
  - `deleteBankAuthCandidateBySub` finds candidates through the grant, and its misplaced docblock was moved above it and rewritten.
- **Specs.** In `candidate-bank-auth.spec.ts`:
  - `afterAll` deletes the candidate by id, then the grants, then the user.
  - The create test asserts that the new user's grants are exactly `[{entity, candidate, candidate_id, editor}]`.
  - The second-POST test asserts the same `candidate_id`.
  - The journey spec's step 6b uses `client.candidateIdsForUser(authUserId)` with `toHaveLength(1)`.
- **Comment sweep.** Comments were corrected in eight comment-only files. `bank-auth-journey.teardown.ts` no longer cites review findings (`CR-01`, `WR-08`) or says "this step used to write", and `EFLOW-10b`, `WR-06/WR-02` and `phase-158` were removed from the admin client.

## Task Commits

1. **Task 1 (tracer): a returning identity is found through its grant, and a failed create is undone:** `079bad487` (feat); NC-6 record `c9c0a47b5` (docs)
2. **Task 2: invite-candidate writes the grant only:** `01aa40f4f` (feat)
3. **Task 3: the E2E admin client and specs resolve identity from grants:** `3f217b7f4` (feat)

**Tracer gate:** Task 1's `<verify>` passed end to end (bank-auth 8/8 on committed HEAD `079bad487`) before expansion. `⚡ Tracer verified end-to-end — expanding`.

## Verification (final tree, HEAD `3f217b7f4`)

| Gate | Result |
|---|---|
| `yarn workspace @openvaa/supabase test:unit` | exit 0, 15 files, 205 passed |
| bank-auth E2E `166-02-bank-auth` / `-nc6` / `-nc6-green` | exit 0 (8/8) / exit 1, the planned NC-6 red / exit 0 (8/8), preflight OK each |
| `candidate-journey` E2E `166-02-candidate-journey` | exit 0, 5 passed, 0 skipped, preflight 0 failures / 1 success |
| `candidate-a11y-scan` E2E `166-02-candidate-a11y` | exit 0, 17 passed, 0 skipped, preflight 0 failures / 1 success |
| `yarn lint:check` (status read directly, not through a pipe) | exit 0 |
| `yarn format:check` | exit 0 |
| `yarn workspace @openvaa/dev-seed test:unit` | exit 0, 66 files, 898 passed |
| `git grep -l auth_user_id -- tests apps/supabase/supabase/functions` | no output, exit 1 |
| `166-hygiene-scan.sh` over all 17 touched code files | `CLEAN`, exit 0 |
| Task 1/2/3 acceptance greps | all pass (writeEntityGrant ×1, deleteCandidate ×1, no candidates chain in index.ts, the three anchors ≥1; rollbackInvite ×1, 7 numbered steps, no `// 8.`; helpers public, `candidateIdsForUser(` before `.delete()` in both teardown methods) |

The candidate-journey and a11y runs were made against the Task 3 working tree before its commit. The commit that followed contains exactly the tree they ran against.

## TDD Gate Compliance

There are no separate `test(166-02)` RED commits. The plan says "Do not commit the red state", so each RED was run against the old code, recorded verbatim in `166-NEGATIVE-CONTROLS.md`, and then committed together with the fix:
- **NC-5:** 13 planned assertion failures plus the missing `deleteCandidate` export.
- **NC-7:** `expected 2 to be 1`.

Neither RED was a load or parse error. NC-6 is the E2E standing-acceptance control: a fault injected into a committed tree, then reverted (`git diff --exit-code` exit 0).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] RPC-nullability guard rejected a cast in `userIdForCandidate`**
- **Found during:** Task 3 (`yarn lint:check`)
- **Issue:** `scripts/assert-rpc-return-nullability.mjs` flagged `(grant?.user_id as string | undefined) ?? null`. `user_id` is also a column of an RPC return table, so the guard reads the line as an ad-hoc nullability cast.
- **Fix:** `const userId: unknown = grant?.user_id; return typeof userId === 'string' ? userId : null;`
- **Files modified:** `tests/tests/utils/supabaseAdminClient.ts`
- **Verification:** `yarn lint:check` exit 0
- **Committed in:** `3f217b7f4`

**2. [Rule 1 - Side effect] Restored the local edge-runtime container's environment after the bank-auth runs**
- **Found during:** Task 1 cleanup
- **Issue:** `supabase functions serve --env-file <test env>` replaces the `supabase_edge_runtime_openvaa-local` container, and killing the CLI process does not stop it. The container kept serving with the test decryption key, the test issuer and the e2 project after the run.
- **Fix:** Started `npx supabase functions serve` once with no `--env-file`, which loads `functions/.env`, then stopped the CLI. I checked the restored env by key only (issuer `https://openvaa.test.idura.broker`, default project, `SITE_URL :5173`). Docker itself was never restarted, and the other Supabase stack was not touched.
- **Files modified:** none (runtime state only)

**3. [Rule 2 - Scope addition] Two more narrative fixes during the whole-file sweep**
- The advisory scan flagged `adminCredentials.ts` and `testCredentials.ts` ("deriving them threw at import time once the source template was retired"). Both now give the reason in the present tense.
- The test title "reads no retired claim key" was renamed in both flowConformance files.
- **Committed in:** `3f217b7f4`, `079bad487`, `01aa40f4f`

**4. [Rule 2 - Test strictness] Strict row comparison and extra lookup cases**
- The `createCandidate` row test uses `toStrictEqual` plus an exact key list. Plain `toEqual` ignores a key that holds `undefined`, so it would have passed against the old code.
- I added three lookup cases the plan's bullets imply:
  - a null grants answer is treated like an empty one;
  - a granted candidate outside the served project resolves to null;
  - the message-privacy check covers the grants query as well as the candidates query.

---

**Total deviations:** 4 (1 blocking fix, 1 runtime side-effect restore, 2 sweep/strictness additions). **Impact:** none on scope; each was needed for a gate or for honest evidence.

## Flagged Assumptions

- **AUTHID-03 encoding probe:** does not apply. The invite flow changes no length or equality semantics, as the plan's probe-coverage note already says.
- **`auth.setup.ts` comment:** the new wording says the "deleted and re-inserted" base dataset's candidate delete removes the stale user's grant, through `cleanup_grants_on_delete`. That fits the run evidence (`delete base dataset` and then `import base dataset` run before auth setup, and the a11y run passed). I did not prove it with a dedicated probe that bulk import never keeps the old row id. **UNCONFIRMED.**
- **`deleteBankAuthCandidateBySub` is now project-scoped**, through `candidateIdsForUser`, where it used to be unscoped. It finds the journey's candidate only if the served identity-callback writes into the client's project, which is e2. The journey spec's step 6b already assumed that. The `bank-auth-journey` project was not run in this plan; 166-04's gate covers it.

## Issues Encountered

None blocking. The E2E wrapper's `--no-db-reset` runs went against the database the previous plan left. NC-6's orphan candidate was deleted by psql as the plan specified (`DELETE 1`, 0 grants left).

## Known Stubs

None.

## Threat Flags

None. No new endpoint or trust boundary. The only new server-side log is the failed compensating delete in identity-callback, which is server-side only and is covered by T-166-10.

## User Setup Required

None.

## Next Phase Readiness

- **166-03 can drop the column.** The only things that still name it are the schema files, the generated migration and types, `seed.sql`, the dev-seed permitted keys and absence test, `column-map.ts`, and the pgTAP fixtures and guards.
- **AUTHID-05 and AUTHID-07 stay Pending** until 166-03 lands. AUTHID-02 and AUTHID-03 are complete here.
- **For 166-04's bank-auth-journey gate:** serve `identity-callback` with the journey issuer (`https://127.0.0.1:9443`), not the `bank-auth` issuer.
- **For 166-04's bank-auth gate:** run with `PUBLIC_PROJECT_ID=…e2`. Then restore the edge-runtime container to the `functions/.env` defaults afterwards: a killed `functions serve` leaves the test env in place.

---
*Phase: 166-retire-auth-user-id-entity-identity-from-grants*
*Completed: 2026-10-01*

## Self-Check: PASSED
