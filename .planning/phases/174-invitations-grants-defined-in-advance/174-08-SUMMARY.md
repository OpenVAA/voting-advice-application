---
phase: 174-invitations-grants-defined-in-advance
plan: 08
subsystem: frontend
tags: [sveltekit, supabase, auth, invitations, data-writer, session, zod, e2e]

requires:
  - phase: 174-invitations-grants-defined-in-advance
    provides: "plan 04: claim_invitations(p_project_id) answering claimed, skipped and password_set; plan 05: the Edge Function account-access with check-code, request-link and code-sign-in; plan 06: the E2E project invitation-contract; plan 07: three served functions and the writer without its removed member"
provides:
  - "four members of DataWriter: checkInvitationCode, requestSignInLink, signInWithInvitationCode, claimInvitations, with the types InvitationClaimResult, ClaimedInvitation, SkippedInvitation, InvitationSkipReason, InvitationCodeStatus and RequestSignInLinkOptions"
  - "admitSession in $lib/auth: claim, refresh when a grant was written, read the session, gate; used by passwordLogin and by invitationCodeLogin"
  - "the auth callback's magiclink arm, with the claim and the refresh before every arm"
  - "both login actions passing the claim on the request's own client"
  - "the verdict for A5: auth.setSession on a server-shaped client writes the session cookie by the time the call resolves"
affects: [174-09, 174-10, 178]

actuals:
  tokens: 27214
  tasks: 4
  commits: 4
plan_head_before: e5b89f92473cc74e676c062b78e9135eaad7fe7e
plan_head_after: 90c7a2e2991ab5c83654b004a38f679705aff503

tech-stack:
  added: []
  patterns:
    - "Session, claim, refresh, gate: a grant gate reads the session only after the claim and, when the claim wrote a grant, after the refresh"
    - "A claim or a refresh that fails is logged and the gate reads the token as it is; only an arm whose landing depends on the claim's answer drops the session"
    - "A narrowing that refuses an answer names the operation and the refused paths, never a value of the answer"
    - "One private method invokes an Edge Function for every operation, writing operation and project_id after the operation's own fields"

key-files:
  created:
    - "apps/frontend/src/lib/api/adapters/supabase/utils/invitationAccess.ts"
    - "apps/frontend/src/lib/api/adapters/supabase/utils/invitationAccess.test.ts"
    - "apps/frontend/src/lib/auth/sessionAdmission.ts"
    - "apps/frontend/src/lib/auth/sessionAdmission.test.ts"
    - "apps/frontend/src/lib/auth/invitationCodeLogin.ts"
    - "apps/frontend/src/lib/auth/invitationCodeLogin.test.ts"
    - "apps/frontend/src/routes/api/auth/callback/server.test.ts"
  modified:
    - "apps/frontend/src/lib/api/base/dataWriter.type.ts"
    - "apps/frontend/src/lib/api/base/universalDataWriter.ts"
    - "apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts"
    - "apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts"
    - "apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.integration.test.ts"
    - "apps/frontend/src/lib/auth/passwordLogin.ts"
    - "apps/frontend/src/lib/auth/passwordLogin.test.ts"
    - "apps/frontend/src/lib/auth/index.ts"
    - "apps/frontend/src/routes/contestant/login/+page.server.ts"
    - "apps/frontend/src/routes/admin/login/+page.server.ts"
    - "apps/frontend/src/routes/api/auth/callback/+server.ts"
    - "scripts/assert-project-scoped-queries.mjs"
    - ".planning/phases/174-invitations-grants-defined-in-advance/174-NAME-MAP.md"

key-decisions:
  - "The writer has one functions.invoke('account-access') site, a private method taking the operation, instead of three: the project term and the transport error are written once"
  - "The claim's elements keep the database's column names (scope, target_type, target_id, role), as GrantClaim does; only the top level is narrowed to passwordSet"
  - "sessionAdmission.ts imports the claim's result type from the data writer's backend-neutral contract; it imports no backend package and no adapter"
  - "A refresh that throws is caught and logged like a refresh that returns an error, in admitSession and in the callback"
  - "The callback claims and refreshes inline, as the plan specifies, and does not go through admitSession: it applies no grant gate"
  - "The exact number of cookie writes of a code sign-in was read once through a temporary assertion and is not pinned by the committed test, which asserts at least one"

