---
phase: 172-terms-of-use-per-user-and-project
plan: 03
subsystem: api
tags: [supabase, postgrest, upsert, data-writer, project-scoping, svelte-context, terms-of-use, vitest, e2e]

requires:
  - phase: 172-terms-of-use-per-user-and-project
    provides: "Plan 01: public.terms_of_use_acceptances with its self-row access model and the two gate helpers. Plan 02: the E2E admin client's acceptance default, its opt-out and acceptTermsOfUse(email)"
provides:
  - "'terms_of_use_acceptances' in the ProjectScopedTable union and in PROJECT_SCOPED_TABLES"
  - "ScopedTableAccess['upsert'] and the upsert member of scopedFrom: one parameter, the project id supplied, ignore-duplicates fixed inside the helper"
  - "BasicUserData.termsOfUseAccepted: string | null, filled by SupabaseDataWriter._getBasicUserData for the adapter's project"
  - "DataWriter.acceptTermsOfUse, UniversalDataWriter.acceptTermsOfUse() and SupabaseDataWriter._acceptTermsOfUse()"
  - "acceptTermsOfUse on the contestant context: a stable arrow field that rejects on failure"
  - "The boundary proof plan 02 named: the first full E2E run over the five perm setups and the localisation spec's helper call, 177 of 177"
affects: [172-04, 172-05, 172-07, 172-08, 172-09, 173, 178]

actuals:
  tokens: 6877
  tasks: 3
  commits: 3
plan_head_before: 2243b0863507f89589f8d92994a3464f7e7c7022
plan_head_after: dddab79bcd9112dcd856306cd00b93890e7c312f

tech-stack:
  added: []
  patterns:
    - "A write option that must never vary is fixed inside the guarded scoped helper, and the member's type takes the payload alone, so no caller can state it"
    - "A user-level fact read beside the session: a failed read is logged at error and read as null, so the gate that depends on it fails closed and an unrelated caller is not failed"
    - "A context wrapper the UI must hear fail neither catches nor logs: it returns the writer's promise as it is"

key-files:
  created: []
  modified:
    - apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.type.ts
    - apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts
    - scripts/assert-project-scoped-queries.mjs
    - apps/frontend/src/lib/api/base/dataWriter.type.ts
    - apps/frontend/src/lib/api/base/universalDataWriter.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts
    - apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.ts
    - apps/frontend/src/lib/contexts/contestant/contestantContext.type.ts
    - apps/frontend/src/lib/server/admin/requireAdminIdentity.test.ts
    - apps/frontend/src/routes/api/admin/jobs/adminJobsAuthorization.test.ts

key-decisions:
  - "The failed-read log record carries the message in a new Error and the SQLSTATE as an attribute: PostgREST reports a failure as a plain object, which the logger flattens to '[object Object]'"
  - "The two admin identity test fakes gained a stub for the one table read the identity read now makes; the writer was not wrapped in a try/catch to hide a client that has no `from`"
  - "The full static gate set was run before the E2E run although the plan asks only for the frontend checks: the change touches a script and types that dev-seed tests and lint:check read"
  - "A nine-check probe issued the adapter's exact read and write as a signed-in user against the local stack, because nothing in the E2E suite consumes either yet"

patterns-established:
  - "The gate's write: `await getContestantContext().acceptTermsOfUse()`; it resolves `{ type: 'success' }` and rejects with `acceptTermsOfUse: <message>`"
  - "A fake Supabase client that `getBasicUserData` runs over must answer `from(...).select(...).eq(...).maybeSingle()`"

requirements-completed: []

