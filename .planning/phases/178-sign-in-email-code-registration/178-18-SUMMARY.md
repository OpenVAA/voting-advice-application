---
phase: 178-sign-in-email-code-registration
plan: 18
subsystem: auth
tags: [sveltekit, svelte5, login, registration, redirect-target, playwright, e2e, fixtures, axe, supabase-adapter, i18n, contestant-app]

requires:
  - phase: 178-sign-in-email-code-registration
    provides: "plan 178-04: the fourth value of contestant_app_public_config; plan 178-08: listedRegistrationModes and the message keys signInWithEmail, signedOut, linkFailed; plan 178-12: the login page object's steps for the login screen; plan 178-13: the sign-in screen and its action; plan 178-16: the mode selector, the registration guard, the entry routes, declareEntryScans; plan 178-17: the email spec, expectEndedOnEntry, signInScriptLoaded, the auth-count form"
provides:
  - "apps/frontend/src/routes/contestant/login/+page.svelte: the login screen as two links, a notice by reason, the locked sentence; login/+page.server.ts is deleted"
  - "ContestantLoginError = 'loginFailed' | 'authError', mapped to contestantApp.login.signedOut and contestantApp.login.linkFailed; getErrorTranslationKey takes any text and answers only for a reason the map holds as its own member"
  - "supabaseDataProvider: access.answersLocked copied from the public configuration, so an anonymous visitor of a closed project reads the answers lock"
  - "contestantLoginPage fixture: signInFromCold(email, password); goToPage() opens the sign-in screen; expectEntryNotShown, expectSignInAnswersLocked, openEntitySettingsWithNoSession, expectLedToEntitySettings; expectNotice asserts the catalogue's sentence; expectEndedOnEntry asserts the root marker"
  - "E2E: tests `entry: …` and `notice: …` of the email spec; the scan entry contestant-login-sign-in-only in both themes and the answers-lock case of a closed project in perm-closed-project.spec.ts"
  - "scripts/assert-a11y-scan-wiring.mjs: check 4a reads tests/tests/utils/entryAxeScan.ts, and the closed-project spec's route to the scan core is declareEntryScans"
affects: [178-19, 178-21, 178-22, 178-23, 178-24]

actuals:
  tokens: 39607
  tasks: 3
  commits: 3
plan_head_before: 027701ef21878d36b96bf59614b0097daba0d2d1
plan_head_after: 491f7bddea0968669ef92a5f72f5e45481a6b694

tech-stack:
  added: []
  patterns:
    - "A screen that offers ways in is links alone: each entry is a Button with an href, so the server's markup is the whole screen and nothing waits for a script"
    - "A value from the address bar that a page passes on is passed through the route builder and never read: the page that consumes it validates it"
    - "A reason from the address bar is looked up with Object.hasOwn in a closed map, so a name every object inherits has no message"
    - "A step that follows a logout waits for the logout's own navigation to land before it opens another address"
    - "One page object stands between the suite and its sessions: a setup signs in through signInFromCold, a spec through goToPage and login"

key-files:
  created:
    - apps/frontend/src/routes/contestant/login/page.svelte.test.ts
    - apps/frontend/src/lib/contestant/utils/loginError.test.ts
  modified:
    - apps/frontend/src/routes/contestant/login/+page.svelte
    - apps/frontend/src/lib/contestant/utils/loginError.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts
    - apps/frontend/src/lib/routes/loginRedirectTarget.ts
    - apps/frontend/eslint.config.mjs
    - apps/frontend/src/lib/_guards/eslint-adapter-boundary-guard.test.ts
    - apps/frontend/messages/en/contestantApp.login.json
    - apps/frontend/messages/fi/contestantApp.login.json
    - apps/frontend/messages/lb/contestantApp.login.json
    - "apps/docs/src/routes/(content)/developers-guide/contestant-app/login-and-password-reset/+page.md"
    - scripts/assert-a11y-scan-wiring.mjs
    - tests/tests/fixtures/contestant/contestantLoginPage.fixture.ts
    - tests/tests/fixtures/contestant/contestantLogoutButton.fixture.ts
    - tests/tests/fixtures/contestant/contestantNothingToEditPage.fixture.ts
    - tests/tests/fixtures/contestant/contestant-entity-selection.ts
    - tests/tests/setup/shared/registerAndStoreSession.ts
    - tests/tests/setup/perm/perm-answers-locked.setup.ts
    - tests/tests/setup/perm/perm-disable-allow-open.setup.ts
    - tests/tests/setup/perm/perm-hide-hero.setup.ts
    - tests/tests/setup/perm/perm-question-video.setup.ts
    - tests/tests/specs/contestant/contestant-email-registration.spec.ts
    - tests/tests/specs/contestant/contestant-journey.spec.ts
    - tests/tests/specs/contestant/contestant-entity-selection.spec.ts
    - tests/tests/specs/contestant/invitation-landing.spec.ts
    - tests/tests/specs/perm/perm-closed-project.spec.ts
    - tests/tests/specs/perm/perm-answers-locked.spec.ts
    - tests/tests/specs/perm/perm-access-disable.spec.ts
    - tests/tests/utils/testIds.ts
  deleted:
    - apps/frontend/src/routes/contestant/login/+page.server.ts

