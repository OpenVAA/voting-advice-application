---
phase: 174-invitations-grants-defined-in-advance
plan: 06
subsystem: testing
tags: [playwright, e2e, fixtures, invitations, edge-function, magiclink, mailpit, dev-seed, supabase]

requires:
  - phase: 174-invitations-grants-defined-in-advance
    provides: "plan 04: claim_invitations, create_invitations and the six service-role helpers, the completion witness among them; plan 05: the Edge Function account-access, served on the local stack, and the sign-in mail"
provides:
  - "createInvitations on the dev-seed admin client: the one caller of create_invitations for every harness"
  - "two rows of e2e/base reserved for invitation tests: the candidate test-e2e-base-ca-invitation and the organization test-e2e-base-or-invitation, unconfirmed and without a nomination"
  - "four test utilities: invitationConstants, accountAccessClient, authApi, mailedLink (with its unit test)"
  - "on the E2E admin client: removeInvitations, inviteByEmail, releaseLinkSlot, openLinkWitness, awaitLinkWitness, and four exact reads of the auth users; unregisterCandidate and deleteAllTestUsers remove a user's invitations with the user"
  - "the fixture invitationFlow.fixture.ts and the spec invitation-contract.spec.ts (15 tests), in the default suite as the project invitation-contract"
  - "the boundary proof of 174-04 and 174-05: the full default E2E suite green with the contract in it"
affects: [174-07, 174-08, 174-09, 174-10, 178]

actuals:
  tokens: 30270
  tasks: 5
  commits: 5
plan_head_before: cebe14793a6f8e669f1846ec2a7cd648a713b4f4
plan_head_after: 7ea5735ca69b91b7a0645c2eabcf192cdc5b80f5

tech-stack:
  added: []
  patterns:
    - "A finished request as a value: a link request is returned only once its own completion witness has read an outcome, and the assertion that nothing was sent takes that value and nothing else"
    - "Exact reads for negatives: a helper that concludes something from an absence pages through everything and fails when a read fails, beside the lenient helper the positive paths keep"
    - "Credentials never reach an expectation: a link is asserted through its origin and path, a count as a number, a signed-in answer through its keys and the grants its token carries"
    - "A slot a test needs taken is taken by the request just before it, after the slot was given back, so the outcome does not depend on the time since an earlier test"
    - "A negative control on the running stack: one function of the local database replaced, the slice run under a label that says so, the original re-applied and compared by checksum"

key-files:
  created:
    - "packages/dev-seed/tests/supabaseAdminClient.invitations.test.ts"
    - "tests/tests/utils/invitationConstants.ts"
    - "tests/tests/utils/accountAccessClient.ts"
    - "tests/tests/utils/authApi.ts"
    - "tests/tests/utils/mailedLink.ts"
    - "tests/tests/utils/mailedLink.test.ts"
    - "tests/tests/fixtures/shared/invitationFlow.fixture.ts"
    - "tests/tests/specs/contestant/invitation-contract.spec.ts"
  modified:
    - "packages/dev-seed/src/supabaseAdminClient.ts"
    - "packages/dev-seed/src/index.ts"
    - "packages/dev-seed/src/templates/e2e/base.ts"
    - "packages/dev-seed/tests/templates/base.test.ts"
    - "tests/tests/utils/supabaseAdminClient.ts"
    - "tests/tests/fixtures/shared/emailBucket.fixture.ts"
    - "tests/playwright.config.ts"
    - "tests/README.md"
    - ".planning/phases/174-invitations-grants-defined-in-advance/174-NAME-MAP.md"

key-decisions:
  - "createInvitations throws the database error's code and nothing else: a database message or its details can quote a row, and a row holds an invitee's address"
  - "The two reserved rows have no nomination: the template's validation does not require one for a candidate"
  - "scripts/assert-project-scoped-queries.mjs is not touched: the gate scans apps/frontend/src and asks for nothing"
  - "The fixture is worker-scoped, so beforeAll and afterAll speak in its steps too"
  - "The witness ceiling is three slow timeouts, because the function bounds each of its own dependencies at ten seconds"
  - "The used-code test takes the claimant's slot itself before the request under test, so its not-sent outcome does not depend on elapsed time"
  - "readGrantsClaim throws when the token carries no grants array, so an empty claim is a statement and not an absence"