coverage:
  - id: D1
    description: "The acceptance table is in the ProjectScopedTable union and in PROJECT_SCOPED_TABLES, and both lists hold the same fourteen names"
    requirement: TOU-01
    verification:
      - kind: other
        ref: "git grep -n terms_of_use_acceptances on the two files (one line each); a node count of both lists (14 and 14); yarn assert:project-scoped-queries (exit 0, 0 violations)"
        status: pass
      - kind: unit
        ref: "packages/dev-seed/tests/projectScopingGate.test.ts (121 of 121)"
        status: pass
    human_judgment: false
  - id: D2
    description: "scopedFrom's upsert supplies the project id, always sends ignoreDuplicates, and its type takes the payload alone; no cast site was added"
    requirement: TOU-01
    verification:
      - kind: other
        ref: "git grep -n 'as unknown as' on supabaseAdapter.ts lists two sites before and after; yarn assert:adapter-casts (exit 0); git grep -q 'ignoreDuplicates: true' (exit 0)"
        status: pass
      - kind: unit
        ref: "apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts#acceptTermsOfUse > issues one ignore-duplicates upsert stating nothing but the project"
        status: pass
    human_judgment: false
  - id: D3
    description: "getBasicUserData returns termsOfUseAccepted: the stamped time of the caller's acceptance for the adapter's project, or null when there is no row"
    requirement: TOU-01
    verification:
      - kind: unit
        ref: "supabaseDataWriter.test.ts#getBasicUserData > terms-of-use acceptance > returns the stamped time of the acceptance row as termsOfUseAccepted; > returns null when the user has no acceptance row"
        status: pass
      - kind: other
        ref: "probe checks 2 and 4 against the local database: null before accepting, 2026-10-06T00:54:12.277826+00:00 after"
        status: pass
    human_judgment: false
  - id: D4
    description: "The acceptance read carries this adapter's project and is one round-trip; no adapter source reaches the table through the bare client"
    verification:
      - kind: unit
        ref: "supabaseDataWriter.test.ts#getBasicUserData > terms-of-use acceptance > reads the acceptance of this adapter's project in one round-trip; #project scoping > filters the nominations read by project as well as by candidate (exact list of two tables)"
        status: pass
      - kind: other
        ref: "git grep -n \"supabase.from('terms_of_use_acceptances')\" -- apps/frontend/src (no line, exit 1); two scopedFrom sites in supabaseDataWriter.ts"
        status: pass
    human_judgment: false
  - id: D5
    description: "A failed acceptance read is logged at error and yields null; getBasicUserData does not reject because of it"
    verification:
      - kind: unit
        ref: "supabaseDataWriter.test.ts#getBasicUserData > terms-of-use acceptance > returns null, reports the failure and does not reject when the read fails"
        status: pass
    human_judgment: false
  - id: D6
    description: "acceptTermsOfUse resolves { type: 'success' } and rejects with `acceptTermsOfUse: <message>` on an error"
    requirement: REG-12
    verification:
      - kind: unit
        ref: "supabaseDataWriter.test.ts#acceptTermsOfUse (two cases)"
        status: pass
      - kind: other
        ref: "probe checks 3, 5, 6 and 7: the upsert the helper builds gives 201 twice and leaves the stamped time unchanged; the same payload without the option gives 403 / 42501"
        status: pass
    human_judgment: false
  - id: D7
    description: "The contestant context exposes acceptTermsOfUse as an arrow field that returns the writer's promise with no catch"
    requirement: REG-12
    verification:
      - kind: other
        ref: "git grep -n acceptTermsOfUse -- apps/frontend/src/lib/contexts (the field, its call and the type member; no .catch in the wrapper); yarn workspace @openvaa/frontend typecheck (exit 0)"
        status: pass
    human_judgment: true
    rationale: "No test mounts the context class, so that the wrapper rejects is read from three lines of source and from the type; the first behavioural proof is the gate's unit test in 172-04."
  - id: D8
    description: "Nothing consumes the new field or the new method; the protected layout and its server load are unchanged"
    verification:
      - kind: other
        ref: "git show --stat on the three commits lists no file under routes/contestant/(protected); git grep for acceptTermsOfUse outside lib/api finds only the context's own three lines; no reader of user.termsOfUseAccepted (grep exit 1)"
        status: pass
    human_judgment: false
  - id: D9
    description: "The plan closes green on one tree: nine static gates at 0 and the full default E2E suite at 177 of 177"
    verification:
      - kind: other
        ref: "bash 172-gates.sh --judge 172-03-writer (exit 0; nine rows, every status 0; head dddab79bc, clean tree)"
        status: pass
      - kind: e2e
        ref: "bash 172-e2e.sh --judge 172-03-writer (exit 0; 177 total, 177 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run; the full default suite; head dddab79bc)"
        status: pass
    human_judgment: false
  - id: D10
    description: "Plan 02's boundary proof: the five perm setups that call forceRegister and the localisation spec's acceptTermsOfUse call run green"
    verification:
      - kind: e2e
        ref: "tests/e2e-runs/172/172-03-writer/summary.json byProject: data-setup-perm-{answers-locked,closed-project,disable-allow-open,hide-hero,question-video} 1 of 1 each; perm-localisation-positive 2 of 2"
        status: pass
    human_judgment: false

