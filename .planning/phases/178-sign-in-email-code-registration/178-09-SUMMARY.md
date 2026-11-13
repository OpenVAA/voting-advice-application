---
phase: 178-sign-in-email-code-registration
plan: 09
subsystem: frontend
tags: [svelte5, components, forms, autofill, autocomplete, accessibility, aria, wcag, vitest, contestant-app]

requires:
  - phase: 178-sign-in-email-code-registration
    provides: "plan 178-08: the message keys the fields read (common.email, common.emailConfirmation, contestantApp.register.code, .codeFormat, .emailEntry.mismatch, contestantApp.login.emailRequired, .forgotPassword), the registry's test ids for the email entry, the sign-in screen and the code sign-in screen, and form on Button's type; plan 178-01: the gate driver and the verdict script"
provides:
  - "EmailField: one labelled email input with an optional hint and an error; exports focus() and checkValidity()"
  - "RegistrationCodeField: one labelled text input for a code with the format as its hint; export focus()"
  - "EmailEntry: an address and its confirmation over two EmailFields; export validate()"
  - "PasswordSignIn: the labelled current-password field, the refusal and the forgot-password link; export focus()"
  - "PasswordField: props name, describedby and invalid; no placeholder with externalLabel; a unit test beside it"
  - "Four rows and one changed row of the contestant component library's README; the regenerated component listing with four new pages (107 to 111 components)"
affects: [178-10, 178-11, 178-13, 178-15, 178-16, 178-19, 178-21, 178-22, 178-23, 179]

actuals:
  tokens: 27861
  tasks: 3
  commits: 3
plan_head_before: 2cfe54e46624f7183b8b2d77834180a2bfcae1d7
plan_head_after: 6131ad06ae3731d4d4dc94708a90f3311ff21231

tech-stack:
  added: []
  patterns:
    - "The field pattern: a root flex column with gap-xs holding a visible label tied by for, the control, a hint with the id <id>-info and an ErrorMessage inline role=alert with the id <id>-error; the control's aria-describedby names exactly the ones rendered and it is aria-invalid only while the error is shown"
    - "A field decides nothing: its caller sets a bindable error, in the catalogue's words, and the field clears it on input"
    - "A test id a fixture fills goes to the control through the component's data-testid prop; the error takes a second id through errorTestId, spread only when one was given so the message keeps its own otherwise"
    - "A wrapper that must react to a child's write to a bindable prop uses a function binding (bind:password={() => password, handlePasswordEdited}) when the child spreads no rest props onto an element"
    - "A red-first run of a component that does not exist yet is made over an inert stand-in (an empty div with empty exports), so that every failure is an expectation; the stand-in is never committed"

key-files:
  created:
    - apps/frontend/src/lib/contestant/components/emailField/EmailField.svelte
    - apps/frontend/src/lib/contestant/components/emailField/EmailField.type.ts
    - apps/frontend/src/lib/contestant/components/emailField/index.ts
    - apps/frontend/src/lib/contestant/components/emailField/EmailField.svelte.test.ts
    - apps/frontend/src/lib/contestant/components/registrationCodeField/RegistrationCodeField.svelte
    - apps/frontend/src/lib/contestant/components/registrationCodeField/RegistrationCodeField.type.ts
    - apps/frontend/src/lib/contestant/components/registrationCodeField/index.ts
    - apps/frontend/src/lib/contestant/components/registrationCodeField/RegistrationCodeField.svelte.test.ts
    - apps/frontend/src/lib/contestant/components/emailEntry/EmailEntry.svelte
    - apps/frontend/src/lib/contestant/components/emailEntry/EmailEntry.type.ts
    - apps/frontend/src/lib/contestant/components/emailEntry/index.ts
    - apps/frontend/src/lib/contestant/components/emailEntry/EmailEntry.svelte.test.ts
    - apps/frontend/src/lib/contestant/components/passwordSignIn/PasswordSignIn.svelte
    - apps/frontend/src/lib/contestant/components/passwordSignIn/PasswordSignIn.type.ts
    - apps/frontend/src/lib/contestant/components/passwordSignIn/index.ts
    - apps/frontend/src/lib/contestant/components/passwordSignIn/PasswordSignIn.svelte.test.ts
    - apps/frontend/src/lib/contestant/components/passwordField/PasswordField.svelte.test.ts
    - apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/contestant/components/{emailEntry/EmailEntry,emailField/EmailField,passwordSignIn/PasswordSignIn,registrationCodeField/RegistrationCodeField}/+page.md
  modified:
    - apps/frontend/src/lib/contestant/components/passwordField/PasswordField.svelte
    - apps/frontend/src/lib/contestant/components/passwordField/PasswordField.type.ts
    - apps/frontend/src/lib/contestant/components/README.md
    - apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/+page.md
    - apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/contestant/components/passwordField/PasswordField/+page.md