key-decisions:
  - "The footer of the login screen is the last thing in its actions, after the two secondary links, so that it stays the last thing on the screen; the UI contract's sketch lists it before the actions snippet"
  - "The two sentences are reworded only where a locale's word differs from the word its sign-in title uses: English, Finnish and Luxembourgish. The Danish, Estonian, French and Swedish sentences already use their locale's one word and are not changed"
  - "The deep link the entry test opens is the entity's settings page: the reserved candidate has no nomination, and its profile, questions and preview are not rendered for it"
  - "The two new tests of the email spec stand in a describe of their own that is not serial, and the spec's three hooks are at file level, so that each of the two could be red on its own in the control"
  - "The a11y wiring gate is taught the closed-project spec's new route to the scan core, declareEntryScans from entryAxeScan.ts, which itself joins check 4a's list; the gate is not relaxed"

patterns-established:
  - "signInFromCold for every setup that stores a session; goToPage and login for a spec"
  - "expectEndedOnEntry after a logout, before the next address is opened"

requirements-completed: [REG-01, REG-02]

coverage:
  - deliverable: "The login screen is two links, with Register exactly when a registration mode is listed, a notice by reason and the locked sentence"
    human_judgment: false
    verification:
      - kind: unit
        ref: "apps/frontend/src/routes/contestant/login/page.svelte.test.ts (41 cases)"
        status: pass
      - kind: e2e
        ref: "tests/tests/specs/contestant/contestant-email-registration.spec.ts#entry: the login screen offers both entries, and \"Sign in with email\" carries a deep link's target"
        status: pass
      - kind: e2e
        ref: "tests/tests/specs/perm/perm-closed-project.spec.ts (six matrix cases, the answers-lock case, the scan entry contestant-login-sign-in-only in both themes)"
        status: pass
  - deliverable: "The two reasons a visitor is sent to the login screen with each have a sentence, and no other text in the address bar shows anything"
    human_judgment: false
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/contestant/utils/loginError.test.ts (16 cases)"
        status: pass
      - kind: e2e
        ref: "tests/tests/specs/contestant/contestant-email-registration.spec.ts#notice: a mailed link opened a second time lands on the login screen with its sentence"
        status: pass
  - deliverable: "The answers lock reaches an anonymous visitor of a closed project"
    human_judgment: false
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts (four cases on access.answersLocked)"
        status: pass
      - kind: e2e
        ref: "tests/tests/specs/perm/perm-closed-project.spec.ts#while answers are locked"
        status: pass
  - deliverable: "Every stored session of the suite is made on the sign-in screen, through one page object, and the suite was green on that tree before the login page lost its form"
    human_judgment: false
    verification:
      - kind: e2e
        ref: "tests/e2e-runs/178-e2e/178-18-repoint-r2 (464 of 464, the uncommitted helpers)"
        status: pass
      - kind: e2e
        ref: "tests/e2e-runs/178-e2e/178-18-close (the committed tree)"
        status: pass
  - deliverable: "How the login screen looks: the weight of its two entries, the footer under them, the notice and the locked sentence under the title"
    human_judgment: true
    rationale: "No test asserts a layout. The screen is scanned by axe in one state and two themes; plans 178-21 and 178-22 scan the state with both entries and check phone widths."

duration: 65min
completed: 2026-10-13
status: complete
---

# Phase 178 Plan 18: The Login Screen Is Two Links, and Every Sign-in of the Suite Moved to the Sign-in Screen First — Summary

**The Contestant App's login page holds no form: "Sign in with email" and, exactly when a registration mode is listed, "Register", both links, with a sentence for each of the two reasons a visitor is sent there and the locked sentence while answers are locked — built only after every stored session of the E2E suite had been moved onto one page object that opens the sign-in screen and a full run of that tree was green.**

## Read this first

- **Three commits, and the order of the coupling held.** `6de63a273` moved every sign-in of the suite to the sign-in screen and changed no file of the frontend; it was made after a full run of that uncommitted tree was green (464 of 464). `e4ad7eef2` and `491f7bdde` are the login screen's held set, the catalogue files first and everything else second, back to back after one green full run of that uncommitted tree (469 of 469). No commit of this plan turned a committed E2E test red.
- **The closed-project project moved by +3, not by the plan's −2.** The four old login scans were assertions inside tests, not tests, so replacing them removed none; the scan entry added two tests and the answers-lock case one. The plan's verdict lines that state `perm-closed-project=-2` fail as written; each was run with `=3`, and both statuses are recorded below.
- **Two uncommitted-tree runs were red, each for a step of this plan's own test code, and each was settled before anything was committed.** Neither was a defect of the application, and no red run was of a committed tree. Both are kept.
- **No defect of the application was met.** One latent fault of the old login page went with it: its reason map was asked with `in`, so `?errorMessage=constructor` handed a function to the translator. The new map is asked with `Object.hasOwn`, and unit cases pin it.
- **The auth budget moved by one:** 33 password sign-ins from the host's address in a full run, at most **23 in any five minutes**, against thirty; 15 link verifications, against thirty. No 429.

## Performance

- **Duration:** 65 min from the first reading to the closing run's verdict (2026-10-13T01:33:00Z to 2026-10-13T02:37:39Z).
- **Tasks:** 3
- **Files modified:** 32 (2 created, 1 deleted)

## Task Commits

| # | Commit | What |
|---|---|---|
| 1 | `6de63a273` | `test(178-18): every sign-in of the suite goes through one page object, on the sign-in screen` — eleven files under `tests/tests/`, none of the frontend |
| 2a | `e4ad7eef2` | `feat(178-18): the two sentences above the sign-in form say "sign in"` — three catalogue files |
| 2b | `491f7bdde` | `feat(178-18): the login screen offers "Sign in with email" and "Register" as two links` — twenty-one files, the deleted action among them |
| 3 | — | The gate rows and the full run of the committed tree; evidence only |

## Each task's verify command, with its real exit status

Each block was taken from the plan by a script, byte for byte, into `tests/e2e-runs/178-unit/178-18-t<N>-verify.sh` and run with `bash`.

