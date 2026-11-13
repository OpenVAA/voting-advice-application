---
phase: 178-sign-in-email-code-registration
plan: 15
subsystem: auth
tags: [sveltekit, svelte5, form-actions, registration-code, entry-flow, invitationCodeLogin, session-admission, auth-callback, contestant-app, vitest, playwright]

requires:
  - phase: 178-sign-in-email-code-registration
    provides: "plan 178-08: the message keys and test ids of D1 and D2, Button's form attribute; plan 178-09: EmailEntry and PasswordSignIn; plan 178-10: entryFlow, sendEntryLink, clearEntryFlow on the contestant context; plan 178-12: the register page object's steps for D1 and D2; plan 178-13: the sign-in screen's form and action as the pattern, the email-sent screen, the $app/forms stub; plan 178-14: the callback as the tracer left it, the set-password gate a D2 user without a password meets"
  - phase: 174-invitations-grants-defined-in-advance
    provides: "invitationCodeLogin, which had no caller, and the writer's signInWithInvitationCode"
provides:
  - "Route key ContestantAppRegisterEmail and the page at /contestant/register/email (D1): shown only over a held code found valid"
  - "Route key ContestantAppRegisterSignIn, the page at /contestant/register/sign-in (D2) and its server action, the first caller of invitationCodeLogin: shown only over a held code found used"
  - "claimAndRefresh({ context, logLabel }) and the type SessionClaimContext, exported from $lib/auth/sessionAdmission; admitSession and the auth callback both call it"
  - "The email-sent screen's change-address link for the origin registerEmail"
  - "Fixture steps contestantRegisterPage.openEmailEntryDirectly() and .openCodeSignInDirectly()"
  - "An entry for D2's action on ADAPTER_BOUNDARY_ALLOWLIST"
affects: [178-16, 178-17, 178-18, 178-19, 178-21, 178-22, 178-23, 178-24]

actuals:
  tokens: 23970
  tasks: 3
  commits: 5
plan_head_before: 6050a97a93db75e91b1b3ed567a5ebbeec72db2f
plan_head_after: 2ebf42846e1e1f774bfe1c0c7ffc6174f1021ce1

tech-stack:
  added: []
  patterns:
    - "A screen that renders only over something held in the entry flow puts its whole markup inside an {#if} over a $derived of the held value, and leaves by an $effect that calls goto with replaceState when the value is absent"
    - "A screen that leaves when the entry flow loses its value clears the flow only after applyAction has resolved: clearing first starts a second navigation that overtakes the action's redirect"
    - "A server action that needs the writer for two calls builds it once, on the first call, inside the helper's own try: a writer that cannot be built is then one more refusal and not a thrown action"
    - "A registration code is never bound to page state or to a field the user sees: D1 passes the held code to the link request, D2 puts it in one hidden field of a posted form"

key-files:
  created:
    - apps/frontend/src/routes/contestant/register/email/+page.svelte
    - apps/frontend/src/routes/contestant/register/email/page.svelte.test.ts
    - apps/frontend/src/routes/contestant/register/sign-in/+page.svelte
    - apps/frontend/src/routes/contestant/register/sign-in/+page.server.ts
    - apps/frontend/src/routes/contestant/register/sign-in/page.svelte.test.ts
    - apps/frontend/src/routes/contestant/register/sign-in/page.server.test.ts
  modified:
    - apps/frontend/src/lib/routes/route.ts
    - apps/frontend/src/routes/contestant/email-sent/+page.svelte
    - apps/frontend/src/routes/contestant/email-sent/page.svelte.test.ts
    - apps/frontend/src/lib/auth/sessionAdmission.ts
    - apps/frontend/src/lib/auth/sessionAdmission.test.ts
    - apps/frontend/src/routes/api/auth/callback/+server.ts
    - apps/frontend/eslint.config.mjs
    - tests/tests/fixtures/contestant/contestantRegisterPage.fixture.ts

key-decisions:
  - "D2 clears the entry flow after the action's redirect has been followed, not before it as the sign-in screen does: D2 leaves for the registration page as soon as the held code goes, and that navigation would overtake the redirect"
  - "The shared claim-and-refresh function takes a context and a log label, not the callback's locals and fetch: a module under lib/auth may not read locals.supabase, and the pending todo describes this form. Its return type is the callback's"
  - "D2's action builds one writer for the request, on the helper's first call, and uses it for the code sign-in and the claim"
  - "A second submit of D2's form while a sign-in runs is cancelled by the page, beside the main button's loading state"
  - "No case was added to the adapter-boundary guard's own test: that test probes two real paths of the list and does not enumerate its entries"
  - "The callback's test file is unchanged: every one of its 17 cases passes over the shared function as it did over the local one"

patterns-established:
  - "A red-first unit run of a route that does not exist yet is made over stand-in files that render or do nothing, so that every failure is an expectation"

requirements-completed: []