patterns-established:
  - "A context member that may throw is called inside the helper's own try: a writer that cannot be constructed is a failed claim, not a failed login"
  - "A test of an ordering uses a fake whose token changes only when refreshSession is called, and records every call in one list"

requirements-completed: [INV-03, INV-04]

coverage:
  - id: D1
    description: "Every entry point that can sign an invitee in follows the order session, claim, refresh when a grant was claimed, gate: the auth callback and both login actions"
    requirement: "INV-03"
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/auth/sessionAdmission.test.ts#claims, then refreshes, then reads the session, and gates on the session it read"
        status: pass
      - kind: unit
        ref: "apps/frontend/src/routes/api/auth/callback/server.test.ts#verifies, claims on the request client, refreshes and only then redirects when a grant was claimed"
        status: pass
      - kind: other
        ref: "git grep -c -F claimInvitations on both login actions (1 each); neither action reads a session or applies a gate itself"
        status: pass
    human_judgment: true
    rationale: "That no other entry point signs an invitee in is a reading of the tree; the bank-authentication endpoint establishes a session and claims nothing, and is in no plan of this phase"
  - id: D2
    description: "A first-time invitee whose token gains its grant only through the refresh is admitted; without a claim the same user is refused and signed out locally"
    requirement: "INV-03"
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/auth/sessionAdmission.test.ts#admits a first-time invitee whose token carries no grant until the refresh"
        status: pass
      - kind: unit
        ref: "apps/frontend/src/lib/auth/sessionAdmission.test.ts#does not refresh and refuses that user when nothing was claimed, signing the local session out"
        status: pass
      - kind: other
        ref: "negative control: admitSession without the refresh fails 7 of 43 tests under src/lib/auth; reading the session before the claim fails 12"
        status: pass
    human_judgment: false
  - id: D3
    description: "A claim that fails locks nobody out of a password login: it is logged and the gate decides on the grants the token already carries"
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/auth/sessionAdmission.test.ts#admits a returning user on the grants the token already carries when the claim throws, without a refresh"
        status: pass
    human_judgment: false
  - id: D4
    description: "The callback verifies a mailed magiclink, claims, refreshes, and lands a user without a password on the set-password page with no registration key and a user with one on the validated next path or the app root; a failed claim on that arm drops the session and returns to login with the auth error"
    requirement: "INV-03"
    verification:
      - kind: unit
        ref: "apps/frontend/src/routes/api/auth/callback/server.test.ts — 14 tests, all passed"
        status: pass
      - kind: other
        ref: "negative control: a callback that never refreshes fails 2 of 14; one that keeps the session after a failed claim fails the test of that arm"
        status: pass
    human_judgment: false
  - id: D5
    description: "The data writer offers the four calls of the server contract, each carrying this adapter's project and nothing else that identifies a user"
    requirement: "INV-04"
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts#names this adapter project and passes nothing else"
        status: pass
      - kind: unit
        ref: "apps/frontend/src/lib/api/adapters/supabase/utils/invitationAccess.test.ts — 23 tests, all passed"
        status: pass
      - kind: other
        ref: "yarn assert:project-scoped-queries (exit 0; exit 1 with the RPC's disposition removed); yarn assert:adapter-casts (exit 0)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Code sign-in establishes its session on the request's own client, so its cookies land on the caller's response, and no token is returned, logged or placed in a redirect"
    requirement: "INV-04"
    verification:
      - kind: integration
        ref: "supabaseDataWriter.integration.test.ts, group 'SupabaseDataWriter and the invitation contract against the local stack' — 4 of 4 passed in tests/e2e-runs/174-gates/174-08-integration.json"
        status: pass
      - kind: unit
        ref: "apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts#sets the session once with the two tokens, and its result and its log hold neither"
        status: pass
      - kind: unit
        ref: "apps/frontend/src/lib/auth/invitationCodeLogin.test.ts — 6 tests, all passed"
        status: pass
    human_judgment: false
  - id: D7
    description: "No page, route, layout, component or message key was added, and the set-password page is reached without a registration key"
    verification:
      - kind: other
        ref: "git diff --stat e5b89f924..HEAD -- apps/frontend/messages apps/frontend/src/lib/components apps/frontend/src/lib/dynamic-components apps/frontend/src/lib/contestant prints nothing; under apps/frontend/src/routes the diff names the two login actions, the callback and its test"
        status: pass
      - kind: unit
        ref: "apps/frontend/src/routes/api/auth/callback/server.test.ts#sends a verified magiclink of a user without a password to the set-password page, in the request locale, with the address and no registration key"
        status: pass
    human_judgment: false
  - id: D8
    description: "With the wiring in, the fifteen gate rows and the full default E2E suite are green, every project at its total in 174-06-close; the run is also the boundary proof of 174-07"
    verification:
      - kind: other
        ref: "node 174-verdict.mjs gates 174-08-close — exit 0, 15 rows, head 352f9793e, sleep_entries_in_window 0, no void marker"
        status: pass
      - kind: e2e
        ref: "node 174-verdict.mjs e2e 174-08-close --same-projects-as 174-06-close --expect-project contestant-journey --expect-project invitation-contract — exit 0: total 215, passed 215, failed 0, flaky 0, skipped 0, did not run 0; 105 compared, 0 not as expected"
        status: pass
    human_judgment: false

