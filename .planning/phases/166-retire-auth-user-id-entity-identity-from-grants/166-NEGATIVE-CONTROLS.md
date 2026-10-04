# Phase 166: Negative Controls

**Purpose.** The standing acceptance rule (`.planning/REQUIREMENTS.md`): every new check this phase adds
is observed FAILING on a realistic regression before it counts. Each row below records the check, the
regression state it was run against (the old code, or an injected fault), the exact command, the RED
verdict with its exit code and the verbatim failing lines, and then the GREEN run after the change.
An injected fault is reverted and the revert proven with `git diff --exit-code -- <file>`.

**Opened at:** HEAD `cb276b0d2` on `fix/888-review-findings` (166-01 start, 2026-10-01).

**Row format:** id · check · regression state · command · RED (exit code + verbatim failing lines) · GREEN.

---

## NC-1 — identity is read from the grant table (166-01 Task 1)

- **Check:** the "who the caller is" and "catalog" sections of
  `apps/supabase/supabase/tests/database/36-entity-identity.test.sql` (13 assertions).
- **Regression state:** the OLD code — the tree at `cb276b0d2`, where `get_candidate_user_data` is a
  `LANGUAGE sql` function reading the per-row auth link column of `candidates` / `organizations`,
  ending in `LIMIT 1`, and `private.caller_entity_ids` does not exist. Only the new test file was
  added; no schema file was touched.
- **Command:** `yarn db:reset && yarn workspace @openvaa/supabase test:db`

### RED

`yarn db:reset` exit 0; `test:db` **exit 1**.

```
/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/supabase/supabase/tests/database/36-entity-identity.test.sql ...............
# Failed test 1: "one candidate-editor grant in project A resolves to exactly that candidate"
#         have: NULL
#         want: 36363636-3636-3636-3636-0000000000c1
# Failed test 2: "asked for project B, the same caller resolves to its project B candidate"
#         have: NULL
#         want: 36363636-3636-3636-3636-0000000000c4
# Failed test 5: "an organization-editor grant resolves to that organization in the organization arm"
#         have: NULL
#         want: dddddddd-dddd-dddd-dddd-000000000003
# Failed test 7: "two organization-editor grants in one project raise"
#       caught: no exception
#       wanted: P0001
# Failed test 8: "a second candidate-editor grant in the table raises even though the token predates it"
#       caught: no exception
#       wanted: P0001
# Failed test 9: "the ambiguity error carries the hint ERR_ENTITY_IDENTITY_AMBIGUOUS"
#         have: NULL
#         want: ERR_ENTITY_IDENTITY_AMBIGUOUS
# Failed test 11: "private.caller_entity_ids is SECURITY DEFINER with an empty search_path"
# Failed test 13: "authenticated holds the private schema's stated EXECUTE grant on private.caller_entity_ids"
# Looks like you failed 8 tests of 13
Failed 8/13 subtests

Test Summary Report
-------------------
/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/supabase/supabase/tests/database/36-entity-identity.test.sql             (Wstat: 0 Tests: 13 Failed: 8)
  Failed tests:  1-2, 5, 7-9, 11, 13
Files=36, Tests=1330,  3 wallclock secs ( 0.08 usr  0.03 sys +  0.17 cusr  0.07 csys =  0.35 CPU)
Result: FAIL
```

The five assertions that pass on the old code (3 project admin, 4 entity-admin holder, 6 anon, 10 helper
absent from `public`, 12 RPC not SECURITY DEFINER) are the denial and placement halves; they guard
against a fix that over-reaches (for example one routed through `user_can`), not against the old code.

### GREEN

After `private.caller_entity_ids` (301) and the plpgsql `get_candidate_user_data` (503) landed:
`yarn prettier --write …`, `yarn schema:regenerate`, `yarn db:reset` (exit 0), `yarn db:types` (exit 0,
`packages/supabase-types/src/database.ts` byte-identical), then `test:db` **exit 0**:

```
/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/supabase/supabase/tests/database/36-entity-identity.test.sql ............... ok
All tests successful.
Files=36, Tests=1330,  3 wallclock secs ( 0.07 usr  0.04 sys +  0.17 cusr  0.08 csys =  0.36 CPU)
Result: PASS
```