key-decisions:
  - "EmailEntry's id prop is the base of its two controls' ids: <id>-email and <id>-confirmation"
  - "EmailEntry removes the confirmation's message on an edit of the address only when that message is the mismatch; the confirmation's own 'enter your email address' stays until the confirmation is edited"
  - "PasswordSignIn's root is a gap-md column whose first child is the field pattern (gap-xs: label, field, the field's error), followed by the refusal and the link"
  - "PasswordSignIn clears its bound error through a function binding on PasswordField's password, because PasswordField spreads no rest props onto an element and so takes no input handler"
  - "RegistrationCodeField's control is not required: the contract's table gives the code field no required attribute, and the page says when an empty code is an error"
  - "No attribute needed a spread to pass the type check: inputmode, autocapitalize, spellcheck and autocorrect are all admitted as literals by svelte/elements"

patterns-established:
  - "A component test hands a bindable prop over as an accessor pair on a $state object, which is what bind: compiles to, and asserts the parent's side of the write"
  - "yarn workspace @openvaa/docs generate:docs validates links against git ls-files: a new component's files are staged before it is run, or it exits 1 before its format step and leaves about fifty generated pages unformatted"

requirements-completed: [REG-13, REG-09, REG-02]

coverage:
  - id: D1
    description: "EmailField: a labelled type=email control carrying the name, autocomplete token and test id its caller gives, inputmode=email, autocapitalize=none, spellcheck=false and required; a hint and an alert tied to it by aria-describedby and aria-invalid; typing clears a bound error; focus() and checkValidity(); no placeholder, no length limit, no pattern, paste never prevented"
    requirement: REG-13
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/contestant/components/emailField/EmailField.svelte.test.ts — 19 cases; red over a stand-in (178-09-t1-red.log, 34 of 34 failed across the two files, each on an expectation), green after"
        status: pass
      - kind: other
        ref: "tests/e2e-runs/178-unit/178-09-t1-verify.sh — exit 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "RegistrationCodeField: a labelled type=text control named code with autocomplete=off, autocapitalize=characters, spellcheck=false and autocorrect=off, no length limit, the format hint as its info, its error an alert with a data-reason; a value set from outside is shown as it is and typing changes nothing but what was typed"
    requirement: REG-13
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/contestant/components/registrationCodeField/RegistrationCodeField.svelte.test.ts — 15 cases; red and green as D1"
        status: pass
    human_judgment: false
  - id: D3
    description: "EmailEntry: two EmailFields named email and email-confirmation, compared trimmed and without regard to case; the mismatch at the confirmation on its blur while both hold text and on validate(); an edit of either removes it; validate() shows each field's message, moves focus to the first field in error and returns the verdict; it takes no code"
    requirement: REG-09
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/contestant/components/emailEntry/EmailEntry.svelte.test.ts — 24 cases; red over a stand-in (178-09-t2-red.log, 24 of 24 failed, each on an expectation), green after"
        status: pass
      - kind: other
        ref: "tests/e2e-runs/178-unit/178-09-t2-verify.sh — exit 0"
        status: pass
    human_judgment: false
  - id: D4
    description: "PasswordField takes a name, a description and an error state, and with an outside label renders no placeholder; a caller that passes none of them — the Admin login — gets the markup it had"
    requirement: REG-13
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/contestant/components/passwordField/PasswordField.svelte.test.ts — 9 cases, the first three mounted with exactly what the Admin login passes; in the red run (178-09-t3-red.log) those three and focus() passed against the unchanged component and the five cases of the new props failed on expectations"
        status: pass
    human_judgment: false
  - id: D5
    description: "PasswordSignIn: a visible label tied to a required current-password control named password, the field's error, the refusal as an alert with the test id and data-status it was given, and the link to the forgot-password route, in that order in the document; focus(); each screen's own test ids"
    requirement: REG-02
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/contestant/components/passwordSignIn/PasswordSignIn.svelte.test.ts — 15 cases; red over a stand-in (15 of 15 failed, each on an expectation), green after"
        status: pass
      - kind: other
        ref: "tests/e2e-runs/178-unit/178-09-t3-verify.sh — exit 0"
        status: pass
    human_judgment: false
  - id: D6
    description: "The library's README names the four new components and PasswordField's new props; the generated listing names them (111 components) with a page each; the committed tree is green on the seven closing gate rows"
    verification:
      - kind: other
        ref: "tests/e2e-runs/178-gates/178-09-close — typecheck, lint, unit, check-frontend, build, format, docs-links all 0; 178-verdict gates 178-09-close --rows …: PASS"
        status: pass
    human_judgment: false
  - id: D7
    description: "A person tabbing through the sign-in screen meets the email field, the password field, its toggle, 'Forgot Password?', 'Sign in', the link button and Return in that order; and password managers offer what each field declares"
    verification: []
    human_judgment: true
    rationale: "No screen renders the components yet. The component's half is asserted (document order, no control moved in or out of the tab order); the screen's order is plan 178-13's markup and the scans of plans 178-21 and 178-22, and what a manager offers is a person's check filed by plan 178-24."