patterns-established:
  - "askForLink / expectNothingSent: the shape every later spec uses for a negative about a mail or an account"
  - "A received link goes through assertSignInLinkShape, and a spec that opens it in a browser then through toRunOrigin"

requirements-completed: [INV-02, INV-03, INV-04, INV-05]

coverage:
  - id: D1
    description: "The seeding function has one caller for every harness: createInvitations on the dev-seed admin client calls create_invitations with the client's project and exactly the two SQL parameter names"
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/supabaseAdminClient.invitations.test.ts (4 tests)"
        status: pass
      - kind: e2e
        ref: "invitation-contract.spec.ts, every test that seeds, through the inherited method"
        status: pass
    human_judgment: false
  - id: D2
    description: "A received link has only its scheme, host and port replaced; path, locale segment, parameter names, token and type are asserted as received and never built by a test"
    verification:
      - kind: unit
        ref: "tests/tests/utils/mailedLink.test.ts (22 tests); red against a parse-and-rebuild of toRunOrigin on the one case added for it"
        status: pass
      - kind: e2e
        ref: "invitation-contract.spec.ts: every link passes assertSignInLinkShape for its locale before its token is verified"
        status: pass
    human_judgment: true
    rationale: "toRunOrigin is held by its unit test only. No spec of this plan opens a link in a browser; the first to do so is 174-09's"
  - id: D3
    description: "The two cleanup helpers remove a test user's invitations, claimed ones included, before the user, and unregisterCandidate also when no user exists"
    verification:
      - kind: e2e
        ref: "the full default run 174-06-close: every spec that calls unregisterCandidate green; the spec's afterAll asserts no invitation and no user is left"
        status: pass
    human_judgment: true
    rationale: "No test seeds an invitation for another spec's user and then observes unregisterCandidate remove it; the helpers' own invitation path is first exercised by 174-09. deleteAllTestUsers has no caller in the suite"
  - id: D4
    description: "check-code answers valid, used and unknown; request-link answers every address alike; a mailed link verifies to a session that, after claim_invitations and a refresh, holds exactly the promised grant; code-sign-in accepts the right password only"
    requirement: "INV-03"
    verification:
      - kind: e2e
        ref: "invitation-contract.spec.ts tests 3, 4, 5, 11 and 13; slices 174-06-contract-slice and -again, full run 174-06-close"
        status: pass
    human_judgment: false
  - id: D5
    description: "Every assertion that no mail was sent or that no account exists follows the completion witness of the request under test"
    verification:
      - kind: e2e
        ref: "invitationFlow.fixture.ts expectNothingSent takes only a request askForLink returned; red when the eligibility or the throttle is removed (174-06-contract-slice-mutant-eligibility, -mutant-throttle), each on a witness that read sent"
        status: pass
    human_judgment: false
  - id: D6
    description: "Each refusal on the running stack: no invitation means no mail and no account; a second request inside the interval sends no second mail; hostile origin headers do not move the link; a user who proved another address claims nothing; a used code bound again grants nothing; a wrong password and an unknown code get one answer"
    requirement: "INV-04"
    verification:
      - kind: e2e
        ref: "invitation-contract.spec.ts tests 6, 7, 8, 9, 12 and 13; test 6 red against a claim that ignores the address (174-06-contract-slice-mutant-claim)"
        status: pass
    human_judgment: false
  - id: D7
    description: "A named candidate and a named organization seeded with an invitation read confirmed = true, and a duplicate invitation is refused with the first row unchanged"
    requirement: "INV-05"
    verification:
      - kind: e2e
        ref: "invitation-contract.spec.ts tests 1 and 2"
        status: pass
    human_judgment: false
  - id: D8
    description: "With the spec in the suite, the fifteen gate rows and the full default E2E suite are green: every earlier project at its total in 174-03-close, and the new project present with every test passed"
    verification:
      - kind: other
        ref: "node 174-verdict.mjs gates 174-06-close — exit 0, 15 rows"
        status: pass
      - kind: e2e
        ref: "node 174-verdict.mjs e2e 174-06-close --same-projects-as 174-03-close --except invitation-contract=+ --expect-project invitation-contract --expect-project auth-service-contract — exit 0, 215 of 215, 105 projects"
        status: pass
    human_judgment: false