duration: 22min
completed: 2026-10-06
status: complete
---

# Phase 172 Plan 03: The Scoped Upsert, the Acceptance Read and `acceptTermsOfUse` on the Writer and the Context Summary

**The data writer now reads the signed-in user's terms-of-use acceptance for its project into `BasicUserData.termsOfUseAccepted` and records one through a dedicated `acceptTermsOfUse()`, both through a project-scoped helper whose new `upsert` cannot be sent without ignore-duplicates; the contestant context exposes the write; nothing consumes either yet, and the tree closed green on nine gate rows and 177 of 177 E2E tests.**

## Performance

- **Duration:** 22 min
- **Started:** 2026-10-06T00:35:22Z
- **Completed:** 2026-10-06T00:57:00Z
- **Tasks:** 3 of 3
- **Files changed:** 11, nine in `files_modified` and two test files outside it
- **Start revision:** `2243b0863507f89589f8d92994a3464f7e7c7022`
- **The tree the gate run, the E2E run and every closing check describe:** `dddab79bcd9112dcd856306cd00b93890e7c312f`, clean apart from the operator's untracked `CAND-APP-PLAN.md`

## What the Plan Asked to Have Recorded

| Item | Value |
|---|---|
| Files outside `files_modified` in which the typecheck forced a fixture edit | **None.** `yarn workspace @openvaa/frontend typecheck` reported 0 errors after the type change: the tree holds no typed `BasicUserData` literal (the one user literal, in `contestantUserDataState.svelte.test.ts`, is cast) and no fake that implements `DataWriter` or the contestant context in full |
| Files outside `files_modified` that the **unit suite** forced an edit in | Two: `apps/frontend/src/lib/server/admin/requireAdminIdentity.test.ts` and `apps/frontend/src/routes/api/admin/jobs/adminJobsAuthorization.test.ts`. See deviation 1 |
| The count of scoped tables written into the adapter comment | **fourteen**, measured: the `ProjectScopedTable` union and `PROJECT_SCOPED_TABLES` each hold 14 names |
| E2E counts | `172-03-writer`: total 177, passed 177, failed 0, flaky 0, skipped 0, did not run 0; 100 projects; the full default suite; one preflight success, no preflight failure; wrapper status 0 |

## Accomplishments

- `scopedFrom` gained `upsert`: it supplies `project_id` as `insert` does and always passes `{ ignoreDuplicates: true }`. The existing `writes` cast was extended; the file still has two `as unknown as` sites.
- The table joined the union and the guard's list in the same commit as the helper.
- `_getBasicUserData` reads `accepted_at` through the scoped helper after the role is known. An error is logged at error and read as `null`.
- `_acceptTermsOfUse` issues `scopedFrom('terms_of_use_acceptances').upsert({})`, throws `acceptTermsOfUse: <message>` on an error and reads no row back.
- Six unit cases were added and the exact table list in the nominations case was updated to two tables.
- The contestant context gained the arrow field and its type member.
- A probe showed the two calls behave on the local stack as the unit tests assume.

## Task Commits

1. **Task 1: the table joins the scoped set, `scopedFrom` gains `upsert`** — `f91825883` `feat(172-03): add the acceptance table to the project-scoped set and an ignore-duplicates upsert to scopedFrom`
2. **Task 2: the read, the write and their unit tests** — `a528a5754` `feat(172-03): read the terms-of-use acceptance into the basic user data and add acceptTermsOfUse to the data writer`
3. **Task 3: the context member** — `dddab79bc` `feat(172-03): expose acceptTermsOfUse on the contestant context`

