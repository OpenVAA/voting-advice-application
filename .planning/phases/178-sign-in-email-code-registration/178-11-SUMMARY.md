---
phase: 178-sign-in-email-code-registration
plan: 11
subsystem: frontend
tags: [svelte5, components, password-manager, autocomplete, passwordrules, novalidate, aria-invalid, vitest, playwright, contestant-app]

requires:
  - phase: 178-sign-in-email-code-registration
    provides: "plan 178-09: PasswordField's name, describedby, invalid and externalLabel without a placeholder, and the field pattern; plan 178-08: the two error test ids in the registry; plan 178-01: the gate driver, the E2E driver and the verdict script; plan 178-07: the predecessor full run 178-07-close"
provides:
  - "PasswordSetter: one form posted by POST with its own validation off, an id and a submit handler from its caller; prop username; exports validate() and reset(); controls named username, new-password and new-password-confirmation; errors with the test ids password-setter-password-error and password-setter-confirmation-error"
  - "PasswordField: prop passwordrules, spread onto the control only when given"
  - "The settings page passes the signed-in user's address to the setter"
  - "contestantApp.setPassword.passwordNotValid reworded in seven locales"
  - "Fixture step expectFieldError(field) in contestantPasswordSetter.fixture.ts"
  - "The full run 178-11-close: the predecessor of the next full run"
affects: [178-14, 178-16, 178-19, 178-21, 178-22, 178-23, 178-24]

actuals:
  tokens: 16574
  tasks: 3
  commits: 1
plan_head_before: 124746bbe2cfb3c12c362d40ec75313b2f1ec86d
plan_head_after: 49dadc2fe18785feaa372cf1d1031f2affef0026

tech-stack:
  added: []
  patterns:
    - "An attribute a form must always carry is written after the rest-props spread, and left out of the props type, so that no caller replaces it"
    - "A component that owns a delayed display of a verdict also exports a function that computes the verdict directly, so that a press straight after the last keystroke is judged on what was typed"
    - "A rule string for the browser is built from the keys of the rules the validator answers with and a map from each key to the browser's token, so the string follows the validator"
    - "A field that exists for a password manager alone is display: none, read-only and no tab stop: not type=hidden and not visually hidden"

key-files:
  created: []
  modified:
    - apps/frontend/src/lib/contestant/components/passwordSetter/PasswordSetter.svelte
    - apps/frontend/src/lib/contestant/components/passwordSetter/PasswordSetter.type.ts
    - apps/frontend/src/lib/contestant/components/passwordSetter/PasswordSetter.svelte.test.ts
    - apps/frontend/src/lib/contestant/components/passwordField/PasswordField.svelte
    - apps/frontend/src/lib/contestant/components/passwordField/PasswordField.type.ts
    - apps/frontend/src/lib/contestant/components/passwordField/PasswordField.svelte.test.ts
    - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/settings/+page.svelte
    - apps/frontend/messages/{da,en,et,fi,fr,lb,sv}/contestantApp.setPassword.json
    - tests/tests/fixtures/contestant/contestantPasswordSetter.fixture.ts
    - apps/frontend/src/lib/contestant/components/README.md
    - apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/contestant/components/{passwordSetter/PasswordSetter,passwordField/PasswordField}/+page.md

key-decisions:
  - "PasswordSetter's form keeps items-center beside flex w-full flex-col gap-md: the rule list is w-full with margins of its own, and centring is what keeps its edges on the form's, as today"
  - "method=POST and novalidate follow the rest-props spread and are left out of the props type, so no caller can replace them"
  - "The autocomplete prop of PasswordSetter is removed: both fields are new-password for every caller, and no caller passed it"
  - "A mismatch is removed when either field is edited, not only the confirmation: it is a statement about both"
  - "validate() shows one error at a time: the password's own before the mismatch"
  - "The rule string is minlength from minPasswordLength and one required: token per character-class rule the validator answers with; the rule on repetition, which the validator does not enforce, is not stated"
  - "The two test ids password-setter-password and password-setter-confirmation stay on the blocks that hold each label, control and error, so every existing fixture step still finds its control"

patterns-established:
  - "A red-first run over an existing component that lacks an export is made with an inert stand-in export, replaced before anything is committed"
  - "Copies of held files kept beside a pre-commit run are named by the file's path with slashes written as two underscores, where file names repeat"

requirements-completed: [REG-13, REG-11]