duration: 42min
completed: 2026-10-07
status: complete
---

# Phase 174 Plan 06: The Invitation Contract in the Suite Summary

**One serial spec of the default suite, with no screen, now observes the server contract Phase 178 will stand on: it seeds invitations through `create_invitations`, asks `account-access` for links, takes each sign-in token out of a received mail, and follows it to a session that holds exactly the promised grant, for an email and for a code, for a candidate and for an organization. Each refusal is a test, and every "nothing was sent" follows the completion witness of its own request. The full default suite is 215 of 215 in 105 projects, with one project moved against the baseline: the new one.**

## Performance

- **Duration:** 42 min
- **Started:** 2026-10-07T10:09:02Z
- **Completed:** 2026-10-07T10:51:43Z
- **Tasks:** 5 of 5
- **Files:** 8 created, 9 modified
- **Restarts of the stack:** none. No file under `apps/supabase/` changed.

## Accomplishments

- The fixtures came first: one method on the dev-seed client, four utilities, the admin client's helpers and the flow fixture were written and committed before the spec that reads them.
- The spec passed on its first run and again nine seconds later with no reset, release or restart between, which is what shows that no test depends on the time since another run.
- The spec was then shown red three times, each against one function of the local database replaced by a weakened one, and each time on exactly the test that names the weakened property.
- The close is fifteen green gate rows and a full default E2E run in which every one of the 104 earlier projects holds its total and `invitation-contract` is 15 of 15. That run is also the boundary proof 174-04 and 174-05 left open.

## Task Commits

| Task | Name | Commit |
| --- | --- | --- |
| 1 | `createInvitations` on the dev-seed client, and two reserved rows in the base dataset | `61756e575` (feat) |
| 2 | The test utilities: the function client, the auth calls and the received link | `4184d958c` (test) |
| 3 | The admin client: invitation cleanup in the two cleanup helpers, the seed-and-request helper, the completion witness | `c065d5309` (test) |
| 4 | The fixture and the contract spec; the two slice runs | `2c107fee3` (test) |
| 5 | The close on fifteen gate rows and the full E2E suite | `7ea5735ca` (docs: name map) |

**Plan metadata:** the commit that adds this file. `commits: 5` is `git rev-list --count cebe14793..HEAD` when this file was written; all five are this plan's.

## The dataset rows as seeded, and the pins that moved

Both in `packages/dev-seed/src/templates/e2e/base.ts`, each under a comment that says what it is for.

| Row | Fields |
| --- | --- |
| candidate `test-e2e-base-ca-invitation` | `first_name: 'Invited'`, `last_name: 'Entity Three'`, `confirmed: false`, `sort_order: 17`; no organization, no answers |
| organization `test-e2e-base-or-invitation` | `name: { en: '[or-invitation] Party Invitation' }`, `short_name: { en: 'INV' }`, `color: { normal: '#8a5a00', dark: '#d9b36b' }`, `confirmed: false`, `sort_order: 6` |

**Neither has a nomination.** The template's validation does not require one for a candidate (`validateTemplate(baseTemplate)` passes), so the plan's fallback of an unconfirmed nomination was not needed. `seed.sql` and the `default` template are unchanged (`git diff cebe14793..HEAD` over both prints nothing).

Pins re-measured in `packages/dev-seed/tests/templates/base.test.ts`:

| Pin | Before | After |
| --- | --- | --- |
| `organizations.fixed` | 6 | 7 |
| `candidates.fixed` | 32 | 33 |
| `nominations.fixed` | 64 | 64 |
| candidates that state `confirmed` | 4 | 5 |
| organizations that state `confirmed` | 1 | 2 |

A new `describe` holds the two rows themselves: unconfirmed, no nomination, no answers, the candidate with both names and no organization, the organization with a name and a short name no other carries, and no candidate belonging to it. dev-seed unit totals went from 67 files and 1015 tests to 68 and 1030.

**The project-scoping script did not change.** `yarn assert:project-scoped-queries` exits 0 with its lists as they were: it scans `apps/frontend/src`, and the RPC's one caller is the dev-seed client. `PROJECT_SCOPED_RPCS` gains its entry when an adapter first calls the function.

## The fixtures, and what each expresses

**`invitationConstants.ts`** — the English and Finnish subjects of the sign-in mail as literals, the two reserved external ids, the address prefix `invitation-contract-`, and `freshInvitationAddress()`.

**`accountAccessClient.ts`** — `checkCode`, `requestLink` (with `witness` and `headers`) and `codeSignIn`: the function as an anonymous visitor calls it, each returning `{ status, body }` uninterpreted.

**`authApi.ts`** — `verifyTokenHash`, `refreshSession`, `signInWithPassword`, `setPassword`, `claimInvitations` (with `extraArgs`) and `readGrantsClaim`: the calls a signed-in user's own session makes, with the anon key and the user's token, never the service role.

**`mailedLink.ts`** — `assertSignInLinkShape` (the path for the locale, exactly the two parameters once each, `type` `magiclink`, a non-empty token, no credentials, no fragment), `toRunOrigin` (the origin replaced by string surgery, nothing else parsed) and `runOriginFromEnv`.

**On the E2E admin client** — `removeInvitations`, `inviteByEmail`, `releaseLinkSlot`, `openLinkWitness`, `awaitLinkWitness`; and `hasAuthUser`, `grantRowsForUser`, `countUsersByEmailPrefix`, `removeUsersByEmailPrefix`, which page through every auth user and fail when a page fails.

**`invitationFlow.fixture.ts`** — the flow as steps a spec reads as sentences:

| Step | What it expresses |
| --- | --- |
| `seedEmailInvitation`, `seedCodeInvitation`, `inviteAndAskForLink` | an administrator promises a grant on a reserved row, by address or by code |
| `checkCode`, `codeSignIn` | a visitor types a code, or a code and a password |
| `askForLink` | a visitor asks for a link, and the step returns once that request's own witness has finished |
| `expectNothingSent` | a finished request sent nothing: the witness reads `not-sent`, then the catcher holds the expected number of mails, then no account exists |
| `receiveSignInLink` | the mail arrives and holds exactly one link of the callback's shape |
| `signInWithLink`, `signInWithPassword`, `claim`, `claimNamingAnAddress`, `refresh`, `setFreshPassword` | the user's own session |
| `grantsClaimOf`, `grantRowsOf`, `hasAccount`, `invitationsFor`, `readDedicatedRow` | what the token and the database say afterwards |
| `expectHeadersLeaveThisProcess` | hostile headers really leave the test process |
| `operationsWhoseAnswerHolds` | no answer of the function holds a given text |
| `resetDedicatedRows`, `leftovers` | the reserved rows back as seeded, and nothing left behind |

## The spec's test titles

One serial `describe`, `the server contract of invitations`, in this order:

1. seeding an invitation confirms the named entity it promises a grant on
2. a duplicate invitation is refused, and the first is left unchanged
3. the code check answers one word: valid for a seeded code, unknown for a string that names nothing
4. an invited address receives exactly one sign-in mail, whose link is the callback link of the requested locale
5. the mailed link signs in to a session that holds exactly the promised grant after the claim and a refresh
6. nobody else claims an invitation: a user who proved another address claims nothing, and the claim takes no address
7. an address with no invitation is answered like an invited one, and gets no mail and no account
8. a second request for one address inside the interval is answered alike and sends no second mail
9. request headers that name another site do not move the mailed link
10. the requested locale reaches the path of the link and the text of the mail
11. a code binds a fresh address, whose mailed link claims the grant the code promises; the code then answers used
12. a used code grants nothing twice: another address that presents it gets no mail, no account and no grant
13. a used code signs in with its claimant's password only, and no answer names the claimant
14. a returning user is mailed a link, and the claim reports a set password and nothing claimed
15. a request naming a witness nobody opened is answered like any other

No title carries a requirement or decision id, as the comment rules of `CLAUDE.md` require; the plan's list names them by id.

## Was the spec ever red

**Yes, three times, by design, and never on the tree's own database.** Each run replaced one function of the local database with a weakened one, ran the slice under a label that says so, and re-applied the original; `md5(pg_get_functiondef(…))` of the three functions read the same before and after each run.

| Label | The mutation | The one test that failed | Counts |
| --- | --- | --- | --- |
| `174-06-contract-slice-mutant-claim` | `claim_invitations` takes every open email invitation of the project | test 6: the other user's claim returned the organization's grant | passed 7, failed 1, skipped 9 |
| `174-06-contract-slice-mutant-eligibility` | `invitation_link_request` takes every address as eligible | test 7: the witness read `sent` | passed 8, failed 1, skipped 8 |
| `174-06-contract-slice-mutant-throttle` | `private.invitation_throttle_take` never refuses | test 8: the witness read `sent` | passed 9, failed 1, skipped 7 |

The skipped tests are the rest of the serial walk. These runs are not attempts at a green run and are not counted among the plan's runs; their directories are kept. The mutations and logs are `tests/e2e-runs/174-gates/174-06-negative-control-*`. The gate set's `db-reset` row rebuilt the database from the migration afterwards.

**Not shown red:** every test other than 6, 7 and 8, which have only been seen green, and the function side as a whole. No run was made against a weakened `account-access`, which would have cost two restarts; the properties of tests 9, 10 and 13 are held on the function's side by 174-05's source-level tests.

## Closing evidence

Head of every run: `2c107fee3`, tree-equal to HEAD outside `.planning/`. AC power, `caffeinate -dimsu`, every run a first attempt under its label. **No void marker exists in any directory this plan made, and no run was void.**

**Slices.** `174-06-contract-slice`: total 17, passed 17, failed 0, flaky 0, skipped 0, didNotRun 0; 13:30:55 to 13:31:43 local. `174-06-contract-slice-again`: the same counts; 13:31:52 to 13:32:11 local. `sleep_entries_in_window: 0` in both. Both verdicts with `--allow-slice --expect-project invitation-contract` exit 0: "project invitation-contract: 15/15 passed".

**Gate set `174-06-close`**, exit 0, 13:35:39 to 13:39:03 local, `sleep_entries_in_window: 0`. `node 174-verdict.mjs gates 174-06-close` exits 0: "rows: 15 expected (the full gate set), 15 recorded", "not stale", "power: no Sleep entry inside the run window", "PASS".

| Row | Status | Seconds |
| --- | --- | --- |
| typecheck | 0 | 18 |
| lint | 0 | 44 |
| db-reset | 0 | 30 |
| types-regen | 0 | 2 |
| types-clean | 0 | 0 |
| pgtap | 0 | 5 |
| sql-lint | 0 | 3 |
| unit | 0 | 57 |
| check-frontend | 0 | 8 |
| build | 0 | 16 |
| format | 0 | 17 |
| docs-links | 0 | 2 |
| name-gate-self-test | 0 | 0 |
| auth-config | 0 | 0 |
| stack | 0 | 2 |

pgTAP 39 files and 1706 tests, PASS. Unit: dev-seed 68 files and 1030 tests; supabase functions 21 and 499; frontend 159 files passed and 1 skipped, 2546 tests passed and 7 skipped; app-shared 10 and 141; data 47 and 244. The tests-utility vitest run, which is in no gate row, is 6 files and 95 tests (exit 0, by hand).