duration: 32min
completed: 2026-10-07
status: complete
---

# Phase 174 Plan 08: Wiring the Claim into Every Sign-in Summary

**The auth callback and both login actions now claim the signed-in user's invitations and refresh the session before any grant gate reads it; the data writer offers the four calls of the server contract; and a code-login helper exists for Phase 178. Fifteen gate rows and the full default E2E suite (215 of 215, every one of 105 projects at its total in `174-06-close`) are green on the tree. No screen, route or message key was added.**

## Performance

- **Duration:** 32 min
- **Started:** 2026-10-07T11:23:56Z
- **Completed:** 2026-10-07T11:55Z
- **Tasks:** 4 of 4
- **Files:** 7 created, 13 modified (`git diff --name-status e5b89f924..HEAD`): exactly the twenty paths the plan lists
- **Restarts of the stack:** none

## Task Commits

| Task | Name | Commit |
| --- | --- | --- |
| 1 | The four writer methods and the narrowing of their answers | `7a8d30d29` (feat) |
| 2 | Session, claim, refresh, gate: the admission sequence, both login actions and the code-login helper | `093a05df1` (feat) |
| 3 | The callback verifies a mailed link, claims, refreshes and lands by password state; the code sign-in hand-off is measured | `352f9793e` (feat) |
| 4 | Close on the fifteen gate rows and the full E2E suite | `90c7a2e29` (docs: name map) |

**Plan metadata:** the commit that adds this file. `commits: 4` is `git rev-list --count e5b89f924..HEAD` when this file was written; all four are this plan's.

## The four methods as built

In `DataWriter` (`apps/frontend/src/lib/api/base/dataWriter.type.ts`), with a public method and an abstract `_`-method each on `UniversalDataWriter`:

```ts
checkInvitationCode: (opts: { code: string }) => DWReturnType<InvitationCodeStatus, TType>;
requestSignInLink: (opts: RequestSignInLinkOptions) => DWReturnType<DataApiActionResult, TType>;
signInWithInvitationCode: (opts: { code: string; password: string }) => DWReturnType<DataApiActionResult, TType>;
claimInvitations: () => DWReturnType<InvitationClaimResult, TType>;

type InvitationCodeStatus = 'valid' | 'used' | 'unknown';
type RequestSignInLinkOptions = { locale: string } & ({ email: string; code?: string } | { email?: string; code: string });
type ClaimedInvitation = { scope: string; target_type: string | null; target_id: string | null; role: string };
type InvitationSkipReason = 'candidate_has_editor' | 'target_not_in_project';
type SkippedInvitation = ClaimedInvitation & { reason: InvitationSkipReason };
type InvitationClaimResult = { claimed: Array<ClaimedInvitation>; skipped: Array<SkippedInvitation>; passwordSet: boolean };
```

On `SupabaseDataWriter`:

| Method | What it sends | What it resolves to | When it throws |
| --- | --- | --- | --- |
| `checkInvitationCode` | `functions.invoke('account-access', { body: { code, operation: 'check-code', project_id } })` | the status word | a transport error; an answer without one of the three words |
| `requestSignInLink` | the same function, `operation: 'request-link'`, with `locale` and whichever of `email` and `code` was given (an absent one is left out of the body) | `{ type: 'success' }` | a transport error; an answer that is not `{ accepted: true }` |
| `signInWithInvitationCode` | the same function, `operation: 'code-sign-in'`, with `code` and `password`; on `signed-in`, `auth.setSession({ access_token, refresh_token })` on the writer's own client | `{ type: 'success' }` when a session was set, `{ type: 'failure' }` for `invalid-credentials`; neither holds a token | a transport error; an answer of another shape or with an empty token; an error from `setSession` |
| `claimInvitations` | `rpc('claim_invitations', { p_project_id })`, the project being the only argument key | `{ claimed, skipped, passwordSet }` | the RPC's error; an answer of another shape |

