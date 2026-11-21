---
phase: 172-terms-of-use-per-user-and-project
plan: 02
subsystem: testing
tags: [e2e, playwright, fixtures, supabase, service-role, terms-of-use, forceRegister, upsert]

requires:
  - phase: 172-terms-of-use-per-user-and-project
    provides: "Plan 01: public.terms_of_use_acceptances with its self-row access model (service_role keeps its privileges and must state user_id), 172-NAMES.md, and the 172-e2e.sh helper"
provides:
  - "SupabaseAdminClient.forceRegister records the new user's acceptance for the client's project by default, as step 4 inside the try whose rollback deletes the auth user"
  - "The opt-out: a fourth, optional argument { acceptTermsOfUse?: boolean }; false omits the row"
  - "SupabaseAdminClient.acceptTermsOfUse(email): records an acceptance for a user created another way; safe to call twice"
  - "perm-localisation-positive.spec.ts records its invited user's acceptance on the statement after client.sendEmail"
  - "A green slice (contestant-a11y-scan with its setups, 17 of 17) with the harness writing acceptance rows while the gate still reads the candidate column"
affects: [172-03, 172-04, 172-07, 172-08, 173, 174, 178]

actuals:
  tokens: 2272
  tasks: 2
  commits: 2
plan_head_before: 0a06627baae25fe4970dbe88bf6d4e7e7c3e8424
plan_head_after: c1153ae1bafabced1c9eda629168181251faca48

tech-stack:
  added: []
  patterns:
    - "One protected write for the acceptance row, shared by the force-register default and the public helper: an ignore-duplicates upsert keyed on (user_id, project_id) that states user_id, because the service role has no caller identity for the column default to read"
    - "A fixture default with an explicit opt-out: every force-registered identity is past the acceptance gate unless its caller says otherwise"

key-files:
  created: []
  modified:
    - tests/tests/utils/supabaseAdminClient.ts
    - tests/tests/specs/perm/perm-localisation-positive.spec.ts

key-decisions:
  - "The protected write takes the calling method's name as a second argument, so a failure reads `forceRegister: record terms-of-use acceptance failed: …` or `acceptTermsOfUse: record terms-of-use acceptance failed: …` without a catch-and-rewrap at either call site"
  - "The spec's docblock states the two facts side by side (the acceptance is recorded through the admin client; login lands on the home page) and does not join them with a causal word: until the layout reads the table, the direct landing still comes from the candidate column"
  - "A probe of eight checks was run against the local database before the first commit, because the plan's own checks exercise only the default path of forceRegister: the opt-out and the public helper are otherwise first run by later plans"

patterns-established:
  - "The opt-out for an identity that must meet the gate: `await client.forceRegister(externalId, email, password, { acceptTermsOfUse: false })`"
  - "An identity created by any route other than forceRegister (an email invitation, an identity provider) that should be past the gate: `await client.acceptTermsOfUse(email)` once the auth user exists"

requirements-completed: []