`git rev-list --count 2243b0863..dddab79bc` is 3. The commit that carries this file follows them.

## The Surface as Committed

```ts
// supabaseAdapter.type.ts
upsert: (values: Omit<TablesInsert<TTable>, 'project_id'>) => ReturnType<QueryBuilderFor<TTable>['upsert']>;

// supabaseAdapter.ts, inside scopedFrom
upsert: (values) => writes.upsert({ ...values, project_id: projectId }, { ignoreDuplicates: true }),

// dataWriter.type.ts
interface BasicUserData { /* … */ termsOfUseAccepted: string | null; }
acceptTermsOfUse: () => DWReturnType<DataApiActionResult, TType>;

// contestantContext.svelte.ts
acceptTermsOfUse = async (): Promise<DataApiActionResult> => {
  const dw = prepareDataWriter();
  return dw.acceptTermsOfUse();
};
```

- The read is `this.scopedFrom('terms_of_use_acceptances').select('accepted_at').maybeSingle()`; on the wire that is `GET …?select=accepted_at&project_id=eq.<project>`.
- The value is the string PostgREST returns for a `timestamptz`, with microseconds and an offset: `2026-10-06T00:54:12.277826+00:00` in the probe. It is not the `toJSON()` form the candidate column held.
- The failed-read record: level error, message `getBasicUserData: could not read the terms-of-use acceptance: <message>`, `err.message` the PostgREST message, attribute `code` the SQLSTATE.
- `LocalizedCandidateData.termsOfUseAccepted`, `_updateEntityProperties`, the user-data state store, the protected layout and its server load are untouched.

## Gate and E2E Results

Every exit status was read from the command itself or from the attempt's `done` file, never through a pipe.

| What | Command | Exit | Result |
|---|---|---|---|
| Task 1 verify chain | the two guards, the dev-seed scoping-gate test, the `ignoreDuplicates` grep, as one command | 0 | 0 violations; 121 of 121 |
| Frontend typecheck, after each task | `yarn workspace @openvaa/frontend typecheck` | 0, 0, 0 | 0 errors, 0 warnings |
| Frontend unit suite, first run after Task 2's edits | `yarn workspace @openvaa/frontend test:unit` | **1** | 10 failed of 2146, in the two admin test files; deviation 1 |
| Frontend unit suite, after the two fakes | same | 0 | 135 files, 2146 tests |
| Task 2 verify chain | the writer test file, the scoping guard, the `_acceptTermsOfUse` grep, as one command | 0 | 63 of 63 in the writer file |
| Task 3 verify chain, part 1 | typecheck, `test:unit`, `lint`, as one command | 0 | 2146 tests; ESLint 0 errors and the one warning the baseline also has (`contestantContext.svelte.test.ts`, an unused variable) |
| Prettier and ESLint on every changed file | per file | 0 | |
| Comment hygiene, app-name gate, no-session-in-loads | the three root scripts | 0, 0, 0 | |
| **Gate set** | `172-gates.sh 172-03-writer` | **0** | **nine rows, all `0`**, head `dddab79bc`, clean tree |
| **E2E** | `172-e2e.sh 172-03-writer` | **0** | **177 / 177 / 0 failed / 0 flaky / 0 skipped / 0 did not run**; about 5 minutes |
| Task 3 verify chain, part 2 | `172-e2e.sh --judge 172-03-writer` | 0 | verdict GREEN, not below the baseline total |
| Probe | `tsx` on a scratch script outside the repository | 0 | 9 of 9; the table held 0 rows before and after |
| Allowlist | `170-allowlist-probe.sh after` | 0 | every row OK; the stack was not restarted |

The nine rows of `172-03-writer`: lint 41 s, types-regen 30 s, types-clean 1 s, sql-lint 2 s, pgtap 5 s (38 files, 1392 tests), unit 53 s (frontend 2146 in 135, dev-seed 997 in 67, supabase 206 in 15, app-shared 141 in 10), svelte-check 8 s (2650 files, 0 errors, 0 warnings), build 15 s, format 16 s.