coverage:
  - id: D1
    description: "PasswordSetter is one form with method POST and novalidate that no caller can replace, taking its id, its class and its submit handler from its caller"
    requirement: REG-13
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/contestant/components/passwordSetter/PasswordSetter.svelte.test.ts — describe 'the form', 4 cases"
        status: pass
      - kind: other
        ref: "tests/e2e-runs/178-unit/178-11-t1-verify.sh — exit 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "With username the form's first control is a read-only email input named username with autocomplete username, tabindex -1 and the class hidden, holding the address; without an address, or with an empty one, no such input exists"
    requirement: REG-13
    verification:
      - kind: unit
        ref: "PasswordSetter.svelte.test.ts — describe 'the address field', 3 cases"
        status: pass
    human_judgment: false
  - id: D3
    description: "The two password controls are named new-password and new-password-confirmation, both autocomplete new-password, each with one visible label tied to it and no placeholder; the first states the rule string through passwordrules and the second does not; the form's order is the address, the sentence, the rule list, the password, the confirmation"
    requirement: REG-13
    verification:
      - kind: unit
        ref: "PasswordSetter.svelte.test.ts — describe 'the two password fields', 5 cases; PasswordField.svelte.test.ts — describe 'a rule string', 2 cases"
        status: pass
    human_judgment: false
  - id: D4
    description: "The rule list is given the address: a password that contains it is not valid, and the same password is valid where no address is given"
    requirement: REG-13
    verification:
      - kind: unit
        ref: "PasswordSetter.svelte.test.ts — describe 'the address and the rule list', 2 cases; 'validate() › refuses a password that contains the address at the first field'"
        status: pass
    human_judgment: false
  - id: D5
    description: "validate() judges the password as typed without waiting for the rule list: two empty fields and a rule-breaking password are refused at the first field with focus there; a different confirmation at the second with focus there; a valid matching pair is accepted with no error; each error is an alert the control is described by while aria-invalid; editing a field removes its error and reset() empties both fields and both errors"
    requirement: REG-11
    verification:
      - kind: unit
        ref: "PasswordSetter.svelte.test.ts — describe 'validate()', 9 cases, none of which advances the validator's timer; describe 'editing and reset()', 6 cases"
        status: pass
    human_judgment: false
  - id: D6
    description: "onValidityChange still reports the verdict and the message as before"
    verification:
      - kind: unit
        ref: "PasswordSetter.svelte.test.ts — describe 'PasswordSetter validity and error message', the 4 cases the file held before, unchanged in what they assert"
        status: pass
    human_judgment: false
  - id: D7
    description: "The settings page passes the signed-in user's address and keeps its own button, label, messages and handler; the reset page and the legacy set-password page render the new setter unchanged in what they do; the sentence is reworded in seven locales; the fixture has expectFieldError"
    requirement: REG-13
    verification:
      - kind: other
        ref: "tests/e2e-runs/178-unit/178-11-t2-verify.sh — exit 0"
        status: pass
      - kind: e2e
        ref: "tests/e2e-runs/178-e2e/178-11-precommit — the full suite on the uncommitted tree, 444 of 444 in 116 projects; 178-verdict control … --full --same-projects-as 178-07-close --green: PASS"
        status: pass
    human_judgment: false
  - id: D8
    description: "The committed tree is green: seven gate rows at 0 and the full E2E suite with the predecessor's projects and totals"
    verification:
      - kind: other
        ref: "tests/e2e-runs/178-gates/178-11-close — typecheck, lint, unit, check-frontend, build, format, docs-links all 0; 178-verdict gates: PASS"
        status: pass
      - kind: e2e
        ref: "tests/e2e-runs/178-e2e/178-11-close — 444 of 444 in 116 projects, head 49dadc2fe; 178-verdict e2e 178-11-close --same-projects-as 178-07-close: PASS"
        status: pass
    human_judgment: false
  - id: D9
    description: "A password manager pairs the address field that is not rendered with the new password and offers to save the pair; a password that each of three browsers suggests on the form passes the rule list as suggested"
    verification: []
    human_judgment: true
    rationale: "No test can drive a password manager or a browser's password suggestion. The attributes they read are unit cases (D2, D3). Which managers honour a display: none user-name field and whether a suggestion built from the rule string passes the rule list are a person's checks, filed by plan 178-23 for plan 178-24."
  - id: D10
    description: "On a rendered screen: the two visible labels and the fields at phone width; a field's error under its control; the settings page's and the reset page's button, whose label is now a whole sentence while the password is not valid"
    verification: []
    human_judgment: true
    rationale: "The existing scans and specs ran green over the three pages, but none of them calls validate(), so no browser has rendered a field's error, and no phone-width check covers these pages. The error states are scanned by plans 178-21 and 178-22."

duration: 42min
completed: 2026-10-12
status: complete
---

# Phase 178 Plan 11: The Password Setter, Made a Form a Password Manager Can Read — Summary