coverage:
  - id: D1
    description: "forceRegister records an acceptance row for the user it creates, in the client's own project, by default"
    requirement: TOU-01
    verification:
      - kind: other
        ref: "scratch probe against the local database, check 1: after forceRegister(ext, email, pw) the user has exactly one row, project_id = the E2E project, accepted_at set (probe exit 0, 8 of 8)"
        status: pass
      - kind: e2e
        ref: "tests/e2e-runs/172/172-02-fixtures: auth-setup 1 of 1 (it calls forceRegister with the default; a failed acceptance write throws, so the setup would have failed)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The acceptance write sits inside forceRegister's compensating rollback: a failed write throws with the step named and leaves no auth user"
    verification:
      - kind: other
        ref: "probe check 7: the write pointed at a project that does not exist gives `forceRegister: record terms-of-use acceptance failed: … violates foreign key constraint …`, and no auth user with that email remains"
        status: pass
    human_judgment: false
  - id: D3
    description: "Passing { acceptTermsOfUse: false } omits the row and still writes the candidate-editor grant"
    verification:
      - kind: other
        ref: "probe check 4: rows 0, candidate grants 1"
        status: pass
    human_judgment: false
  - id: D4
    description: "acceptTermsOfUse(email) records an acceptance for a user named by email, is safe to call twice, and throws for an unknown email"
    verification:
      - kind: other
        ref: "probe checks 2, 5 and 6: one row after two calls with the same accepted_at; a call on an already-accepted user changes nothing; an unknown email gives `acceptTermsOfUse: no user found with email …`"
        status: pass
    human_judgment: false
  - id: D5
    description: "Every existing three-argument forceRegister call site compiles unchanged"
    verification:
      - kind: other
        ref: "yarn typecheck:tests (exit 0); git grep -n 'forceRegister(' -- tests/tests/setup lists the same six three-argument sites before and after"
        status: pass
    human_judgment: false
  - id: D6
    description: "perm-localisation-positive.spec.ts records its invited user's acceptance itself, on the statement after client.sendEmail, and no longer names the retired candidate column"
    requirement: REG-12
    verification:
      - kind: other
        ref: "Task 2's first verify chain as one command (exit 0); ESLint and Prettier on the file (exit 0, 0)"
        status: pass
      - kind: e2e
        ref: "not yet exercised: the spec sits in the serial perm chain. First run by the full E2E run that closes 172-03 (`172-03-writer`), this plan's boundary proof"
        status: unknown
    human_judgment: false
  - id: D7
    description: "The slice forceRegister feeds directly is green with the harness writing acceptance rows while the gate still reads the candidate column"
    requirement: REG-12
    verification:
      - kind: e2e
        ref: "bash 172-e2e.sh --judge 172-02-fixtures --allow-slice (exit 0; 17 total, 17 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run; head c1153ae1b, clean tree)"
        status: pass
    human_judgment: false
  - id: D8
    description: "The contestant journey's email-flow registration is untouched and receives no row"
    verification:
      - kind: other
        ref: "git show --stat for the two commits lists only the two files in files_modified; sendEmail is unchanged and calls no acceptance write"
        status: pass
    human_judgment: false
  - id: D9
    description: "PROH-172-01: the E2E admin client under tests/ is the only non-user writer, and no spec whose subject is meeting the gate is given a row"
    verification: []
    human_judgment: true
    rationale: "The plan marks the prohibition as verified by judgment. The supporting facts are measured: outside .planning/ the table is named in six files, the five of plan 01 and tests/tests/utils/supabaseAdminClient.ts; no file under apps/ or packages/ imports the E2E admin client; the only spec given the helper call is the localisation spec."

duration: 7min
completed: 2026-10-06
status: complete
---

# Phase 172 Plan 02: Fixtures First — the Acceptance Default on `forceRegister`, its Opt-out and the Localisation Spec Summary

**The E2E admin client now records a terms-of-use acceptance, in its own project, for every identity it force-registers unless the caller passes `{ acceptTermsOfUse: false }`; it exposes `acceptTermsOfUse(email)` for identities created another way; the one email-flow spec that expects to land past the gate calls it; and the slice `forceRegister` feeds directly is green at 17 of 17 while the gate still reads the candidate column.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-10-06T00:26:42Z
- **Completed:** 2026-10-06T00:33:59Z
- **Tasks:** 2 of 2
- **Files changed:** 2, both under `tests/`
- **Start revision:** `0a06627baae25fe4970dbe88bf6d4e7e7c3e8424`
- **The tree the slice and every closing check describe:** `c1153ae1bafabced1c9eda629168181251faca48`, clean apart from the operator's untracked `CAND-APP-PLAN.md`

## What the Plan Asked to Have Recorded