duration: 15min
completed: 2026-10-12
status: complete
---

# Phase 178 Plan 09: The Shared Fields — `EmailField`, `RegistrationCodeField`, `EmailEntry`, `PasswordSignIn`, and the Three Props `PasswordField` Gains — Summary

**Four new components of the Contestant App's own library, each with its type file, barrel, `@component` docblock and a unit test beside it, and one changed component whose defaults reproduce today's markup. Every input declares its `type`, `name` and `autocomplete` as attributes a unit case asserts; every control has a visible label tied by `for`, and an error that is an alert tied to it. Nothing renders the four yet.**

## Read this first

- **Everything is green and nothing was retried.** Three commits, three verify blocks at exit 0, seven gate rows at 0. No E2E run was made: the plan has none and its commits are additive. The predecessor label for the next full run stays `178-07-close`.
- **Five generated pages outside the plan's `files_modified` are in Task 3's commit**: the generator writes one page per component, so the four new components each got a page and `PasswordField`'s page changed. See *Deviations* 1.
- **No attribute needed a spread** (ruling 5 of the plan). `inputmode`, `autocapitalize`, `spellcheck` and `autocorrect` are admitted as literals by `svelte/elements`, so each stands in the markup as written.
- **`PasswordField` has three new props, not two**: `name`, `describedby` and `invalid`, as the plan's Task 3 lays out (its title and objective say two).
- **Items U-02 and U-16 were read by the operator on 2026-10-11 and stand at their recommended options**; both are built so: visible labels with no placeholder, and errors in the app's own words with the address rule left to the `type="email"` control.
- **The components skill's two measured counts are now behind by this plan's four components** and were not edited; see *Not done, or not verified*.

## Performance

- **Duration:** about 15 min
- **Started:** 2026-10-12T19:28:45Z
- **Completed:** 2026-10-12T19:43Z
- **Tasks:** 3
- **Files modified:** 26 (21 created, 5 modified)

## Task Commits

1. **Task 1: `EmailField` and `RegistrationCodeField`** — `a954505e9` (feat)
2. **Task 2: `EmailEntry`** — `a60ea7622` (feat)
3. **Task 3: `PasswordSignIn`; `PasswordField` takes a name and an outside label; the README and the listing** — `6131ad06a` (feat)

## Each task's verify command, with its real exit status

Each `<automated>` block was written byte for byte to `tests/e2e-runs/178-unit/178-09-t<N>-verify.sh` and run with `bash`; its log, exit status and head are beside it.

| Task | Script | Exit | Notes |
|---|---|---|---|
| 1 | `178-09-t1-verify.sh` | 0 | Its unit command has `--`, so the whole frontend suite ran: 211 files passed, 1 skipped; 4374 tests passed, 31 skipped |
| 2 | `178-09-t2-verify.sh` | 0 | Whole suite again: 212 files passed, 1 skipped; 4398 passed, 31 skipped |
| 3 | `178-09-t3-verify.sh` | 0 | Ends on the gate verdict: PASS, not stale, no Sleep entry in the run window |

The filtered runs, by a positional path with no `--`: Task 1's two directories 34 of 34; Task 2's directory 24 of 24; the whole component library (`src/lib/contestant/components`) 11 files, 128 of 128.

## Red before green

Each new component's red-first run was made over an inert stand-in — an empty `<div>` with empty exports — so that the test file imports and every failure is an expectation. The stand-ins were replaced before anything was committed.

| Run | Exit | What failed |
|---|---|---|
| `178-09-t1-red` | 1 | 34 of 34, each "expected … to have a length of 1 but got 0" at the control lookup |
| `178-09-t2-red` | 1 | 24 of 24, each "expected … to have a length of 2 but got 0" at the two-control lookup |
| `178-09-t3-red` | 1 | 20 of 24: `PasswordSignIn`'s 15 over its stand-in; `PasswordField`'s 5 cases of the new props over the unchanged component (the name, the placeholder with an outside label, the description, the error state). The 4 that passed are the three cases of the Admin login's field and `focus()`, which hold what exists |

No failure in any red run was an import, compile or timeout failure.

## The components as built

### `EmailField` — `$contestant/components/emailField`

| Prop | Type | Default | |
|---|---|---|---|
| `value` | `string` | `''` | bindable |
| `label` | `string` | `t('common.email')` | visible, tied by `for` |
| `name` | `string` | `'email'` | |
| `autocomplete` | `'username' \| 'email'` | `'email'` | |
| `info` | `string` | — | a `<p>` with the id `<id>-info` |
| `error` | `string` | — | bindable; cleared on input |
| `id` | `string` | generated | the control's id |
| `errorTestId` | `string` | — | on the error message |
| `data-testid` | `string` | — | on the control, not the root |
| any `<div>` attribute | | | onto the root, `class` merged |

