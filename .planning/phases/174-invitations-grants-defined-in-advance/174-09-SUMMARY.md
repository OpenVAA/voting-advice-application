---
phase: 174-invitations-grants-defined-in-advance
plan: 09
subsystem: testing
tags: [playwright, e2e, fixtures, invitations, magiclink, auth-callback, sveltekit, supabase, mailpit]

requires:
  - phase: 174-invitations-grants-defined-in-advance
    provides: "plan 06: the invitation flow fixture, mailedLink, inviteByEmail and the completion witness; plan 07: three served functions and the fourth search literal left in five test files; plan 08: the callback's magiclink arm and the claim and refresh ahead of every grant gate"
provides:
  - "contestant-journey and perm-localisation-positive registering through a seeded invitation, a requested link and the mailed link opened as received"
  - "the Playwright project invitation-landing (3 tests): where a claimed project-scope invitation lands its user"
  - "the auth callback without an invite arm: that type is refused before it is verified"
  - "the E2E admin client without sendEmail; inviteByEmail witness-backed, with an afterSeeding hook"
  - "invitationFlow steps for any entity and for the project: whileHiddenFromVoters, expectSeedingAloneCreatedNothing, editorGrantOn, projectGrant, seedProjectInvitation, signInLinkToOpen, invitationsAddressedTo, removeEverythingUnderPrefix, leftoversUnderPrefix; an address prefix per composing spec"
  - "fixtures/admin/adminLoginPage.fixture.ts and goToPage on the contestant login page fixture"
affects: [174-10, 175, 178]

actuals:
  tokens: 27779
  tasks: 4
  commits: 5
plan_head_before: 6a00e042c50af6d3432e34c2775c2de667741108
plan_head_after: f3b307363d587ebf76c775d1df60e5cc12793a48

tech-stack:
  added: []
  patterns:
    - "A helper that asks for a mail returns only once that request's completion witness reads sent, so a spec that reuses one address across runs reads this run's mail"
    - "A spec that invites an entity the dataset hides keeps it hidden: nominations unconfirmed, seed, entity unconfirmed, nominations restored, so that the entity or each of its nominations is unconfirmed at every moment"
    - "One address prefix per spec that cleans up by prefix; two specs that run side by side never share one"
    - "A negative control on the running stack: one function of the local database replaced, the slice run under a label that says so, the original re-applied and compared by checksum"
    - "An expectation over a navigated URL reads the pathname alone when the query can hold a token or an address"

key-files:
  created:
    - "tests/tests/specs/contestant/invitation-landing.spec.ts"
    - "tests/tests/fixtures/contestant/invitation-landing.ts"
    - "tests/tests/fixtures/admin/adminLoginPage.fixture.ts"
  modified:
    - "tests/tests/specs/contestant/contestant-journey.spec.ts"
    - "tests/tests/specs/perm/perm-localisation-positive.spec.ts"
    - "tests/tests/setup/contestant/contestant-journey.teardown.ts"
    - "tests/tests/setup/perm/perm-localisation-positive.teardown.ts"
    - "tests/tests/fixtures/contestant/contestant-journey.ts"
    - "tests/tests/fixtures/contestant/contestantLoginPage.fixture.ts"
    - "tests/tests/fixtures/shared/invitationFlow.fixture.ts"
    - "tests/tests/fixtures/shared/emailBucket.fixture.ts"
    - "tests/tests/utils/supabaseAdminClient.ts"
    - "tests/tests/utils/contestantJourneyConstants.ts"
    - "tests/tests/utils/invitationConstants.ts"
    - "tests/playwright.config.ts"
    - "tests/README.md"
    - "apps/frontend/src/routes/api/auth/callback/+server.ts"
    - "apps/frontend/src/routes/api/auth/callback/server.test.ts"
    - "packages/dev-seed/src/templates/e2e/base.ts"
    - "apps/docs/src/routes/(content)/developers-guide/contestant-app/registration/+page.md"
    - ".planning/phases/174-invitations-grants-defined-in-advance/174-NAME-MAP.md"