### Every run directory of this plan

| Directory | Head | Counts | Verdict |
|---|---|---|---|
| `tests/e2e-runs/172-gates/172-03-writer` | `dddab79bc` | nine rows, all `0` | green |
| `tests/e2e-runs/172/172-03-writer` | `dddab79bc` | 177 of 177 over 100 projects | **green, the full default suite** |

There was no red gate row and no red E2E run, no rerun under a label, and nothing under `tests/e2e-runs/` was deleted. The one red result of the plan was the frontend unit run described in deviation 1; its log is in the session scratchpad.

## What the Evidence Does and Does Not Show

- **Shown by unit tests:** the read's project filter, its three outcomes (row, no row, error), the single round-trip, both arguments of the upsert, the success value and the rejection text.
- **Shown by the probe, on the local stack:** as a signed-in user the read gives `null` before accepting and the stamped time after; the upsert the helper builds gives 201 on the first call and on the repeat, and the repeat leaves the time unchanged; the same payload without the option is refused with 42501; the database recorded the caller and the project in one row. The probe issued the calls with supabase-js directly, in the form `scopedFrom` builds them. It did not run the `SupabaseDataWriter` class, which needs the frontend's module aliases.
- **Shown by the E2E run:** every `getBasicUserData()` call in the suite, the Admin app's included, completes with the read in place, and the dev server's log holds no `getBasicUserData:` record, so no server-side acceptance read failed. Since nothing consumes the field, the run cannot show that the value is right.
- **Not shown in this plan:** the context wrapper at run time, and `acceptTermsOfUse` called from a browser session. Both are first exercised by 172-04.

## Decisions Made

None of the plan's decisions was decided differently. The four calls the plan does not make are under `key-decisions`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Two admin identity test files failed once the identity read reached a table**
- **Found during:** Task 2, on the first frontend unit run after the writer change.
- **Issue:** `requireAdminIdentity.test.ts` and `adminJobsAuthorization.test.ts` build a structural Supabase client holding `auth` and `rpc` only. `_getBasicUserData` now calls `from('terms_of_use_acceptances')`, so on those fakes `from` was not a function, the identity read threw, `getUserData` turned the throw into `undefined`, and every case expecting an admitted admin got 403. Ten tests failed in the two files.
- **Fix:** each fake gained a `from` stub whose chain answers the acceptance read with no row, and the comment naming what is stubbed was updated. The writer was left as the plan specifies: a real client always has `from`, and postgrest-js reports a network or database failure as an error object, which is the path that yields `null`.
- **Files modified:** the two test files above, both outside `files_modified`.
- **Verification:** the frontend unit suite, 2146 of 2146.
- **Committed in:** `a528a5754`.

### Small departures in form

- **The failed-read log passes `err: new Error(acceptanceError.message)` and `code`, not the PostgREST error itself.** The plan says to pass the error as `{ err }`. The logger flattens a non-`Error` value with `String(value)`, and a PostgREST failure is a plain object, so the record would have read `[object Object]`. The unit case asserts `err.message` and the `code` attribute.
- **The guard script needed the list entry only.** Step 3 of Task 1 says to teach the script `upsert` if it recognises scoped operations by name. It does not: it forbids the raw call shapes and never reads which member of the scoped helper is called.
- **One more test helper than the plan lists:** `upsertCallsFor(client, table)`, in the shape of `eqCallsFor`.
- **Six unit cases, not seven items:** the plan's three `acceptTermsOfUse` assertions are two cases (the success case asserts the arguments, the call count, the tables reached and the result together).

### Beyond the plan's list

- **The full gate set**, `172-gates.sh 172-03-writer`, before the E2E run. It reset the local database, as every gate run of this phase does; the `default` dataset was seeded again at the end (`yarn db:seed:default`, exit 0).
- **The probe**, described above. The script is in the session scratchpad and is not committed. It created one auth user and removed it; the acceptance row went with the user.

### Acceptance criteria that did not hold as written

None. Every criterion of the three tasks holds as written, and each `<automated>` check was run as one command and exited 0.

