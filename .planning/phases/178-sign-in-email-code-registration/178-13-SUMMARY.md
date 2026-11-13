---
phase: 178-sign-in-email-code-registration
plan: 13
subsystem: ui
tags: [sveltekit, svelte5, form-action, use-enhance, password-sign-in, entry-flow, email-sent, route-map, contestant-app, vitest, playwright-fixtures]

requires:
  - phase: 178-sign-in-email-code-registration
    provides: "plan 178-08: signInLinkOffered, the message keys, the test ids and Button's form attribute; plan 178-09: EmailField and PasswordSignIn; plan 178-10: EmailSentPanel, EmailSentResend, ResendCountdown and the context's entryFlow, sendEntryLink, resendEntryLink and clearEntryFlow; plan 178-12: the page objects of the login screen and the email-sent screen"
provides:
  - "Route keys ContestantAppSignIn (/contestant/login/email) and ContestantAppEmailSent (/contestant/email-sent)"
  - "The sign-in screen (B): one form posted to its own server action, a submit button among the page's actions tied to the form, and a button that asks for a mailed sign-in link"
  - "B's server action: the password sign-in helper called once, one failure for every refusal with the status in the response and in its data"
  - "The email-sent screen (E): the held link request's wording, address and count, and no part of the screen with nothing held"
  - "Fixture steps openSignIn({ redirectTo }) and openDirectly()"
  - "A resolvable vitest stub of $app/forms"
affects: [178-14, 178-15, 178-16, 178-17, 178-18, 178-19, 178-21, 178-22, 178-23]

actuals:
  tokens: 20897
  tasks: 3
  commits: 3
plan_head_before: b7de759a9851b774d39862c340ebdb9c2aab314f
plan_head_after: 81a8d278ae7163bf0e673c0ec99dec4b7ed08a62

tech-stack:
  added: []
  patterns:
    - "A page with a server action reads what is missing from the posted form's own data inside the enhance callback, and holds no bound copy of a field's value"
    - "A refusal is shown from one derived outcome: the page script's own last sign-in, else the form prop of a page rendered after a post"
    - "A button that needs the page's script is natively disabled until onMount has run; a unit case reads it between mount() and flushSync()"
    - "A page test that drives an enhanced form replaces $app/forms with an enhance that keeps the page's result handler, so a test answers the post with a result of its choice"
    - "A screen that shows only what the context holds renders nothing without it and leaves by an effect, so it also leaves when what it showed goes"

key-files:
  created:
    - apps/frontend/src/routes/contestant/login/email/+page.svelte
    - apps/frontend/src/routes/contestant/login/email/+page.server.ts
    - apps/frontend/src/routes/contestant/login/email/page.svelte.test.ts
    - apps/frontend/src/routes/contestant/login/email/page.server.test.ts
    - apps/frontend/src/routes/contestant/email-sent/+page.svelte
    - apps/frontend/src/routes/contestant/email-sent/page.svelte.test.ts
    - apps/frontend/src/lib/i18n/tests/__mocks__/app-forms.ts
  modified:
    - apps/frontend/src/lib/routes/route.ts
    - apps/frontend/vitest.config.ts
    - apps/frontend/eslint.config.mjs
    - tests/tests/fixtures/contestant/contestantLoginPage.fixture.ts
    - tests/tests/fixtures/contestant/contestantEmailSentPage.fixture.ts
    - tests/tests/utils/testIds.ts

key-decisions:
  - "B's action is on the adapter-boundary allowlist of the frontend's ESLint config, beside the login action it mirrors: the plan lays out the login action's body, which reads locals.supabase.auth, and the lint rule refuses that member access in any file that is not listed"
  - "B binds neither field's value to page state: the emptiness check and the link button both read the form's own data, which is the fallback the UI contract names for a value a browser filled in before hydration"
  - "After a refused sign-in B puts focus back where it was when the browser has dropped it to the body, because Button's loading state disables the button natively"
  - "E leaves for the login screen by an effect on the held request, not once on mount, so it also leaves when the request goes while it is shown"
  - "A full default E2E run was made at the close although the plan lays none out, because the dispatch names this run as the first with a browser behind plan 178-12's page objects"

patterns-established:
  - "A route file that hands the request's own auth surface to a sign-in helper needs an entry on ADAPTER_BOUNDARY_ALLOWLIST; the lint row is what says so"
  - "A stand-in for a red run of a page test is an empty component and an action that returns nothing, so that every failure is an expectation"

requirements-completed: [REG-02, REG-10, REG-13]