| Task | As written | Why | The intent | Status |
|---|---|---|---|---|
| 1 | **0** | the label `178-18-repoint` names its newest attempt, `-r2` | — | — |
| 2 | **1** | its last stage, the verdict: `perm-closed-project` has 18 tests where the stage expects 13, and two held paths were outside its `--dirty-only` list (`scripts/assert-a11y-scan-wiring.mjs`, one page under `apps/docs/`). Every stage before it passed | `178-18-t2-verify-intent.sh`: the same chain with that stage given `--except perm-closed-project=3` and the two more `--dirty-only` paths | **0** |
| 3 | **0** | it compares the closing run with `178-18-precommit`, whose newest attempt is `-r2`, and reads the scan entry's two titles | — | — |

Task 3's step 2 states the closing verdict against `178-17-close` with `--except perm-closed-project=-2`: exit **1** as written, on that project alone, and **0** with `=3`.

## Task 1 — every file that held a copy of the sign-in steps, and what it calls now

`git grep -n -e "login\.email" -e "login\.submit" -e "waitForLoginForm" -- tests/tests` and a second search for the page object's callers named these.

| File | Held | Calls now |
|---|---|---|
| `setup/shared/registerAndStoreSession.ts` | its own `waitForLoginForm` (the app root opened up to three times, `login-email` awaited on the page the redirect landed on) and four lines that fill and submit | `createContestantLoginPage(page).signInFromCold(email, password)`. The wait for the address to have left the login routes and the wait for `settledTestId` are as they were |
| `setup/perm/perm-answers-locked.setup.ts`, `perm-disable-allow-open.setup.ts`, `perm-hide-hero.setup.ts`, `perm-question-video.setup.ts` | each its own copy of the helper and of the four lines | the same one call |
| `fixtures/contestant/contestantLoginPage.fixture.ts` | `goToPage()` opening `ContestantAppLogin` | `goToPage()` opens `ContestantAppSignIn` and waits for the screen's frame and its email control; `signInFromCold` is new; `getSubmitButton()` is removed with its one reader |
| `specs/contestant/contestant-journey.spec.ts`, step 9 | `login()` on the login page the logout landed on, after a soft assertion that the submit button was disabled | `expectEndedOnEntry()`, `goToPage()`, `signInScriptLoaded()`, then a press with nothing typed and `expectEmailError()`, then the two sign-ins as before |
| `specs/perm/perm-closed-project.spec.ts`, "a candidate can log in…" | three raw locators on the login page | `goToPage()` and `login()` |
| `specs/contestant/contestant-entity-selection.spec.ts` | `contestantEntityPages.openLoginForm()`, which opened the login page and awaited `login-email` | `contestantLoginPage.goToPage()`; `openLoginForm` is removed from `contestant-entity-selection.ts` |
| `specs/contestant/invitation-landing.spec.ts`, the stranger | `goToPage()` and `login()`, unchanged calls | the same calls, now on the sign-in screen: the refusal it asserts is `contestantApp.login.noProfile`, the sign-in screen's sentence for status 403 |
| `specs/perm/perm-no-nomination.spec.ts` | `goToPage()` and `login()` | unchanged, now on the sign-in screen |

**`signInFromCold`** opens the sign-in screen up to three times with `waitUntil: 'domcontentloaded'`, each time waiting ten seconds for the email control, and throws an error naming the three openings; then `login()`. Its comment says that a backend still starting can hold the app on its loading screen, and that the screen is opened again only after a wait has already timed out.

**Two expectations changed in Task 1, although the plan says none does.** Both follow from `goToPage()` opening another screen, which the plan asks for:

1. The journey's soft assertion that the submit button is disabled with nothing typed has no counterpart: the sign-in screen's main button can always be pressed. In its place the step presses it with nothing typed and asserts the email field's error, its `aria-invalid` and its focus — a hard assertion.
2. The stranger of the invitation-landing spec is refused with the sign-in screen's own sentence for an account with no profile, where the login page showed the general "not authorized" sentence. The status, the address and the grants asserted are the same.

## Task 2 — the login screen as built

- **The context.** `appCustomization`, `darkMode`, `getRoute` and `t` are destructured; `appSettings` and `answersLocked` are read as `contestantCtx.X` inside a `$derived` or the markup. "Register is offered" is `listedRegistrationModes(contestantCtx.appSettings).length > 0` and nothing else.
- **The frame.** `MainContent` with the app's name as its title, `data-testid="contestant-login"`, `data-register-offered` and `data-answers-locked`, each `"true"` or `"false"`; the heading is `<h1 tabindex="-1">` holding the app's name. The shaded frame and the poster through the top bar's settings are as before.
- **The notice.** `ErrorMessage inline role="alert" class="my-md"` with `data-testid="login-notice"` and `data-reason`, rendered only when `getErrorTranslationKey` knows the address bar's `errorMessage`. No text of the address bar is rendered.
- **The locked sentence.** `p.max-w-md.text-center` with `data-testid="login-answers-locked-info"`, only while answers are locked.
- **The entries**, in the page's actions: a main `Button` with an `href` to the sign-in screen and the text `contestantApp.login.signInWithEmail` (`login-sign-in-link`); then, only when Register is offered, the "Or" divider and a main `Button` with an `href` to the registration page and the text `contestantApp.register.register` (`login-register-link`). Each renders as an `<a>`.
- **`redirectTo`** is read from `page.url` inside a `$derived` and handed to `getRoute.current({ route: 'ContestantAppSignIn', redirectTo })` when the address bar holds one; with none the entry's address is the bare route, with no `?`. The page neither navigates by it, renders it nor validates it. Register's address is built with no parameter, and `redirectTo` and `errorMessage` are not among the search parameters the route builder carries over.
- **Under the entries**, in a `div` with `mt-lg flex w-full flex-col items-center`: the help link and, where the voter app is accessible, the voter-app link, each with its id. The footer follows them.
- **Gone:** the form, the email input, `PasswordField`, the collapsed-form button and its machinery, the "password is now set" heading with its read of `newUserEmail`, the separate pre-registration button, the forgot-password link and the registration-code link's own text. `login/+page.server.ts` is deleted.