**Default E2E run `174-06-close`**, exit 0, 13:39:15 to 13:44:44 local, one preflight success and no preflight failure, `sleep_entries_in_window: 0`.

```
174-e2e.sh counts: total 215, passed 215, failed 0, flaky 0, skipped 0, didNotRun 0
```

`node 174-verdict.mjs e2e 174-06-close --same-projects-as 174-03-close --except invitation-contract=+ --expect-project invitation-contract --expect-project auth-service-contract` exits 0: "counts: total 215, passed 215, failed 0, flaky 0, skipped 0, didNotRun 0; 105 project(s)", "project invitation-contract: 15/15 passed", "project auth-service-contract: 2/2 passed", "per project: 105 compared, 0 not as expected", "PASS".

**Per project against the baseline: one project moved.** `invitation-contract` 0 → 15. Each of the other 104 projects is at its total in `174-03-close` (200 tests, 104 projects). The same is true against the operator's run `tests/e2e-runs/c6-heartbeat-close` at head `674b056db` (200, 104), read from the two `summary.json` files. 200 + 15 = 215; 104 + 1 = 105. The full list is in the name map.

**Probes after the close:** `170-allowlist-probe.sh after` exit 0 and `174-stack-probe.sh after` exit 0, each "every row OK". `node 174-verdict.mjs hygiene` exit 0.

## Leftovers

- **Users:** none. `auth.users` with an address beginning `invitation-contract-`: 0 after the slices, after the three mutant runs and after the full run.
- **Invitations:** none. `public.invitations`: 0 rows each time. The spec's `afterAll` asserts both.
- **Mails: seven per green run stay in the catcher** until the next stack restart; 27 for the prefix after this plan's six runs, 38 in the catcher in all. Their users are deleted, so their tokens verify to nothing. The suite deletes no mail anywhere, and this spec follows that.
- Nine finished witness records and two throttle rows after the full run. Which keys the two are was not read.
- The function's log, read through the filter for its prefix after the slices and after the full run, held no line.

## Decisions Made

- **The thrown error of `createInvitations` holds a code and nothing else.** The spec's duplicate test matches `23505` in it.
- **Every request in the spec carries a witness, positive ones too**, except the last test's by construction. A positive then reads the catcher knowing no further mail can come from that request, which is what makes "exactly one mail" exact.
- **`askForLinkNamingUnopenedWitness` uses an address nobody invited.** The request has no witness to wait for, and an invited address would let its background work create a user after the cleanup.
- **`requirements-completed` lists all four for their observed half on the running stack.** INV-03 and INV-04 were listed by 174-04 and 174-05 for the database and the function; the entry points that claim and refresh are 174-08's, and the browser path is 174-09's.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] A read that answers a failure with "nothing" cannot carry a negative assertion**
- **Found during:** Tasks 3 and 4
- **Issue:** `fetchEmailsForRecipient` answers a failed catcher request with an empty list, and `safeListUsers` reads one page of users and answers a failed listing with an empty list. "No mail" and "no account" would both pass while the catcher or the admin API is unreachable, and "no account" also for a user beyond the first page.
- **Fix:** `emailBucket` gains `listSubjects()`, which throws when the catcher cannot be read. The admin client gains a private pager over every auth user that fails when a page fails, and `hasAuthUser`, `grantRowsForUser`, `countUsersByEmailPrefix` and `removeUsersByEmailPrefix` on it. The lenient helpers are unchanged for their existing callers.
- **Files modified:** `tests/tests/fixtures/shared/emailBucket.fixture.ts` (outside the plan's file list), `tests/tests/utils/supabaseAdminClient.ts`
- **Commits:** `c065d5309`, `2c107fee3`

**2. [Rule 1 - Bug] The prescribed token cannot detect the fault the test is for**
- **Found during:** Task 2
- **Issue:** The plan's test of `toRunOrigin` uses a token holding `%2B`, `-` and `_`. A helper that parses and rebuilds the link returns that token unchanged, so the test passes on the fault it exists to catch.
- **Fix:** A second case with a token a rebuild alters (a lower-case escape, an escaped tilde and a bare one). With `toRunOrigin` replaced by a parse-and-rebuild, 1 of 22 tests fails: the added one. The source was restored and compared.
- **Files modified:** `tests/tests/utils/mailedLink.test.ts`
- **Commit:** `4184d958c`

**3. [Rule 1 - Bug] An assertion that would pass or fail by the clock**
- **Found during:** Task 4
- **Issue:** The plan's "nothing twice" test asserts that the request of another address presenting the used code reads `not-sent`. With a used code the mail goes to the claimant, so the outcome is `not-sent` only while the claimant's 60-second slot is taken, which as written depends on how long the tests since the claimant's own mail took. On a runner four times slower that is a race against a fixed window.
- **Fix:** The test gives the claimant's slot back (`invitation_link_release`, through the new `releaseLinkSlot`), takes it again with a request that presents the code alone (witness `sent`, the claimant's second mail), and only then makes the request under test. The plan's assertion is kept as written.
- **Files modified:** `tests/tests/specs/contestant/invitation-contract.spec.ts`, `tests/tests/utils/supabaseAdminClient.ts`
- **Commits:** `c065d5309`, `2c107fee3`