| Item | Value |
|---|---|
| The slice's per-project counts | `data-setup-base` 1 of 1, `auth-setup` 1 of 1, `contestant-a11y-scan` 14 of 14, `data-teardown-base` 1 of 1. Total 17, passed 17, failed 0, flaky 0, skipped 0, did not run 0 |
| This plan's boundary proof | **The full E2E run that closes 172-03, `172-03-writer`.** It is the first run to exercise the five perm setups that call `forceRegister` (`perm-answers-locked`, `perm-closed-project`, `perm-disable-allow-open`, `perm-hide-hero`, `perm-question-video`) and the localisation spec's `acceptTermsOfUse` call. They sit in the serial perm chain, which a slice would pull in whole. Nothing in this plan ran them |
| The exact form of the opt-out, for 172-08 and Phase 173 | `await client.forceRegister(candidateExternalId, email, password, { acceptTermsOfUse: false });` The fourth argument is `options: { acceptTermsOfUse?: boolean } = {}`; anything other than the literal `false` records the row |

## Accomplishments

- `forceRegister` gained step 4: unless the caller opted out, it records the new user's acceptance for `this.projectId`, after the grant insert and before `catch (mutationErr)`, so the existing rollback covers it.
- The client gained `acceptTermsOfUse(email)` and the protected write both paths share.
- `perm-localisation-positive.spec.ts` calls the helper directly after `client.sendEmail({ … })`, and its docblock states the mechanism as it is.
- A probe proved the default, the opt-out, the helper's idempotence, its error for an unknown email, the cascade with the auth user and the rollback, eight checks of eight, and left the database as it found it.
- The slice ran green on the committed tree.

## Task Commits

1. **Task 1: the default, the opt-out and the public helper** — `5979b5522` `test(172-02): record a terms-of-use acceptance for every identity the E2E admin client force-registers`
2. **Task 2: the localisation spec** — `c1153ae1b` `test(172-02): record the invited user's terms-of-use acceptance in the localisation spec`

`git rev-list --count 0a06627ba..c1153ae1b` is 2. The commit that carries this file follows them.

## The Surface as Committed

```ts
// tests/tests/utils/supabaseAdminClient.ts
protected async insertTermsOfUseAcceptance(userId: string, caller: string): Promise<void>
async acceptTermsOfUse(email: string): Promise<void>
async forceRegister(
  candidateExternalId: string,
  email: string,
  password: string,
  options: { acceptTermsOfUse?: boolean } = {}
): Promise<void>
```

- The write is `.from('terms_of_use_acceptances').upsert({ user_id, project_id: this.projectId }, { onConflict: 'user_id,project_id', ignoreDuplicates: true })`. It states `user_id` because the service role has no caller identity for the column default to read.
- Error texts: `forceRegister: record terms-of-use acceptance failed: <message>`, `acceptTermsOfUse: record terms-of-use acceptance failed: <message>`, `acceptTermsOfUse: no user found with email <email>`.
- `acceptTermsOfUse` finds the user with `safeListUsers()`, as `setPassword` does.
- The class docblock's list of the public surface names `acceptTermsOfUse` among the auth actions and the protected write among the auth helpers.
- `unregisterCandidate`, `deleteAllTestUsers`, `forceRegisterAdmin`, `sendEmail` and the six `forceRegister` call sites are unchanged. Every hunk of `5979b5522` ends above `catch (mutationErr)` of `forceRegister`.

## Gate and E2E Results

Every exit status was read from the command itself or from the attempt's `done` file, never through a pipe.