**The reasons.** `ContestantLoginError = 'loginFailed' | 'authError'`; `loginFailed` → `contestantApp.login.signedOut`, `authError` → `contestantApp.login.linkFailed`. `getErrorTranslationKey` takes `string | null | undefined` and answers only for a value the map holds as its own member. `error.loginFailed` is no longer shown by the Contestant App; the key stays for the Admin App.

**The provider.** `storedPublicConfig` copies `access.answersLocked` beside `access.contestantApp` when the answer holds it, and leaves a null one out. Its doc comment and the method's say four values, and the *Limitation* paragraph no longer names the answers lock. Nothing else of `_getAppSettings` changed: the closed-project answer already spread the declared `access` over the shipped one.

**The messages.**

| Locale | `enterEmailAndPassword` | `answersLockedInfo` |
|---|---|---|
| `en` | "…to log in." → "…to sign in." | "…you can still log in…" → "…you can still sign in…" |
| `fi` | "…kirjautuaksesi sisään." → "…kirjautuaksesi." | "…voit silti kirjautua sisään…" → "…voit silti kirjautua…" — the word the title "Kirjaudu" and the phase's other Finnish sentences use |
| `lb` | unchanged: it already says "unzemellen" | "…Iech nach aloggen…" → "…Iech nach umellen…" — the word the title "Umellen" uses |
| `da`, `et`, `fr`, `sv` | unchanged | unchanged: each already uses the one word its sign-in title and its other sentences of this phase use ("logge ind", "sisse logida", "se connecter", "logga in") |

So the catalogue commit holds three files, not seven. The Finnish and the Luxembourgish sentences are constructed by this plan and belong on the native-speaker review's list.

**Also in the held set, outside the plan's file list** — each needed by the deletion or by the plan's own design:

- `apps/frontend/eslint.config.mjs`: the deleted action's entry on `ADAPTER_BOUNDARY_ALLOWLIST` is struck; the group's comment says seven sites; the Admin App's entry describes itself where it said "identical to the candidate login path"; the sign-in screen's entry says "as the Admin App's login action listed above does". The guard's own test had a count in one comment, which is gone.
- `apps/frontend/src/lib/routes/loginRedirectTarget.ts`: its header named the login page as the page that posts `redirectTo`; it names the sign-in screen, and says that the login screen passes the value on unread.
- `apps/docs/…/contestant-app/login-and-password-reset/+page.md`: one sentence, whose link named the deleted file. It now says that the login page holds no form and links to the sign-in page, and links that page's action. `validate:links --check` exits 0. The rest of the page is 178-23's.
- `scripts/assert-a11y-scan-wiring.mjs`: see *Deviations*.

## Every reader of the old login page the search named, and what it asserts now

`git grep -n -e "login\.showLogin" -e "login\.preregister" -e "login\.registerLink" -e "login\.email" -e "login\.errorMessage" -e "login-errorMessage" -e "contestant\/login" -- tests/tests`, and a second search by accessible name and text.

| Reader | Asserted | Asserts now |
|---|---|---|
| `contestant-journey.spec.ts`, step 7 | `login.registerLink` visible, `login.preregister` hidden, the heading | `expectEndedOnEntry()` after the logout; after the bounce from a protected address `expectEntryShown()`, `expectRegisterOffered(true)`, `expectAnswersLocked(false)`, `expectNoNotice()`, the heading |
| `contestantLogoutButton.fixture.ts`, `clickWithoutDialog` | the address under the login route | the address, and the login screen's marker |
| `contestantNothingToEditPage.fixture.ts`, `logoutWithoutDialog` | the address | the address, and the login screen's marker |
| `contestantLoginPage.fixture.ts`, `expectEndedOnEntry` | the bare address, `login-help-link`, no notice, no refusal | the bare address, the root marker and the sign-in entry, no notice, no refusal |
| `perm-access-disable.spec.ts`, three assertions | `login.email` visible or hidden | `expectEntryShown()` or `expectEntryNotShown()` |
| `perm-answers-locked.spec.ts`, the login test | the locked sentence at `/en/contestant` | the login screen: `expectAnswersLocked(true)`, `expectRegisterOffered(false)`; then the sign-in screen its entry leads to: `expectSignInAnswersLocked()` |
| `perm-answers-locked.spec.ts`, the registration test | the address and the locked sentence, three times | the address, `expectEntryShown()` and `expectAnswersLocked(true)`, three times |
| `perm-closed-project.spec.ts`, "anon can reach…" | `login.email` on the login page | the login screen and no notice; then the sign-in screen through its entry, with its fields |
| `perm-closed-project.spec.ts`, an empty matrix | the form, no collapsed button, no registration link, no pre-registration button, an inline scan | `expectRegisterOffered(false)`, `expectAnswersLocked(false)`, the heading, the four refusals |
| `perm-closed-project.spec.ts`, the code mode | the registration link, no pre-registration button, the form, an inline scan | `expectRegisterOffered(true)`; Register followed to the registration page, which shows the code field directly; the rest as before |
| `perm-closed-project.spec.ts`, the provider's mode | the pre-registration button beside a collapsed form, the form expanded, two inline scans | `expectRegisterOffered(true)`; the pre-registration start at its own address; Register followed to the registration page, whose main button opens the pre-registration start; the rest as before |
| `perm-closed-project.spec.ts`, the provider's mode for organizations alone; a row for a type not served | the form, no registration link | `expectRegisterOffered(false)`, and the refusals as before |
| `perm-closed-project.spec.ts`, the heading | unchanged | unchanged |
| `contestant-entity-selection.ts` | `openLoginForm` | removed in Task 1; the fixture reads nothing of the login page |