key-decisions:
  - "The journey keeps its candidate hidden from voters while the invitation is seeded and leaves it unconfirmed: seeding confirms the candidate, and its nomination is confirmed, so it would otherwise become public in the base dataset"
  - "inviteByEmail carries a completion witness and throws when the request ends as not-sent: the function answers before it mails, and the catcher keeps earlier runs' mails for a fixed address"
  - "The landing spec invents its addresses under its own prefix, invitation-landing-, because invitation-contract runs beside it and removes every user under invitation-contract-"
  - "A string subject passed to the mail fixture is the whole subject; a RegExp is a pattern"
  - "The between-seed-and-request assertion is a hook of inviteByEmail, so the journey still calls the one helper the plan names"
  - "The callback's refusal is a comparison with one named constant, placed before verifyOtp"

patterns-established:
  - "whileHiddenFromVoters(entity, action): the wrapper for any spec that invites an entity voters must not see"
  - "createInvitationFlow(admin, { addressPrefix }): a flow bound to a spec's own prefix, with removeEverythingUnderPrefix and leftoversUnderPrefix for a spec that writes on no reserved row"

requirements-completed: [INV-01, INV-03]

coverage:
  - id: D1
    description: "The Contestant App journey registers through a seeded invitation, a requested link and the mailed link opened through the real callback, and the user then holds exactly the promised grant, written by the claim"
    requirement: "INV-03"
    verification:
      - kind: e2e
        ref: "contestant-journey.spec.ts steps 3, 4, 5 and 5.5; slices 174-09-journey-slice and -again, full run 174-09-close"
        status: pass
      - kind: other
        ref: "negative control 174-09-journey-slice-mutant-claim-nothing: the journey fails in step 5 against a claim that writes nothing"
        status: pass
    human_judgment: false
  - id: D2
    description: "The localisation spec registers the same way, and its teardown and self-heal remove the invitation with the user"
    verification:
      - kind: e2e
        ref: "perm-localisation-positive 2 of 2 in 174-09-close; no slice, it belongs to the serial permutation chain"
        status: pass
    human_judgment: true
    rationale: "Seen green once, in the full run. Its back-to-back behaviour was not run separately; the self-heal is the same call the journey's two slices exercised"
  - id: D3
    description: "The mailed link is opened as received, with only its origin replaced after its shape was asserted; the hand-built callback URL remains in the journey's password-reset step alone"
    verification:
      - kind: other
        ref: "git grep -n -F 'toCallbackUrl(' -- . ':!.planning': the declaration, its docblock and one call, in the journey's step 8"
        status: pass
    human_judgment: false
  - id: D4
    description: "The helper that invited through the auth service and wrote the grant itself is gone, and no file outside the planning record names that admin call"
    requirement: "INV-01"
    verification:
      - kind: other
        ref: "node 174-verdict.mjs greps — exit 0, four literals, no hit; git grep -n -F inviteUserByEmail -- . ':!.planning' exit 1"
        status: pass
    human_judgment: false
  - id: D5
    description: "The auth callback refuses a link of the type invite before it is verified"
    verification:
      - kind: unit
        ref: "apps/frontend/src/routes/api/auth/callback/server.test.ts#refuses a link of the type invite, and verifies and claims nothing"
        status: pass
      - kind: other
        ref: "negative control: with the refusal removed that test fails, 1 of 15"
        status: pass
    human_judgment: false
  - id: D6
    description: "A returning user promised a project role is signed in by the mailed link with the grant claimed and told there is nothing to edit; an invited project admin enters the Admin App through its login with the grant claimed in that request; a signed-in stranger gains nothing"
    requirement: "INV-03"
    verification:
      - kind: e2e
        ref: "invitation-landing.spec.ts, 3 of 3 in 174-09-landing-slice and in 174-09-close"
        status: pass
      - kind: other
        ref: "negative controls: each of the three tests red against the weakened claim that names its property (claim-nothing, claim-editor-only, claim-any-address)"
        status: pass
    human_judgment: false
  - id: D7
    description: "With the specs re-pointed, the fifteen gate rows and the full default E2E suite are green, every earlier project at its total in 174-08-close and the new project present with every test passed"
    verification:
      - kind: other
        ref: "node 174-verdict.mjs gates 174-09-close — exit 0, 15 rows, head e219189ae"
        status: pass
      - kind: e2e
        ref: "node 174-verdict.mjs e2e 174-09-close --same-projects-as 174-08-close --except invitation-landing=+ … — exit 0: total 218, passed 218; 106 compared, 0 not as expected"
        status: pass
    human_judgment: false