**`PasswordSetter` is now one `POST` form with its own validation off that holds the account's address in a read-only user-name field that is not rendered, two labelled new-password fields with different names, an error at each field and a `validate()` that judges the password as typed; `PasswordField` takes a `passwordrules` string, which the setter builds from the validator's own rules. The settings page passes the address, one sentence is reworded in seven locales, and the full E2E suite was green on the uncommitted tree before the one commit and on the committed tree after it.**

## Read this first

- **Everything is green.** One commit for Tasks 1 and 2, as the plan lays out; Task 3 changes no file. All three verify blocks exit 0 as written. Both full runs are 444 of 444 in 116 projects, with `178-07-close`'s projects and totals.
- **The pre-commit run made me correct no expectation.** No fixture, spec or scan changed to pass; the only fixture change is the new step.
- **The predecessor label for the next full run is `178-11-close`** (head `49dadc2fe`).
- **The form keeps `items-center`**, which the contract's class list (`flex w-full flex-col gap-md`) does not name. The rule list (`PasswordValidator`, not this plan's file) is `w-full` with a margin of its own; in a stack that stretches its blocks it would sit one margin to the right of the form and overhang its right edge by one. Centring keeps it where it is today. That reading is from the classes, not from a rendered page. See *Decisions Made* 1.
- **The `autocomplete` prop of `PasswordSetter` is gone**, and `method` and `novalidate` are not props: no caller passed any of the three. See *Decisions Made* 2 and 3.
- **Two generated pages outside the plan's `files_modified` are in the commit, and the listing the plan names did not change**: the generator writes a page per component, and the listing holds only names. As in plans 178-09 and 178-10.
- **On three pages the main button's label is now a whole sentence while the password is not valid** — "The password does not meet the requirements above." — because those pages show the setter's message as their button's label and are not rebuilt here. Whether it wraps at 320 px was not looked at. See *For later plans*.
- **Items U-02, U-06, U-07 and U-25 were read by the operator on 2026-10-11 and stand at their recommended options**; all four are built so.
- **The todo `2026-10-02-password-validator-username-never-passed.md` is closable**: the rule list is given the address on the settings page, and will be on the gate and the reset page. Plan 178-23 moves it.

## Performance

- **Duration:** about 42 min, 25 of them the two full runs
- **Started:** 2026-10-12T20:14:16Z
- **Completed:** 2026-10-12T20:56Z
- **Tasks:** 3
- **Files modified:** 18 (none created)

## Task Commits

1. **Task 1: `PasswordSetter` as a form with an address, two named fields and `validate()`** — held in the working tree, as the plan's `<uncommitted_changes>` lays out; committed with Task 2
2. **Task 2: the settings page, the reworded sentence and the fixture step — held through a full run, then one commit** — `49dadc2fe` (feat), eighteen files
3. **Task 3: the gate rows and the full E2E run of the committed tree** — no file changed; its record is this summary

## Each task's verify command, with its real exit status

Each `<automated>` block was written byte for byte to `tests/e2e-runs/178-unit/178-11-t<N>-verify.sh` by a script and run with `bash`; its log, exit status and head are beside it. Every status below was read from the command itself, with its output redirected to a file.

| Task | Script | Exit | Notes |
|---|---|---|---|
| 1 | `178-11-t1-verify.sh` | 0 | On the working tree, before the commit. Its unit command has `--`, so the whole frontend suite ran: 216 files passed, 1 skipped; 4543 tests passed, 31 skipped |
| 2 | `178-11-t2-verify.sh` | 0 | At head `49dadc2fe`. Ends on the control verdict: PASS |
| 3 | `178-11-t3-verify.sh` | 0 | At head `49dadc2fe`. Gates: PASS, seven rows, not stale. E2E: PASS, not stale, no Sleep entry in the window, 116 projects compared and 0 not as expected |

The filtered unit run, by positional paths with no `--`: the two component directories, 2 files, 44 of 44.

Before the pre-commit run, each read from the command: `yarn workspace @openvaa/frontend check` 0 (2980 files, 0 errors, 0 warnings), `yarn typecheck:tests` 0, `yarn assert:i18n-catalog-namespaces` 0, `yarn assert:comment-hygiene` 0, `eslint` on the changed files 0, `prettier --check` on the changed directories 0, `yarn workspace @openvaa/docs generate:docs` 0, the whole frontend unit suite 0.

## Red before green

`tests/e2e-runs/178-unit/178-11-t1-red.{log,exit,head}`: exit 1; 25 of 44 failed, each an `AssertionError`. No failure was an import, compile or timeout failure.