Placement probe for assertion 13 (rolled back, psql as postgres): a function created in `private`
after the `GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA private` statement carries no stated grant, so the
assertion distinguishes the two placements:

```
      proname      | acl_null | stated
-------------------+----------+--------
 caller_entity_ids | f        | t
 probe_after_grant | t        | f
```

Other gates: `yarn assert:schema-migration-parity` exit 0, `yarn assert:rpc-nullability` exit 0
(`get_candidate_user_data 14 … 0 violation(s)`), `yarn db:lint:sql` exit 0 (`No schema errors found`,
`0 error(s), 3 warning(s)` — the baseline), `plpgsql_check_function` on the new body: 0 rows.

E2E tracer: `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/166-01-tracer --project candidate-a11y-scan`
**exit 0** — `17 passed (16.7s)`, `preflight failures 0, successes 1`, HEAD `cb276b0d2` plus the
uncommitted Task 1 change. Every protected candidate page in the scan loads through the rewritten RPC.

---

## NC-2 — one editor per candidate, by the index's name (166-01 Task 2, pgTAP)

- **Check:** the "One editor per candidate" section of `36-entity-identity.test.sql` (tests 14-18):
  a second user's candidate-editor grant refused naming `idx_grants_one_candidate_editor`; an exact
  duplicate refused naming `grants_user_scope_target_role_key`; a third organization editor and an
  `admin`-role grant on an edited candidate admitted; the index exists, unique and partial.
- **Regression state:** the OLD schema — `4413b8ac7` (Task 1 committed), no partial index in
  `300-auth-tables.sql`; only the new pgTAP section added.
- **Command:** `yarn db:reset && yarn workspace @openvaa/supabase test:db`

### RED

`yarn db:reset` exit 0; `test:db` **exit 1**.

```
/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/supabase/supabase/tests/database/36-entity-identity.test.sql ...............
# Failed test 14: "a second user's editor grant on a candidate is refused by idx_grants_one_candidate_editor"
#       caught: no exception
#       wanted: 23505
# Failed test 18: "idx_grants_one_candidate_editor is a unique partial index on grants"
# Looks like you failed 2 tests of 18
Failed 2/18 subtests

Test Summary Report
-------------------
/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/supabase/supabase/tests/database/36-entity-identity.test.sql             (Wstat: 0 Tests: 18 Failed: 2)
  Failed tests:  14, 18
Files=36, Tests=1335,  3 wallclock secs ( 0.08 usr  0.04 sys +  0.16 cusr  0.09 csys =  0.37 CPU)
Result: FAIL
```

Tests 15-17 pass on the old schema by design: they pin what the index must NOT break (the exact
duplicate still names the table key, so identity-callback's idempotent re-write stays a success;
organizations stay multi-editor; an `admin`-role entity grant stays outside the rule).

**Fixture control (the 12-user-can retarget is required).** With the index in place and
`12-user-can.test.sql` restored to its HEAD content (`git show HEAD:<file> > <file>`), `test:db`
**exit 1**:

```
psql:/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/supabase/supabase/tests/database/12-user-can.test.sql:245: ERROR:  duplicate key value violates unique constraint "idx_grants_one_candidate_editor"
DETAIL:  Key (target_id)=(dddddddd-dddd-dddd-dddd-000000000005) already exists.
Dubious, test returned 3 (wstat 768, 0x300)
Failed 45/45 subtests
  Parse errors: Bad plan.  You planned 45 tests but ran 0.
Result: FAIL
```

The retargeted file was copied back from a scratch copy and `cmp` confirmed it byte-identical.

### GREEN

After the index (300), the 12-user-can retarget (union caller's entity grant on `candidate_a2`),
`yarn schema:regenerate`, `yarn db:reset` (exit 0) and `yarn db:types` (exit 0, `database.ts`
byte-identical — `git diff --exit-code` exit 0), `test:db` **exit 0**:

```
/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/supabase/supabase/tests/database/12-user-can.test.sql ...................... ok
/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/supabase/supabase/tests/database/36-entity-identity.test.sql ............... ok
Files=36, Tests=1335,  3 wallclock secs ( 0.08 usr  0.03 sys +  0.18 cusr  0.07 csys =  0.36 CPU)
Result: PASS
```

`yarn assert:schema-migration-parity` exit 0.

---

## NC-3 — the grant write treats only the table key as success (166-01 Task 2, vitest + hygiene)

- **Check:** `entityGrant.test.ts` case "throws when a unique violation names a key other than the
  grant key" (a fake insert answering `code: '23505'` with a message naming
  `idx_grants_one_candidate_editor` must reject with `ERR_GRANT_WRITE_FAILED`), plus the scoped
  hygiene scan over both `entityGrant.ts` copies.