Exports: `focus(): void`, `checkValidity(): boolean` (the control's own answer). Fixed on the control: `type="email"`, `inputmode="email"`, `autocapitalize="none"`, `spellcheck="false"`, `required`, `class="input w-full"`. Reads the component context's `t` and nothing else.

### `RegistrationCodeField` — `$contestant/components/registrationCodeField`

| Prop | Type | Default | |
|---|---|---|---|
| `value` | `string` | `''` | bindable; never rewritten |
| `label` | `string` | `t('contestantApp.register.code')` | |
| `info` | `string` | `t('contestantApp.register.codeFormat')` | |
| `error` | `string` | — | bindable; cleared on input |
| `errorReason` | `string` | — | `data-reason` on the error message |
| `id`, `errorTestId`, `data-testid`, any `<div>` attribute | | | as `EmailField` |

Export: `focus(): void`. Fixed on the control: `type="text"`, `name="code"`, `autocomplete="off"`, `autocapitalize="characters"`, `spellcheck="false"`, `autocorrect="off"`. It is not `required` and has no length limit and no pattern. Its one input handler clears the error; nothing writes the value back.

### `EmailEntry` — `$contestant/components/emailEntry`

| Prop | Type | Default | |
|---|---|---|---|
| `email` | `string` | `''` | bindable; the first field's value, as typed |
| `id` | `string` | generated | the base of the two ids: `<id>-email`, `<id>-confirmation` |
| any `<div>` attribute | | | onto the root (`flex w-full flex-col gap-md`) |

Export: `validate(): boolean`. The two fields: `common.email` / `name="email"` / `email-entry-email` (error `email-entry-email-error`) and `common.emailConfirmation` / `name="email-confirmation"` / `email-entry-confirmation` (error `email-entry-confirmation-error`), both `autocomplete="email"`. Messages: `contestantApp.login.emailRequired`, `components.input.error.invalidEmail`, `contestantApp.register.emailEntry.mismatch`.

### `PasswordSignIn` — `$contestant/components/passwordSignIn`

| Prop | Type | Default | |
|---|---|---|---|
| `password` | `string` | `''` | bindable |
| `error` | `string` | — | bindable; the field's own; cleared when the user edits the field |
| `failure` | `string` | — | the refusal's sentence; rendered only when non-empty |
| `failureStatus` | `number \| string` | — | `data-status` on the refusal |
| `id` | `string` | generated | the password control's id; the error is `<id>-error` |
| `errorTestId`, `failureTestId`, `forgotPasswordTestId` | `string` | — | each spread only when given |
| any `<div>` attribute | | | onto the root |

Export: `focus(): void`. Destructures `getRoute` and `t` from the contestant context and reads no reactive accessor. The control keeps `PasswordField`'s own test id, `password-field`.

### `PasswordField`, as changed

New props: `name?: string` (default `'password'`), `describedby?: string` (the control's `aria-describedby`), `invalid?: boolean` (default `false`; `aria-invalid="true"` when set). With `externalLabel` the placeholder is not rendered. Nothing else of its markup changed; the toggle stays `type="button"`.

## `PasswordField`'s callers, and what each passes

From `git grep -n "PasswordField" -- apps/frontend/src ':!*.test.ts'`:

| Caller | Passes | Gets |
|---|---|---|
| `routes/admin/login/+page.svelte` | `autocomplete="current-password"`, `id="password"`, `bind:password` | unchanged: `name="password"`, the `sr-only` label, the placeholder, `password-field` |
| `routes/contestant/login/+page.svelte` | the same, and `bind:this` | unchanged |
| `passwordSetter/PasswordSetter.svelte`, twice | `bind:password`, an `id`, a `label`, `autocomplete` | unchanged (both still named `password`; plan 178-11 gives them names) |
| `passwordSignIn/PasswordSignIn.svelte` (new) | `bind:this`, a function binding on `password`, `id`, `autocomplete="current-password"`, `externalLabel`, `describedby`, `invalid` | no inner label, no placeholder |

## The unit cases, by title

### `EmailField.svelte.test.ts` — 19

- **the label:** renders one visible label tied to the control by `for` · shows the label it was given · names the control by its label alone: no placeholder and no `aria-label`
- **what the control declares:** is a required email control named `email` with the `email` autocomplete token by default · carries the name, the autocomplete token and the test id its caller gives, on the control · sets no limit on the length of an address and no pattern of its own · merges the caller’s class into its root
- **the hint and the error:** describes nothing and is not in error when it has neither a hint nor an error · renders a hint as a paragraph with the id `<id>-info` and describes the control by it · renders an error as an alert with the id `<id>-error` and the test id it was given · describes the control by the hint and the error when both are rendered
- **editing:** clears a bound error when the user types · hands the parent the value as typed and writes nothing back into the control · shows a value set from outside · does not prevent a paste
- **the exports:** focuses the control on `focus()` · answers `checkValidity()` with the control’s own verdict
- **ids:** gives two instances different ids, each with its own label · uses an id it was given as given

### `RegistrationCodeField.svelte.test.ts` — 15

- **the label and the hint:** renders one visible label tied to the control by `for`, and no placeholder · shows the format of a code as its hint and describes the control by it · shows the label and the hint it was given
- **what the control declares:** is a text control named `code` that a browser offers nothing for and does not correct · sets no limit on the length of a code and no pattern · carries the test id its caller gives on the control, not on its root
- **the error:** renders no alert and is not in error without one · renders an error as an alert with the id `<id>-error`, the test id and the reason it was given · clears a bound error when the user types
- **editing:** shows a value set from outside exactly as it is · changes nothing but what was typed · does not prevent a paste
- **the export and the ids:** focuses the control on `focus()` · gives two instances different ids · uses an id it was given as given

### `EmailEntry.svelte.test.ts` — 24

- **the two fields:** renders an address and its confirmation, each an email control with the `email` autocomplete token · gives the two controls different names and different ids · labels each control visibly, tied to it by `for` · builds the two ids from an id it was given, and merges the caller’s class into its root · gives two instances four different ids
- **`email`:** is the first field’s value · does not change when the confirmation is typed · shows a value set from outside in the first field alone
- **the comparison when the confirmation loses focus:** shows the mismatch at the confirmation when both hold text and they differ · compares the two trimmed and without regard to case · shows nothing while the address is empty · shows nothing while the confirmation is empty · shows nothing when the address loses focus
- **editing:** removes the mismatch when the confirmation is edited · removes the mismatch when the address is edited · keeps the confirmation’s own message when the address is edited · does not prevent a paste into either field
- **`validate()`:** returns true for two equal, usable addresses and shows nothing · returns true for two addresses that differ only in case and surrounding space · asks for an address at each empty field and moves focus to the first · says the address is not valid when its control says so, and moves focus to it · asks for the confirmation when it alone is empty, and moves focus to it · shows the mismatch at the confirmation when the two differ, and moves focus to it · shows nothing once the fields were corrected and it is asked again

### `PasswordField.svelte.test.ts` — 9

- **the Admin login’s field:** is a required password control named `password` with the test id `password-field` · is labelled for assistive technology only, and shows its placeholder · carries no description and no error state
- **a name:** submits the control under the name it was given
- **an outside label:** renders no label and no placeholder inside
- **a description and an error state:** passes both on to the control · leaves the control without an error state when it is not in error
- **the toggle and the export:** has a toggle that submits nothing and changes the control’s type alone · focuses the control on `focus()`

### `PasswordSignIn.svelte.test.ts` — 15

- **the labelled field:** renders one visible label tied to the password control, and no placeholder · declares a required password control named `password` that holds the current password · hands the parent the password as typed
- **the refusal:** renders no alert while there is no refusal and no error · renders the refusal as an alert holding its sentence, with the test id and the status it was given · leaves the control out of the error state for a refusal · carries the test ids of the screen that renders it
- **the link:** leads to the forgot-password page, with the test id it was given
- **the order:** puts the control, its toggle, the field’s error, the refusal and the link in that order · moves no control in or out of the tab order, so the tab order is the order of the document
- **the field’s error:** renders the error as an alert tied to the control, with the test id it was given · clears a bound error when the user types
- **the export and the ids:** focuses the password control on `focus()` · gives two instances different ids, each with its own label · uses an id it was given as given, and merges the caller’s class into its root

## The gate rows

`bash $P/178-gates.sh 178-09-close --rows typecheck,lint,unit,check-frontend,build,format,docs-links`, in the background, polled; head `6131ad06a`.

| Row | Exit | Seconds |
|---|---|---|
| typecheck | 0 | 22 |
| lint | 0 | 47 |
| unit | 0 | 38 |
| check-frontend | 0 | 10 |
| build | 0 | 17 |
| format | 0 | 20 |
| docs-links | 0 | 1 |

`node $P/178-verdict.mjs gates 178-09-close --rows …`: PASS — 7 expected, 7 recorded; not stale (the run's head is tree-equal to HEAD outside `.planning/`); no Sleep entry inside the run window. The host was on AC power at 100 %.

Beside the gate set, on the working tree before each commit: `svelte-check` 0 errors and 0 warnings; `eslint` on the touched directories exit 0; `prettier --check` exit 0; `yarn assert:comment-hygiene` exit 0, three times; `yarn workspace @openvaa/docs validate:links` exit 0; `bash .claude/scripts/audit-skill-links.sh components` exit 0.

## Decisions Made

- **`EmailEntry`'s `id` is a base, not one control's id.** The component has two controls, so the prop the plan names gives both: `<id>-email` and `<id>-confirmation`.
- **An edit of the address removes the mismatch and nothing else.** The behaviour says "editing either field removes the mismatch". The confirmation's own "Enter your email address." is about the confirmation and stays until that field is edited; a flag beside the message says which of the two is shown.
- **`validate()` judges the confirmation by emptiness and equality only.** A confirmation equal to an address its control calls unusable carries no message of its own: the address's field says it is not valid, and focus goes there.
- **`PasswordSignIn` is a `gap-md` column around the field pattern.** The pattern (`gap-xs`: label, field, the field's error) is its first child; the refusal and the link follow at the form's own distance, as the contract's spacing table gives a message.
- **A function binding carries "typing clears the error" in `PasswordSignIn`.** `PasswordField` declares the attributes of a `<div>` and spreads none of them, so an input handler passed to it reaches nothing. The setter of `bind:password={() => password, handlePasswordEdited}` runs exactly when the field writes, and no event handler sits on a static element.
- **The code field is not `required`.** The contract's table lists `required` for the email and password fields and not for the code; the page says when an empty code is an error.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The generator writes a page per component, and refuses untracked sources**
- **Found during:** Task 3, step 4
- **Issue:** `yarn workspace @openvaa/docs generate:docs` exited 1: its link validation reads `git ls-files`, and the new `passwordSignIn` files were not yet tracked ("Not a tracked file or directory", 2 findings). Because the script is `tsx … && yarn format`, the format step did not run and about fifty generated pages and `navigation.config.ts` were left unformatted in the working tree. The plan's `files_modified` names the listing alone, but the generator also writes one page per component.
- **Fix:** staged the new source files by explicit path and ran the generator again: exit 0, and its own format step restored every unrelated page. The diff was read before staging: the listing gained four entries and its total went from 107 to 111; `PasswordField`'s page gained the three props and the second usage; four new pages. Nothing else differed. All six generated files are in Task 3's commit.
- **Files modified:** the listing, `…/generated/contestant/components/passwordField/PasswordField/+page.md`, and the four new `…/generated/contestant/components/<dir>/<Name>/+page.md`
- **Verification:** `validate:links` exit 0; the `docs-links` gate row 0; `git diff --quiet HEAD -- . ':(exclude).planning'` exit 0
- **Committed in:** `6131ad06a`

**2. [Rule 1 - Bug] A test of this plan asserted something `Button` does not do**
- **Found during:** Task 3, the first green run
- **Issue:** the case written as "sets no `tabindex`" failed: `Button` puts `tabindex="0"` on its element (and `-1` when disabled), so the toggle and the link each carry one. A `tabindex` of 0 keeps an element at its place in the document, so the order is still the markup's.
- **Fix:** the case is "moves no control in or out of the tab order, so the tab order is the order of the document": every `tabindex` present is `0`, and the tab stops are the control, its toggle and the link, in that order. The component was not changed.
- **Files modified:** `PasswordSignIn.svelte.test.ts`
- **Committed in:** `6131ad06a`

### Other departures, none of them a fix

- **The unit commands with `--` ran the whole frontend suite**, as the dispatch notes; the filtered runs were made by a positional path and are recorded above.
- **The refusal's fixture key in `PasswordSignIn`'s test is `error.wrongEmailOrPassword`**, the key the tree holds for "Wrong email or password"; the component takes the sentence as a prop and names no key.
- **`PasswordField.svelte` was edited by a scripted replacement with exact-match assertions** rather than by hand; the result was type-checked, linted, formatted and unit-tested like the rest.

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug in a new test), 3 other. No scope was added.

## Issues Encountered

None beyond the two above.

## The code-review checklist

| Item | Outcome |
|---|---|
| The changes solve what they set out to | Yes: the four components and the changed one exist, tested, documented and listed |
| OWASP top 10 | No typed value is logged, stored, rendered as markup or written into an attribute other than `value`; errors are catalogue strings passed by the caller; `ErrorMessage` logs the message it shows, which is such a string. No `{@html}` in any new file |
| Code style guide | Followed: type files beside components, barrels, TSDoc on every prop, `concatClass` on every root |
| No `any` | None. The tests cast mount props with `as never`, as `ContactSupport`'s test does |
| No repeated code | One judgement: `EmailField` and `RegistrationCodeField` each write the field pattern (about fifteen lines: label, control, hint, error and the description list). The contract names two components and "the same pattern"; a shared base would have to take every attribute as a prop. `PasswordSignIn` writes the label and error half of it around `PasswordField`. Left as the plan lays it out |
| New entities documented | Yes: `@component` docblocks, TSDoc on every prop and on `validate()` and `checkValidity()` |
| Repo markdown updated | The library's README; the generated listing and pages |
| Tracking events | None needed: no function is made available to a user yet |
| Svelte component guidelines | Runes only, props from a co-located type, no `export let`, no `<slot>`; `svelte-check` 0 warnings |
| Errors handled and logged | The components raise none; `validate()` and `checkValidity()` answer `false` when the control is not mounted |
| Failing checks | None |
| Parts sharing dependencies not unduly affected | `PasswordField`'s other callers get the markup they had, held by three unit cases mounted with the Admin login's props; the whole unit suite and the build are green |
| WCAG A and AA | Visible labels tied by `for`; errors are alerts named in `aria-describedby`; `aria-invalid` only in error; no placeholder as a name; paste never prevented. No axe scan can run until a screen renders them (plans 178-21, 178-22) |
| Keyboard and screen reader | Document order is tab order; no control is taken out of it. Not driven in a browser yet |
| Developers' and Publishers' Guides | The generated component pages. Nothing else describes these fields yet |
| Comment hygiene | `yarn assert:comment-hygiene` 0 violations before each commit; every comment added or changed was read: none tells history or names a plan, decision or proposal. The one comment the edit of `PasswordField` touched (a `bind: keep —` note pointing at "line below") is replaced by one that says why a field with an outside label has no placeholder |
| Commit history | Three commits, one per task, none fixing another |
| Formatting-only changes | None |
| `[db]` | Not applicable |

## Prohibitions

| Id | Outcome | Evidence |
|---|---|---|
| PROH-178-25 | Held | No `maxlength`, no pattern, no handler that writes a value: the one input handler of each field assigns `error` alone. Unit cases: paste not default-prevented in every field; a code set from outside shown exactly; typing changes nothing but what was typed. Task 1's verify refuses `maxlength`; Task 2's refuses a paste handler |
| PROH-178-26 | Held | Values are bound to `value` alone. Nothing logs, stores or renders a typed value; no `title`, no `{@html}`. Read in each new file |
| PROH-178-27 | Held | Task 1's verify refuses a numeric spacing class and a transition name in the two fields; the other two new files hold `gap-xs`, `gap-md`, `w-full` and `text-start` only, no inline style. `PasswordField`'s existing classes were not touched |

## Observed, and inferred

- **Observed:** every unit case, red and green; the three verify exits; the seven gate rows; the generated diff as described; `svelte-check` with no warning on a file that sets `autocorrect`, `autocapitalize`, `inputmode` and `spellcheck` as literals; jsdom fires `focusout` on `blur()`, so the confirmation's comparison is driven by a real loss of focus in the test.
- **Inferred, not observed:** that a browser's `type="email"` control trims the value it reports (jsdom does; the component trims again before comparing, so nothing rests on it); that `<Button href>` inside a `<form>` is reached by Tab after the toggle in a real browser; that the hint's paragraph margin (below) reads well on a phone; that any password manager honours `autocomplete="off"` on the code field.

## Not done, or not verified

- **No browser has rendered these components.** No axe scan, no phone-width check, no tab-order walk and no autofill check was possible; they belong to the screens (178-10, 178-13 to 178-16, 178-19), the scans (178-21, 178-22) and the person's list (178-24).
- **The components skill's measured counts were not updated.** `.claude/skills/components/SKILL.md` convention 1 says 105 files calling `$props()` and 105 type files, measured 2026-10-11; the tree now has 109 and 109. Convention 3 says 62 files in the three directories and 67 across `apps/frontend/src` use `concatClass`; the tree has 66 and 73 (it had 62 and 69 at this plan's base, so the second number was already behind by two). The skill's own re-check list asks for the update in the same commit; the file is outside this plan's `files_modified`, and an edit after the gate run would have made `178-09-close` stale for Task 3's verify, so it was measured and left for plan 178-23 or the orchestrator. `audit-skill-links.sh components` exits 0.
- **`requirements-completed` in the frontmatter copies the plan's three ids** as the template asks. This plan builds the shared pieces of REG-13, REG-09 and REG-02 and no screen; whether any of the three is complete is the orchestrator's to mark.

## The state the local stack is left in

Untouched. This plan ran no database command, no reset, no probe and no E2E run, and started no server. No Docker reading was needed for a gate set without database rows.

## For later plans

- **Predecessor label for the next full run is still `178-07-close`** (444 tests, 116 projects). This plan made no full run and adds no E2E test.
- **Importing:** `$contestant/components/emailField` (`EmailField`), `/registrationCodeField` (`RegistrationCodeField`), `/emailEntry` (`EmailEntry`), `/passwordSignIn` (`PasswordSignIn`); each barrel also exports the props type.
- **Every screen plan — how a field is told it is in error.** The page holds `let emailError = $state<string>()` and writes `bind:error={emailError}`; the field clears it on input. The message is a catalogue string the page reads with `t`. To judge an address: `if (!email.trim()) emailError = t('contestantApp.login.emailRequired'); else if (!field.checkValidity()) emailError = t('components.input.error.invalidEmail');` then `field.focus()`. `checkValidity()` answers `false` for an empty field too (the control is `required`), so ask about emptiness first if the two messages differ. The form is `novalidate`.
- **A test id goes to the control.** `<EmailField data-testid={testIds…email} errorTestId={testIds…emailError} />` puts the first on the `<input>` — what a fixture fills — and the second on the alert. The root gets no test id. Without `errorTestId` the alert keeps `ErrorMessage`'s own `error-message`.
- **178-13 (B):** `<EmailField autocomplete="username" data-testid="login-email" errorTestId="login-email-error" />` and `<PasswordSignIn bind:password bind:error={passwordError} failure={…} failureStatus={…} errorTestId="login-password-error" failureTestId="login-errorMessage" forgotPasswordTestId="login-forgot-password-link" />`. The password control keeps the id `password-field`, so the login fixture's `enterPassword` still finds it. `failureStatus` is rendered as `data-status`; the registry's comment on `login.errorMessage` is that plan's to add. The component's document order is the control, its toggle, the field's error, the refusal, the link.
- **178-15 (D2):** the same component with `register-sign-in-password-error`, `register-sign-in-error` and `register-sign-in-forgot-password-link`.
- **178-10, 178-16 (C):** `RegistrationCodeField` takes `errorReason` for `data-reason="required" | "unconfirmed"` and `data-testid="register-code"`, `errorTestId="register-code-error"`. Its `value` is exactly what was typed: the page trims before it sends. Its label is `contestantApp.register.code`, which still reads "registration code" in lower case; the Copywriting Contract rewords it to "Registration code" with the screen that shows it.
- **178-15 (D1), Phase 179:** `<EmailEntry bind:email bind:this={entry} />` and `entry.validate()` in the submit handler. Its four test ids are fixed (`email-entry-*`), so a page holds one `EmailEntry`. `email` is as typed; trim before sending.
- **178-11 (`PasswordSetter`):** `PasswordField` now takes `name`, `describedby` and `invalid`, and with `externalLabel` renders neither a label nor a placeholder. It still spreads no rest props: a `class`, an `oninput` or a `data-testid` passed to it reaches nothing, and its control's test id is always `password-field`. To react to an edit, use a function binding on `password` as `PasswordSignIn` does.
- **178-21, 178-22 (scans and phone widths) — three things to look at on the rendered screens:**
  1. A hint is a `<p>`, as the contract's pattern writes it, and the base stylesheet gives a paragraph a 16 px bottom margin unless it is the last child. With no error the hint is last and has none; **with an error under it the two are 20 px apart** (16 + `gap-xs`). On `RegistrationCodeField` the hint is always there, so its error always sits at that distance.
  2. `ErrorMessage inline` centres its text (`text-center` on its span) while the label and the hint are `text-start`.
  3. `Button` with an `href` renders `<a role="button" tabindex="0">`; the forgot-password link is announced as a button. That is `Button`'s own markup, on every link button of the app.
- **`ErrorMessage` logs every message it shows with `log.error`**, so a field error writes one console error line in development. A spec that fails on console errors would meet it; `Input` behaves the same today.
- **Any plan that adds a component:** stage its files before `yarn workspace @openvaa/docs generate:docs`, or the generator exits 1 on its link check and skips its own format step; then read the diff — one new page per component beside the listing.
- **Component tests:** a bindable prop is handed over as a getter and setter on a `$state` object in a `.svelte.test.ts` file; `input.focus(); input.blur()` fires `focusout` in jsdom; a stand-in for the red run needs the component's exports as empty functions.
- **178-23 — documentation:** the components skill's counts (above); nothing else this plan made out of date.
- **Timing on this host today:** the component library's unit tests 2 s; `svelte-check` 10 s; the seven gate rows 2 min 35 s.

## Threat register

| Id | Disposition | What was done |
|---|---|---|
| T-178-50 | mitigated | every `type`, `name` and `autocomplete` asserted as an attribute by a unit case per component; the code field is `autocomplete="off"` and Task 1's verify refuses the one-time-code token |
| T-178-51 | mitigated | values bound to `value` alone; errors are catalogue strings; each new component read for it |
| T-178-52 | mitigated | no handler writes a value, no length limit; unit cases set a value from outside and type into it |
| T-178-53 | mitigated in the components | visible labels, `aria-invalid`, alerts named in `aria-describedby`, paste never prevented — each a unit case; the scans read the screens later |
| T-178-54 | mitigated | three unit cases mounted with the Admin login's props hold the defaults |
| T-178-SC | accepted | no package was installed |

No security-relevant surface outside the plan's threat model was added.

## Known Stubs

None. The four components are complete; that nothing renders them yet is the plan's own boundary.

## Next Phase Readiness

Plans 178-10, 178-11 and 178-13 to 178-16 can build their forms from these fields. No blocker.

## Self-Check: PASSED

- The 21 created and 5 modified files exist and are tracked (`git ls-files --error-unmatch` on each, exit 0).
- The three commits are ancestors of HEAD: `a954505e9`, `a60ea7622`, `6131ad06a`.
- `git rev-list --count 2cfe54e46..HEAD` at the time of writing: 3.