### Additions and differences

- **`packages/dev-seed/src/index.ts`** exports the method's argument and return types; it is not in the plan's file list.
- **`inviteByEmail` gives the address's slot back before it asks**, and throws when the function does not answer 200. The journey calls it with a fixed address in 174-09, where a run inside a minute of the last would otherwise meet the interval.
- **`assertSignInLinkShape` also refuses credentials and a fragment**, and a repeated parameter.
- **`SIGN_IN_LINK_EMAIL_SUBJECT_FI`** was added so the locale test asserts the mail's text as well as the link's path.
- **Test 6 seeds an open invitation for a third address first**, so "claims nothing" is asserted while there is something to claim, and asserts that invitation is still unclaimed afterwards.
- **Test 9 first shows that the hostile headers leave the test process.** What the gateway hands on to the function cannot be observed from a test.
- **`afterAll` also puts the two rows back to unconfirmed**, where the plan asks only for the removal.
- **Three negative-control slice runs** the plan does not ask for.
- **Test titles carry no requirement id**, where the plan's list does.

**Total deviations:** 3 auto-fixed (1 missing critical, 2 bugs in a prescribed test), the differences listed above. No file under `apps/` changed.

## Issues Encountered

None. No gate, unit run, slice or full run was red on a tree meant to be green, no run was void, and nothing was repeated after a red. Lint findings were corrected before their commits: an import order, an import placed below a mock, a comment broken across lines, and two length assertions, one of which was rewritten so that it cannot put a link into the report.

## Observations for the operator

- **`tests/scripts/e2e-run.sh` writes `yarn db:start`'s whole output to `<run-dir>/db-start.log`.** A count of key-shaped lines in this plan's first slice's copy is 1; the file was not opened. Run directories are gitignored. This is the wrapper's own behaviour, the same pattern 174-05 reported for `174-bankauth.sh`, and this plan did not change it.
- **`safeListUsers` reads the first page of auth users only.** Every helper built on it (`unregisterCandidate`, `grantEntity`, `setPassword`, `acceptTermsOfUse`, `getAuthUserByEmail`) misses a user once the stack holds more than one page. The spec adds eight users while it runs and removes them; how many users the stack holds at the suite's peak was not measured.
- **`GrantSpec` (`authApi.ts`) and `GrantRow` (the admin client) are the same four fields declared twice.** Left as it is to keep the close on an unchanged tree; 174-09 touches both files.

## Review against the checklist

Read against `.agents/code-review-checklist.md`, the general items.