- The run was made over the unchanged component with one inert stand-in, an exported `validate` that returns nothing, so that the nine `validate()` cases fail on what they expect and not on a missing function. The stand-in was replaced by the real function before anything was committed.
- A first red run (`178-11-t1-red-first.{log,exit}`) had 24 assertions and one `TypeError`: the order case called `compareDocumentPosition` on an address field that did not exist. The case now asserts the field's existence first; the run above is the one after that.
- The 19 that passed: the 13 cases the two files held before, and 6 new ones that hold of the unchanged component too — "is absent from the control by default" (`PasswordField`), "takes its id and its submit handler from its caller", "is absent without an address", "is absent with an empty address", "carry no error state before the form is judged" and "reports the same password as valid where no address is given".

Green after: 44 of 44 (`178-11-t1-green.log`). The files hold 31 new cases: 2 in `PasswordField.svelte.test.ts` (11 in the file) and 29 in `PasswordSetter.svelte.test.ts` (33 in the file).

## The component as built

### `PasswordSetter` — `$contestant/components/passwordSetter`

| Prop | Type | |
|---|---|---|
| `password` | `string` | bindable, default `''` |
| `username` | `string` | the account's address; held in the form and given to the rule list; never shown and never sent by the component |
| `onValidityChange` | `({ valid, errorMessage }) => void` | as before; follows the rule list's delayed display |
| any `<form>` attribute but `method`, `novalidate`, `autocomplete` | | onto the form; `class` is merged through `concatClass` |

Exports: `validate(): boolean`, `reset(): void`.

**The form.** `<form {...rest} method="POST" novalidate>` with the classes `flex w-full flex-col items-center gap-md`. `method` and `novalidate` come after the spread, so a caller's value for either is replaced by the component's; a unit case mounts it with `method: 'GET'` and `novalidate: false` and reads `POST` and no validation. An `id` and an `onsubmit` reach the form through the rest props. The component does not call `preventDefault`: that is its caller's handler. It holds no submit control.

**The address field**, rendered only when `username` is a non-empty string, and then the form's first control:

```html
<input type="email" name="username" autocomplete="username" value={username} readonly tabindex="-1" class="hidden" />
```

`hidden` is Tailwind's `display: none`. It has no label and no id.

**The order of the form's markup:** the address field; the sentence `contestantApp.setPassword.ingress` in a `<div class="mx-md self-stretch">` (no longer a `<p>`); `PasswordValidator`, now given `username`; the password block; the confirmation block.

**The two blocks**, each `<div class="gap-xs flex w-full flex-col">` carrying the test id it carried before (`password-setter-password`, `password-setter-confirmation`):

| | Password | Confirmation |
|---|---|---|
| label | `common.password`, `for` the control, `text-start` | `common.passwordConfirmation`, the same |
| control | `PasswordField` with `externalLabel`, `name="new-password"`, `autocomplete="new-password"`, `passwordrules` | the same with `name="new-password-confirmation"` and no `passwordrules` |
| control's id | `password-<uuid>` | `confirmation-<uuid>` |
| error | `ErrorMessage inline role="alert"`, id `<control id>-error`, test id `password-setter-password-error` | the same with `password-setter-confirmation-error` |

While a field's error is shown its control is `aria-invalid="true"` and its `aria-describedby` is the error's id. The control inside each block keeps `PasswordField`'s own test id, `password-field`.

**The rule string**, as rendered today: `minlength: 8; required: upper; required: lower; required: digit; required: special;`. The 8 is `minPasswordLength`, imported from `passwordValidation.ts`. The four `required:` tokens are not written as a list: the component asks `validatePasswordDetails('')` for its rules, keeps the keys that a small map names (`uppercase` → `upper`, `lowercase` → `lower`, `number` → `digit`, `symbol` → `special`) and writes one token for each, in the validator's order. A character rule removed from the validator leaves the string; a rule added under a key the map does not name is not stated until the map names it. The rule on the user name and the rule on repetition have no token: the first is not about characters and the second is not enforced by the validator.

**`validate()`** clears both errors, then asks `validatePasswordDetails(password, username ?? '').status` — the function the rule list itself calls, with the same address. On a refusal it sets `contestantApp.setPassword.passwordNotValid` at the first field, focuses that control and returns `false`. Otherwise, when the confirmation differs, it sets `contestantApp.setPassword.passwordsDontMatch` at the second, focuses that control and returns `false`. Otherwise it returns `true`. It reads neither `validPassword` nor `valid`, so it does not wait for the rule list's 200 ms.

**Editing.** Each field is bound through a function binding. An edit of the password removes the password's error and the mismatch; an edit of the confirmation removes the mismatch. `reset()` empties both fields and both errors.

**Kept as they were:** `valid`, `errorMessage`, the effect that calls `onValidityChange`, and the comment on the load-bearing equality.

### `PasswordField`, as changed