- **Regression state:** the OLD `writeEntityGrant` (`if (error && error.code !== UNIQUE_VIOLATION)`,
  every 23505 read as success); only the new test case added to `identity-callback/entityGrant.test.ts`.
- **Command:** `yarn workspace @openvaa/supabase test:unit`

### RED

`test:unit` **exit 1**.

```
   × writeEntityGrant > throws when a unique violation names a key other than the grant key 3ms
     → promise resolved "undefined" instead of rejecting

 FAIL  supabase/functions/identity-callback/entityGrant.test.ts > writeEntityGrant > throws when a unique violation names a key other than the grant key
AssertionError: promise resolved "undefined" instead of rejecting

- Expected:
Error {
  "message": "rejected promise",
}

+ Received:
undefined

 Test Files  1 failed | 14 passed (15)
      Tests  1 failed | 195 passed (196)
```

Hygiene scan over both `entityGrant.ts` copies, **exit 1**:

```
apps/supabase/supabase/functions/identity-callback/entityGrant.ts:8: * ENTITY-TYPE PARAMETERISED, which is D-21's instruction applied as far as wave 2 reaches. ...
apps/supabase/supabase/functions/identity-callback/entityGrant.ts:78:  // IDEMPOTENT (162-REVIEW WR-06). A unique violation on `grants_user_scope_target_role_key` means this exact grant already exists, ...
apps/supabase/supabase/functions/invite-candidate/entityGrant.ts:8: * ENTITY-TYPE PARAMETERISED, which is D-21's instruction applied as far as wave 2 reaches. ...
apps/supabase/supabase/functions/invite-candidate/entityGrant.ts:78:  // IDEMPOTENT (162-REVIEW WR-06). A unique violation on `grants_user_scope_target_role_key` means this exact grant already exists, ...
FAIL: 4 hit line(s)
```

### GREEN

`IDEMPOTENT_GRANT_KEY = 'grants_user_scope_target_role_key'`; the check throws unless
`error.code === UNIQUE_VIOLATION && error.message.includes(IDEMPOTENT_GRANT_KEY)`; both copies of the
module and of the test byte-identical (`cmp` exit 0). `test:unit` **exit 0**:

```
 Test Files  15 passed (15)
      Tests  197 passed (197)
```

Hygiene scan over the seven Task 2 files: `CLEAN: no planning-reference form in 7 file(s)`, exit 0.

---

## NC-4 — anon can read no auth user id (166-01 Task 3, pgTAP census + behavioural check)

- **Check:** the "What anon can read" section of `36-entity-identity.test.sql` (tests 1-2): the census
  of every column of a foreign key to `auth.users` on a table where anon holds column SELECT and either
  RLS is off or a SELECT/ALL policy names anon or PUBLIC, expected to be exactly
  `{public.nominations.created_by}` (the single exemption); and, as anon,
  `SELECT auth_user_id FROM public.candidates` must raise `42703`.
- **Regression state:** the CURRENT tree with the link column present — `cc4a599b9` (Tasks 1-2
  committed); the column is dropped only in 166-03. This is the red run required before the drop lands.
- **Command:** `yarn db:reset && yarn workspace @openvaa/supabase test:db`

### RED (un-wrapped)

`yarn db:reset` exit 0; `test:db` **exit 1**.

```
/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/supabase/supabase/tests/database/36-entity-identity.test.sql ...............
# Failed test 1: "anon can read no auth user id column except nominations.created_by"
#         have: {public.candidates.auth_user_id,public.nominations.created_by,public.organizations.auth_user_id}
#         want: {public.nominations.created_by}
# Failed test 2: "anon cannot select an auth user id column from candidates"
#       caught: no exception
#       wanted: 42703
# Looks like you failed 2 tests of 20
Failed 2/20 subtests

Test Summary Report
-------------------
/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/supabase/supabase/tests/database/36-entity-identity.test.sql             (Wstat: 0 Tests: 20 Failed: 2)
  Failed tests:  1-2
Files=36, Tests=1337,  3 wallclock secs ( 0.08 usr  0.03 sys +  0.17 cusr  0.08 csys =  0.36 CPU)
Result: FAIL
```