The three function calls go through one private method, `#accountAccess(operation, fields)`, which writes `operation` and `project_id: this.projectId` after the operation's own fields. The four narrowings are in `utils/invitationAccess.ts`; a refused answer throws "The answer of `<operation>` did not match its schema at: `<paths>`", which holds no value of the answer.

## What each entry point does now, in order

**`passwordLogin` (both login actions).** (1) `signInWithPassword`; an error is the `400 invalidCredentials` outcome and nothing else runs. (2) `admitSession`: `claimInvitations()`; when `claimed` is not empty, `refreshSession()`; `getSession()`; the grant-shape gate on that session's token; refusal signs out locally and is `403 grantNotAllowed`; no session is `500 noSession`. The Contestant App's action gates on `CONTESTANT_GRANTS`, the Admin App's on `ADMIN_GRANTS`; each passes `claimInvitations: () => createDataWriter({ fetch, locals }).claimInvitations()`, so the claim runs on the request's own client as the user just signed in. Redirects, statuses and log labels are unchanged.

**When the claim fails in a login.** The error's message is logged with the label, no refresh is made, and the gate reads the token as the sign-in issued it: a returning user is admitted, a user with no grant is refused as before. A refresh that returns an error or throws is logged, and the gate reads the session as it is. A success outcome carries the claim's result when the claim answered.

**The auth callback.** (1) `verifyOtp({ token_hash, type })`; a missing parameter or a failed verification goes to the login page with `authError` and claims nothing. (2) `createDataWriter({ fetch, locals }).claimInvitations()`. (3) When `claimed` is not empty, `locals.supabase.auth.refreshSession()`; a failure is logged. (4) The arm:

| Type | Lands on |
| --- | --- |
| `recovery` | the reset-password page |
| `invite` | the set-password page with the user's address (unchanged; 174-09 removes the arm) |
| `magiclink` | **claim failed:** local sign-out, then the login page with `authError`. **`passwordSet` false:** the set-password page with the user's address and no registration key. **`passwordSet` true:** the validated `next` path, or the Contestant App's root |
| `email`, `signup` | the validated `next` path, or the Contestant App's root (unchanged) |
| any other | the Contestant App's root (unchanged) |

**When the claim fails in the callback.** It is logged. On `magiclink` the session is dropped and the user returns to login with the auth error, because where that arm lands depends on the claim's answer. On every other arm the landing goes ahead with the session.

**`invitationCodeLogin`.** `context.signInWithInvitationCode({ code, password })`, which resolves to whether a session was established; `false` and a throw are both `400 invalidCredentials` and never reach the claim; then `admitSession`. It has no caller in the application.

## The verdict for A5

**Holds.** Over a `@supabase/ssr` server client whose cookie callbacks keep a jar and record the names of every write, against the local stack: `signInWithInvitationCode` with the right password resolves to success; read with no wait after the call, one cookie write has happened, of one cookie, `sb-127-auth-token`; `getSession()` on that client returns the user's session; and a second server client reading only the jar is verified by the auth service as the same user. With a wrong password the call resolves to failure, no cookie is written and there is no session. `checkInvitationCode` answers `used` for the claimed code, and `claimInvitations()` under the new session returns two empty lists and `passwordSet` true.

`tests/e2e-runs/174-gates/174-08-integration.json`: 11 tests, 11 passed, 0 failed, 0 skipped; the four of the new group passed. The count "one" and the cookie's name were read once through a temporary assertion that was not committed; the committed test asserts at least one write and that every written name begins `sb-`. The group left no user and no invitation (`auth.users` 2, `public.invitations` 0 afterwards).

## Were the new tests ever red