| What | Command | Exit | Result |
|---|---|---|---|
| Task 1 verify chain | `yarn typecheck:tests`, ESLint on the helper file, the two signature greps | 0 | each link 0 |
| Probe | `tsx` on a scratch script outside the repository | 0 | 8 of 8; the table held 0 rows before and after |
| Task 2 verify chain, part 1 | spec present, helper call present, retired column name absent (grep exit 1), `yarn typecheck:tests` | 0 | |
| ESLint, both files | `node_modules/.bin/eslint <file>` | 0, 0 | |
| Prettier, both files | `node_modules/.bin/prettier --check <file>` | 0, 0 | |
| Comment hygiene | `yarn assert:comment-hygiene`, after each task | 0, 0 | |
| App-name gate | `yarn assert:no-candidate-app-names`, after each task | 0, 0 | |
| Scan wiring, project scoping | `yarn assert:a11y-scan-wiring`, `yarn assert:project-scoped-queries` | 0, 0 | |
| dev-seed tests that read the helper file's source | `vitest run` on `ensureProject`, `localSupabaseUrl`, `projectScopedContaminationIsolation`, `serviceRoleClientCallSites` | 0 | 4 files, 86 tests |
| **The slice** | `172-e2e.sh 172-02-fixtures --project contestant-a11y-scan` | **0** | **17 / 17 / 0 failed / 0 flaky / 0 skipped / 0 did not run**; one preflight success, no preflight failure; wrapper status 0 |
| Task 2 verify chain, part 2 | `172-e2e.sh --judge 172-02-fixtures --allow-slice` and the `byProject` check, as one command | 0 | verdict GREEN; `auth-setup` and `contestant-a11y-scan` both present with passing tests |
| Allowlist | `170-allowlist-probe.sh after` | 0 | every row OK; the stack was not restarted |

The full gate set (`172-gates.sh`) was not run: the plan closes on the tests typecheck and the slice, and a gate run resets the database. No gate of the set reads a file this plan changed other than `lint:check` (ESLint over `tests`, the tests typecheck, the name and hygiene gates) and `format:check`, whose links for the two changed files are in the table above.

### Every run directory of this plan

| Directory | Head | Counts | Verdict |
|---|---|---|---|
| `tests/e2e-runs/172/172-02-fixtures` | `c1153ae1b` | 17 of 17 over four projects | **green, a project slice** |

There was no red run and no rerun under the label, and nothing under `tests/e2e-runs/` was deleted.

## What the Evidence Does and Does Not Show

- **Shown by the probe, directly:** a row exists after `forceRegister` with the default; none after the opt-out; one after two helper calls; the row goes when the auth user goes; a failed write rolls the user back.
- **Shown by the slice:** the real auth setup calls `forceRegister` with the default against the table and does not throw, and the fourteen contestant scans pass under the stored session of an identity that has a row. Since nothing reads the table yet, the slice cannot show that the row matters; that is 172-04's switch.
- **Not shown by the slice's residue:** the database holds no acceptance row after the run. The base teardown removes the force-registered user and the row cascades with it, so there is no row left to read. That the setup wrote one is inferred from the write being unconditional on that path and throwing on any error, and from the probe.
- **Not shown at all in this plan:** the localisation spec's helper call at run time, and the five perm setups. See the boundary proof above.

## Decisions Made

None of the plan's decisions was decided differently. The three calls the plan does not make are under `key-decisions`.

## Deviations from Plan

### Auto-fixed Issues

None. No bug, missing critical piece or blocker was found.

### Small departures in form

- **The protected write has two parameters, not one.** The plan suggests `insertTermsOfUseAcceptance(userId: string)` and also fixes the error text as `forceRegister: record terms-of-use acceptance failed: <message>`. A one-argument method cannot know its caller, so the method takes the caller's name as a second argument. Committed in `5979b5522`.
- **One existing comment in `forceRegister` was updated.** The comment above the `try` said a failure "in step 2 or 3" leaves an orphan auth user; it now says "in any of steps 2 to 4", which is what the code does.
- **The slice held four projects, not three.** Playwright ran `data-teardown-base` with the three the plan names.

### Beyond the plan's list

- **The probe**, described above. The script lives in the session scratchpad and is not committed. It inserted one candidate and three auth users in the E2E project and removed them; afterwards no probe user, no probe candidate, no acceptance row and no orphan grant remained.
- **Four dev-seed unit files were run** because they read the helper file's source text: 86 of 86.

### Acceptance criteria that did not hold as written