One more prop, `passwordrules?: string`, spread onto the control from an object (`{}` when not given, `{ passwordrules }` when given). `svelte-check` accepts the spread; the attribute is not in Svelte's type for an `<input>`, which is why it is not written as an attribute. Nothing else of the field changed.

### The three pages that render the setter

| Page | Changed here | What a user meets |
|---|---|---|
| the entity's settings page | passes `username={contestantCtx.user?.email}`, read in the markup | visible labels, no placeholders; the rule list now refuses a password that contains their address; the button's label while the password is not valid is the reworded sentence |
| `password-reset` | nothing | visible labels, no placeholders; no address field (it passes none); the same button label |
| `register/password` (the legacy set-password page) | nothing | the same as `password-reset` |

None of the three calls `validate()`, so none shows a field's error. Their buttons stay outside the form with their own handlers and stay unavailable until `onValidityChange` reports a valid pair.

### The reworded sentence

`contestantApp.setPassword.passwordNotValid`, the key unchanged:

| Locale | Was | Is |
|---|---|---|
| en | Password is not valid | The password does not meet the requirements above. |
| da | Adgangskoden er ikke gyldig | Adgangskoden opfylder ikke kravene ovenfor. |
| et | Parool ei ole kehtiv | Parool ei vasta ülaltoodud nõuetele. |
| fi | Salasana ei ole kelvollinen | Salasana ei täytä yllä olevia vaatimuksia. |
| fr | Le mot de passe n’est pas valide | Le mot de passe ne répond pas aux exigences ci-dessus. |
| lb | Passwuert ass net valabel | D’Passwuert erfëllt d’Reegelen hei uewen net. |
| sv | Lösenordet är ogiltigt | Lösenordet uppfyller inte kraven ovan. |

The English is the contract's. The other six are mine, each using the noun its own locale's `ingress` uses for the requirements (Luxembourgish *Reegelen*, the others their word for *requirements*). They are constructed strings: none was read by a native speaker.

### The fixture

`contestantPasswordSetter.fixture.ts` gains `expectFieldError(field: 'password' | 'confirmation')`: the field's error is visible and the control inside the field's block is `aria-invalid="true"`. It exports the type `PasswordSetterField`. No committed spec calls it. `setPassword` and `expectNotVisible` are unchanged. The file's header, which named test ids that no longer exist, describes the three steps as they are.

## The two full runs

| | `178-11-precommit` | `178-11-close` |
|---|---|---|
| tree | uncommitted: the eighteen held files over head `124746bbe` | committed, head `49dadc2fe` |
| made by | `tests/scripts/e2e-run.sh --run-dir … --no-db-reset`, directly | `178-e2e.sh 178-11-close` |
| window (UTC) | 20:23:58 to 20:36:26 | 20:41:01 to 20:53:22 |
| Docker VM free before | 16.39 GiB | 16.38 GiB |
| power | AC, 100 % | AC, 100 %; no Sleep entry in the window |
| wrapper status | 0 | 0 |
| counts | 444 passed of 444; 0 failed, flaky, skipped, did not run | the same |
| against `178-07-close` | 116 projects compared, 0 not as expected | 116 projects compared, 0 not as expected |
| verdict | `control … --full --same-projects-as 178-07-close --dirty-only … --green`: PASS, exit 0 | `e2e 178-11-close --same-projects-as 178-07-close`: PASS, exit 0 |

No run was void, red or made again. The eighteen held files as the pre-commit run ran them are kept beside it as `tests/e2e-runs/178-e2e/178-11-precommit.<path>.kept`; the commit script compared each with the working tree before it committed, and all were equal.

The standing `TypeError: Cannot read properties of undefined (reading 'map')` of `Input.svelte` is in the closing run's dev-server log once, as in every full run. Neither run's dev-server log names `PasswordSetter`, `PasswordField`, `passwordrules` or a hydration mismatch.

## The gate rows

`tests/e2e-runs/178-gates/178-11-close`, at head `49dadc2fe`; `178-verdict gates 178-11-close --rows …`: PASS.

| Row | Exit | Seconds |
|---|---|---|
| typecheck | 0 | 23 |
| lint | 0 | 60 |
| unit | 0 | 85 |
| check-frontend | 0 | 10 |
| build | 0 | 17 |
| format | 0 | 21 |
| docs-links | 0 | 2 |

## Decisions Made