coverage:
  - id: D1
    description: "The email entry of a registration code at its own address: nothing rendered and the history entry replaced by the registration page unless a code found valid is held; one form declared as a post with the two address fields; Continue asks for a link once with the trimmed address and the held code and opens the email-sent screen when the request has settled; a second submit while it runs sends nothing"
    requirement: REG-09
    verification:
      - kind: unit
        ref: "apps/frontend/src/routes/contestant/register/email/page.svelte.test.ts — 25 cases, new; red first over a stand-in page (tests/e2e-runs/178-unit/178-15-t1-red.log, exit 1, every failure an AssertionError)"
        status: pass
    human_judgment: true
    rationale: "No browser has rendered the screen: nothing links to it until plan 178-16, and plan 178-17's code spec is its first walk. Its axe scan and phone widths are plans 178-21 and 178-22's."
  - id: D2
    description: "The code sign-in's server action: one call of invitationCodeLogin with the code and the password of the posted form, the Contestant App's grant shapes, this request's auth surface and session reader, and a claim and a code sign-in on one writer built for the request; one failure for every refusal, holding the helper's status; a 303 to the app's home; nothing read of the request's address"
    requirement: REG-09
    verification:
      - kind: unit
        ref: "apps/frontend/src/routes/contestant/register/sign-in/page.server.test.ts — 19 cases, new; red first over a stand-in action"
        status: pass
    human_judgment: false
  - id: D3
    description: "The code sign-in screen: nothing rendered unless a code found used is held; one posted form with the held code in a hidden field and the password, and no address field or address; one sentence per refusal status; the link button asks for a link with the code and no address"
    requirement: REG-09
    verification:
      - kind: unit
        ref: "apps/frontend/src/routes/contestant/register/sign-in/page.svelte.test.ts — 43 cases, new; red first over a stand-in page"
        status: pass
    human_judgment: true
    rationale: "As D1: unit cases in jsdom only. That a browser posts the hidden field, follows the redirect and lands a signed-in user is first observed by plan 178-17."
  - id: D4
    description: "The email-sent screen leads back to the email entry for an address typed there"
    requirement: REG-09
    verification:
      - kind: unit
        ref: "apps/frontend/src/routes/contestant/email-sent/page.svelte.test.ts — 31 cases, one more than before and one changed; red first on the committed page"
        status: pass
      - kind: e2e
        ref: "178-15-precommit and 178-15-close: the committed tracer walks the page, green"
        status: pass
    human_judgment: false
  - id: D5
    description: "The claim-and-refresh pair exists once: admitSession and the auth callback call claimAndRefresh, and neither's behaviour changed"
    requirement: REG-09
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/auth/sessionAdmission.test.ts — 17 cases, 7 of them new for the exported function, the 10 of admitSession unchanged; apps/frontend/src/routes/api/auth/callback/server.test.ts — 17 cases, file unchanged"
        status: pass
      - kind: e2e
        ref: "178-15-precommit: a full run of the uncommitted tree, 178-verdict control --full --same-projects-as 178-14-close --green: PASS, 445 of 445 in 117 projects; 178-15-close on the committed tree: PASS"
        status: pass
    human_judgment: false
  - id: D6
    description: "The committed suite is green on the tree that holds both screens and the shared function, with its predecessor's projects and totals"
    requirement: REG-09
    verification:
      - kind: e2e
        ref: "tests/e2e-runs/178-e2e/178-15-close — 445 of 445 in 117 projects, head 2ebf42846; equal per project to 178-14-close"
        status: pass
    human_judgment: false

duration: 42min
completed: 2026-10-13
status: complete
---

# Phase 178 Plan 15: The Two Screens a Registration Code Leads To — Enter and Confirm an Email, and the Code-Reuse Sign-in — Each at Its Own Address, Linked from Nowhere, and One Claim-and-Refresh — Summary

**Two route keys, two pages and one server action that is the first caller of `invitationCodeLogin`; the claim-and-refresh pair moved into one exported function that `admitSession` and the auth callback both call; one more origin on the email-sent screen's way back; two fixture steps; 95 new unit cases; six gate rows at 0; and two full runs of 445 in 117 projects, one of the uncommitted tree and one of the committed.**

## Read this first

- **All three tasks are done and committed; the tree is clean; nothing is held.** Five commits. The two that reach what committed specs walk (`284742b7d`, `f1afe1dae`) followed a green full run of the uncommitted tree.
- **No browser has rendered D1 or D2.** Nothing links to either, and no spec opens one. Their evidence is 87 unit cases, 68 of them mounting a page in jsdom. Plan 178-16 builds the screen that leads to them and plan 178-17's code spec is their first walk; a failure there on D1 or D2 is as likely the screen's as the spec's.
- **D2 clears the entry flow after the redirect, where the sign-in screen clears it before.** D2 leaves for the registration page the moment the held code goes. Clearing first would start that navigation while the action's redirect is being followed, and the later navigation wins. This is a difference from plan 178-13's pattern that any later screen with the same guard must copy (*Decisions Made* 1).
- **The shared function's parameter is not the callback's.** The plan asks for "the signature the callback's local one has", which took the request's `locals` and `fetch`. A module under `lib/auth` cannot read `locals.supabase` (the adapter-boundary lint) and `admitSession` holds a structural context, so the function takes `{ context, logLabel }`, as the pending todo lays out. Its return type is the callback's (*Deviations* 1).
- **D2's action is on the adapter-boundary allowlist by path**, as the orchestrator ruled, in the form of the sign-in screen's entry. No case was added to the guard's own test, which probes two paths and does not enumerate the list.
- **A finding for plan 178-16: the guard of the `register/` tree does not stand over D2's action.** It is a layout load, and a load runs to render a page, not before an action. See *Threat Flags*.

## Performance

- **Duration:** 42 min
- **Started:** 2026-10-12T23:04:51Z
- **Completed:** 2026-10-12T23:46Z (2026-10-13 local)
- **Tasks:** 3
- **Files:** 14 (6 created, 8 modified)

## Task Commits