duration: 34min
completed: 2026-10-07
status: complete
---

# Phase 174 Plan 09: The Specs on the Mailed Link Summary

**The contestant journey and the localisation spec now register their candidate the way an invited person does: an invitation is seeded, a link is asked for, the mailed link is opened as received, and the grant is the one the claim wrote. A new project, `invitation-landing`, shows in the browser where a project-scope claim lands. The E2E helper that invited through the auth service and the callback's `invite` arm are gone. Fifteen gate rows and the full default E2E suite (218 of 218 in 106 projects; one project moved against `174-08-close`, the new one) are green on the tree.**

## Performance

- **Duration:** 34 min
- **Started:** 2026-10-07T11:57:17Z
- **Completed:** 2026-10-07T12:31Z
- **Tasks:** 4 of 4
- **Files:** 3 created, 17 modified outside `.planning/` (`git diff --name-status 6a00e042c..HEAD`), and the name map
- **Restarts of the stack:** none

## Task Commits

| Task | Name | Commit |
| --- | --- | --- |
| 1 | The journey registers through a seeded invitation and the mailed link | `c3849a0eb` (test) |
| 2 | The localisation spec follows; the old invite helper leaves the harness | `e472d2256` (test); the spec's own registration step is in `c3849a0eb` |
| 3 | The callback loses its `invite` arm; one spec shows where a claim lands | `0c103ce3f` (feat) |
| — | The registration docs page (a deviation, a commit of its own) | `e219189ae` (docs) |
| 4 | Close on the fifteen gate rows, the four searches and the full E2E suite | `f3b307363` (docs: name map) |

**Plan metadata:** the commit that adds this file. `commits: 5` is `git rev-list --count 6a00e042c..HEAD` when this file was written; all five are this plan's. `tokens` is the size of `git diff 6a00e042c..HEAD -- . ':!.planning'` in characters, divided by four.

## The journey's registration steps as they are now