| Mutation | Result |
| --- | --- |
| `admitSession` without the refresh | 7 of 43 tests under `src/lib/auth` fail, the first-time invitee among them |
| `admitSession` reading the session before the claim | 12 of 43 fail |
| the callback never refreshing | 2 of 14 fail |
| the callback keeping the session when the claim throws on `magiclink` | 1 of 14 fails, the test of that arm |
| the project-scoping gate without the RPC's disposition | exit 1, "rpc 'claim_invitations' has no disposition in PROJECT_SCOPED_RPCS" |

Each source was restored and compared byte for byte before its commit.

## Closing evidence

**Gate set `174-08-close`** — `tests/e2e-runs/174-gates/174-08-close`, exit 0, first attempt, head `352f9793e`, window 14:41:36 to 14:44:40 local, `sleep_entries_in_window: 0`, no void marker. `node 174-verdict.mjs gates 174-08-close` exits 0.

| Row | Status | Seconds |
| --- | --- | --- |
| typecheck | 0 | 19 |
| lint | 0 | 46 |
| db-reset | 0 | 29 |
| types-regen | 0 | 2 |
| types-clean | 0 | 0 |
| pgtap | 0 | 5 |
| sql-lint | 0 | 4 |
| unit | 0 | 32 |
| check-frontend | 0 | 9 |
| build | 0 | 16 |
| format | 0 | 18 |
| docs-links | 0 | 2 |
| name-gate-self-test | 0 | 0 |
| auth-config | 0 | 0 |
| stack | 0 | 2 |

**Unit totals.** Frontend 163 files passed and 1 skipped, **2616 tests passed and 11 skipped** (159 and 1, 2543 and 7 at `174-07-close`). What moved, by the JSON reporter: `supabaseDataWriter.test.ts` 81 → 99; `invitationAccess.test.ts` 23 (new); `sessionAdmission.test.ts` 10 (new); `invitationCodeLogin.test.ts` 6 (new); `passwordLogin.test.ts` 25 → 27; `callback/server.test.ts` 14 (new): 73 more in four new files. The 4 more skipped are the invitation group of the gated integration test. Supabase functions 18 files and 462 tests, dev-seed 68 and 1030, app-shared 10 and 141, data 47 and 244: unchanged. pgTAP 39 files and 1706 tests, `Result: PASS`.

**Default E2E run `174-08-close`** — `tests/e2e-runs/174-e2e/174-08-close`, exit 0, first attempt, head `352f9793e`, window 14:45:06 to 14:50:49 local, `sleep_entries_in_window: 0`, no void marker, one preflight success and no preflight failure.

```
counts: total 215, passed 215, failed 0, flaky 0, skipped 0, didNotRun 0; 105 project(s)
project contestant-journey: 1/1 passed
project invitation-contract: 15/15 passed
per project: 105 compared, 0 not as expected
174-verdict e2e 174-08-close: PASS
```

**Per project against `174-06-close`: no project moved.** Each of the 105 is at exactly its total there. The whole verdict is kept as `tests/e2e-runs/174-gates/174-08-close-e2e-verdict.txt`.

**The claim answered throughout the run.** The run's dev-server log holds no line of "claiming invitations failed", "session refresh after the claim failed" or "sign-out after a failed claim". Its one login error line ("Candidate login failed: Invalid login credentials") is also in the log of `174-06-close`, once.

**The boundary proof of 174-07.** No test met a 404 from a function or a silent edge runtime; `invitation-contract`, which calls `account-access`, is at 15 of 15.

**Probes after the close:** `170-allowlist-probe.sh after` exit 0 ("every row OK"); `174-stack-probe.sh after` exit 0 ("every row OK"). `OPTIONS` answers 200 from `account-access`, `identity-callback` and `send-email`, and 404 from `invite-candidate`. `node 174-verdict.mjs hygiene` exits 0.

**Void runs:** none. **Fixes after a red:** none; no gate row and no E2E test was red.

## For Phase 178