### Departures in procedure

- **`requirements-completed` is empty.** The plan's frontmatter names TOU-01 and REG-12. Plan 01 reported TOU-01's table. This plan gives REG-12's gate its fact and its write and leaves the gate itself reading the candidate column; listing REG-12 here would be a false record.
- **The commits sit on `feat/entity-signup-multi-grant` in a linked worktree,** as the run's standing notes direct; the branch is not the default branch and was checked before each commit.
- **Polling** was a bounded foreground loop of `--status` calls 45 seconds apart; both helper runs were started with the tool's background mode.
- **`172-RESEARCH.md` and `172-PATTERNS.md` were read by the sections the plan names,** not whole.

---

**Total deviations:** 1 auto-fixed (blocking), four small departures in form, two additions beyond the plan.
**Impact on plan:** none on behaviour or scope. The one a later plan must carry is the fake-client requirement in deviation 1.

## Threat Model, Each Disposition

| Threat | Disposition | Where it stands |
|---|---|---|
| T-172-09 a default-form upsert refused on a repeat | mitigate | `{ ignoreDuplicates: true }` is written once, inside `scopedFrom`; `ScopedTableAccess['upsert']` takes the payload alone; the unit case pins both arguments; probe check 7 shows the unreachable form is the one that fails |
| T-172-10 `termsOfUseAccepted` in page data | accept | the field is the signed-in user's own fact, read under their session; `yarn assert:no-session-in-loads` exit 0 |
| T-172-11 a failing acceptance read | accept | yields `null` and one error record (unit case); the Admin identity cases pass with the read answering no row |
| T-172-SC package installs | accept | no package was installed; `yarn.lock` and every `package.json` are unchanged |

No security-relevant surface was added beyond the plan's threat model.

## Changes for the Operator's Eye

- **The four items the plan lists for review stand as planned:** the `upsert` member on the guarded helper, the failed read yielding `null`, the extra read per `getBasicUserData` caller (twice per protected contestant load), and acceptance staying a table read beside which Phase 178's fact can sit.
- **The local database was reset once, by the gate run,** and the `default` dataset was seeded again afterwards.
- **The stack was not stopped or restarted.** The other Supabase stack on this host, `my-redis` and the Vite server on port 5199 were not touched.
- **`CAND-APP-PLAN.md` was not edited, moved, staged or committed.** `.planning/STATE.md`, `.planning/ROADMAP.md` and `.planning/REQUIREMENTS.md` are unchanged.

## Deferred Issues

None fixed, all outside this plan:

1. The docs page `developers-guide/frontend/data-api-and-adapters` says `scopedFrom` "supplies the project column on inserts" and lists the writer's methods; it names neither `upsert` nor `acceptTermsOfUse`. Its sentence is still true. The docs plan of this phase (D-19) is where it belongs.
2. The three `// reason:` comments in `scopedFrom` call their casts "the ONE cast", "the second and last cast" and "the third and last cast". That wording predates this plan; only the three counts the plan names were corrected.
3. The dev-server logs of green runs hold a few client-side records reading `A DataProvider returned an invalid result` with `Error loading election data` or `Error loading constituency data`. They are in the run of the untouched tree as well, in the same number (lines matching one of the three messages: `172-01-baseline` 6, `172-01-table` 2, `172-02-fixtures` 2, `172-03-writer` 6), so they do not come from this plan. Their cause was not investigated. No test failed or was retried in any of those runs.
4. `svelte-check` reports 2060 files when run by hand in this session and 2650 in the gate set, 0 errors both times. The difference was not investigated.
5. `172-VALIDATION.md` was not touched; its rows for this plan are answered in this file.

The cross-phase defect ledger (`.planning/WINDOWS.md`) was not appended to: there is no stub, no skipped test and no verification of this plan that was not run. No todo was filed.

## Issues Encountered

One, described in deviation 1. A first attempt to list the names of the Supabase variables read the root `.env` and was stopped by the secret guard before it ran; the names were read from `.env.example`, and the probe uses the E2E admin client's own construction, which resolves its keys itself.

## Known Stubs