### GREEN-with-TODO (held until the column is dropped)

The same two assertions wrapped in `SELECT todo_start ('the entity tables still expose an auth user id to anon');`
... `SELECT todo_end ();`. `yarn db:reset` exit 0; `test:db` **exit 0**:

```
/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/supabase/supabase/tests/database/36-entity-identity.test.sql ...............
# Failed (TODO) test 1: "anon can read no auth user id column except nominations.created_by"
#         have: {public.candidates.auth_user_id,public.nominations.created_by,public.organizations.auth_user_id}
#         want: {public.nominations.created_by}
# Failed (TODO) test 2: "anon cannot select an auth user id column from candidates"
#       caught: no exception
#       wanted: 42703
ok
All tests successful.
Files=36, Tests=1337,  3 wallclock secs ( 0.07 usr  0.04 sys +  0.16 cusr  0.08 csys =  0.35 CPU)
Result: PASS
```

166-03 removes the wrapper; the same two assertions must then pass un-wrapped (that run is NC-4's
real GREEN and belongs to 166-03's record).

### GREEN (un-wrapped, 166-03 Task 1 — the column and its indexes dropped)

Tree: 166-03 Task 1's working tree on top of `12e8f01b0` — `candidates` / `organizations` without the
link column, `idx_candidates_*` / `idx_organizations_*` link indexes gone, the migration regenerated
(still one file), and the `todo_start` / `todo_end` pair deleted from `36-entity-identity.test.sql`
with the two assertions byte-identical to 166-01's. `yarn db:reset` exit 0; `yarn db:types` exit 0;
`yarn workspace @openvaa/supabase test:db` **exit 0**:

```
/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd/apps/supabase/supabase/tests/database/36-entity-identity.test.sql ............... ok
All tests successful.
Files=36, Tests=1335,  3 wallclock secs ( 0.06 usr  0.05 sys +  0.17 cusr  0.08 csys =  0.36 CPU)
Result: PASS
```

(1335 = 1337 − the two `09-column-restrictions` assertions on the dropped column; `plan (32)`.)

The same file run verbosely (`npx supabase test db supabase/tests/database/00-helpers.test.sql
supabase/tests/database/36-entity-identity.test.sql --debug`, exit 0), the two NC-4 lines with no
`# TODO` marker:

```
1..20
ok 1 - anon can read no auth user id column except nominations.created_by
ok 2 - anon cannot select an auth user id column from candidates
...
All tests successful.
Files=2, Tests=29,  0 wallclock secs ( 0.01 usr  0.01 sys +  0.01 cusr  0.00 csys =  0.03 CPU)
Result: PASS
```

The census now returns exactly `{public.nominations.created_by}` (the one exemption, never widened),
and anon selecting the link column from `candidates` raises `42703`. **NC-4 closed: RED observed in
166-01, GREEN un-wrapped here.**

---

## NC-5 — identity-callback finds the candidate through its grant and undoes a failed create (166-02 Task 1, vitest)

- **Check:** the rewritten `findExistingCandidate` cases, the four-key `createCandidate` row case, the
  three `deleteCandidate` cases and the entry-point import case in
  `apps/supabase/supabase/functions/identity-callback/candidateRecord.test.ts`, plus the order case
  "writes the grant once, after both candidate branches, and deletes a just-created candidate when that
  write fails" in `identity-callback/flowConformance.test.ts`.
- **Regression state:** the OLD code at HEAD `18b25f305` — `findExistingCandidate` filters `candidates`
  on the per-row auth link column, `createCandidate` writes that column, `deleteCandidate` does not
  exist, and `index.ts` writes the grant with no try/catch. Only the two test files were changed.
- **Command:** `yarn workspace @openvaa/supabase test:unit`

### RED

`test:unit` **exit 1** (`Test Files  2 failed | 13 passed (15)`, `Tests  13 failed | 192 passed (205)`).
Every failure is a planned assertion or the missing export, none a load or parse error:

```
 FAIL  candidateRecord.test.ts > findExistingCandidate > reads the target ids of the user’s candidate-editor grants
AssertionError: expected [ [ 'candidates', 'id' ] ] to deeply equal ArrayContaining{…}
 FAIL  candidateRecord.test.ts > findExistingCandidate > reads the granted candidate in the served project only, as at most one row
AssertionError: expected [ 'candidates' ] to deeply equal [ 'grants', 'candidates' ]
 FAIL  candidateRecord.test.ts > findExistingCandidate > carries every granted id and the project id it was given rather than one of its own
AssertionError: expected [ { table: 'candidates', …(3) }, …(1) ] to deeply equal ArrayContaining{…}
 FAIL  candidateRecord.test.ts > findExistingCandidate > returns null without reading candidates when the user holds no candidate-editor grant, the ordinary first-registration case
AssertionError: expected [ 'candidates' ] to deeply equal [ 'grants' ]
 FAIL  candidateRecord.test.ts > findExistingCandidate > treats a null grants answer like an empty one
AssertionError: expected [ 'candidates' ] to deeply equal [ 'grants' ]
 FAIL  candidateRecord.test.ts > findExistingCandidate > rejects, without reading candidates, when the grants query reported an error
AssertionError: promise resolved "null" instead of rejecting
 FAIL  candidateRecord.test.ts > findExistingCandidate > names the client-reported failure of the grants query and nothing about the deployment in the thrown message
AssertionError: expected null to be an instance of Error
 FAIL  candidateRecord.test.ts > the identity-callback entry point reaches the candidates table only through the helper > calls findExistingCandidate, createCandidate and deleteCandidate, all imported from the helper module
AssertionError: expected '/**\n * Provider-Agnostic Identity Ca…' to contain 'deleteCandidate('
 FAIL  candidateRecord.test.ts > createCandidate > writes exactly the name parts, the project and the confirmation flag
AssertionError: expected [ 'auth_user_id', 'confirmed', …(3) ] to deeply equal [ 'confirmed', 'first_name', …(2) ]
 FAIL  candidateRecord.test.ts > deleteCandidate > deletes the candidate by its id within the served project
TypeError: (0 , deleteCandidate) is not a function
 FAIL  candidateRecord.test.ts > deleteCandidate > carries the project id it was given rather than one of its own
TypeError: (0 , deleteCandidate) is not a function
 FAIL  candidateRecord.test.ts > deleteCandidate > rejects with the client-reported text only when the delete fails
TypeError: (0 , deleteCandidate) is not a function
 FAIL  flowConformance.test.ts > identity-callback flow conformance > writes the grant once, after both candidate branches, and deletes a just-created candidate when that write fails
AssertionError: expected 14286 to be greater than 18710
```

The flow case fails on its "grant call sits inside a `try` that opens after the create branch" step: the
nearest `try {` before the grant call is the handler's outer one.

### GREEN

Two-query lookup through `grants`, the four-key insert, `deleteCandidate` filtered by id and project,
and the grant write in a `try` whose catch deletes the new candidate on the create branch before
rethrowing. `test:unit` **exit 0**:

```
 Test Files  15 passed (15)
      Tests  205 passed (205)
```

---

## NC-6 — the returning-identity assertion catches a broken grant lookup (166-02 Task 1, bank-auth E2E)

- **Check:** the new assertion `expect(body.candidate_id).toBe(captured.body.candidate_id)` in
  `tests/tests/specs/candidate/candidate-bank-auth.spec.ts`, test "should return session with magic link
  when candidate is created" (the second POST for the same identity).
- **Regression state:** the committed Task 1 tree (HEAD `079bad487`) with one injected fault: `return null;`
  as the first statement of `findExistingCandidate` in
  `apps/supabase/supabase/functions/identity-callback/candidateRecord.ts`, so every login takes the create
  branch. The function server was restarted on the faulted file before the run.
- **Environment:** `identity-callback` served by `npx supabase functions serve identity-callback
  --no-verify-jwt --env-file $SCRATCH/bank-auth-edge.env` (Step E-1 values, issuer
  `https://test-idp.example.com`, `PUBLIC_PROJECT_ID=00000000-0000-0000-0000-0000000000e2`,
  `SITE_URL=http://127.0.0.1:5273`), the test JWKS on `python3 -m http.server 8777`. Nothing written
  into the repository, the root `.env` or `functions/.env`.
- **Command:** `PLAYWRIGHT_BANK_AUTH=1 tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/166-02-bank-auth-nc6 --project bank-auth --no-db-reset`

### Baseline GREEN before the fault

`tests/e2e-runs/166-02-bank-auth` (Task 1 tree, uncommitted at the time, served fresh): exit file `0`,
`{"expected":8,"skipped":0,"unexpected":0,"flaky":0}`, preflight OK.

### RED (fault injected)

Exit file **`1`**, `{"expected":4,"skipped":3,"unexpected":1,"flaky":0}`. The create test and the
wrong-key test pass; in the second-POST test every pre-existing assertion before the new line passes
(status 200, `success`, `is_new_user === false`, `user_id`), and the new assertion fails:

```
failed  should return session with magic link when candidate is created
   ERR: Error: expect(received).toBe(expected) // Object.is equality

        Expected: "9b18c5e1-7c69-44b7-9129-01e441670fbd"
        Received: "1f55b198-2a76-4c0b-9a55-58e528fb1739"

          244 |     expect(body.user_id).toBe(captured.createdUserId);
          245 |     // The returning identity is matched to the candidate it already edits, found through its grant, rather than given a second one.
        > 246 |     expect(body.candidate_id).toBe(captured.body.candidate_id);
```

The three later tests are `skipped` only because the describe is `mode: 'serial'` and stops at the first
failure; they are the CORS and malformed-request cases, unaffected by the lookup.

### Revert proof and orphan cleanup

`git checkout -- apps/supabase/supabase/functions/identity-callback/candidateRecord.ts`, then
`git diff --exit-code -- apps/supabase/supabase/functions/identity-callback/candidateRecord.ts` **exit 0**.
The faulted run left the second candidate behind (the spec's cleanup deletes the first by id): one row,
`1f55b198-2a76-4c0b-9a55-58e528fb1739`, removed with
`DELETE FROM public.candidates WHERE project_id = '00000000-0000-0000-0000-0000000000e2' AND external_id IS NULL`
(`DELETE 1`; grants naming it afterwards: `0`, removed by `cleanup_grants_on_delete`).

### GREEN (fault reverted, server restarted)

`tests/e2e-runs/166-02-bank-auth-nc6-green` on HEAD `079bad487`: exit file **`0`**,
`{"expected":8,"skipped":0,"unexpected":0,"flaky":0}`, all eight tests `passed`, preflight OK; no
candidate without an external id left in the e2 project afterwards (`0`). Both servers stopped; ports 8777
and 5273 have no listener.

---

## NC-7 — invite-candidate writes the grant and nothing else (166-02 Task 2, vitest source-text)

- **Check:** `apps/supabase/supabase/functions/invite-candidate/flowConformance.test.ts` case "rolls back
  the invited auth user as well as the candidate when the grant write fails": exactly one
  `await rollbackInvite(supabaseAdmin` call, `supabaseAdmin.auth.admin.deleteUser(userId)` still present
  (inside `rollbackInvite`), no "Log but don't fail", and no `.update(` call anywhere in the source.
- **Regression state:** the OLD `invite-candidate/index.ts` at HEAD `c9c0a47b5`, which still carries step 7
  (the `.update(...)` on `candidates` writing the per-row auth link and its own rollback arm). Only the
  test case was changed.
- **Command:** `yarn workspace @openvaa/supabase test:unit`

### RED

`test:unit` **exit 1** (`Test Files  1 failed | 14 passed (15)`, `Tests  1 failed | 204 passed (205)`):

```
   × invite-candidate flow conformance > rolls back the invited auth user as well as the candidate when the grant write fails 4ms
 FAIL  supabase/functions/invite-candidate/flowConformance.test.ts > invite-candidate flow conformance > rolls back the invited auth user as well as the candidate when the grant write fails
AssertionError: expected 2 to be 1 // Object.is equality
```

### GREEN

Step 7 (the link update and its rollback arm) deleted; "Return success response" renumbered 7;
`rollbackInvite` kept as the one helper, called once from the grant-failure arm. `test:unit` **exit 0**:

```
 Test Files  15 passed (15)
      Tests  205 passed (205)
```

`grep -cE "^ *// [0-9]+\. " index.ts` = 7; `grep -c "// 8\." index.ts` = 0. No E2E project exercises
invite-candidate, so this source-text gate and the unit suite are its whole evidence.