- **Where each operation is called from.** `checkInvitationCode` and `requestSignInLink`: their unit tests and the integration group only; no application caller. `signInWithInvitationCode`: `invitationCodeLogin` is written to call it through its context, and nothing calls `invitationCodeLogin`. `claimInvitations`: the auth callback and, through `admitSession`, both login actions.
- **`invitationCodeLogin` has no caller yet.** A form action passes `signInWithInvitationCode: async (credentials) => (await writer.signInWithInvitationCode(credentials)).type === 'success'` with `writer = createDataWriter({ fetch, locals })`, the same `auth`, `getSession` and `claimInvitations` members the login actions pass, and its own grant shapes.
- **Ruling 18, the two entry-gate facts.** (1) `ADMIN_GRANTS` lists admin shapes only: a claimed `(project, admin)` promise opens the Admin App's login, and a claimed `(project, editor)` promise opens neither login (403 from both). (2) The Contestant App's login gate refuses a user with no contestant grant, so "nothing to edit" is reached only by a user who already holds a session: a user who arrives by a mailed link whose claim wrote nothing they can edit there, or whose grant was removed.
- **None of the four calls consults the registration-mode matrix**, and the invitation leg of the set-password page stays exempt from the registration-code guard.
- **A mailed link carries no `next`.** The callback honours a validated `next` on the `magiclink` arm for a user with a password; the function's link does not set one, so such a user lands on the Contestant App's root.
- **A refresh that fails after a successful claim** leaves the grant written and the token without it until the session is next reissued; the user is landed or gated on the token as it is.

## Decisions Made

- **One invocation site.** The plan describes three `functions.invoke` calls; the tree has one private method that the three `_`-methods call. The project-scoping gate counts it as one Edge Function invocation and finds its project term.
- **The claim's elements keep the database's column names.** `scope`, `target_type`, `target_id` and `role` are strings as the RPC states them; `reason` is one of the two words.
- **The admission's context names the writer's contract type.** `sessionAdmission.ts` imports `InvitationClaimResult` from `$lib/api/base/dataWriter.type` (types only), as `getUserData.ts` in the same directory imports `BasicUserData`. It imports no backend package and no adapter.
- **`requirements-completed` lists INV-03 and INV-04 for their wiring half.** The browser path of a mailed link is 174-09's.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The project-scoping gate needs the new util in `GUARDED_SOURCES`**
- **Found during:** Task 1
- **Issue:** `yarn assert:project-scoped-queries` exited 1: "`utils/invitationAccess.ts` issues adapter calls but is in neither GUARDED_SOURCES nor DEFERRED_SOURCES". Check 5 keeps the list exhaustive against the adapter directory; the plan names the RPC's entry only.
- **Fix:** one entry in `GUARDED_SOURCES`, in the file the plan already lists. The gate exits 0 with 18 guarded sources.
- **Commit:** `7a8d30d29`

**2. [Rule 2 - Robustness] A refresh that throws is caught**
- **Found during:** Task 2
- **Issue:** the plan logs a refresh that returns an error. A refresh that throws would turn an otherwise admitted login into a 500.
- **Fix:** `admitSession` and the callback catch a thrown refresh and log it as they log a returned error. Tested in `sessionAdmission.test.ts`.
- **Commits:** `093a05df1`, `352f9793e`

**3. [Rule 2 - Robustness] A sign-out that rejects on the callback's `magiclink` arm does not stop the redirect**
- **Found during:** Task 3
- **Fix:** the rejection is logged and the user is still sent to login with the auth error, as `signOutToLogin` does for the protected loads.
- **Commit:** `352f9793e`

### Other differences from the plan's text

- **`passwordLogin.test.ts`: one existing expectation changed.** A success outcome carries the claim's result, so the case that compares the whole outcome names it. Every other existing case passes unchanged with the wider context.
- **`server.test.ts` holds 14 tests, not nine.** The nine the plan lists are there; the others cover two more hostile `next` values, the `invite` and `email` arms, and a refresh that returns an error.
- **`sessionAdmission.test.ts` and `invitationCodeLogin.test.ts` hold more cases than listed** (skipped-only claims, a thrown refresh, no session, concurrency, credentials absent from every log line).
- **The integration test was run three times.** Twice to read the number of cookie writes (the first printed nothing; the second failed by design on a temporary assertion that showed the record) and once for the report. Nothing temporary was committed.
- **No state file was edited.** `STATE.md`, `ROADMAP.md` and `REQUIREMENTS.md` are left for the orchestrator, as instructed.

## Issues Encountered

None. No gate row and no test of either closing run was red.

## Observations for the operator