None. The new field and method have no consumer yet by design; 172-04 is the consumer.

## User Setup Required

None - no external service configuration required.

## What the Next Plan and Later Phases Must Know

**Plan 172-04**

- **The fact:** `BasicUserData.termsOfUseAccepted`, a string or `null`. `getBasicUserData()` and the `user` of `getContestantUserData()` both carry it. Treat any string as accepted; do not parse or compare it (it has microseconds and a `+00:00` offset).
- **The write:** `getContestantContext().acceptTermsOfUse()`. It is a stable arrow field and may be destructured. It resolves `{ type: 'success' }` and rejects with an `Error` whose message starts `acceptTermsOfUse: `. It does not log; the gate shows the failure.
- **A fake Supabase client under any code that reaches `getBasicUserData` needs `from(...).select(...).eq(...).maybeSingle()`.** Without it the read throws and the whole identity read rejects, which is a different outcome from a failed read (that yields `null`). The new `layout.server.test.ts` of the protected load should mock the writer or carry that chain. The two admin fakes are the model.
- **An error response is handled; a thrown exception from the read is not caught.** With the client as it is configured (no `throwOnError`), a network or database failure arrives as an error object.
- **Every identity from `forceRegister` has a row and the localisation spec's invited user has one;** this run exercised both paths green. The journey's email-flow user has none.
- **Compare against:** gates `172-03-writer` (nine rows at 0), E2E `172-03-writer` (177 / 177). Frontend unit is now 2146 tests in 135 files; dev-seed 997 in 67, supabase 206 in 15, app-shared 141 in 10; pgTAP 38 files, 1392 tests. The census of the retired candidate column is unchanged at 43 files and 158 lines.

**Plans 172-05 and 172-07**

- `_setPassword`'s comment still speaks of "the terms-of-use UPDATE that follows", and `_getContestantUserData` still reads `entityRow.terms_of_use_accepted`. Neither was touched.
- The exact table list in `'filters the nominations read by project as well as by candidate'` is now `['terms_of_use_acceptances', 'nominations']`. `candidateRow(…)` in that block still carries `terms_of_use_accepted: null`.

**Phase 173**

- `_getContestantUserData` calls `_getBasicUserData` itself, so a protected contestant load that also reads the user separately runs the acceptance read twice. Reshaping the entity read is where that goes.

**Phase 178**

- A second user-level fact sits beside `termsOfUseAccepted` on `BasicUserData`. If it is read from a table, `scopedFrom` already offers the read; if it is written, `upsert` exists only in the ignore-duplicates form, and a write that must change a row needs `update`.

**Host state:** the stack is up and healthy on the live allowlist; nothing listens on 5173 or 5273. The database holds migrations plus `seed.sql`, the pgTAP helper functions in `public` (left by the gate run), what the E2E run left in its own project, and the `default` dataset in the default project. `terms_of_use_acceptances` is empty.

## Self-Check: PASSED

- The eleven files under `key-files.modified` and this file exist, and `git diff --name-only 2243b0863..dddab79bc` lists exactly those eleven.
- The three commits (`f91825883`, `a528a5754`, `dddab79bc`) are ancestors of HEAD; `git rev-list --count 2243b0863..HEAD` was 3 when this file was written.
- `tests/e2e-runs/172/172-03-writer/summary.json` and `tests/e2e-runs/172-gates/172-03-writer/summary.tsv` exist; both attempts hold `done` = 0 and record head `dddab79bc`.
- The plan's verification items were re-run on the final tree: `yarn assert:project-scoped-queries` (0), `yarn assert:adapter-casts` (0), `172-e2e.sh --judge 172-03-writer` (0), `172-gates.sh --judge 172-03-writer` (0); the frontend typecheck and unit suite ran at 0 on the same file contents before the last commit and again inside the gate set.
- Every acceptance criterion of the three tasks was checked by command.
- No stub pattern is in the added lines. `.planning/STATE.md`, `.planning/ROADMAP.md` and `.planning/REQUIREMENTS.md` are unchanged since the start revision; `CAND-APP-PLAN.md` is untracked and untouched.