1. **The form is `flex w-full flex-col items-center gap-md`.** The contract's list has no `items-center`, and the three numeric classes are gone as it asks (`m-0`, `my-0`, `gap-6`). `PasswordValidator`'s root is `m-sm flex w-full flex-col`: as wide as its container plus a margin on each side. Centred, as today, its box sits exactly on the form's edges. In a stack that stretches, a block with an explicit full width starts after its left margin and so ends one margin beyond the form's right edge. `PasswordValidator` is not this plan's file and takes no class from a caller (it discards its rest props). Keeping the centring changes nothing a user sees of the rule list; the two field blocks are `w-full` and the sentence is `self-stretch`, so they fill the form either way.
2. **`method="POST"` and `novalidate` cannot be replaced by a caller.** They are written after the spread and left out of the props type. The threat the plan names — a form with no method posting a password into the address bar before the script loads — is closed for every caller only if no caller can undo it.
3. **The `autocomplete` prop is removed.** It let a caller turn both fields into something other than `new-password`, which the plan's truths forbid, and a caller that passed the token for a current password would have made the setter ask for one. `git grep` found no caller passing it.
4. **A mismatch goes when either field is edited.** The plan asks that editing a field removes that field's error. "Passwords don't match" is a statement about both fields: left standing after the user has corrected the first, it would be false. `EmailEntry` does the same.
5. **One error at a time.** With a password that breaks a rule and a different confirmation, only the first field is in error: the confirmation cannot be judged against a password that has to change.
6. **The test ids of the two blocks stay where they were.** The plan says the existing ids of the two controls stay; the ids were on the `<div>` around each `PasswordField`, and the fixture reaches each control as `password-field` inside that block. They are now on the field blocks, which also hold the label and the error.

## Deviations from Plan

### Auto-fixed Issues

None. No bug, missing piece or blocker was met.

### Other departures, none of them a fix

1. **Two generated pages outside `files_modified` are in the commit; the listing in `files_modified` is not.** `generate:docs` rewrote `generated/contestant/components/passwordSetter/PasswordSetter/+page.md` and `…/passwordField/PasswordField/+page.md` from the two docblocks. `generated/+page.md` lists names and import lines only and did not change. Both pages are under `apps/docs/`, which the control's `--dirty-only` names.
2. **The unit runs of the two directories were made without `--`**, as the dispatch rules say. The verify block's own command has it and ran the whole suite, with the same verdict.
3. **The kept copies are named by path, not by file name.** Seven of the held files are named `contestantApp.setPassword.json` and two `+page.md`, so `<label>.<file name>.kept` would have kept one of each.
4. **Two file headers were rewritten because the edit touched them.** The test file's header told the history of an earlier phase and named its decision ids; the fixture's header named three test ids that do not exist. Both describe the file as it is. The type file's comment on `onValidityChange` lost its sentence on what the callback replaced.
5. **Tasks 1 and 2 share one commit**, which is the plan's own design, and Task 3 has none of its own: "each task committed individually" is met as far as the plan allows.

**Total deviations:** 0 auto-fixed; 5 departures and 6 decisions recorded. **Impact:** none on scope. The three decisions that narrow the component's props (2, 3) or add to its behaviour (4) are each within what the plan's truths and prohibitions state.

## Issues Encountered

None.

## The code-review checklist

| Item | Outcome |
|---|---|
| Solves what it sets out to | Yes: the form, the address, the names, the errors, `validate()`; unit cases for each and two green full runs |
| OWASP top 10 | The form cannot be posted by `GET`. The address is rendered as an attribute value and the messages are catalogue strings rendered as text. Nothing is sent by the component. No new route, endpoint or storage |
| Code style guide | Followed; `prettier` and `eslint` at 0 |
| No `any` | None. The test harness casts the mounted component to its two exports and passes its props `as never`, as the file's neighbours do |
| No repeated code | The field block is written twice in the component, once per field, as `PasswordSignIn` writes it once; there is no shared labelled-password component to reuse and the plan adds none. The rule string reads the validator instead of restating it |
| New entities documented | The two props and the two exports have TSDoc; both docblocks are rewritten or extended; the README row and the generated pages follow |
| Repo documentation | The component library's README and the generated pages are updated. One Developers' Guide page is now out of date and is left for plan 178-23 (*For later plans*) |
| Tracking events | No user function is added by this plan |
| Svelte component guidelines | `$props()` typed by the co-located type file, `concatClass`, the barrel unchanged, the `@component` docblock |
| Errors handled and logged | `ErrorMessage` logs each field error it shows with `log.error`. `validate()` cannot throw |
| Failing checks | None: seven gate rows at 0 |
| Shared dependants | `PasswordField` is also the Admin login's input: it passes no `passwordrules`, and a unit case mounted with its props holds that the attribute is absent. The three pages that render the setter ran green in both full runs |
| WCAG A and AA | Both fields have a visible label tied by `for`; errors are alerts tied to their controls; the address field is `display: none`. The existing scans over the settings page and the set-password state passed in both runs. The error states have not been scanned (no page shows one yet) |
| Keyboard and screen reader | The address field is no tab stop. `validate()` moves focus to the field in error. Not walked in a browser |
| Guides | See "Repo documentation" |
| Comment hygiene | `yarn assert:comment-hygiene` 0; every touched comment was read, and three that told history were rewritten |
| Commit history | One commit, conventional subject |
| No fix of itself | None |
| Formatting-only changes | None |
| `[db]` | No database change |