coverage:
  - id: D1
    description: "The sign-in action calls the password sign-in helper once, with the posted address and password, before anything else is asked of the request; every refusal is one failure with the helper's status in the response and in its data; a sign-in redirects with 303 to the app's home in the request's locale or to a redirectTo the validator accepts"
    requirement: REG-02
    verification:
      - kind: unit
        ref: "apps/frontend/src/routes/contestant/login/email/page.server.test.ts — 18 cases; red first (tests/e2e-runs/178-unit/178-13-t1-red.log, exit 1, every failure an expectation)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The sign-in screen renders one form with method POST and novalidate, the two fields, a hidden redirectTo, a submit button outside the form tied to it, and the link button exactly when the email or the identity-provider mode is allowed, whatever the answers lock says"
    requirement: REG-02
    verification:
      - kind: unit
        ref: "apps/frontend/src/routes/contestant/login/email/page.svelte.test.ts — describes 'the frame', 'the form', 'when a link is offered'; 25 cases"
        status: pass
    human_judgment: true
    rationale: "Mounted in jsdom against a fake context. No browser has rendered the screen: that a submit button outside the form posts it, that Enter in a field does, and what the server's markup holds before hydration are first observed by the tracer's test in plan 178-14."
  - id: D3
    description: "A press of the link button with an empty, blank or invalid address sends nothing and says so at the email field with focus there; with a usable address it calls sendEntryLink once with the origin signIn and navigates to the email-sent screen when the call has resolved, whatever it resolved to"
    requirement: REG-02
    verification:
      - kind: unit
        ref: "page.svelte.test.ts — describe 'asking for a link', 7 cases"
        status: pass
    human_judgment: false
  - id: D4
    description: "A refused sign-in shows one sentence by its status (400 wrong email or password, 403 no profile, anything else the unknown-error sentence) with the status as data-status, from the enhanced post and from the form prop alike; a press with something missing sends nothing; a sign-in clears the entry flow and then applies the action's redirect"
    requirement: REG-13
    verification:
      - kind: unit
        ref: "page.svelte.test.ts — describes 'signing in' and 'a page rendered after a post', 16 cases"
        status: pass
    human_judgment: false
  - id: D5
    description: "The email-sent screen renders no part of itself with nothing held and leads to the login screen replacing the history entry; with a held request it shows the wording, the typed address with a link back to the screen it was typed on, one count, one plain support button and no filled button, and a press of Send again when ready repeats the held request once"
    requirement: REG-10
    verification:
      - kind: unit
        ref: "apps/frontend/src/routes/contestant/email-sent/page.svelte.test.ts — 30 cases; red first (tests/e2e-runs/178-unit/178-13-t2-red.log, exit 1, every failure an expectation)"
        status: pass
    human_judgment: true
    rationale: "Mounted in jsdom under a fake clock. No browser has rendered the screen, and a document request for it has not been made: the tracer's test in plan 178-14 is its first walk."
  - id: D6
    description: "Two fixture steps open the new addresses: openSignIn({ redirectTo }) and openDirectly(); goToPage still opens the login route"
    requirement: REG-10
    verification:
      - kind: other
        ref: "tests/e2e-runs/178-unit/178-13-t3-verify-r2.log — the plan's Task 3 verify, exit 0, with 178-verdict gates 178-13-close-r2: PASS"
        status: pass
    human_judgment: true
    rationale: "Type-checked and linted; no spec calls either step yet."
  - id: D7
    description: "The committed suite is green with the two routes on the tree and plan 178-12's page objects behind a browser for the first time"
    requirement: REG-13
    verification:
      - kind: e2e
        ref: "tests/e2e-runs/178-e2e/178-13-close — 444 of 444 in 116 projects, head 63e976942; 178-verdict e2e 178-13-close --same-projects-as 178-11-close: PASS"
        status: pass
    human_judgment: false

duration: 34min
completed: 2026-10-12
status: complete
---

# Phase 178 Plan 13: The Sign-in Screen and the "Email Sent" Screen at Their Own Addresses, Linked from Nowhere — Summary

**Two routes with their keys, one server action, 96 unit cases red first, two fixture steps that open the addresses, six gate rows at 0 and a full run of 444 — and two lint and test-harness files outside the plan's list, without which neither page could be committed green.**

## Read this first