**New in `perm-closed-project.spec.ts`:** `while answers are locked › the login screen says so to an anonymous visitor, offers sign-in only and refuses every registration address` — the matrix allows candidates two modes and the lock alone closes them; a describe of its own takes the lock off again when it ends. And the scan entry `contestant-login-sign-in-only` through `declareEntryScans`, in both themes: marker `login.signInLink`, with `login.page` carrying `data-register-offered="false"`. The spec's body holds no raw locator of the login screen; `loginScan` and the import of `assertAxeScan` are gone.

**Titles that changed** (the file's last describe, and two of its tests): "the login page, …" → "the login screen, …"; "the code mode shows the registration link, …" → "the code mode offers Register on the login screen, …"; "the identity provider mode shows pre-registration beside a collapsed sign-in form, …" → "the identity provider mode offers Register on the login screen, …".

## Every id removed from the registry

Derived: an id of the `login` block leaves when it has no reader under `tests/` **and** no element under `apps/frontend/src`.

| Id | Why |
|---|---|
| `showLogin` (`login-show`) | the collapsed-form button is gone |
| `preregister` (`login-preregister`) | the separate pre-registration button is gone |

**No third id leaves.** `helpLink`, `voterAppLink`, `forgotPasswordLink` and `return` have no reader under `tests/` today, and each has an element on the login screen or the sign-in screen, so each stays. The comments on `answersLockedInfo` and `registerLink` say what they are now.

## The E2E tests added

Both in `contestant-email-registration.spec.ts`, in a describe of their own, `the login screen`, written in fixture steps.

- **`entry: the login screen offers both entries, and "Sign in with email" carries a deep link's target`** — a user made with a password as the reserved candidate's editor, the terms accepted. The address of the candidate's settings page, opened with no session, ends on the login screen with both entries and no notice; the first entry leads to the sign-in screen; the sign-in ends on the settings page. That the page first asked for is the one reached is the browser's half of the claim that the target is validated in the sign-in screen's action and passed on verbatim.
- **`notice: a mailed link opened a second time lands on the login screen with its sentence`** — an invited address's link opened as received, which shows the set-password view; the same link opened by a second visitor in a browser context of its own ends on the login screen with the notice whose reason is `authError`, holding the catalogue's sentence, and both entries.

The spec's three hooks moved from its serial describe to file level, so that they bind both describes.

## The unit cases

- `login/page.svelte.test.ts` — **41**, new: the frame (5), the entries (10), while answers are locked (3), the notice (13), a deep link's target (8), the links under the entries (2). Mounted for real against a fake context whose `getRoute` is the real `buildRoute` over the stubbed page's address.
- `loginError.test.ts` — **16**, new: the two reasons; three absent values; six texts that are not reasons; five names every object inherits.
- `supabaseDataProvider.test.ts` — 118 (115 before): the lock placed beside the gate; the lock honoured where the gate is not declared, and a stored `false`; a null lock left out; "copies nothing but the four values".

**Red before green** (`178-18-t2-unit-red.log`, head `6de63a273`): 36 failed, 139 passed — 26 of the page's 41, 7 of the reasons' 16, 3 of the provider's. Every failure an `AssertionError`; the old page mounted. Five of the seven reasons' failures were the inherited names, which the old map answered with a function or an object.

## The runs

| Label | What | Verdict |
|---|---|---|
| `178-18-repoint` | full, the uncommitted helpers | **red**: 1 failed, 318 did not run, 145 passed. The journey's step 9, as this plan first wrote it, opened the sign-in screen while the logout's own navigation was still in flight; the logout's navigation won and the step waited on the login page. Settled in the held set: the step waits for the logout to land, and `goToPage()` waits for the sign-in screen's own frame. Kept |
| `178-18-repoint-r2` | full, the uncommitted helpers | **PASS** — 464 of 464 in 118 projects, each project equal to `178-17-close`; exit 0 as the plan wrote the verdict |
| `178-18-control` | the email project, the two new tests against the unchanged login page | **PASS as a red control** — exactly `entry:` and `notice:` red, each on `expect(locator).toBeVisible()` for the login screen's marker; 11 others passed |
| `178-18-precommit` | full, the uncommitted login screen | **red**: 1 failed, 321 did not run, 147 passed. The `entry:` test's last step compared the address with the route builder's path, which leaves the base locale's prefix out, while the sign-in's redirect names the locale: the page reached was the one asked for. A defect of the step, settled in the held set. Kept |
| `178-18-dev-email` | the email project, the held tree with the step corrected | 13 of 13 |
| `178-18-precommit-r2` | full, the uncommitted login screen | **PASS** with `--except contestant-email-registration=2 --except perm-closed-project=3` and the two more `--dirty-only` paths; **FAIL (3)** as the plan wrote the verdict. 469 of 469 in 118 projects; both tests of the control passed |
| `178-18-close` | full, the committed tree, head `491f7bdde` | **PASS** — 469 of 469 in 118 projects, each project equal to `178-18-precommit-r2`; `contestant-login-sign-in-only` is two tests, passed; preflight confirmed; not void, no Sleep entry in the window |

**Every `--except` the pre-commit run needed:**

| Project | Delta | Reason |
|---|---|---|
| `contestant-email-registration` | +2 | the `entry:` and `notice:` tests, as the plan states |
| `perm-closed-project` | **+3**, where the plan states −2 | the scan entry's two tests and the answers-lock test. The four old login scans were `assertAxeScan` calls inside three tests, so replacing them removed no test |

No other project's total moved. `perm-answers-locked` stays at 5 and `perm-access-disable` at 3.

**Docker VM free space before each run, in GiB:** 15.96, 15.92, 15.78, 15.76, 15.71, 15.69, and 15.49 before the closing run. The floor is 13.8.

**Power:** AC, 100 %, before every run.

## What the suite asks of the auth service now

Counted from the auth service's own log in each run's window with `tests/e2e-runs/178-unit/178-18-auth-peaks.sh`, which prints counts and no line of the log. The script gives `178-17-close` the numbers its summary states (32, at most 22, 13).

| Run | Password sign-ins from the host's address | Most in any five minutes | Link verifications |
|---|---|---|---|
| `178-17-close` | 32 | 22 | 13 |
| `178-18-repoint-r2` | 32 | 22 | 13 |
| `178-18-precommit-r2` | 33 | **23** | 15 (14 answered 200, one 403) |
| `178-18-close` | 33 | **23** | 15 (14 answered 200, one 403) |

The one more sign-in is the `entry:` test's; the two more verifications are the `notice:` test's link, opened once and once more. The service admits thirty of each in five minutes. No 429 in any run.

## The gate rows — `tests/e2e-runs/178-gates/178-18-close`, head `491f7bdde`

| Row | Exit | Seconds |
|---|---|---|
| typecheck | 0 | 27 |
| lint | 0 | 51 |
| unit | 0 | 83 |
| check-frontend | 0 | 10 |
| build | 0 | 18 |
| format | 0 | 21 |

`178-verdict gates 178-18-close --rows typecheck,lint,unit,check-frontend,build,format`: PASS; not stale; no Sleep entry in the window.

## Items built at their options

J5 (a), U-08 (a), U-09 (a), U-10 (a), U-11 (a), U-12 (a), U-26 (a), U-29 (a) and PL-03 were each read by the operator on 2026-10-11 and stand at their recommended option, and each is built so here: the login screen with its one entry where nothing lists a mode; two filled buttons, sign-in first; a sentence for each of the two reasons; the deep link's target passed on by "Sign in with email"; the locked sentence on the login screen and on the sign-in screen; one scan entry in the closed-project spec in place of four; one list of modes behind Register; a visitor from a protected address landing on the login screen.

## Decisions Made

- **The footer is last.** The UI contract's sketch of the screen lists `<Footer />` among the content and the entries in the actions snippet, which would render the footer above the two buttons; the same section says the footer stays as it is, which is last on the screen. It is rendered at the end of the actions, after the secondary links.
- **The notice and the target follow the address bar.** Both are `$derived` reads of `page.url` in the page, so a visit to the bare address from the same screen drops the notice. No load reads the URL.
- **The voter-app link keeps its click handler**, and so needs the page's script; the two entries are the links the truth is about.
- **The settings page is the deep link of the `entry:` test**, because the reserved candidate has no nomination.
- **A second describe for the two new tests**, not serial, so that the control could show each red on its own.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The a11y wiring gate refused the closed-project spec once it scanned through `declareEntryScans` alone**
- **Found during:** Task 2, step 8 (`yarn assert:a11y-scan-wiring` exit 1)
- **Issue:** check 4a required that spec to import `assertAxeScan` from `utils/axeScan`. The plan replaces its inline scans with the entry declarer, after which the spec reaches the scan core only through `utils/entryAxeScan.ts`, a file the gate did not read.
- **Fix:** the gate reads `entryAxeScan.ts` under the same prohibition and the same required import as `contestantAxeScan.ts`, and the closed-project spec's required route is `declareEntryScans` from that module. Nothing is relaxed: the chain to `assertAxeScan` is asserted at both links. Plan 178-16's note left the helper's entry to 178-21; it was needed here.
- **Files modified:** `scripts/assert-a11y-scan-wiring.mjs`
- **Commit:** `491f7bdde`

**2. [Rule 3 - Blocking] A docs page linked the deleted action**
- **Found during:** Task 2, before the deletion
- **Fix:** the one sentence of `login-and-password-reset/+page.md` names the sign-in page and its action. `validate:links --check` exit 0.
- **Commit:** `491f7bdde`

**3. [Rule 1 - Bug] The reason map answered names every object inherits**
- **Found during:** Task 2, step 1 (the unit cases, red)
- **Issue:** `error in CONTESTANT_LOGIN_ERROR` is true for `constructor`, `toString` and the like, and the page handed what the map returned to the translator.
- **Fix:** `Object.hasOwn`, and five unit cases.
- **Commit:** `491f7bdde`

**4. [Rule 1 - Bug, in this plan's own test code] Two steps written here were wrong, and each turned an uncommitted-tree run red**
- The journey's step 9 opened the sign-in screen before the logout's navigation had landed (`178-18-repoint`); `expectLedToEntitySettings` compared a path with the locale's prefix against one without (`178-18-precommit`). Each was corrected in the held set and the full run made again under `-r2`. Nothing was retried on an unchanged tree.

### Other departures, none of them a fix

- **Two expectations changed in Task 1**, where the plan says none does — the journey's disabled-button assertion and the stranger's sentence. See *Task 1*.
- **`perm-closed-project` moved by +3**, where the plan states −2, and the plan's verdict lines fail as written on it. See *The runs*.
- **Three catalogue files changed, not seven.** See *The messages*.
- **`getSubmitButton()` and `openLoginForm()` are removed**, each with its one reader.
- **Files outside the plan's list:** `eslint.config.mjs` and the guard test's one comment (the dispatch asks for the entry to be struck), `loginRedirectTarget.ts` (a comment made false), the docs page, the wiring gate, `contestantNothingToEditPage.fixture.ts`, `contestant-entity-selection.spec.ts`, `invitation-landing.spec.ts`.
- **REG-13 is in the plan's frontmatter and not in `requirements-completed`**, as the plan's output section asks: this plan adds no shared component.

## Issues Encountered

None beyond the two red uncommitted-tree runs above.

## The code-review checklist

| Item | Outcome |
|---|---|
| Solves what it sets out to | Yes: REG-01's screen, with the coupling's order kept |
| OWASP top 10 | The open-redirect surface gained no validator and no consumer: the login screen passes `redirectTo` on through the route builder, percent-encoded, and unit cases hold that `//host`, `https://…`, `../admin` and a value with `&` and `#` stay one search value on the sign-in screen's own path. No text of the address bar is rendered: the notice is a catalogue sentence chosen from a closed map, and a markup-shaped value shows nothing |
| Code style guide | Followed; exported symbols have TSDoc |
| No `any` | None added |
| No repeated code | Five copies of the cold-start wait and the four lines became one step; two unused steps removed |
| New entities documented | The page's component docstring is rewritten; `ContestantLoginError`, `getErrorTranslationKey`, `storedPublicConfig` and every new fixture step are documented |
| Repo documentation updated | One sentence of one docs page, for its link. The rest is listed for 178-23 |
| Tracking events | No function is added for a user |
| Svelte component guidelines | No component is added; the page follows the context rules |
| Errors handled and logged | The notice is an `ErrorMessage`, which logs what it shows |
| Failing checks | None on the committed tree |
| Parts that share dependencies | The Admin App's login keeps `error.loginFailed` and its own reason map; `listedRegistrationModes` is unchanged |
| WCAG A and AA | The screen with sign-in alone is scanned by axe in both themes, no finding. The state with both entries, with a notice and with the locked sentence is not scanned yet (178-21) |
| Keyboard and screen reader | Each entry is an `<a role="button">` named by its text; the notice is a `role="alert"` after the heading; the heading takes the focus of a navigation. Not walked with a screen reader |
| Comment hygiene | `yarn assert:comment-hygiene` 0 before each commit; every touched comment read. The allowlist's group comment lost its account of earlier phases |
| Commits | Three, each of one purpose; no `[db]` |

The Supabase adapter items: the provider change is one copied member inside `storedPublicConfig`; no row mapping and no auth call changed.

## Prohibitions

| Id | Holds | By |
|---|---|---|
| PROH-178-53 | Yes | `6de63a273` changes no file of the frontend and follows `178-18-repoint-r2`; the login page changed two commits later |
| PROH-178-54 | Yes | the entries come from `listedRegistrationModes` and the notice from a map of two reasons; unit cases on other text |
| PROH-178-55 | Yes | unit cases: the target on the first entry alone, never rendered, `goto` never called |

## Threat register

| Id | Disposition | How it is held |
|---|---|---|
| T-178-112 | mitigated | the unit cases above; the `entry:` test ends on the page first asked for |
| T-178-113 | mitigated | the closed map, asked with `Object.hasOwn`; 13 unit cases on the notice |
| T-178-114 | mitigated | the two sentences name no cause; a failed password is the sign-in screen's |
| T-178-115 | mitigated | "copies nothing but the four values" |
| T-178-116 | mitigated | Task 1's order and its full run |
| T-178-117 | mitigated | the two ids are gone from the registry, and the tests' type check is 0 |

## Observed, and inferred

- **Observed in a browser:** both entries as links, Register by the matrix and by the lock, the deep link's target reaching the sign-in screen's action and the page first asked for, the `authError` notice with its sentence, the locked sentence for an anonymous visitor of a closed project and on the sign-in screen, the screen after a logout, and no axe finding with sign-in alone in either theme.
- **Observed in unit cases only:** the `loginFailed` notice (no E2E case forces a failed read of the user's data); that the screen is whole before its script runs (the server's markup was not read in a browser with scripts off); the hostile values of `redirectTo` and `errorMessage`.
- **Inferred:** that the Finnish and Luxembourgish rewordings read naturally.

## Not done, or not verified

- The login screen was not looked at by a person, and not at a phone's width.
- The state with both entries, the notice and the locked sentence are not scanned by axe.
- No E2E case shows the `loginFailed` notice.
- `178-bankauth.sh` was not run (PL-26: at the closing gate).

## Threat Flags

None: the plan's threat model covers the address bar's two parameters and the fourth public value.

## Known Stubs

None.

## The state the local stack is left in

The stack is up and was not restarted. The database was not reset by this plan; the last run's teardowns ran, and the closed-project spec's `afterAll` reopened the project. `private.invitation_link_witness` holds the rows the runs left, as before, so pgTAP file 39's test 238 would be red until a reset.

## For later plans

- **Predecessor label for the next full run: `178-18-close`** (469 tests, 118 projects, head `491f7bdde`). A comparison with `178-17-close` needs `--except contestant-email-registration=2 --except perm-closed-project=3`.
- **The login page object, as it is now:**

  ```ts
  goToPage()                                   // opens the SIGN-IN screen, waits for its frame and its email control
  signInFromCold(email, password)              // for a setup: the sign-in screen opened up to three times, then login()
  expectEntryNotShown()                        // the login screen is not rendered
  expectSignInAnswersLocked()                  // the sign-in screen shows the locked sentence
  openEntitySettingsWithNoSession(entityType, entityId)   // waits for nothing
  expectLedToEntitySettings(entityType, entityId)
  expectNotice(reason)                         // now also asserts the catalogue's sentence for the reason
  expectEndedOnEntry()                         // the bare address, the root marker, the sign-in entry, no notice, no refusal
  ```

  `getSubmitButton()` is gone, and so is `openLoginForm()` of `contestant-entity-selection.ts`. The login page has no field: a spec that wants the form calls `goToPage()` or `followSignIn()`.
- **Wait for a logout to land before opening another address.** `clickWithDialog()` returns as soon as the modal's button is pressed; the logout then navigates on its own. Call `expectEndedOnEntry()` first, or the logout's navigation can replace the one the step made. `clickWithoutDialog()` and `logoutWithoutDialog()` already wait for the login screen's marker.
- **The sign-in's redirect names the locale in the path** (`/en/contestant/…`), and the tests' route builder leaves the base locale's prefix out. Compare a landed address with the prefix removed, or with a pattern that allows it, as `expectLedToEntitySettings` does.
- **A reserved row with no nomination has no profile, questions or preview page.** A deep link to one of them ends on the entity's home. The settings page and the nominations page are rendered for it.
- **178-19 (forgot-password, password-reset):** the forgot-password link is on the sign-in screen and on the used code's sign-in, not on the login screen. `password-reset/+page.svelte` still sends a visitor with no session, and a user who has set a password, to `ContestantAppLogin`: the first is right as it is; whether the second should land on the sign-in screen is that plan's. A refused or spent recovery link lands on the login screen with `errorMessage=authError`, whose sentence names no page and no button; `expectNotice('authError')` asserts it.
- **178-21 (the scans):** entry 4, `entry-login`, is the state with both entries — marker `login.registerLink`, or `login.page` with `data-register-offered="true"`; the base dataset lists two modes. The wiring gate already reads `entryAxeScan.ts`; the new scan spec is one more constant and one more list entry with the gate `{ from: '../../utils/entryAxeScan', symbol: 'declareEntryScans' }`, and the count in the gate's header ("ten source files", "none of the eight") moves with it. A notice state and the locked state of the login screen have no scan entry in the contract's table: `?errorMessage=authError` reaches the first with no setup.
- **178-21, 178-22 — to look at on the rendered login screen:** the footer under the two secondary links, inside the actions section; the notice (`my-md`, centred, an emoji before it) between the heading and the entries; the locked sentence directly under the heading with no notice; with Register absent, one button and the two links; the "Or" divider's width between two full-width buttons; the voter-app link is a button that needs the page's script.
- **178-23 — keys with no reader now:** `contestantApp.login.haveRegistrationCode` and `contestantApp.setPassword.passwordSetSuccesfully`, beside the six of plan 178-16. `newUserEmail` of the contestant context has neither a writer nor a reader. `contestantApp.login.forgotPassword` is still read by `PasswordSignIn` and by `mailTemplates.test.ts`.
- **178-23 — documentation now out of date:** `developers-guide/contestant-app/login-and-password-reset` (one sentence was changed here; the page still describes the login page as the place of the form in its headings and steps, and the `errorMessage=authError` landing has a sentence now); `developers-guide/configuration/app-settings` (an anonymous visitor of a closed project reads four values, the answers lock among them); the database skill's `schema-reference.md` and `rls-policy-map.md` ("three stored", "the three values"); `tests/README.md` (the paragraph on the closed-project spec's last describe, the sentence on `registerAndStoreSession`, the steps above, the wiring gate's list); whatever describes the adapter-boundary allowlist (one entry fewer: seven sites and the two outside the groups); the comment of the `contestant-email-registration` project in `tests/playwright.config.ts` (eleven tests, one more sign-in, a second describe).
- **178-23 — for the native-speaker review:** the Finnish `enterEmailAndPassword` and `answersLockedInfo`, and the Luxembourgish `answersLockedInfo`, as reworded here.
- **Swedish:** the login screen shows `contestantApp.login.signInWithEmail` ("Logga in med e-post") and `contestantApp.register.register`, and not `common.login`, so it does not show "Registrera dig" beside the new sentences. The menu's item and the sign-in screen's title and button still do. Not changed.
- **The auth budget:** 33 password sign-ins in a full run from the host's address, at most 23 in any five minutes; 15 link verifications. `tests/e2e-runs/178-unit/178-18-auth-peaks.sh <since> <until>` prints the totals and the most in any five minutes by origin, from a run's `started` and `ended`.
- **A verdict line that states a project's delta is derived from the tree first.** An inline `assertAxeScan` call is not a test: replacing four of them with one declared entry adds two tests and removes none.
- **Timing on this host today:** the email project alone 63 s (the control) and 43 s from the wrapper's start to its end; a full run 11 min 54 s and 11 min 57 s (the held trees) and 12 min 29 s (the committed tree); the six gate rows 3 min 30 s.

## Next Phase Readiness

Ready for 178-19. The login screen and the sign-in screen are the two entry screens every later plan's specs start from, and every session of the suite is made on the second.

## Self-Check: PASSED

- The files this summary names as created or changed exist, and `login/+page.server.ts` does not.
- `6de63a273`, `e4ad7eef2` and `491f7bdde` are ancestors of HEAD; `git rev-list --count 027701ef2..HEAD` was 3 before this summary's commit.
- The seven run directories under `tests/e2e-runs/178-e2e/` and the gate set `tests/e2e-runs/178-gates/178-18-close` exist.