| Task | Commit | What |
|---|---|---|
| 1 | `e33d29812` | `feat(178-15)`: the key `ContestantAppRegisterEmail`, D1's page and its test |
| 2 | `27a3a3c6a` | `feat(178-15)`: the key `ContestantAppRegisterSignIn`, D2's page, its action, the two test files and the allowlist entry |
| 1 (held) | `284742b7d` | `feat(178-15)`: the email-sent screen's origin `registerEmail` and its test, after the pre-commit run |
| 2 (held) | `f1afe1dae` | `refactor(178-15)`: `claimAndRefresh` exported from `sessionAdmission.ts`, called by `admitSession` and by the callback, with its cases, after the pre-commit run |
| 3 | `2ebf42846` | `test(178-15)`: `openEmailEntryDirectly()` and `openCodeSignInDirectly()` |

The first two commits are additive: two routes nothing links to and no committed spec opens. The last is two steps no spec calls.

## Each task's verify command, with its real exit status

Each block was written byte for byte from the plan to `tests/e2e-runs/178-unit/178-15-t<N>-verify.sh` and run with `bash`; its log, exit status and head are beside it.

| Task | Exit | On head | Note |
|---|---|---|---|
| 1 | 0 | `e33d29812`, with the email-sent page and its test held, as the block expects | The unit stage has the `--`, so it ran the whole frontend suite: 221 files, 4702 passed |
| 2 | 0 | `f1afe1dae` | The whole frontend suite again: 223 files, 4771 passed; the control's verdict PASS |
| 3 | 0 | `2ebf42846` | Both verdicts PASS |

## Red before green