- **All three tasks are done and committed; the tree is clean; nothing is left held.** The login page and its action are byte for byte as the phase's base commit has them.
- **Three files outside the plan's `files_modified` were changed, each because a gate could not pass without it** (*Deviations* 1 and 2): a resolvable test stub of `$app/forms` with its alias in `vitest.config.ts`, and one entry on the adapter-boundary allowlist of `apps/frontend/eslint.config.mjs`. **The allowlist entry is the one the orchestrator should look at**: the plan lays out an action that reads `locals.supabase.auth`, the lint rule refuses that in any unlisted file, and the phase's documents do not mention the rule. Plan 178-15's action for D2 will meet it too.
- **No browser has rendered B or E.** Their unit cases run in jsdom; the tracer of plan 178-14 is the first walk. What that leaves unobserved is listed under *Observed, and inferred*.
- **A full default E2E run was made although the plan lays none out**, by the dispatch's note for this plan: `178-13-close`, 444 of 444 in 116 projects, equal per project to `178-11-close`. It is the first run with a browser behind plan 178-12's changes to the login and forgot-password page objects, and found nothing. It ran on head `63e976942`; the one commit after it adds a comment to the test-id registry.
- **One sentence of the UI contract does not hold for a post made before the script has loaded**: "The address stays in its field." The action answers a refusal with the status alone, as the plan's ruling 4 lays out, so a page rendered from such a post has an empty email field unless the browser fills it. See *Not done, or not verified*.

## Performance

- **Duration:** 34 min
- **Started:** 2026-10-12T21:29:31Z
- **Completed:** 2026-10-12T22:04Z
- **Tasks:** 3
- **Files:** 13 (7 created, 6 modified)

## Task Commits

| Task | Commit | What |
|---|---|---|
| 1 and 2 | `8c9a14f65` | `feat(178-13)`: both route keys, the sign-in screen with its action and two test files, the email-sent screen with its test file, the `$app/forms` stub and the allowlist entry — one commit, as the plan lays out |
| 3 | `63e976942` | `test(178-13)`: `openSignIn({ redirectTo })` and `openDirectly()` |
| 3 | `81a8d278a` | `test(178-13)`: the registry's comment on `login.errorMessage`, which the dispatch leaves to the plan that renders `data-status` |

## Each task's verify command, with its real exit status

Each block was written byte for byte from the plan to `tests/e2e-runs/178-unit/178-13-t<N>-verify.sh` and run with `bash`; its log, exit status and head are beside it.

| Task | Exit | On head | Note |
|---|---|---|---|
| 1 | 0 | `b7de759a9` with the working tree of both tasks | The block's unit stage has the `--`, so it ran the whole frontend suite: 219 files, 4639 passed |
| 2 | 0 | `8c9a14f65` | The same |
| 3 | 0 | `63e976942`, gates `178-13-close` | |
| 3 again | 0 | `81a8d278a`, gates `178-13-close-r2` | Made again after the registry comment, so that the gate run is not stale on HEAD |

## Red before green

Both red runs were made against stand-ins — an action that returns nothing and a component that renders nothing — so that no failure is an import or compile failure.