## Prohibitions

| Id | Verdict | Evidence |
|---|---|---|
| PROH-178-31 | Holds | The file holds no token for a current password (Task 1's verify refuses one); the address goes to an attribute and to `validatePasswordDetails` and nowhere else; its input is `readonly`, `tabindex="-1"` and `display: none`, each a unit assertion |
| PROH-178-32 | Holds | `passwordValidation.ts` is not in the commit; `validate()` and the rule list call the same `validatePasswordDetails` with the same two arguments |
| PROH-178-33 | Holds | Nothing was committed between head `124746bbe` and the green full run `178-11-precommit`; the commit script compared every held file with the copy the run ran |

## Observed, and inferred

- **Observed:** every exit status and count above; the attributes, order, errors and focus of the component in jsdom; that `svelte-check` accepts the `passwordrules` spread; that the three pages and the two scans that reach the setter are green in a browser with the new markup, twice.
- **Inferred, not observed:**
  - that a stretched stack would move the rule list (*Decisions Made* 1) — read from the classes;
  - that the address field is outside the accessibility tree and unseen by axe — from `display: none`; the scans that passed include the settings page, which now holds the field;
  - that Enter in one of the two fields submits nothing on the three existing pages — a form with two or more such fields and no submit button has no implicit submission; and that it will submit once a page ties a `type="submit"` button to the form by `form`;
  - that a suggestion built from the rule string passes the rule list — the browser's `special` set and its ASCII letters are each inside what the validator's symbol and letter rules accept.

## Not done, or not verified

- **No password manager and no browser's password suggestion was tried.** Both are a person's checks (the contract's N-6 and N-7), which plan 178-23 files for plan 178-24. The plan's backstop truth — a password each of three browsers suggests passes the rule list as suggested — rests on them.
- **No browser has rendered a field's error of the setter**: no page calls `validate()` yet. Plans 178-14 and 178-19 are the first; plans 178-21 and 178-22 scan the states.
- **The button label at phone width** on the settings page, the reset page and the legacy set-password page (*For later plans*).
- **The Developers' Guide page `contestant-app/password-validation` is out of date** and was not edited: it is outside this plan's files, and plan 178-23 owns the documentation.
- **The components skill's counts were not updated**: this plan adds no component, but `PasswordSetter` now calls `concatClass` (by `git grep -l concatClass` the tree has 70 files in the three directories and 77 across `apps/frontend/src`). `audit-skill-links.sh components` exits 0.
- **`requirements-completed` copies the plan's two ids** as the template asks. This plan builds the setter's share of REG-13 and of REG-11 and no screen; whether either is complete is the orchestrator's to mark.

## The state the local stack is left in

As two full E2E runs leave it: the stack up, the suite's own project seeded and torn down by its own setups, and the rows no teardown removes (`private.invitation_link_witness`) present, so `39-invitations.test.sql` test 238 would be red until the next reset — the known finding. No reset, no restart, no probe and no pgTAP run was made. Docker VM free space after: 16.38 GiB at the last reading. Nothing listens on port 5273; no run is in flight.

## For later plans

- **Predecessor label for the next full run: `178-11-close`** (444 tests, 116 projects, head `49dadc2fe`).
- **178-14 (F) and 178-19 (password-reset) — mounting the setter.**
  ```svelte
  <PasswordSetter id={formId} username={address} bind:password bind:this={setter} onsubmit={handleSubmit} />
  …
  <Button type="submit" form={formId} variant="main" text={t('contestantApp.setPassword.setPassword')} />
  ```
  ```ts
  let setter: PasswordSetter | undefined = $state();
  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (!setter?.validate()) return;
    …
  }
  ```
  - `preventDefault()` is the page's: the component passes `onsubmit` on and does nothing else with the event. The form is `method="POST"` with no action, so a submit the page does not prevent posts to the page's own address.
  - `validate()` has already shown the error and moved focus when it returns `false`; the page adds nothing.
  - **There is no `autocomplete` prop, and `method` and `novalidate` are not props**: passing one is a type error.
  - `class` is merged, so `class="max-w-md"` works. The form is `w-full` and centres its blocks.
  - `onValidityChange` still works and is not needed by a page that calls `validate()`.
  - **A page that tests itself with the real setter** needs the `window.matchMedia` stub the setter's own test file has (`svelte/motion` reads it at import), and fake timers only if it reads `onValidityChange`.
- **The address.** With `username` the form holds `input[name="username"]`; without it, or with `''`, it holds none. In a spec: `toHaveValue(address)`, `toBeHidden()`, `toHaveAttribute('readonly', '')`, through a fixture step. The component shows the address nowhere: "Signed in as" is the page's.
- **Test ids.** `password-setter-password` and `password-setter-confirmation` are the two field blocks (label, control, error); the control in each is `password-field`; the errors are `password-setter-password-error` and `password-setter-confirmation-error`. `contestantPasswordSetter.expectFieldError('password' | 'confirmation')` asserts an error and its control's `aria-invalid`.
- **178-14, 178-19 — `setPassword(password)` of the fixture presses `set-password-submit`** after filling both fields. A page that keeps that test id on its submit button keeps the step.
- **Each field error writes one console error line** (`ErrorMessage` logs with `log.error`), as plan 178-09 noted.
- **178-16 (deleting the legacy set-password page), 178-19 (rebuilding the reset page):** both pages render the new setter unchanged today and pass no `username`.
- **178-21, 178-22 — to look at on rendered screens:**
  1. **The main button's label on the settings page**, which the contract keeps, is "The password does not meet the requirements above." while the password is not valid — 50 characters in English and 54 in French, where it was 21 and 32. Whether a `variant="main"` button wraps or overflows at 320 px with it is the contract's N-2 and was not looked at. The reset page and the legacy page show the same until they are rebuilt and deleted.
  2. The two labels are `text-start` over full-width controls, while the sentence above the rule list keeps its `mx-md` inset and the rule list its own margins: three left edges in one form.
  3. A field's error is centred text (`ErrorMessage inline`) under a start-aligned label, as plan 178-09 noted for the other fields.
  4. The rule list's width and margins (*Decisions Made* 1), should a later plan want the stack to stretch: the change belongs in `PasswordValidator`.
- **178-23 — documentation now out of date:**
  - `apps/docs/…/developers-guide/contestant-app/password-validation/+page.md`: the sentence "`PasswordSetter` renders `PasswordValidator` without a username, so on the three password pages the `username` requirement is always met" is false for the settings page; its *Flow* steps 2 and 3 do not know `validate()` or the field errors; its opening says the setter is "a `PasswordValidator`, a password field and a confirmation field".
  - The components skill's `concatClass` counts (one more file: `PasswordSetter.svelte`).
  - The native-speaker review todo takes the six constructed sentences of `contestantApp.setPassword.passwordNotValid` tabled above.
  - The todo `2026-10-02-password-validator-username-never-passed.md` is closable.
  - For the person's list of plan 178-24: which managers pair a `display: none` user-name field with the new password (N-6), with the visible read-only field as the fallback, located in `PasswordSetter.svelte` alone; and a suggested password in each browser against the rule list (N-7), given the rule string above.
- **Timing on this host today:** the two component directories' unit tests under 1 s and the whole frontend unit suite 12 s, by vitest's own count; `svelte-check` 10 s; the seven gate rows 3 min 38 s (the `unit` row, every workspace, 85 s); one full E2E run about 12 min 25 s.

## Threat register

| Id | Disposition | What was done |
|---|---|---|
| T-178-61 | mitigated in the markup; a person's check remains | the form's first control is the read-only `username` field before the two `new-password` fields, each attribute a unit assertion; which managers read a field that is not rendered is filed for plan 178-24 |
| T-178-62 | mitigated | `method="POST"` is written after the spread and is not a prop; a unit case passes `GET` and reads `POST` |
| T-178-63 | accepted, as planned | nothing widened: no route added, and the setter asks for no less than before |
| T-178-64 | mitigated | `validate()` calls `validatePasswordDetails` with the address, as the rule list does; `passwordValidation.ts` is unchanged |
| T-178-65 | mitigated | the full suite green on the uncommitted tree, then on the committed tree |
| T-178-66 | mitigated in the component | each field says its own error, tied to it and announced; the pages that stop greying their buttons are plans 178-14 and 178-19 |
| T-178-SC | accepted | no package was installed |

No security-relevant surface outside the plan's threat model was added.

## Known Stubs

None. `validate()` and `expectFieldError` are complete; that no page and no spec calls them yet is the plan's own boundary.

## Next Phase Readiness

Plans 178-14 and 178-19 can build the set-password gate and the reset page on this form. No blocker.

## Self-Check: PASSED

- The 18 modified files exist and are tracked (`git ls-files --error-unmatch` on each, exit 0).
- The commit is an ancestor of HEAD: `49dadc2fe`.
- `git rev-list --count 124746bbe..HEAD` at the time of writing: 1.