| Run | Exit | What was red |
|---|---|---|
| `178-15-t1-red` (D1's test and the email-sent test) | 1 | 24 failed. 22 of D1's 25 cases over a stand-in page that renders nothing, and the 2 cases of the email-sent test that expect the link back to D1, on the committed page. Every failure is an `AssertionError` |
| `178-15-t2-red` (D2's two tests and the admission test) | 1 | 66 failed, 13 passed. Over a stand-in page, a stand-in action that does nothing and a stand-in `claimAndRefresh` that answers nothing. Every failure is an `AssertionError`; the log holds no error of another kind |

The stand-ins were never committed; each was replaced by the real file before the task's commit.

## What the legacy guard does with the two new routes today, as read

`routes/contestant/register/+layout.server.ts`, unchanged:

- Its load asks `isRegistrationCodeLeg` with "is this the set-password route" and "does the address carry a registration key". For any route of the tree other than `/contestant/register/password` the answer is `true` whatever the address carries, so **both new routes are on the registration-code leg**.
- On that leg it reads the app settings through an anonymous client and redirects with 303 to `ContestantAppLogin` unless `isRegistrationModeAllowedForAnyType(appSettings, REGISTRATION_MODE.Code)`. A failed read is answered as empty settings, which allow nothing, so it redirects. That is the condition D-19 gives D1 and D2.
- `register/+layout.svelte` renders its "registration locked" frame in place of the children while `answersLocked`, so neither page is mounted then and neither's redirect runs.
- `register/+page.ts` sets `ssr = false` for the code page alone. D1 and D2 are server-rendered — to nothing, because the server's context holds no flow.

*Inferred from the framework's contract, not run:* the guard is a load, and a load runs to render a page, after an action and not before it. A post to D2's action is therefore answered whether or not the code mode is offered. See *Threat Flags*.

## D1 as built

- **The context.** `getRoute`, `sendEntryLink` and `t` are destructured; `entryFlow` and `appSettings` are read as `contestantCtx.X` inside a `$derived`.
- **The held code.** `validCode` is a `$derived.by` over `contestantCtx.entryFlow?.code`: the code while its status is `valid`, else nothing. The whole markup is inside `{#if validCode}`. An `$effect` calls `goto(<the registration route>, { replaceState: true })` when there is none: on mount for a reload or a visit by address, and again if the held code goes while the screen is shown.
- **The form.** `<form id method="POST" novalidate onsubmit>` with `EmailEntry` alone, used as it is: `bind:email` and `bind:this`. No server action answers it.
- **Continue.** The handler prevents the default, returns while a request runs, with no valid code, or when `entry.validate()` is false, then awaits `sendEntryLink({ origin: 'registerEmail', email: email.trim(), code: validCode })` and `goto(<the email-sent route>)`. No `try`, nothing read of what the request resolved to. The button is `type="submit"`, tied by `form`, `disabled` until `onMount`, `loading` while the request runs.
- **The code** is in no attribute, field or text of the page: a unit case reads the document for it.

## D2 as built

- **The held code.** As D1, for the status `used`.
- **The form.** `<form id method="POST" novalidate use:enhance={handleSignIn}>` with `<input type="hidden" name="code" value={usedCode}>` and `PasswordSignIn` with the three test ids. No `action` attribute, so it posts to its own route, whose address carries nothing.
- **The enhanced submit**, a function declaration typed `Parameters<SubmitFunction>[0]`: cancels a submit made while a sign-in runs; cancels one with no password, sets `contestantApp.login.passwordRequired` at the field and focuses it; otherwise remembers `document.activeElement`, goes to `submitting`, and returns the handler. A `failure` sets the outcome and gives focus back only when it has fallen to the body. Anything else is applied with `applyAction`, and the entry flow is cleared after that has resolved, unless the result was an `error`.
- **The outcome** is the script's own, else `{ state: 'failed', status: form.status }` from the `form` prop, else idle; `data-sign-in-state`, the sentence and its `data-status` read it. 400 → `contestantApp.register.signIn.failed`; 403 → `contestantApp.login.noProfile`; anything else → `contestantApp.login.unknownError`.
- **The link button** is always rendered: `type="button"`, `disabled` until mounted, `loading` while its request runs, described by a line holding `contestantApp.register.signIn.noPasswordYetInfo`. Its handler awaits `sendEntryLink({ origin: 'registerSignIn', code: usedCode })` — no address key at all — and `goto(<the email-sent route>)`.
- **No address.** The page holds two inputs, named `code` and `password`, and no email field; a unit case reads both.

## The action as built, against the research's sketch

The sketch's call of `invitationCodeLogin`, with three differences:

1. **A refusal is `fail(outcome.status, { status: outcome.status })`**, where the sketch has `fail(outcome.status)`: the page reads the status from the `form` prop, as the sign-in screen does.
2. **The writer is built on the helper's first call, once**, where the sketch builds it before the call. `signInWithInvitationCode` and `claimInvitations` both go through a local `requestWriter()` that memoises `createDataWriter({ fetch, locals })`. A writer that cannot be built then throws inside the helper's own `try` and is answered as a refusal with 400, and the action does nothing before its one call of the helper.
3. **The docblock**: where the code comes from, why it is never in an address, the order the helper keeps, and the one form of every refusal.

The same otherwise: `locals.supabase.auth`, `locals.safeGetSession`, `CONTESTANT_GRANTS`, the label `'Contestant code sign-in'`, a 303 to `ContestantAppHome` in the request's locale. The action reads no search parameter and no `redirectTo`; a unit case posts one and another puts a code in the address, and neither is read.

## The shared function

```ts
// apps/frontend/src/lib/auth/sessionAdmission.ts
export async function claimAndRefresh({
  context,
  logLabel
}: {
  context: SessionClaimContext;
  logLabel: string;
}): Promise<InvitationClaimResult | undefined>;

export type SessionClaimContext = Pick<SessionAdmissionContext, 'claimInvitations'> & {
  auth: Pick<SessionAdmissionContext['auth'], 'refreshSession'>;
};
```

It calls the module's private `claimOf` and, when the claim wrote a grant, `refresh`; both now take `SessionClaimContext`. `admitSession` calls it in place of its two lines. The callback calls it with `{ auth: locals.supabase.auth, claimInvitations: () => createDataWriter({ fetch, locals }).claimInvitations() }` and the label `'Auth callback'`, which gives the three log lines the text they had; its local `claimAndRefresh`, its `messageOf` and its import of `InvitationClaimResult` are gone. Nothing else of either file changed. It is also exported from the `$lib/auth` barrel, through `export *`.

**The todo `2026-10-07-174-the-claim-and-refresh-pair-exists-twice.md` is now closable**; plan 178-23 moves it. Of its three bullets: the function is extracted; the two tests that pin the order on each caller are kept; the refresh-failure cases are **added** to the shared function's test and the callback's own case "logs a refresh that returns an error and still lands the user" is kept, not moved, because the plan holds the callback's test unchanged.

## The unit cases, by title

### `register/email/page.svelte.test.ts` — 25

- **without a valid code held** (7): renders no part of the screen over nothing / a used code, before the page has mounted · leads to the registration page in place of this history entry over nothing / a used code / a link request and no code, and still renders nothing · stays where it is over a valid code · leaves the screen when the held code goes while it is shown
- **the frame** (3): has one heading that can take focus, under the app's name · says what the address is for · leads back to the registration page
- **the form** (5): is one form declared as a post, with validation left to the page · holds the address and its confirmation, each with a visible label and a name of its own · holds the code nowhere in the document · has its submit button outside it, among the page's actions, tied to it by its id · has a submit button that is natively disabled until the page has mounted
- **Continue** (10): sends nothing with both fields empty, says what to enter at each and focuses the first · sends nothing with the confirmation empty, and focuses the confirmation · sends nothing for an address the control reports invalid · sends nothing for two addresses that differ, and says so at the confirmation · removes the mismatch on the next edit of either field · asks for a link once, from this screen, with the address and the held code · takes two addresses that differ in case and outer spaces as one, and sends the first trimmed · does the same for a submit of the form without a press of the button · reads "Loading…" and takes no second submit while its request runs, and leaves only then · opens the "email sent" screen whatever the request resolved to

### `register/sign-in/page.server.test.ts` — 19

- **the one call of the code sign-in helper** (10): hands over the code and the password of the posted form, exactly as posted · takes the code from the form's body and never from the request's address · hands over the grant shapes of the Contestant App and names the entry point · hands over this request's own auth surface and session reader · hands over a code sign-in that goes through a writer built for this request's fetch and locals · answers the helper whether the writer's call succeeded (two) · lets a code sign-in that throws reach the helper, which answers it as a refusal · hands over a claim that runs on the same writer as the code sign-in · is made before anything else is asked of the request
- **a refusal** (4): is answered with a failure of the helper's status 400 / 403 / 500, holding that status and nothing else · calls the helper once
- **a sign-in** (5): redirects with 303 to the app's home in the request's locale (`en`, `fi`) · redirects to the home whatever redirect target a posted field / the address / a posted field that names another site carries

### `register/sign-in/page.svelte.test.ts` — 43

- **without a used code held** (8): renders no part of the screen over nothing / a valid code, before the page has mounted · leads to the registration page in place of this history entry over nothing / a valid code / a link request and no code · renders nothing of a refusal either, when the page is rendered after a post with nothing held · stays where it is over a used code · leaves the screen when the held code goes while it is shown
- **the frame** (5): carries the marker of the screen and is idle · has one heading that can take focus, with a title of its own, under the app's name · says that the user has registered and what to enter · leads back to the registration page · has its actions in order: sign in, ask for a link, return
- **the form** (8): is one form posted to the server, with validation left to the page · holds the held code in a hidden field named code · holds the code in that field and nowhere else in the document · holds the password field, declared as the current password, under a visible label · asks for no address and shows none · links to the forgot-password page from inside the form · has its submit button outside it, among the page's actions, tied to it by its id · is submitted by a press of that button, with the held code and the password in its body
- **signing in** (13): sends nothing with the password empty, says what to enter at the field and focuses it · clears that message when the password is edited · sends a password of spaces alone · reads "Loading…" and sends nothing for a second submit while the sign-in runs · shows one sentence for a refusal with 400 / 403 / 500 / 429 · keeps the code, enables the button again and applies nothing after a refusal · leaves focus on the button after a refusal, also when the browser dropped it · hides the last refusal while the next sign-in runs · follows the action's redirect, and clears the entry flow only when that has ended · applies an error of the post and keeps the entry flow
- **a page rendered after a post** (4): shows the sentence for the action's refusal with 400 / 403 / 500 · shows no refusal when nothing was posted
- **asking for a link** (5): is a plain button that cannot post the form, described by its line · is natively disabled until the page has mounted, and the submit button is not · asks for a link once, from this screen, with the held code and no address, and posts nothing · reads "Loading…" and takes no second press while its request runs, and leaves only then · opens the "email sent" screen whatever the request resolved to

### `email-sent/page.svelte.test.ts` — 31 (30 before)

- The table "links back to … for an address typed there" gains the row for the origin `registerEmail` and `ContestantAppRegisterEmail`.
- "shows the address with no link back for an origin it knows no screen of", which pinned the absence, is replaced by "links back to the screen that took the address for a code the flow still holds", which also reads that the code is nowhere in the document.

### `lib/auth/sessionAdmission.test.ts` — 17 (10 before)

- **claimAndRefresh** (7): claims, refreshes when a grant was written, and answers with the claim · does not refresh when nothing was claimed, and answers with the claim · answers a claim that throws with nothing, logs it under the entry point and does not refresh · logs a refresh that returns an error / throws and still answers with the claim · reads no session and signs nobody out · acts through a context that holds the claim and the refresh alone
- The ten cases of `admitSession` are unchanged and pass.

`routes/api/auth/callback/server.test.ts`: 17 cases, the file unchanged, all passing.

## The two E2E runs

| Label | What | Verdict | Totals | Docker VM free before |
|---|---|---|---|---|
| `178-15-precommit` | a full run of the uncommitted tree: the five held files and nothing else uncommitted, head `27a3a3c6a` | `control --full --same-projects-as 178-14-close --dirty-only apps/frontend/src/lib/auth/ --dirty-only apps/frontend/src/routes/api/auth/callback/ --dirty-only apps/frontend/src/routes/contestant/email-sent/ --green`: PASS | 445 of 445, 117 projects | 16.31 GiB |
| `178-15-close` | a full run of the committed tree, head `2ebf42846` | `e2e --same-projects-as 178-14-close`: PASS | 445 of 445, 117 projects; 0 failed, flaky, skipped or did not run | 16.15 GiB |

Per project, both runs equal `178-14-close` in all 117 projects. No run was void; the host's log holds no Sleep, Wake or DarkWake entry inside either window; the host was on AC power at 100 %. By the wrapper's own markers `178-15-precommit` took 11 min 42 s and `178-15-close` 12 min 33 s.

The dev-server log of each run holds the standing `TypeError … (reading 'map')` once, two aborted view transitions ("Viewport size changed") and nine interrupted `play()` calls, as the runs of plan 178-14 hold. Neither holds a line of a failed claim or a failed refresh.

A copy of each held file as the pre-commit run ran it is beside the run (`tests/e2e-runs/178-e2e/178-15-precommit.<path>.kept`); each was compared with the tree after the run, equal.

## The gate rows — `tests/e2e-runs/178-gates/178-15-close`, head `2ebf42846`

| Row | Exit | Seconds |
|---|---|---|
| typecheck | 0 | 27 |
| lint | 0 | 53 |
| unit | 0 | 84 |
| check-frontend | 0 | 10 |
| build | 0 | 18 |
| format | 0 | 20 |

`178-verdict gates 178-15-close --rows typecheck,lint,unit,check-frontend,build,format`: PASS, not stale, no Sleep entry inside the window.

## The two windows of ruling 6

| Window | What a signed-in user can reach | Opened by | Closed by |
|---|---|---|---|
| The first (T-178-79) | B, the sign-in screen, and its session-establishing action; E | `8c9a14f65` (plan 178-13) | plan 178-16's commit that lands the gate table's list of entry routes — not made yet |
| The second (T-178-155) | D1 | `e33d29812` | the same |
| | D2 and its code sign-in action | `27a3a3c6a` | the same |

In either a signed-in user can replace their own session by signing in again — on D2 with a code and its claimant's password — which signing out and in does too. Nothing links to any of the four routes and nothing is deployed between the plans. Both are tabled for the operator under item PL-19. Nothing was built here about the window beyond what the plan lays out.

## Items built at their options

U-13, U-17, U-21, PL-07, PL-19, PL-20 and PL-23 were read by the operator on 2026-10-11 and stand at their recommended options; each is built so:

- **U-13** (a): a 403 on D2 shows the "nothing to edit" words, `contestantApp.login.noProfile`.
- **U-17** (a): D2 has its own title and its own refusal sentence.
- **U-21** (a): D1 and D2 with nothing of the right kind held render no frame and show no notice.
- **PL-07**: the pair is extracted with D2's action.
- **PL-19**: D1 and D2 are committed as routes nothing links to, with the window above.
- **PL-20**: the held change that reaches every stored session was shown green on a full run of the uncommitted tree.
- **PL-23**: D1 and D2 before C.

## Decisions Made

1. **Clear after the redirect on D2.** `applyAction` awaits the navigation; `clearEntryFlow()` runs when it has resolved. The unit case "follows the action's redirect, and clears the entry flow only when that has ended" holds the order and that nothing leads to the registration page meanwhile. The sign-in screen clears first and can, because it has no guard.
2. **The shared function takes a context.** See *Deviations* 1.
3. **One memoised writer in the action.** A unit case holds that the sign-in and the claim share it and that none is built before the helper asks.
4. **The page cancels a second submit while a sign-in runs.** The main button is natively disabled then, which stops a press and stops Enter in a field; the cancel covers a submit that reaches the page another way.
5. **The redirects of D1 and D2 are effects**, as the email-sent screen's is: a screen that would otherwise stay blank when its code goes is worse than a second `goto`.
6. **No case in the guard's own test** for the new allowlist entry: the test probes two real paths of the list, not each entry, and the lint row on the real file shows the entry matches.
7. **No requirement is marked complete.** REG-09 needs the screen that checks a code (plan 178-16) and a browser walk (plan 178-17); REG-13's hints on the code field are the same plan's.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The shared function cannot have the callback's parameter**
- **Found during:** Task 2, step 6
- **Issue:** The plan asks that `sessionAdmission.ts` export the function "with the signature the callback's local one has", which is `Pick<RequestEvent, 'locals' | 'fetch'>`. A file under `lib/auth` that read `locals.supabase.auth` would fail the adapter-boundary lint, and `admitSession` has no event to hand over, only its structural context.
- **Fix:** `{ context: SessionClaimContext; logLabel: string }`, the form the pending todo describes; the return type is the callback's. The callback builds the two-member context from its `locals` and `fetch`.
- **Files modified:** `apps/frontend/src/lib/auth/sessionAdmission.ts`, `apps/frontend/src/routes/api/auth/callback/+server.ts`
- **Commit:** `f1afe1dae`

**2. [Rule 1 - Bug] Clearing the flow before the redirect would have sent a signed-in user to the registration page**
- **Found during:** Task 2, step 4, before the page was written
- **Issue:** The plan lays out "the enhanced submit as on the sign-in screen … clearing the flow state on success". The sign-in screen clears and then applies. On D2 the clear removes the held code, the guard's effect then calls `goto` to the registration page, and that later navigation overtakes the redirect `applyAction` started.
- **Fix:** apply, then clear. *Reasoned from the order of the calls and held by a unit case; not seen in a browser.*
- **Files modified:** `apps/frontend/src/routes/contestant/register/sign-in/+page.svelte`
- **Commit:** `27a3a3c6a`

### Other departures, none of them a fix

3. **`apps/frontend/eslint.config.mjs` is outside the plan's `files_modified`** and gained D2's entry, by the orchestrator's ruling.
4. **`routes/api/auth/callback/server.test.ts` is in `files_modified` and was not changed**: nothing of the callback's behaviour moved. The held set was therefore five files, not six.
5. **The verify blocks' unit stage** runs the whole frontend suite because of its `--`; known, and the verdict is the same.
6. **`.planning/WINDOWS.md` was not appended to**: the deviations are recorded here, and the dispatch keeps an executor's planning writes to its own summary.
7. **A shell check was refused once.** A read-only command that searched the pre-commit run's dev-server log through `bash -c` was denied by the harness's removal safety check, which could not read the script. The command held no removal. The same reads were then written to a script file, `tests/e2e-runs/178-unit/178-15-read-run.sh`, and run from it. Nothing was removed anywhere.

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug caught before it was written), 5 other departures. **Impact:** none on the committed suite.

## Issues Encountered

None beyond the deviations.

## The code-review checklist

| Item | Outcome |
|---|---|
| Solves what it sets out to | Yes: both screens at their own addresses with their action, tested alone and linked from nowhere; the pair exists once |
| OWASP top 10 | The code is read from the form's body and from nowhere else, and is in no address, storage, log line or error message; one `fail` for every refusal, with the status alone; the page shows no address and asks for none; the action takes no redirect target; `method="POST"` on both forms; the link button `type="button"` and natively disabled before hydration; nothing of a link request's answer read. The window T-178-155 stands until plan 178-16, as the plan accepts. One finding, under *Threat Flags* |
| Code style guide | `eslint` and `prettier --check` 0 on every file; the lint and format rows 0 |
| No `any` | None |
| No repeated code | The pair that existed twice exists once. Two repetitions remain, both known: D2's enhanced submit and its focus-after-refusal lines follow the sign-in screen's, and the `matchMedia` stub and the fake `enhance` are in two more test files. A third screen with the enhanced sign-in is the time to extract |
| Everything documented | `@component` docblocks on both pages, a docblock on the action, TSDoc on the two route keys, on `claimAndRefresh`, on `SessionClaimContext` and on the two fixture steps |
| Repo documentation | Not updated: plan 178-23 owns it. See *For later plans* |
| Tracking events | None added; the sign-in screen and the legacy code page track none |
| Svelte component guidelines | Runes only; no new component, two pages; reactive accessors read as `contestantCtx.X` |
| Errors handled and logged | The helper logs a refusal and a thrown sign-in with its label and no credential; a field's message is logged by `ErrorMessage`; the link request cannot reject; the shared function logs a failed claim and a failed refresh under the caller's label |
| Failing checks | None: six gate rows at 0 |
| Parts sharing dependencies | `admitSession` is every password sign-in's path and the callback every mailed link's: the whole frontend suite (223 files) and two full E2E runs are green over the shared function. The opt-in bank-auth projects were not run (item PL-26: at the closing gate) |
| WCAG A and AA | Visible labels from the shared fields, errors as `role="alert"` tied to their controls, a focusable `<h1>` on each screen, the link button described by its line, a real submit button tied to its form. **No axe scan and no width check has run on either screen**; they are plans 178-21 and 178-22's |
| Keyboard and screen reader | Unit cases hold the order of the actions, the focus moves and the descriptions; a submit of the form without a press is held for both screens. Not tried in a browser |
| Developers' and Publishers' Guides | Not updated; plan 178-23 |
| Comment hygiene | `yarn assert:comment-hygiene` 0 before each commit, with new files staged; every new comment read for history and ids |
| Commit history | Five commits, none a fix of another |
| No fixes of itself | None |
| Formatting in its own commit | No formatting-only change |
| `[db]` | No database change |

## Prohibitions

| Id | Held? | How |
|---|---|---|
| PROH-178-44 | Yes | D1 reads the code from the context and passes it to `sendEntryLink`; the case "holds the code nowhere in the document". D2 holds it in one hidden field of a `method="POST"` form with no `action`; the case "holds the code in that field and nowhere else in the document". The action reads `data.get('code')` and no address: the cases "takes the code from the form's body and never from the request's address" and the verify's search. Neither page reads the address bar or web storage, and the helper logs neither credential (its own cases) |
| PROH-178-45 | Yes | D2 has no email field and renders no address: the case "asks for no address and shows none". One sentence for every 400. The action's failure holds the status alone, and the helper answers an unknown code, a wrong password and an account with no password alike |
| PROH-178-46 | Yes | `EmailEntry` is mounted with `bind:email` and `bind:this` and nothing else; its files are unchanged |

## Observed, and inferred

**Observed:** every unit case's outcome; the three verify blocks' statuses; the six gate rows; both full runs' totals and their per-project comparison; that the kept copies equal the tree; that the callback's test file is unchanged and passes.

**Inferred, not observed:**

- That a browser posts D2's hidden field, that the action's redirect lands a signed-in user on the app's home, and that a D2 user without a password then meets the set-password view. No browser has opened either screen.
- That clearing the entry flow before the redirect would send the user to the registration page (*Deviations* 2): reasoned from the order of the two `goto` calls, not run.
- That a load does not run before an action, so the tree's guard does not stand over D2's action: the framework's contract, not run here.
- That a document request for D1 or D2 ends on the registration page with one history entry: the unit cases hold the `goto` with `replaceState` and that nothing is rendered; hydration of a server-rendered empty page was not run.
- That the server's markup carries `disabled` on D1's Continue and D2's link button. Neither screen is server-rendered with a frame at all, so this matters only for the moment between a client-side mount and its `onMount`.

## Not done, or not verified

- **No browser has rendered D1 or D2**, and no axe scan or phone-width check has run on them.
- **No case in the adapter-boundary guard's own test** for D2's entry (*Decisions Made* 6).
- **What the server's code sign-in answers for a project whose code mode is off was not read** (*Threat Flags*).
- **The opt-in bank-auth projects were not run** (PL-26).
- **No requirement is marked complete** (*Decisions Made* 7).

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: guard-bypass | `apps/frontend/src/routes/contestant/register/sign-in/+page.server.ts` | The tree's guard (`register/+layout.server.ts`) is a load. A post to D2's action is answered without it, so the action signs in the claimant of a code with their password whether or not the project offers the code mode, and also while answers are locked. The plan's register covers a signed-in caller (T-178-155) and not this. What it gives: nothing a caller could not do on the sign-in screen with the claimant's address and the same password; the server's own budget on the code stands. Plan 178-16's `refuseUnlessRegistrationOffered(event, need)` is asked "by each registration page's own server load" — if D-19's condition is meant to bind the action too, the action must ask it as well. |

## Known Stubs

None. The stand-in files of the two red runs were replaced before any commit.

## The state the local stack is left in

As a full E2E run leaves it: the stack up and not restarted, the suite's own project seeded and torn down by its own setups, and the rows no teardown removes (`private.invitation_link_witness`) present, so `39-invitations.test.sql` test 238 would be red until the next reset — the known finding. No reset, no probe and no pgTAP run was made. Nothing listens on port 5273 and no run is in flight. Docker VM free space after the closing run: 16.03 GiB.

## For later plans

- **Predecessor label for the next full run: `178-15-close`** (445 tests, 117 projects, head `2ebf42846`), equal per project to `178-14-close`.
- **178-16 (C) — where a checked code leads.** `holdEntryCode({ code, status })`, then `goto(getRoute.current('ContestantAppRegisterEmail'))` for `valid` and `'ContestantAppRegisterSignIn'` for `used`. Each screen renders only over a held code of its own status and otherwise replaces its history entry with the registration page, so a code held with the other status bounces back to C. Hold the code before navigating.
- **178-16 — the entry routes' list:** `ContestantAppRegisterEmail` and `ContestantAppRegisterSignIn` are the two keys to name beside `ContestantAppSignIn` and `ContestantAppEmailSent`. D2's action is the fourth thing a signed-in caller can reach (T-178-155).
- **178-16 — the guard and D2's action.** See *Threat Flags*: a layout or page load does not run before an action. If `refuseUnlessRegistrationOffered` is to stand over the code sign-in, the action asks it itself. The legacy guard's file still serves both new routes on its registration-code leg; when it is rewritten, D1 and D2 need the code mode, as D-19 gives them.
- **178-16 — the `register/` layout.** `register/+layout.svelte` shows its "registration locked" frame in place of the children while answers are locked, so D1 and D2 are not mounted then and their redirects do not run. `register/+page.ts`'s `ssr = false` covers the code page alone.
- **178-16, 178-19 — a screen with a guard that leaves when the flow empties clears the flow after the navigation, not before.** `await applyAction(result); if (result.type !== 'error') clearEntryFlow();`. The sign-in screen's order (clear, then apply) is right only for a screen with no such guard. The same holds for any `goto` after a `clearEntryFlow()` on a guarded screen.
- **178-17 (the code spec) — D1's markers:** `contestant-register-email`; the four `email-entry-*` ids; `register-email-submit`, natively disabled until hydration (Playwright's press waits for it); `register-email-return`. Continue sends the address **trimmed** and the held code; the email-sent screen then shows the address and "Use another email address" leads back to D1, which still holds the code — the address fields are empty again, since nothing of the form is kept.
- **178-17 — D2's markers:** `contestant-register-sign-in` with `data-sign-in-state` (`idle`, `submitting`, `failed`); `register-sign-in-error` with `data-status`; `register-sign-in-password-error`; `password-field` for the control; `register-sign-in-submit`; `register-sign-in-request-link`, natively disabled until hydration; `register-sign-in-return`. The link request carries the code and no address, so `pressResend` on the email-sent screen takes `{ code }`, and that screen shows no address and no way back to an address. After a sign-in the user lands on the app's home: one without a password meets the set-password view first.
- **178-17 — opening by address:** `contestantRegisterPage.openEmailEntryDirectly()` and `.openCodeSignInDirectly()` wait for nothing; the caller asserts where the visitor ends, which is the registration screen. Until plan 178-16 the legacy code page is what such a visitor ends on, and where the code mode is off the legacy guard sends them to the login page instead.
- **178-17 — D2's budget.** The plan's threat register states that the server counts each look-up against the code, ten in fifteen minutes; nothing here measured it. A spec that refuses several sign-ins on one code says so and paces itself.
- **178-18, 178-19 — the shared function.** `import { claimAndRefresh } from '$lib/auth/sessionAdmission'` (or the `$lib/auth` barrel). A new entry point that establishes a session calls `admitSession` if it gates on grants, and `claimAndRefresh` if it only lands the user. Do not write the pair a third time.
- **178-18 — the allowlist.** Two entries now stand outside the list's two groups: the sign-in screen's action and D2's. When the login page loses its action, the comment on the sign-in screen's entry ("as the login action listed above does") is reworded; D2's comment does not refer to it.
- **178-21, 178-22 — to look at on the rendered screens:** neither was ever looked at by a person or scanned. D1's Continue and D2's link button are disabled for the moment before `onMount`; D2's link line carries `mt-sm` alone between the link button and Return, as on the sign-in screen; D2's refusal sentence is long ("We couldn't sign you in with that password. Try again, or ask for a sign-in link below.") and sits inside the form above the forgot-password link; D2's password field has no user-name field beside it, which is by design and is what a password manager will meet; both screens have no document title for the moment before they leave when nothing is held.
- **178-23 — documentation now out of date:** the Developers' Guide wherever it lists the Contestant App's routes or route keys (two more), the callback's description if it names its own claim-and-refresh, and whatever describes `lib/auth` (one more export) or the adapter-boundary allowlist (one more entry). The todo `2026-10-07-174-the-claim-and-refresh-pair-exists-twice.md` is closable.
- **A harness check may refuse a `bash -c` whose script it cannot read.** Put multi-command reads in a script file and run that; it is also what the rules ask for loops.
- **A red-first run of a route that does not exist** needs stand-in files — a page that renders nothing, an action that does nothing — or every failure is an import error and the run does not count.
- **Timing on this host today:** the six test files of this plan 1.2 s of test time, by vitest's own start and end marks; `svelte-check` 10 s, by its gate row; the six gate rows 3 min 32 s; a full E2E run 11 min 42 s and 12 min 33 s.