| Run | Exit | Failed | Passed | Kind of every failure |
|---|---|---|---|---|
| `178-13-t1-red` (B's two files) | 1 | 64 | 2 | `AssertionError` |
| `178-13-t2-red` (E's file) | 1 | 29 | 1 | `AssertionError` |

The three that passed on a stand-in are negative cases: "when a link is offered › with the code mode alone" and "› with no mode" (which gained an assertion that the submit button is rendered before the green run), and E's "renders no part of the screen before the page has mounted".

## The action's three differences from the login page's

1. The log label is `'Contestant sign-in'`.
2. A refusal returns `fail(outcome.status, { status: outcome.status })`.
3. The docblock is written anew: what the action does, that the helper claims and refreshes before its grant gate, that the redirect target is validated in the action and nowhere else, and why the failure's data repeats the status.

Nothing else differs: the same `passwordLogin` call with `locals.supabase.auth`, `locals.safeGetSession`, the claim on `createDataWriter({ fetch, locals })` and `CONTESTANT_GRANTS`; the same `safeRedirectTarget`; the same 303 to the home or to `/<locale>/<redirectTo>`. The form has no `action` attribute, so it posts to its own route.

## The sign-in screen as built

- **The context.** `clearEntryFlow`, `getRoute`, `sendEntryLink` and `t` are destructured; `appSettings` and `answersLocked` are read as `contestantCtx.X` inside a `$derived` or the markup.
- **No field's value is bound to page state.** `EmailField` and `PasswordSignIn` keep their own values; the page reads `formData.get('email')` and `formData.get('password')` in the enhance callback, and `new FormData(formElement)` for the link button. The address is trimmed for the emptiness check; the password is not, so a password of spaces is sent.
- **The outcome.** `scriptedOutcome` is what the page's script saw of its last sign-in; `outcome` is that, else `{ state: 'failed', status: form.status }` from the `form` prop, else idle. `data-sign-in-state`, the refusal's sentence and its `data-status` all read `outcome`. The refusal is not shown while the next sign-in runs.
- **Focus after a refusal.** The enhance callback remembers `document.activeElement` at the submit and, after a refusal, focuses it again only when the active element has become the body. `Button`'s `loading` sets the native `disabled`, and a browser may drop the focus of a button that becomes disabled.
- **A result that is neither a failure nor an error** clears the entry flow and is then applied; an `error` result is applied without clearing, as the login page applies it.
- **The link button** is `type="button"`, `disabled={!mounted}`, `loading` while its request runs, and named by its line through `aria-describedby`. Its handler has no `try` and reads nothing of what `sendEntryLink` resolved to.
- **The frame** is the shaded one of the forgot-password page (`pageStyles.use`), with no poster image in the top bar.

## How E decides that nothing is held, and what it renders then

`const request = $derived(contestantCtx.entryFlow?.request)`. The whole markup is inside `{#if request}`, so with no request the page renders nothing: no `MainContent`, no heading, no document title of its own. An `$effect` that reads `contestantCtx.entryFlow?.request` calls `goto(<the login route>, { replaceState: true })` when there is none — on mount for a reload or a visit by address, and again if the held request goes while the screen is shown. A flow that holds a registration code and no request counts as nothing held.

With a request: the address shown is `request.email` trimmed, and none for the wording `code` whatever the request carries; "Use another email address" is rendered for a shown address whose origin is `signIn`, `register` or `forgotPassword`, and leads to `ContestantAppSignIn`, `ContestantAppRegister` or `ContestantAppForgotPassword`. The origin `registerEmail` shows its address with no link until plan 178-15 adds D1's key. The count is one `ResendCountdown`, started in `onMount` and stopped by its cleanup.

## The unit cases, by title

### `login/email/page.server.test.ts` — 18

- **the one call of the sign-in helper**: hands over the address and the password exactly as posted · hands over the grant shapes of the Contestant App and names the entry point · hands over this request's own auth surface and session reader · hands over a claim that runs on a writer built for this request's fetch and locals · is made before anything else is asked of the request
- **a refusal**: is answered with a failure of the helper's status (400, 403, 500), holding that status and nothing else · calls the helper once
- **a sign-in**: redirects with 303 to the app's home in the request's locale (`en`, `fi`) · redirects to an empty redirectTo as to none · redirects to a relative app path behind the request's locale · falls back to the home for the refused redirectTo (five values)

### `login/email/page.svelte.test.ts` — 48

- **the frame** (6): carries the marker of the screen and is idle · has one heading that can take focus, under the app's name · says what to enter · says that answers are locked while they are, in place of that sentence · follows the answers lock when it changes · leads back to the login screen
- **the form** (8): is one form posted to the server, with validation left to the page · holds the email field, declared as the user name of a sign-in · holds the password field, declared as the current password · links to the forgot-password page from inside the form · passes the address bar's redirect target on in a hidden field · posts an empty redirect target when the address bar has none · has its submit button outside it, among the page's actions, tied to it by its id · is submitted by a press of that button
- **when a link is offered** (10): with the email mode alone · the identity provider alone · the identity provider for organizations alone · both modes · the code mode alone · no mode · the email mode while answers are locked · follows the settings when they change · is a plain button that cannot post the form, described by its line · is natively disabled until the page has mounted, and the submit button is not
- **asking for a link** (7): sends nothing for an empty address, an address of spaces alone, an address the control reports invalid, and says so at the field · clears the message when the address is edited · asks for a link with the address as typed, from the sign-in screen, and posts nothing · reads "Loading…" and takes no second press while its request runs, and leaves only then · opens the "email sent" screen whatever the request resolved to
- **signing in** (13): sends nothing with both fields empty, says what to enter at each and focuses the first · sends nothing with the address missing · sends nothing with the password missing · sends a password of spaces alone · reads "Loading…" and takes no second press while the sign-in runs · shows one sentence for a refusal with 400, 403, 500, 429 · keeps the address, enables the button again and applies nothing after a refusal · leaves focus on the button after a refusal, also when the browser dropped it · hides the last refusal while the next sign-in runs · clears the entry flow and then follows the action's redirect
- **a page rendered after a post** (4): shows the sentence for the action's refusal with 400, 403, 500 · shows no refusal when nothing was posted

### `email-sent/page.svelte.test.ts` — 30

- **with nothing held** (4): renders no part of the screen before the page has mounted · leads to the login screen in place of this history entry, and still renders nothing · does the same over a flow that holds a registration code and no request · leaves the screen when the held request goes while it is shown
- **the frame** (7): carries the wording of the held request and shows its first sentence (three wordings) · has one heading that can take focus · shows the envelope as a presentational figure · says that the request was asked again when the held request says so · follows a request that replaces the held one
- **the address and the way back to it** (7): shows the address the user typed, as text · links back to the sign-in screen, the registration page, the forgot-password page · shows the address with no link back for an origin it knows no screen of · shows neither for a request made with a code alone · shows neither for the code wording even when the request carries an address
- **asking again** (6): is unavailable while the count runs, and a press calls nothing · counts down on the clock, and is ready when the count has ended · is ready at once for a request that settled longer ago than the wait · repeats the held request once on a press when ready, and says so · shows the same screen whatever the repeated request resolved to · stops reading the clock when the page is destroyed
- **the actions** (6): holds one support button, a plain one, that leads to the support section of the Help page · holds one support button and no filled button (three states) · leads back to the login screen · are in order: ask again, support, another address, return

## The gate rows

| Row | `178-13-close` (head `63e976942`) | `178-13-close-r2` (head `81a8d278a`) |
|---|---|---|
| typecheck | 0 (27 s) | 0 (24 s) |
| lint | 0 (61 s) | 0 (56 s) |
| unit | 0 (44 s) | 0 (86 s) |
| check-frontend | 0 (10 s) | 0 (10 s) |
| build | 0 (18 s) | 0 (18 s) |
| format | 0 (29 s) | 0 (20 s) |
| `178-verdict gates` | PASS | PASS |

No Sleep entry in either window; AC power, 100 %. Wall time 3 min 9 s and 3 min 34 s, from each run's `power.txt`.

## The full run

| | |
|---|---|
| Label | `tests/e2e-runs/178-e2e/178-13-close` |
| Head | `63e976942` |
| Totals | 444 passed of 444; 0 failed, flaky, skipped or did not run |
| Against `178-11-close` | 116 projects compared, 0 not as expected; `178-verdict e2e … --same-projects-as 178-11-close`: PASS |
| Wall time | 12 min 34 s (23:45:51 to 23:58:25 local) |
| Docker VM free before / after | 16.19 GiB / 16.08 GiB |
| Power | AC, 100 %; no Sleep entry in the window; no void marker |

No test was red, so nothing was diagnosed. **The predecessor label for the next full run is `178-13-close`** (444 tests, 116 projects), or `178-11-close` as the execution rules' chain has it: the two are equal per project.

## Decisions Made

1. **The allowlist entry rather than a helper.** The lint rule fires on any `.supabase` member access outside the listed files. The login action and the Admin login action are both listed for exactly this read. A server helper that built the sign-in context would itself need listing and would change the action's body, which the plan fixes. The entry stands outside the list's two groups with a comment of its own, so the counts the neighbouring comments state stay true.
2. **No bound field values** (ruling 6 of the plan, taken to its end): with nothing bound there is nothing for hydration to overwrite.
3. **Focus is put back only from the body.** A user who moved focus elsewhere while the sign-in ran keeps it.
4. **E's redirect is an effect.** A screen that would otherwise stay blank when its request goes is worse than a second `goto`.
5. **Both route keys were written in Task 1's working tree**, because B's unit case builds E's route to assert where the link button leads. They were committed together with both directories, as the plan lays out.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `$app/forms` did not resolve under vitest**
- **Found during:** Task 1, the first green run
- **Issue:** `Failed to resolve import "$app/forms"`: the bare vitest config has no SvelteKit plugin, and no tested file had imported the module before. A `vi.mock` with a factory does not help: vite's import analysis fails first.
- **Fix:** a stub beside the other four (`src/lib/i18n/tests/__mocks__/app-forms.ts`) and its alias in `vitest.config.ts`, in the form of the `$app/navigation` stub.
- **Files modified:** `apps/frontend/src/lib/i18n/tests/__mocks__/app-forms.ts`, `apps/frontend/vitest.config.ts`
- **Commit:** `8c9a14f65`

**2. [Rule 3 - Blocking] The adapter-boundary lint refuses the action the plan lays out**
- **Found during:** Task 2, `eslint` on the files before the commit
- **Issue:** `no-restricted-syntax`: "A `.supabase` access reaches through the adapter boundary" on `auth: locals.supabase.auth`. The rule's `ignores` is `ADAPTER_BOUNDARY_ALLOWLIST`, which names the login action by path. Nothing in the plan, the pattern map or the research mentions the rule.
- **Fix:** one entry for `src/routes/contestant/login/email/+page.server.ts`, with a comment saying what the file reads and why. The server test was written so that it makes no `.supabase` member access of its own.
- **Not done:** no case was added to `eslint-adapter-boundary-guard.test.ts`; the lint row on the real file is what shows the entry matches. The header comment of the allowlist, which describes two groups, was not edited.
- **Files modified:** `apps/frontend/eslint.config.mjs`
- **Commit:** `8c9a14f65`
- **The other option:** a server module that builds the sign-in context from `locals`, listed once and used by B, D2 and both login actions. It is a structural change and is the orchestrator's to rule on.

**3. [Rule 1 - Bug] `func-style` and a typed stub**
- **Found during:** Task 2, `eslint` and `svelte-check`
- **Issue:** the submit callback was an arrow function bound to a `const`, which the repository's `func-style` refuses; two tests held `let settle = () => …`; and `page.url = new URL(…)` does not type-check against the application's narrowed pathname type.
- **Fix:** a function declaration typed by `Parameters<SubmitFunction>[0]`; an array of resolvers; a `setAddress` helper in the test.
- **Commit:** `8c9a14f65`

### Other departures, none of them a fix

- **A full E2E run** (`178-13-close`) beyond the plan, by the dispatch's note.
- **A third commit** (`81a8d278a`) for the registry comment the dispatch's section "After 178-08" leaves to the plan that renders `data-status`; `tests/tests/utils/testIds.ts` is outside the plan's list. The gate rows were made again on that head.
- **The refusal's focus rule and E's effect** go beyond the plan's wording, as *Decisions Made* 3 and 4 say.
- **The verify blocks' unit stage** runs the whole frontend suite because of its `--`; known, and the verdict is the same.
- **`.planning/WINDOWS.md` was not appended to.** No plan of this phase has written to it, and the dispatch limits an executor's planning writes to its summary.

## Issues Encountered

- `ErrorMessage inline` puts the emoji's message key before its sentence, and `Button` while loading holds the spinner's label before its own: a test reads a message through a helper that drops the emoji key, and a button's label from its `.uc-first` span.
- jsdom's `blur()` does nothing on a disabled button, so the focus case drops focus by focusing and blurring another control.
- `$state.raw` on an object is not reactive to a member write; the fake flow of E's test is a module-level `$state.raw` variable that is reassigned.

## The code-review checklist

| Item | Outcome |
|---|---|
| Solves what it sets out to | Yes: both screens at their own addresses, tested alone, linked from nowhere |
| OWASP top 10 | One `fail` for every refusal; `redirectTo` validated in the action alone and never navigated by in the page; `method="POST"`; the link button `type="button"` and natively disabled before hydration; nothing of a link request's answer read. The window T-178-79 (a signed-in user can open B) stands until plan 178-16, as the plan accepts |
| Code style guide | `eslint` and `prettier --check` 0 on every file |
| No `any` | None |
| No repeated code | Two repetitions, both known: the action's body repeats the login action's until plan 178-18 removes that one; the `matchMedia` stub is in two more test files, as in the files it was taken from |
| Everything documented | `@component` docblocks on both pages, a docblock on the action, TSDoc on the route keys, the fixture steps and the test helpers |
| Repo documentation | Not updated: plan 178-23 owns it. See *For later plans* |
| Tracking events | None added; the login page tracks none |
| Svelte component guidelines | Runes only; no new component, two pages |
| Errors handled and logged | The helper logs a refusal with its label; a field's message is logged by `ErrorMessage`; the link request cannot reject |
| Failing checks | None: six gate rows at 0, twice |
| Parts sharing dependencies | The whole frontend suite (219 files) and the full E2E run are green |
| WCAG A and AA | Visible labels, errors as `role="alert"` tied to their controls, a focusable `<h1>` on each screen, the link button described by its line, "Send again" a tab stop while unavailable. **No axe scan and no width check has run on either screen**; they are plans 178-21 and 178-22 |
| Keyboard and screen reader | Unit cases hold the tab order's document order, the focus moves and the descriptions; not tried in a browser |
| Developers' and Publishers' Guides | Not updated; plan 178-23 |
| Comment hygiene | `yarn assert:comment-hygiene` 0 before each commit; every new comment read for history and ids |
| Commit history | Three commits, each green; the third is a comment that belonged with the second |
| No fixes of itself | None |
| Formatting in its own commit | No formatting-only change |
| `[db]` | No database change |

## Prohibitions

| Id | Held? | How |
|---|---|---|
| PROH-178-37 | Yes | The link button's handler calls `sendEntryLink` and `goto` and nothing else; the cases "asks for a link with the address as typed…" and "opens the 'email sent' screen whatever the request resolved to". B's form shows one sentence for 400 |
| PROH-178-38 | Yes | E reads `request.wording`, `request.email`, `request.origin`, `request.askedAgain` and the count; the verify's search for a read of a request's outcome finds none; the case "shows the same screen whatever the repeated request resolved to" |
| PROH-178-39 | Yes | `git diff --quiet $(cat 178-BASE)` on the login page and its action: 0. `goToPage` still opens the login route |

## Observed, and inferred

**Observed:** every unit case's outcome; the three verify blocks' statuses; the gate rows; the full run's totals and its per-project comparison; that the login page and its action are unchanged since the base commit.

**Inferred, not observed:**

- That the server's markup carries `disabled` on the link button. The unit case reads a client mount before its effects have run; `mounted` starts `false` and only `onMount` sets it, and `onMount` does not run on the server.
- That a `type="submit"` button with a `form` attribute, outside the form, submits it in a browser, and that Enter in a field does. jsdom submits the form on a press of that button; Enter in a field was not tried anywhere.
- That a browser drops focus from the button while it is disabled, and that the page's code puts it back. The unit case drops focus by hand.
- That `goto` with `replaceState` from an effect during hydration of a document request for E ends on the login screen with one history entry.
- **The unresolved hydration assumption** (the UI contract's N-1): that a value a browser filled into B's fields before hydration survives it. Nothing was run. What was built against it: no field's value is bound to page state at all, so hydration has no state to write over the control with, and both the sign-in's emptiness check and the link button read the form's own data at the moment of the press.
- Nothing here measures or claims anything about the timing of a sign-in. Probe row P7 read `difference` at the auth service, and the action adds no step before the service's own call.

## Not done, or not verified

- **No browser has rendered either screen**, and no axe scan or phone-width check has run on them.
- **A post made before the script has loaded loses the typed address.** The UI contract's row "After any refusal" says the address stays in its field; the plan's ruling 4 fixes the failure's data to the status. To keep the address the action would return it in the failure's data and the page would pass it to `EmailField` as its initial value. Not built; the orchestrator's to rule on.
- **No case in the adapter-boundary guard's own test** for the new allowlist entry.
- **The two sentences B shows that say "log in"** (`enterEmailAndPassword`, `answersLockedInfo`) are as they were; plan 178-18 rewords them.
- **Swedish `common.login`** is untouched, and is B's main button's label.

## The state the local stack is left in

As a full E2E run leaves it: the stack up and not restarted, the suite's own project seeded and torn down by its own setups, and the rows no teardown removes (`private.invitation_link_witness`) present, so `39-invitations.test.sql` test 238 would be red until the next reset — the known finding. No reset, no probe and no pgTAP run was made. Nothing listens on port 5273 and no run is in flight. Docker VM free space: 16.08 GiB.

## For later plans

- **Predecessor label for the next full run: `178-13-close`** (444 tests, 116 projects, head `63e976942`), equal per project to `178-11-close`. Plan 178-12's page objects have now run behind a browser, green.
- **178-15 (D2's action) will meet the adapter-boundary lint.** `locals.supabase.auth` in `register/sign-in/+page.server.ts` fails `yarn lint:check` until the file is on `ADAPTER_BOUNDARY_ALLOWLIST` in `apps/frontend/eslint.config.mjs`, or the read moves into a listed module. Neither the `lint` nor the `typecheck` row says so before the file exists; run `yarn eslint <the file>` as soon as it does. **178-18:** when the login page loses its action, its entry on the list (`src/routes/contestant/login/+page.server.ts`) goes with it, and the comment on B's entry, which says "as the login action listed above does", is reworded.
- **Any page test that mounts a page with `use:enhance`:** `$app/forms` now resolves to a stub whose `enhance` attaches nothing. To drive a submit, replace the module as `login/email/page.svelte.test.ts` does: its fake `enhance` listens for `submit`, hands the page's callback `{ formData, formElement, submitter, cancel }` and keeps the returned handler, so `await posts[0].answer({ type: 'failure', status: 400, data: { status: 400 } })` answers the post. A page test that mounts `MainContent` needs the `matchMedia` stub and a layout context with `pageStyles.use`.
- **178-14 (the tracer):** `contestantLoginPage.openSignIn()` opens B and waits for its frame; `openSignIn({ redirectTo: 'contestant/…' })` adds the search parameter. The link button is natively disabled until hydration, and Playwright's press waits for it to be enabled. `installClock()` goes before the press that leads to E. B calls `clearEntryFlow()` itself on a sign-in; F still needs its own call. `contestantEmailSentPage.openDirectly()` waits for nothing: assert `contestantLoginPage.expectEntryShown()` after it — today the login page has no `login.page` marker, so until plan 178-18 that assertion needs another anchor.
- **178-14, 178-17 — B's markers:** `contestant-sign-in` carries `data-sign-in-state`; `login-errorMessage` carries `data-status`; a field's error is `login-email-error` or `login-password-error`. After a link press with no usable address the email control is `aria-invalid` and focused, which is what `expectEmailError()` reads.
- **178-15 (D1's key):** add `registerEmail: 'ContestantAppRegisterEmail'` to `ADDRESS_SCREENS` in `email-sent/+page.svelte`, and change the case "shows the address with no link back for an origin it knows no screen of" in its test, which pins today's absence.
- **178-15 (D2), 178-19 (forgot-password):** the page's form is `<form bind:this id method="POST" novalidate use:enhance={handle}>` with the handler a function declaration typed `Parameters<SubmitFunction>[0]` → `ReturnType<SubmitFunction>` (`func-style` refuses a `const` arrow). Read values from `formData`, not from bound state.
- **178-16 (the entry routes' list):** `ContestantAppSignIn` and `ContestantAppEmailSent` are the two keys to name; until then a signed-in user can open both (T-178-79).
- **178-18:** B's Return leads to `ContestantAppLogin`; B reads `redirectTo` from `page.url` once at init and passes it on unread. `goToPage()` of the login page object still opens the login route and waits for `login.email`.
- **178-21, 178-22 — to look at on the rendered screens:** B's link button and its line sit between the main button and Return with `mt-sm` on the line alone; E's hero figure is above the heading group; E with nothing held has no document title for the moment before it leaves; B after a no-script refusal has an empty address field.
- **178-23 — documentation now out of date:** the Developers' Guide wherever it lists the Contestant App's routes or route keys; the frontend's testing notes, if they list the `$app/*` stubs (five now); whatever describes the adapter-boundary allowlist (one more entry, outside its two groups).
- **Timing on this host today:** the two routes' unit files 1.5 s; `svelte-check` 10 s; the six gate rows 3 min 9 s and 3 min 34 s; the full E2E run 12 min 34 s.

## Threat register

| Threat | Disposition | As built |
|---|---|---|
| T-178-73 | mitigate | One `fail(` in the action (the verify counts it); one sentence for 400; the link button navigates whatever the request resolved to — unit cases. Not yet asserted in a browser |
| T-178-74 | mitigate | `safeRedirectTarget` in the action; five refused values fall back to the home; the page passes the value on in a hidden field and never navigates by it |
| T-178-75 | mitigate | The action is the login action's body over `passwordLogin`; a unit case holds that nothing is asked of the request before that call |
| T-178-76 | mitigate | `method="POST"` on the form, a real action behind it, the link button `type="button"` and natively disabled until mounted |
| T-178-77 | mitigate | E reads the origin, the typed address and this tab's clock; the verify's search and a unit case |
| T-178-78 | mitigate | With nothing held no frame is rendered and the visitor is led to the login screen |
| T-178-79 | accept | Unchanged: open until plan 178-16 |

## Threat Flags

None beyond the plan's register. The allowlist entry adds no surface: it permits the read the plan's action makes, in one named file.

## Known Stubs

None. `app-forms.ts` is a test stub by design and is read by tests alone.

## Next Phase Readiness

The tracer (plan 178-14) can open B by address, ask for a link there, land on E and assert where a visitor of E with nothing held ends. Open for the orchestrator: whether the allowlist entry stands or a shared server module replaces it before plan 178-15 adds a second such action, and whether a no-script refusal should keep the typed address.

## Self-Check: PASSED

- Files: the six route files, `app-forms.ts`, `route.ts`, `vitest.config.ts`, `eslint.config.mjs`, the two page objects and `testIds.ts` are all tracked and unchanged against HEAD.
- Commits: `8c9a14f65`, `63e976942` and `81a8d278a` are ancestors of HEAD; `git rev-list --count b7de759a9..HEAD` is 3.