1. **Step 3.** `client.unregisterCandidate(address)`, the self-heal. Then `invitationFlow.whileHiddenFromVoters(candidate, () => client.inviteByEmail({ entityType: 'candidate', externalId, email, locale: 'en', afterSeeding }))`. `afterSeeding` runs between the seeding and the link request and asserts, with the service role, that no auth user holds the address and no editor grant names the candidate. `inviteByEmail` returns once the request's witness reads `sent`. The step then reads the newest mail whose subject is exactly `SIGN_IN_LINK_EMAIL_SUBJECT`, asserts that it holds one link (as a number), asserts the link's shape with `assertSignInLinkShape(link, { locale: 'en' })` and moves it to the run's origin with `toRunOrigin(link, runOriginFromEnv())`.
2. **Step 4.** `page.goto` of that URL. The step waits until the address bar's path is the set-password page (the path alone is read) and sets the first password as before.
3. **Step 5** is unchanged: the login-or-landing dispatch, the terms of use, the entity home.
4. **Step 5.5, new.** With the service role: the user's grant rows are exactly `(entity, candidate, <the candidate's id>, editor)`, the address has exactly one invitation, and its `claimed_at` is set.
5. **Step 8** keeps `toCallbackUrl`: the recovery mail is the auth service's own.

Every other step is as Phases 172 and 173 left it.

## The localisation spec's registration step as it is now

`client.unregisterCandidate(RECIPIENT_EMAIL)`; `client.inviteByEmail({ entityType: 'candidate', externalId, email, locale: 'en' })`; `client.acceptTermsOfUse(RECIPIENT_EMAIL)`, which finds the user because the link request has finished; the mail by its exact subject, one link, `assertSignInLinkShape`, `toRunOrigin`, `page.goto`; then the password and everything after it unchanged. Its candidate is confirmed in its dataset already, so seeding changes nothing voters see.

## `toCallbackUrl`

One caller remains, the journey's password-reset step (`git grep -n -F "toCallbackUrl(" -- . ':!.planning'` lists the declaration, one docblock line and that call). **Phase 178 removes it** with the recovery mail. Its default for a verify link that carries no `type` is `invite`, a type the callback now refuses; the auth service's recovery link always carries `type=recovery`, and the helper's behaviour was left as the plan directs.

## The landing spec's three results

| Test | What it shows | Result |
| --- | --- | --- |
| a returning user promised a project role is signed in by the mailed link with the grant claimed, and is told there is nothing to edit | no grant before; the link request reads `sent`; the opened link lands on the Contestant App's root, the "nothing to edit" view names the user's address; grant rows exactly `(project, <project>, editor)`; `claimed_at` set | passed |
| an invited project admin enters the Admin App through its login, with the grant claimed in the same request | no grant when the form is submitted; the browser lands on the Admin App's home with the content behind its gate; grant rows exactly `(project, <project>, admin)`; `claimed_at` set | passed |
| a signed-in stranger gains nothing from another person's invitation | the Contestant App's login answers with the not-authorized message; the stranger holds no grant; the other address's invitation is still open | passed |

**No difference from obligation O-5:** the root load answers a signed-in user with no contestant grant with the "nothing to edit" view, as the name map records, and test 1 asserts it by the view's own test id.

**Test 1 does not show that the session's token carries the claimed grant**: the view is shown to any signed-in user with no entity. Test 2 shows it: the Admin App's gate reads the token, and a user who held no grant is let in.

## Were the specs ever red

**Yes, each on the property it names**, by replacing `claim_invitations` on the local database, running the slice under a label that says so, and re-applying the original (`md5` of the definition `cb08271334637fa452d4f60acfec9195` before, after each run and after the gate set's reset).

| Label | The mutation | What failed |
| --- | --- | --- |
| `174-09-landing-slice-mutant-claim-nothing` | the claim finds no invitation | landing test 1, on the grant rows; tests 2 and 3 skipped by the serial walk |
| `174-09-journey-slice-mutant-claim-nothing` | the same | the journey, in step 5: the password is set, and the user is not let in |
| `174-09-landing-slice-mutant-claim-editor-only` | the claim passes over admin promises | landing test 2: the address stays on the Admin App's login page; test 1 passed |
| `174-09-landing-slice-mutant-claim-any-address` | the claim takes every open email invitation | landing test 3, on the stranger's grant rows; tests 1 and 2 passed |

The callback's unit test of the refusal fails (1 of 15) with the refusal removed; the source was restored and compared with `cmp`. **Not shown red:** nothing was run against a weakened callback or login action, and the localisation spec was only seen green.

## Closing evidence

**Searches, each read by its own exit status, on head `e219189ae`:**

| Search | Exit | Hits |
| --- | --- | --- |
| `node 174-verdict.mjs greps` (`invite-candidate`, `inviteUserByEmail`, `preregisterWithApiToken`, `complete-registration`) | 0 | PASS, no hit for any |
| `git grep -n -F "inviteUserByEmail" -- . ':!.planning'` | 1 | none, `CLAUDE.md` included |
| `git grep -n -F "case 'invite'" -- 'apps/frontend/src/routes/api/auth/callback/+server.ts'` | 1 | none |
| `git grep -n -F "REGISTRATION_EMAIL_SUBJECT_REGEX" -- . ':!.planning'` | 1 | none |
| `git grep -n -F "sendEmail" -- tests packages/dev-seed` | 1 | none |
| `node 174-verdict.mjs exemptions` | 0 | PASS |
| `node 174-verdict.mjs hygiene` | 0 | PASS, 0 hits |

**What remains that speaks of inviting, and why it stays:** `account-access/index.ts` and its conformance test (`generateLink({ type: 'invite' })` creates a first-time invitee's user; the token is discarded); the callback's `REFUSED_TYPE` and its test; two negative cases of `mailedLink.test.ts`; `toCallbackUrl`'s default type; `supabaseDataWriter.ts` ("Use invite-based registration", "Invite session already established") and the set-password page's "Invite flow" branch, which are Phases 178 and 179's; the bank-authentication fixtures' "preregistration invite email", which is another flow. `sendEmail` elsewhere in the tree is the Admin App writer's method for the `send-email` function.

**Gate set `174-09-close`** — exit 0, first attempt, head `e219189ae`, window 15:19:28 to 15:22:56 local, `sleep_entries_in_window: 0`, no void marker. `node 174-verdict.mjs gates 174-09-close` exits 0.

| Row | Status | Seconds |
| --- | --- | --- |
| typecheck | 0 | 18 |
| lint | 0 | 46 |
| db-reset | 0 | 29 |
| types-regen | 0 | 3 |
| types-clean | 0 | 0 |
| pgtap | 0 | 5 |
| sql-lint | 0 | 4 |
| unit | 0 | 58 |
| check-frontend | 0 | 8 |
| build | 0 | 16 |
| format | 0 | 17 |
| docs-links | 0 | 2 |
| name-gate-self-test | 0 | 0 |
| auth-config | 0 | 0 |
| stack | 0 | 2 |

**Unit totals.** Frontend 163 files passed and 1 skipped, **2617 tests passed and 11 skipped** (2616 and 11 at `174-08-close`). What moved: `callback/server.test.ts` 14 → 15, the one case of the `invite` and `email` arms being two cases now. Supabase functions 18 files and 462 tests, dev-seed 68 and 1030, app-shared 10 and 141, data 47 and 244: unchanged. pgTAP 39 files and 1706 tests, `Result: PASS`. The tests-utility vitest run, in no gate row, is 6 files and 95 tests.

**Default E2E run `174-09-close`** — exit 0, first attempt, head `e219189ae`, window 15:23:06 to 15:28:48 local, `sleep_entries_in_window: 0`, no void marker, one preflight success and no preflight failure.

```
counts: total 218, passed 218, failed 0, flaky 0, skipped 0, didNotRun 0; 106 project(s)
project invitation-landing: 3/3 passed
project contestant-journey: 1/1 passed
project invitation-contract: 15/15 passed
project perm-localisation-positive: 2/2 passed
per project: 106 compared, 0 not as expected
174-verdict e2e 174-09-close: PASS
```

**Per project against `174-08-close`: one project moved.** `invitation-landing` 0 → 3. Each of the other 105 is at exactly its total there. 215 + 3 = 218; 105 + 1 = 106. The whole verdict is kept as `tests/e2e-runs/174-gates/174-09-close-e2e-verdict.txt`.

**The slices:** `174-09-journey-slice` and `174-09-journey-slice-again`, ten seconds apart with no reset between, each total 5, passed 5, `contestant-journey` 1 of 1; `174-09-landing-slice`, total 5, passed 5, `invitation-landing` 3 of 3. Each a first attempt, each verdict exit 0, `sleep_entries_in_window: 0`.

**The run's logs.** The dev-server log holds no line of "claiming invitations failed", "session refresh after the claim failed" or "sign-out after a failed claim", and one "Candidate login failed: Invalid login credentials" line, as the logs of `174-06-close` and `174-08-close` do. The function's log, through the filter for its prefix, held no line.

**Probes after the close:** `170-allowlist-probe.sh after` exit 0 and `174-stack-probe.sh after` exit 0, each "every row OK". `OPTIONS` answers 200 from the three functions and 404 from `invite-candidate`.

**Bank-auth runs:** not made; the plan asks for none.

**Void runs:** none; no void marker exists in any directory this plan made. **Fixes after a red:** none; no gate row and no test was red on a tree meant to be green.

## The first-time invitee who ends with no contestant grant

Seen once, under the claim-nothing mutant and not on the tree: the journey's user opened the link, was sent to the set-password page, set a password, and was then refused by the login form, because the session carried no contestant grant. That is the case ruling 18 hands to Phase 178. No test asserts it, and nothing on the tree produces it for an entity invitation whose claim succeeds.

A first-time invitee promised only a project role would meet the same refusal after setting a password; the landing spec's users all have a password already, so that path was not run.

## Decisions Made

- **The journey's candidate stays hidden from voters.** See Deviation 1.
- **`inviteByEmail` waits for its own witness.** See Deviation 2.
- **The landing spec has its own address prefix.** See Deviation 3.
- **A string subject is the whole subject.** The plan asks for the registration subject to be matched exactly; the mail fixture matched a string as a substring. Its only string callers pass the full literal.
- **`GrantRow` is `GrantSpec`.** The admin client's type is now an alias of the one `authApi.ts` declares.
- **Test titles carry no requirement id**, as the comment rules require.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Seeding the journey's invitation would have made its candidate public**
- **Found during:** Task 1, before any run
- **Issue:** `create_invitations` confirms the entity it names. The journey's candidate is seeded unconfirmed with a nomination that the seed writer confirms, and the dataset's comment says "Unconfirmed, so voters do not see it". With the plan's step as written the candidate is public from step 3 until the base teardown, and then gains answers and a portrait.
- **Root cause, confirmed in isolation:** one rolled-back `psql` transaction on a candidate of the default project: `anon` reads 0 rows while it is unconfirmed, 1 row after `create_invitations`, 0 rows again once its nominations are unconfirmed.
- **Not observed:** a spec failing because of it. In `174-09-close` `voter-journey`, which pins party AA at five visible candidates, ended 9.6 s before the journey started, so the default run may have stayed green without the fix. What the fix protects is the dataset's invariant against peers of the journey's scheduling phase and against a reordering.
- **Fix:** `invitationFlow.whileHiddenFromVoters`: the candidate's nominations are unconfirmed while the invitation is seeded, the candidate is made unconfirmed again, then the nominations are restored. The journey's later steps run on the row state they had before this plan. Two alternatives were rejected: leaving the candidate confirmed with an unconfirmed nomination (no caller under `apps/frontend/src` asks `get_nominations` for unconfirmed rows, so the entity-level load would probably find no nomination and sign the user out with `candidateNoNomination`; inferred from the code, not run), and resetting the candidate straight after seeding (a short window in which it is public).
- **Files modified:** `tests/tests/fixtures/shared/invitationFlow.fixture.ts`, the journey spec, `tests/README.md`
- **Commit:** `c3849a0eb`

**2. [Rule 1 - Bug] A fixed address would have read an earlier run's mail**
- **Found during:** Task 1
- **Issue:** `inviteByEmail` asked for the link without a witness and left the caller to wait for the mail. The function answers before it mails, and the catcher keeps every earlier run's sign-in mail for the journey's fixed address, so a poll for the subject is satisfied at once by an old mail whose token is dead. The localisation spec's `acceptTermsOfUse` straight after the call also needs the user the link request creates.
- **Fix:** `inviteByEmail` opens a witness, sends it with the request and returns once it reads `sent`; `not-sent` throws. Inferred from the helper's and the function's code; the two back-to-back journey slices passed with it and were not run without it.
- **Files modified:** `tests/tests/utils/supabaseAdminClient.ts`
- **Commit:** `c3849a0eb`

**3. [Rule 1 - Bug] The plan's address prefix is the contract spec's**
- **Found during:** Task 3
- **Issue:** The plan puts the landing spec's addresses under the prefix of `invitationConstants.ts`, `invitation-contract-`. `invitation-contract` removes every user under that prefix in `beforeAll` and `afterAll` and asserts none is left, and the two projects overlap (55.0 s to 60.3 s and 56.3 s to 60.8 s in `174-09-close`).
- **Fix:** `INVITATION_LANDING_ADDRESS_PREFIX = 'invitation-landing-'`, and `createInvitationFlow(admin, { addressPrefix })`.
- **Files modified:** `tests/tests/utils/invitationConstants.ts` (outside the plan's file list), the flow fixture
- **Commit:** `0c103ce3f`

**4. [Rule 1 - Bug] Sentences made false by this plan in files it does not list**
- The registration docs page said the callback redirects a verified `invite` link to the set-password page and sends an invitation's `magiclink` to the app home. Corrected in a commit of its own, `e219189ae`, as instructed; the page is in the file list of neither this plan nor 174-10.
- The base dataset's comment on the unregistered candidate named "the sendEmail-driven invite flow". Reworded in `e472d2256` (`packages/dev-seed/src/templates/e2e/base.ts`, a comment only).

### Verify commands and task boundaries

**5. Task 1's commit holds the localisation spec's registration step.** The plan removes `REGISTRATION_EMAIL_SUBJECT_REGEX` in Task 1 and re-points its second importer in Task 2, and Task 1's verify needs `yarn typecheck:tests` green. The spec and its teardown comment moved in `c3849a0eb`; `e472d2256` holds the rest of Task 2.

**6. Task 1's commit also touches the admin client and the mail fixture**, which the plan lists under Task 2: the witness and the hook of `inviteByEmail`, and the exact subject match.

### Additions and differences

- **`afterSeeding` on `inviteByEmail`** in place of a separate seed-then-ask fixture step: the plan allows either, and its verify reads the helper's name in the spec.
- **Step 5.5 also asserts that the address has exactly one invitation.**
- **Step 4 reads the pathname alone**, so no expectation's message can hold the address bar's query.
- **New files outside the plan's list:** `fixtures/admin/adminLoginPage.fixture.ts`, `fixtures/contestant/invitation-landing.ts` (the composition root), and `goToPage` on `contestantLoginPage.fixture.ts`: the steps the landing spec needed, added to fixtures first.
- **Each landing test asserts that its user holds no grant before the application's request**, which the plan does not ask for.
- **Four negative-control slice runs** the plan does not ask for.
- **`server.test.ts` holds 15 tests**: the case that covered the `invite` and the `email` arm is now two.
- **No state file was edited.** `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` and `CLAUDE.md` are left for the orchestrator, and nothing was appended to `.planning/WINDOWS.md`: the plan leaves no stub, skipped test or unrun verify.

**Total deviations:** 4 auto-fixed (three defects in the plan's own steps, one group of stale sentences), 2 task-boundary differences, the additions listed above.

## Issues Encountered

None. No gate row, unit run, slice or full run was red on a tree meant to be green, no run was void, and nothing was repeated after a red. Lint findings were corrected before their commits: an import order, a comment broken across lines, and the README's table formatting.

## The scans' conventions, read against the landing spec

The axe and raw-key scans enumerate routes, not specs: `a11y-smoke` the public voter routes and `contestant-a11y-scan` the candidate `(protected)` routes with three extra identities. This plan adds no route, view or message key, so neither scan needs an entry, and `yarn assert:a11y-scan-wiring` exits 0. Of the surfaces the landing spec visits, the "nothing to edit" view is scanned already (as a user with no grant); the Contestant App's login page and `register/password` are among the twelve public contestant routes the scan's header lists as unscanned; the Admin App's login and home are named by neither scan.

## Observations for the operator

- **A browser test that opens a mailed link puts the link into Playwright's own record of the `page.goto` call**, and into the trace when the test fails. This was so with the hand-built URL too. The run directories are gitignored, the token is spent by that navigation, and the user is deleted by the teardown. No assertion, title or log line of this plan holds a link.
- **Research RQ-2 measured that verifying a token as `signup` or `email` for an invited, passwordless user also sets a temporary password.** The callback still has those two arms. Nothing issues such a link for an invitee, and the plan removes `invite` alone.
- **`safeListUsers` still reads one page.** `acceptTermsOfUse` in the localisation spec uses it, as before this plan; no new negative was built on it.
- **`admin-auth.setup.ts` and `adminLoginPage.fixture.ts` now hold the same two raw locators.** The setup was not touched.
- **The journey spec's header still says "22 named `test.step` segments"**; the walk had more than 22 before this plan and has one more now.

## Review against the checklist

- Exported symbols carry TSDoc: the new fixture steps and types, `createAdminLoginPage`, `INVITATION_LANDING_ADDRESS_PREFIX`, the widened `freshInvitationAddress`, and the callback's `REFUSED_TYPE` and `GET`.
- No `any`.
- Comments and test titles are in present tense and carry no decision, requirement or phase id (`yarn assert:comment-hygiene` and the hygiene verdict exit 0; every touched comment was read).
- No user-facing string was added. The landing spec reads the not-authorized message from the English message source instead of copying it.
- Server side: the callback verifies nothing for a refused type, and its other arms are unchanged. No token, link or password reaches an expectation's subject, a step title or a log line of this plan.
- No component and no context consumer was touched.

## Threat Flags

None. The plan removes a callback arm and a service-role test helper and adds no endpoint, auth path or schema.

## Known Stubs

None.

## User Setup Required

None.

## `CLAUDE.md` and the docs read against the change

**`CLAUDE.md`: no sentence is made false.** It names no callback arm and no E2E helper, and it already lists `account-access` and the invitation model (`git grep -n -F inviteUserByEmail -- CLAUDE.md` exits 1). It was not edited.

**Docs sentences this plan made incomplete, in files 174-10 lists (not edited):**

- `developers-guide/backend/authentication`: "then redirects by link type: a recovery link goes to the password reset page, and a sign-in link to the Contestant App". It names neither the claim nor the refused type, and a first-time invitee's sign-in link lands on the set-password page.
- `developers-guide/contestant-app/login-and-password-reset`: "A missing parameter or a failed verification redirects to the login page with `errorMessage=authError`." A link of type `invite` does too, unverified.
- `developers-guide/contestant-app/pre-registration-and-invitation`: the sentences 174-08 reported ("The frontend calls neither `account-access` nor `claim_invitations`."; "The user is then signed in with a confirmed address, and holds no grant yet.") are unchanged.

## Next Phase Readiness

- The stack is up, not restarted by this plan, and serves three functions. The gate set reset the database and `yarn db:seed:default` was run after the E2E run (exit 0, 752 rows). `auth.users` holds the two users of `seed.sql`; `public.invitations` is empty; `claim_invitations` is the migration's. No dev server is running and nothing listens on 5173 or 5273.
- 174-10 meets the docs sentences quoted above and the red skill link audit 174-07 reported.
- Phase 178 takes over `toCallbackUrl` with the recovery mail, the set-password page's "Invite flow" branch, and the first-time invitee who holds no contestant grant.
- Phase 175, which edits organizations: a spec that invites an entity the dataset hides wraps the invitation in `whileHiddenFromVoters`, or the entity becomes public when it has a confirmed nomination.

## Self-Check: PASSED

- Files: the three created files and the seventeen modified ones exist on the tree; this file is `174-09-SUMMARY.md`.
- Commits: `c3849a0eb`, `e472d2256`, `0c103ce3f`, `e219189ae` and `f3b307363` are ancestors of HEAD; `git rev-list --count 6a00e042c..HEAD` printed 5 when this file was written.
- Evidence: `tests/e2e-runs/174-gates/174-09-close` and `tests/e2e-runs/174-e2e/174-09-close` exist, hold no void marker, and their verdicts exit 0 on HEAD; the three slice directories, the four mutant directories, `174-09-close-e2e-verdict.txt`, the two probe files and the negative-control files exist.
- Working tree: `git status --short` shows only the operator's untracked `CAND-APP-PLAN.md` and this file before its commit.