- **"`git grep -n "tests/utils/supabaseAdminClient" -- apps packages` prints nothing" (plan verification, and threat T-172-08).** It prints four lines, on this tree and on the start revision alike: a comment in `packages/dev-seed/src/supabaseAdminClient.ts` and three dev-seed unit tests that read the file's source (`ensureProject.test.ts`, `localSupabaseUrl.test.ts`, `projectScopedContaminationIsolation.test.ts`). None is an import. The claim the check stands for holds: `git grep -n -E "(from|import\()\s*['\"][^'\"]*tests/utils/supabaseAdminClient" -- apps packages` prints nothing (exit 1). Nothing was changed to make the original command pass.

Every other criterion holds as written, and each `<automated>` check was run as one command and exited 0.

### Departures in procedure

- **`requirements-completed` is empty.** The plan's frontmatter names REG-12 and TOU-01. This plan advances both and completes neither: no product code reads or writes the table yet, and the gate that REG-12 describes still reads the candidate column. Listing them as completed here would be a false record; plan 01 already reported TOU-01's table.
- **The commits sit on `feat/entity-signup-multi-grant` in a linked worktree,** as the run's standing notes direct; the branch is not the default branch and was checked before each commit.
- **Polling** was a bounded foreground loop of `--status` calls 45 seconds apart; the run was started with the tool's background mode. It reported `done 0` on the second poll.

---

**Total deviations:** 0 auto-fixed; three small departures in form, one verification command that does not hold as written, and one probe beyond the plan.
**Impact on plan:** none on behaviour or scope.

## Prohibition, Checked

| Prohibition | Evidence |
|---|---|
| PROH-172-01: acceptance is never recorded on a user's behalf by the product; the E2E admin client is the only non-user writer; no spec whose subject is meeting the gate is given a row | Outside `.planning/` the table is named in six files: plan 01's five and `tests/tests/utils/supabaseAdminClient.ts`. No file under `apps/` or `packages/` imports the E2E admin client. `sendEmail`, the journey spec and its fixtures are unchanged, so the journey's email-flow registration gets no row. The only spec given the helper call is `perm-localisation-positive`, whose subject is localisation. Verified by judgment, as the plan says |

## Threat Model, Each Disposition

| Threat | Disposition | Where it stands |
|---|---|---|
| T-172-08 a test client writing a row for an arbitrary user | accept | the client lives under `tests/`, is built by `createServiceRoleClient` behind the locality guard, and no product code imports it (the import-form grep above). The plan's own grep for this does not hold as written; see above |
| T-172-SC package installs | accept | no package was installed; `yarn.lock` and every `package.json` are unchanged |

No security-relevant surface was added beyond the plan's threat model.

## Changes for the Operator's Eye

- **The two items the plan lists for review stand as planned:** the localisation spec gets one explicit helper call rather than walking the gate, and the public helper takes an email rather than a user id.
- **The local database was not reset in this plan.** The `default` dataset is still in the default project (328 candidates). `terms_of_use_acceptances` is empty.
- **The stack was not stopped or restarted.** The other Supabase stack on this host, `my-redis` and the Vite server on port 5199 were not touched.
- **`CAND-APP-PLAN.md` was not edited, moved, staged or committed.** `.planning/STATE.md`, `.planning/ROADMAP.md` and `.planning/REQUIREMENTS.md` are unchanged.

## Deferred Issues

None fixed, all outside this plan:

1. `acceptTermsOfUse` inherits the reach of `safeListUsers()`, which reads one page of the admin user list and returns an empty list when the call fails. `setPassword` and `unregisterCandidate` share it. On this host the list held two users at rest. Unlike `unregisterCandidate`, the new helper throws when it does not find the user, so a miss is loud. Not changed: the plan says to find the user as `setPassword` does.
2. `perm-closed-project.setup.ts` still sets the candidate column after `forceRegister`, and `unregisterCandidate` and `deleteAllTestUsers` still reset it. Those writes leave in 172-07, in the commit that drops the column.
3. `172-VALIDATION.md` was not touched; its two rows for this plan are answered in this file.

The cross-phase defect ledger (`.planning/WINDOWS.md`) was not appended to: there is no stub, no skipped test and no verification of this plan that was not run. No todo was filed.

## Issues Encountered

None in the work. One in the probe's tooling: `tsx` treated a `.ts` script outside a `type: module` package as CommonJS and refused a top-level await in a dev-seed module; the same script as `.mts` ran.

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## What the Next Plan and Later Phases Must Know

**Plan 172-03**

- **Your full run is this plan's boundary proof.** It is the first to run the five perm setups with the acceptance default and the localisation spec's `client.acceptTermsOfUse(RECIPIENT_EMAIL)`. A setup that throws `forceRegister: record terms-of-use acceptance failed` points at the helper or at the service role's privileges on the table. A localisation failure reading `acceptTermsOfUse: no user found with email candidate-l10n-pos-aa@test.openvaa.local` points at the user lookup (deferred item 1), not at the table.
- **The table is still in neither `PROJECT_SCOPED_TABLES` nor `ProjectScopedTable`.** `assert:project-scoped-queries` is green (exit 0) with the tests file naming the table; the plan that adds the adapter read or write adds the table to both lists.
- **Baselines to compare against are plan 01's and unchanged:** gates `172-01-table`, E2E 177 of 177. This plan made no gate run and no full E2E run. The census of the retired candidate column is now 43 files and 158 lines (was 44 and 159): the localisation spec's docblock no longer names it.
- **The database was not reset here.** A gate run of yours will reset it; seed the `default` dataset again at the end if you make one.

**Plan 172-04**

- When the protected layout reads the table, every identity from `forceRegister` already has a row for the E2E project, and the localisation spec's invited user has one. The journey spec's email-flow user has none and must meet the gate.
- A row is written for `this.projectId` of the client that registered the identity. A spec that builds its client with an explicit third constructor argument gets the row in that project.

**Plan 172-07**

- `unregisterCandidate` step 3 and the `'reset-terms-of-use'` step of `deleteAllTestUsers` are untouched and still write the candidate column; so is the explicit set in `perm-closed-project.setup.ts`. The acceptance row needs no cleanup of its own: it cascades with the auth user (probe check 3, and pgTAP 41).
- The comment in `forceRegister` above the `try` says "steps 2 to 4"; `forceRegisterAdmin`'s docblock still describes the terms-of-use reset of `unregisterCandidate`.

**Plan 172-08 and Phase 173**

- The opt-out is `await client.forceRegister(externalId, email, password, { acceptTermsOfUse: false });`.
- `forceRegisterAdmin` records no acceptance. An admin identity that must be past a terms-of-use gate needs `acceptTermsOfUse(email)` after it.

**Phases 174 and 178**

- Whatever replaces `forceRegister` when registration changes should keep the default and the opt-out in one place. The shared write is `insertTermsOfUseAcceptance(userId, caller)`.

**Host state:** the stack is up and healthy on the live allowlist; nothing listens on 5173 or 5273. The database holds what plan 01 left plus what the slice's base teardown left: the `default` dataset in the default project, two auth users from `seed.sql`, no candidate in the E2E project, and an empty `terms_of_use_acceptances`.

## Self-Check: PASSED

- The two files under `key-files.modified` and this file exist, and `git diff --name-only 0a06627ba..c1153ae1b` lists exactly those two files.
- The two commits (`5979b5522`, `c1153ae1b`) are ancestors of HEAD; `git rev-list --count 0a06627ba..HEAD` was 2 when this file was written.
- `tests/e2e-runs/172/172-02-fixtures/summary.json` exists; its attempt directory holds `done` = 0 and `wrapper-exit` = 0, and its recorded head is `c1153ae1b`.
- Every acceptance criterion of the two tasks was checked by command; the one verification command that does not hold as written is listed above with its measured output.
- No stub pattern is in the added lines. `.planning/STATE.md`, `.planning/ROADMAP.md` and `.planning/REQUIREMENTS.md` are unchanged since the start revision; `CAND-APP-PLAN.md` is untracked and untouched.