- **`any`:** none.
- **Repetition:** the one named above, and the `SUPABASE_URL` fallback, which every API-level spec of the suite restates under the same comment.
- **Documentation:** every exported symbol carries TSDoc; `tests/README.md` gains the project's inventory row and section, the two reserved rows, the utilities, the fixture and a pitfall. No page of the docs site names what changed.
- **Errors:** every utility throws naming the operation and a status or a code, and none holds a token, a password, a key, a code or a link.
- **Comments:** present tense, no decision, requirement or phase id in any file under `packages/` or `tests/` this plan touched (a search of the diff for those forms prints nothing; `yarn assert:comment-hygiene` exits 0).
- **Commits:** the admin client is touched by two commits, the second adding one method the fixture needed.

## Threat Flags

None. The plan adds no endpoint, no auth path and no schema. Every surface it exercises is in the plan's threat model (T-174-48 to T-174-55, T-174-92).

## Known Stubs

None.

## User Setup Required

None.

## `CLAUDE.md` and the docs read against the change

`CLAUDE.md` was not edited, and **this plan makes no sentence of it false.** It states no count of E2E projects or tests, names no cleanup helper and no mail fixture. The sentence 174-05 reported as incomplete is unchanged and still incomplete:

> - **Edge Functions**: `apps/supabase/supabase/functions/` — `identity-callback`, `invite-candidate`, `send-email`

`tests/README.md` said "All ten" of the shared fixtures; it now says eleven and names the new one. No other tracked sentence outside `.planning/` was found that this plan makes false (searched for the dataset's row counts, the project and test totals, and the two cleanup helpers).

## What 174-09 takes over

For the journey and the localisation spec, which still use `sendEmail` and `toCallbackUrl`:

- **Seeding and asking:** `client.inviteByEmail({ entityType, externalId, email, locale })` in place of `client.sendEmail({…})`. It removes the address's earlier invitation on that entity, gives the slot back, seeds one invitation and asks the function. It writes no grant: the grant exists only after the invited user's session has claimed and refreshed.
- **Waiting for the mail:** `createEmailBucket(page, email)` with `SIGN_IN_LINK_EMAIL_SUBJECT`, or the locale's subject; neither journey regex matches it.
- **Opening the link:** `assertSignInLinkShape(link, { locale })`, then `toRunOrigin(link, runOriginFromEnv())`, in place of `toCallbackUrl(links[0])`. The mail's html holds exactly one anchor.
- **Cleanup:** `client.unregisterCandidate(email)` already removes the user's invitations, and the invitations addressed to the email when no user exists.
- **A negative:** `openLinkWitness()`, the request with `witness`, `awaitLinkWitness(id)`; or the fixture's `askForLink` and `expectNothingSent`.
- **Composition:** `createInvitationFlow(admin)` takes an admin client, so a browser spec can compose the flow beside its page fixtures; `test` exported by the fixture file is the worker-scoped form for a spec with no page.
- **Not taken over yet:** `sendEmail`, `toCallbackUrl` and the two journey regexes are still on the tree and still used.

## Next Phase Readiness

- The contract is held by the suite on one tree, and the helpers 174-09 needs exist and have run.
- The stack is up and was not restarted; it serves four functions. The gate set reset the database and `yarn db:seed:default` was run after the E2E run (exit 0, 752 rows). `auth.users` holds the two users `seed.sql` creates; `public.invitations` is empty. No dev server is running and nothing listens on 5173 or 5273.

## Self-Check: PASSED

- Files: the eight created files and the nine modified ones exist on the tree.
- Commits: `61756e575`, `4184d958c`, `c065d5309`, `2c107fee3` and `7ea5735ca` are ancestors of HEAD; `git rev-list --count cebe14793..HEAD` printed 5 when this file was written.
- Evidence: `tests/e2e-runs/174-gates/174-06-close` and `tests/e2e-runs/174-e2e/174-06-close` exist, hold no void marker, and their verdicts exit 0 on HEAD; the two slice directories and the three mutant directories exist.
- Working tree: `git status --short` shows only the operator's untracked `CAND-APP-PLAN.md`.