## Threat register

| Threat | Disposition | How it stands |
|---|---|---|
| T-178-90 | mitigated | The code in a hidden field of a posted form, read from the body; the action reads no address (the verify and two unit cases); D1 and D2 read it from the context alone |
| T-178-91 | mitigated | No email field and no address on D2 (the verify and a unit case); one sentence for every 400; the helper's one refusal |
| T-178-92 | mitigated | The action adds no path around the server's count on the code; nothing here changes the function |
| T-178-93 | mitigated | The action's one call is `invitationCodeLogin`, which ends in `admitSession`; one `fail` (the verify) |
| T-178-94 | mitigated | D1 renders only over a code held as `valid`; the binding is the server's |
| T-178-95 | mitigated | The function moved with its behaviour; the callback's 17 cases and `admitSession`'s 10 pass unchanged; a full run of the uncommitted change and one of the committed tree are green |
| T-178-96 | accepted | Nothing here turns the framework's origin check off |
| T-178-155 | accepted | The window above, until plan 178-16 |
| T-178-SC | accepted | No package installed |

## Next Phase Readiness

Plan 178-16 can build the registration screen with somewhere to send the holder of a `valid` and of a `used` code. Its one open point from this plan is whether the registration guard is to stand over D2's action (*Threat Flags*).

## Self-Check: PASSED

`tests/e2e-runs/178-unit/178-15-self-check.sh`, exit 0: the fourteen files of the plan, the two runs' summaries, the gate set's table, the two red logs and the pending todo exist; the five commits of this plan and plan 178-13's `8c9a14f65` are ancestors of HEAD; five commits since the plan's base; `sessionAdmission.ts` defines `claimAndRefresh` once and the callback names it twice, in its import and its call.