- **The claim-and-refresh pair exists twice**, in `admitSession` and in the callback (about twelve lines), with a small `messageOf` helper beside each. The plan specifies the callback inline, and its verify reads `refreshSession` in that file. A shared helper would remove the repetition when the branch is restructured for review.
- **`scripts/assert-project-scoped-queries.mjs` has 8 ESLint errors when linted directly** (`no-console` among them), before this plan and after it. No gate row lints `scripts/`.
- **The bank-authentication endpoint** (`routes/api/contestant/preregister/+server.ts`) establishes a session with `verifyOtp` and calls no claim. It is in no plan of this phase.
- **The generated types say `Returns: Json` for `claim_invitations`**; the writer narrows the answer and does not rely on the type.

## Review against the checklist

- Exported symbols carry TSDoc: the four interface members, the six types, the four narrowing functions and `CodeSignInAnswer`, `admitSession` with its context and outcome types, `invitationCodeLogin` with its two types, and the callback's `GET`.
- No `any`. Test files cast a structural fake with `as unknown as` where the handler's event type is wider than the fake.
- Comments describe the code as it is: present tense, no history, no planning or requirement ids (`yarn assert:comment-hygiene` and the hygiene verdict exit 0).
- No user-facing string was added; no constructed non-English string exists in this plan.
- Server side: the claim runs on `locals.supabase`, the signed-in user's own client; no service role is used outside the gated integration test's fixture. No token, link or code reaches a log line, an error message or a redirect; the set-password redirect carries the user's address, as the `invite` arm already did.
- No component and no context consumer was touched, so the context destructuring rule and the results-navigation invariants have nothing to apply to here.

## Threat Flags

None. The surface this plan adds is the one its threat model lists.

## Known Stubs

None. `invitationCodeLogin` is complete and has no caller until Phase 178, as the plan states.

## User Setup Required

None.

## `CLAUDE.md` and the docs read against the change

**`CLAUDE.md`: no sentence is made false.** § _Backend (Supabase)_ says "`claim_invitations` writes the promised grants for the signed-in user's own confirmed address" and does not say who calls it.

**Docs sentences this plan made false or incomplete, in files it does not list (not edited):**

- `developers-guide/contestant-app/pre-registration-and-invitation`, § Callers: "The frontend calls neither `account-access` nor `claim_invitations`." False: the auth callback and both login actions call `claim_invitations`, and the data writer holds the three calls of `account-access`.
- The same page: "The route verifies the link's `token_hash` and stores the session in cookies. The user is then signed in with a confirmed address, and holds no grant yet." The route now claims and refreshes in the same request.
- `developers-guide/contestant-app/registration`: "The sign-in link of an invitation is of type `magiclink`, and the route sends it to the Contestant App home". False for a user without a password, who is sent to the set-password page.
- `developers-guide/contestant-app/login-and-password-reset`, the four numbered steps of the login action: they name no claim and no refresh between "It signs in" and "It reads the new session back".
- `developers-guide/backend/authentication`: "a recovery link goes to the password reset page, and a sign-in link to the Contestant App" is still true and says nothing of the claim.

The file list of 174-10 holds the invitation page, the login page and the authentication page. **The registration page is in the file list of neither 174-09 nor 174-10** (`files_modified` of both plans, read), so its sentence has no plan that corrects it; 174-09 also removes the `invite` arm the same sentence describes.

## Next Phase Readiness

- The stack is up, not restarted by this plan, and serves three functions. The gate set reset the database and `yarn db:seed:default` was run after the E2E run (exit 0, 752 rows). `auth.users` holds the two users of `seed.sql`; `public.invitations` is empty. No dev server is running and nothing listens on 5173 or 5273.
- 174-09 can open a mailed link in a browser: the callback claims, refreshes and lands by password state. The `invite` arm is still there for it to remove, with the registration page's sentence about that arm.
- 174-10 meets the docs sentences quoted above, except the registration page's, which no later plan lists.

## Self-Check: PASSED

- Files: the seven created files and the thirteen modified ones exist on the tree; this file is `174-08-SUMMARY.md`.
- Commits: `7a8d30d29`, `093a05df1`, `352f9793e` and `90c7a2e29` are ancestors of HEAD; `git rev-list --count e5b89f924..HEAD` printed 4 when this file was written.
- Evidence: `tests/e2e-runs/174-gates/174-08-close` and `tests/e2e-runs/174-e2e/174-08-close` exist, hold no void marker, and their verdicts exit 0 on HEAD; `174-08-integration.json`, `174-08-close-e2e-verdict.txt` and the two probe files exist.
- Working tree: `git status --short` shows only the operator's untracked `CAND-APP-PLAN.md`.
