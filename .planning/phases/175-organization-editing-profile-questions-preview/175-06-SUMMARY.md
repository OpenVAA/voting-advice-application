---
phase: 175-organization-editing-profile-questions-preview
plan: 06
subsystem: ui
tags: [svelte, input, a11y, aria, i18n, colour, required-locale, tdd]

requires:
  - phase: 175-organization-editing-profile-questions-preview (plan 01)
    provides: each Input part owns its element references and exports focus(); the guard file; the phase drivers
  - phase: 175-organization-editing-profile-questions-preview (plan 04)
    provides: missingRequiredLocale; the keys components.input.requiredLocaleInfo, .colorPicker, .noColor and .error.invalidColor in seven locales
  - phase: 175-organization-editing-profile-questions-preview (plan 05)
    provides: the per-project E2E baseline 175-05-close the slice is compared with
provides:
  - "Input prop requiredLocale for the kinds text-multilingual and textarea-multilingual"
  - "Input kind type: 'color' — value lowercase #rrggbb or nothing"
  - "the ids {id}-info and {id}-error, aria-describedby on every control, role=alert and aria-invalid for an error, aria-required on a required single-control kind"
  - "lang on each locale's field and language label"
  - "an inline ErrorMessage whose emoji is aria-hidden"
  - "part props: describedBy on all four parts, requiredLocale on MultilingualTextPart, required on SelectMultiplePart, invalid on ImagePart"
affects: [175-08, 175-09, 175-12, 175-13, 179]

actuals:
  tokens: 20014 # chars/4 over the four commits' diff outside .planning/ (80055 chars)
  tasks: 2
  commits: 4 # MEASURED: git rev-list --count 5f99944f3..bdd69de77, before this file's own commit
plan_head_before: 5f99944f3b627534309ac3479226145862810dc3
plan_head_after: bdd69de77fc6a0871fe0048e61de2de6abd5aacd

tech-stack:
  added: []
  patterns:
    - "Input renders the info line and the inline error and hands their ids to a part as describedBy; a part sets it on each control it renders"
    - "A single-control kind takes its description, error state and required state from one spread, placed before the caller's rest props so that a caller's own attribute wins"
    - "A colour is painted from the parsed committed value alone; the text in the field is a separate piece of state"

key-files:
  created:
    - apps/frontend/src/lib/components/input/Input.requiredLocale.svelte.test.ts
    - apps/frontend/src/lib/components/input/Input.described.svelte.test.ts
    - apps/frontend/src/lib/components/input/Input.color.svelte.test.ts
    - apps/frontend/src/lib/components/errorMessage/ErrorMessage.svelte.test.ts
  modified:
    - apps/frontend/src/lib/components/input/Input.svelte
    - apps/frontend/src/lib/components/input/Input.type.ts
    - apps/frontend/src/lib/components/input/parts/MultilingualTextPart.svelte
    - apps/frontend/src/lib/components/input/parts/MultilingualTextPart.type.ts
    - apps/frontend/src/lib/components/input/parts/SelectMultiplePart.svelte
    - apps/frontend/src/lib/components/input/parts/SelectMultiplePart.type.ts
    - apps/frontend/src/lib/components/input/parts/MultipleTextPart.svelte
    - apps/frontend/src/lib/components/input/parts/MultipleTextPart.type.ts
    - apps/frontend/src/lib/components/input/parts/ImagePart.svelte
    - apps/frontend/src/lib/components/input/parts/ImagePart.type.ts
    - apps/frontend/src/lib/components/input/parts/README.md
    - apps/frontend/src/lib/components/input/PreviewAllInputs.svelte
    - apps/frontend/src/lib/components/input/Input.focusReturn.svelte.test.ts
    - apps/frontend/src/lib/components/errorMessage/ErrorMessage.svelte

key-decisions:
  - "The InputProps union took its fifteenth member: svelte-check reports 0 errors and 0 warnings and the union still discriminates, so no sibling component was built"
  - "A cleared colour is emitted as undefined, as the number kind emits a cleared number"
  - "The image kind's description goes on the button that opens the file dialog as well as on the hidden file input; nothing of the image kind is aria-required, because a button cannot be"
  - "aria-invalid is set where an error can show: the single-control kinds and the image kind's file input; the three other parts carry no invalid prop, because their kinds raise no error"
  - "The row label of the single-row kinds gets an id for the colour kind alone, so the other kinds' label markup is what it was"

patterns-established:
  - "A new Input part takes describedBy and sets it as the aria-describedby of each of its controls (parts/README.md)"

requirements-completed: []

coverage:
  - id: D1
    description: "requiredLocale: the badge judged on one locale's entry, that locale's field on screen while translations are hidden, the field order, the visible language labels, the required-language line, aria-required on the required field; nothing changed without the prop"
    requirement: GEN-01
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/components/input/Input.requiredLocale.svelte.test.ts (19 cases; with Input.described 87: red 46 failed / 41 passed at 08b86e839, green 87 passed at 2499cf443)"
        status: pass
    human_judgment: false
  - id: D2
    description: "lang on each locale's field and language label, for both multilingual text kinds and the multilingual row list"
    requirement: GEN-01
    verification:
      - kind: unit
        ref: "Input.requiredLocale.svelte.test.ts — the three `the language of a locale field` cases"
        status: pass
      - kind: e2e
        ref: "contestant-a11y-scan 22/22 in tests/e2e-runs/175-e2e/175-06-a11y-slice (the attribute on the candidate pages' multilingual inputs)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The info line and the inline error are each control's description, joined to the caller's own; an error is role=alert and marks its control invalid; a required single-control kind is aria-required"
    requirement: GEN-01
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/components/input/Input.described.svelte.test.ts (68 cases over fourteen kinds)"
        status: pass
      - kind: e2e
        ref: "contestant-a11y-scan 22/22 in 175-06-a11y-slice"
        status: pass
    human_judgment: false
  - id: D4
    description: "The colour kind: stored, absent and unparsable values; typed, picked and cleared values; an entry that is not a hex colour; the locked states; the controls' names"
    requirement: GEN-01
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/components/input/Input.color.svelte.test.ts (39 cases; with ErrorMessage 42: red 41 failed / 1 passed at 67eee2ddf, green 42 passed at bdd69de77)"
        status: pass
    human_judgment: false
  - id: D5
    description: "An inline ErrorMessage speaks its sentence alone, with the same text content"
    requirement: GEN-01
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/components/errorMessage/ErrorMessage.svelte.test.ts (3 cases)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The colour row and a required-locale field as a browser paints them: the swatch's 44px hit area, the focus ring on its wrapper in both themes, the platform picker opened from the keyboard, a locale stack with every locale expanded"
    verification: []
    human_judgment: true

duration: 30min
completed: 2026-10-08
status: complete
---

# Phase 175 Plan 06: `Input` Requires One Language, Holds a Colour and Describes What It Shows — Summary

**`Input` gained the `requiredLocale` prop, the `color` kind and the programmatic associations it lacked (`aria-describedby`, `aria-invalid`, `role="alert"`, `aria-required`, `lang`), and `ErrorMessage`'s inline emoji is hidden from assistive technology — each shown red before it was built (46 of 87 cases, then 41 of 42), with the six gate rows at 0 and the contestant axe scans 22/22 over the changed markup. The `InputProps` union took its fifteenth member, so no fallback component was built. Neither new feature is rendered by a page yet: the colour row has been seen by jsdom only.**

## Performance

- **Duration:** about 30 min (16:39Z → 17:09Z)
- **Tasks:** 2 of 2
- **Files:** 4 created, 14 modified (18 in all; 1304 lines added, 62 removed)

## Task Commits

1. **Task 1, red** — `08b86e839` `test(175-06): Input's per-locale required rule and its programmatic associations` (2 files)
2. **Task 1, green** — `2499cf443` `feat(175-06): Input judges required on one locale, marks its locale fields' language and describes its controls` (10 files)
3. **Task 2, red** — `67eee2ddf` `test(175-06): Input's colour kind and the inline error's accessible text` (2 files)
4. **Task 2, green** — `bdd69de77` `feat(175-06): Input's colour kind, and an inline error that speaks its sentence alone` (6 files)

Each was made by pathspec. No other agent's commit sits between them. `bdd69de77` replaces `bed47a092`, which was amended once before any gate ran (deviation 9).

## Each task's verify command, with its real exit status

Evidence under `tests/e2e-runs/175-unit/` as `175-06-t<N>-verify.sh` / `.log` / `.exit` / `.head`. Both chains were run exactly as the plan writes them, not through a pipe.

| Verify | Head | Exit | What it showed |
|---|---|---|---|
| **Task 1, as written** | `2499cf443` | **0** | the seven searches; red head before green head; the two test files identical at the two heads; red 46 failed / 41 passed, every failure an `AssertionError`; green 87 / 87; `vitest run src/lib/components/input` 4 files, 112 passed; `check` 2128 files, 0 errors, 0 warnings; ESLint; comment hygiene 0 violations |
| **Task 2, as written** | `bdd69de77` | **0** | the three searches and the two negative ones; red head `67eee2ddf` before the commit that changed `ErrorMessage.svelte`; green 42 / 42; `vitest run` over both directories 6 files, 155 passed; comment hygiene; `gates 175-06-close --rows …` PASS; the same verdict without `--rows` non-zero; `e2e 175-06-a11y-slice …` PASS |

One search **inside Task 1's action** (not in its verify) does not work on this host, see deviation 1.

## Gates and runs

**Gate rows `175-06-close`** — `tests/e2e-runs/175-gates/175-06-close`, head `bdd69de77`, `TURBO_FORCE=true`, driver exit 0, 19:59:59 → 20:02:48 local, on AC power, no Sleep entry in the window.

| Row | Exit | Seconds | Numbers |
|---|---|---|---|
| typecheck | 0 | 18 | 23 turbo tasks |
| lint | 0 | 44 | `yarn lint:check`, every link |
| unit | 0 | 65 | 25 turbo tasks; frontend **172 files passed, 1 skipped; 2838 tests passed, 11 skipped** (2708 at `175-05-close`, +130: 87 + 42 + 1); dev-seed 1037; the harness's own 7 files / 102 tests |
| check-frontend | 0 | 8 | 2761 files, 0 errors, 0 warnings |
| build | 0 | 15 | 14 turbo tasks |
| format | 0 | 18 | |

- `node 175-verdict.mjs gates 175-06-close --rows typecheck,lint,unit,check-frontend,build,format` → **exit 0, PASS** (`175-06-close.verdict.txt`).
- `node 175-verdict.mjs gates 175-06-close`, without `--rows` → **exit 1**: `FAIL the run holds 6 row(s) 'typecheck,lint,unit,check-frontend,build,format', not the full gate set of 14; a subset run is judged with --rows` (`175-06-close.refusal-full-set.txt`). Ruling 6 is observed.
- `175-verdict.mjs scope` and `… hygiene` both exit 0 at `bdd69de77`.

**Slice `175-06-a11y-slice`** — `tests/e2e-runs/175-e2e/175-06-a11y-slice`, head `bdd69de77`, through `175-e2e.sh 175-06-a11y-slice --project contestant-a11y-scan`, driver exit 0, wrapper exit 0, 17:03:21Z → 17:04:20Z.

- **30 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run; 6 projects.** `contestant-a11y-scan` 22/22, `auth-setup` 2, `data-setup-base` 1, `data-setup-entity-selection` 3, `data-teardown-base` 1, `data-teardown-entity-selection` 1 — each equal to its total in `175-05-close`.
- Preflight 1 success, 0 failures; no void marker; largest heartbeat lateness 55 ms; no Sleep entry in the window; the dev-server log holds no Svelte warning.
- Verdict, taken at once: `node 175-verdict.mjs e2e 175-06-a11y-slice --allow-slice --same-projects-as 175-05-close --expect-project contestant-a11y-scan` → **exit 0, PASS** (`175-06-a11y-slice.verdict.txt`).

No run was void and none was red. No full default run was made, as ruling 5 says; plan 175-08's is this plan's boundary proof.

## What was built — every name

### `Input`

```ts
// Input.type.ts — InputPropsBase
requiredLocale?: TValue extends LocalizedString ? string : never;

// Input.type.ts — InputProps, the fifteenth member
| ({ type: 'color' } & InputPropsBase<string>)
```

`requiredLocale` **is in effect** when `required` is true, the kind is `text-multilingual` or `textarea-multilingual`, and the prop names a supported locale. Only then:

- `showRequired` is `!!required && missingRequiredLocale(value, requiredLocale)`. Otherwise it is `!!required && isEmptyValue(value)`, character for character. No clause about a disabled input is in either branch.
- the info line gains `t('components.input.requiredLocaleInfo', { language: t('lang.<locale>') })` after the multilingual line, and only with more than one supported locale. `multilingualInfo` keeps its text and its default; `multilingualInfo=""` leaves the required-language sentence alone on the line.
- `MultilingualTextPart` is handed the locale.

Attributes and ids `Input` renders for every caller:

| What | Where |
|---|---|
| `id="{id}-info"` | the info `<div>` |
| `id="{id}-error"`, `role="alert"` | the inline `ErrorMessage`; its test id `input-error` is unchanged |
| `aria-describedby` | every control: the caller's own `aria-describedby` first, then `{id}-info` and `{id}-error`, each only while rendered; absent when there is none |
| `aria-invalid="true"` | the control of a single-control kind, and the image kind's file input, while the error shows |
| `aria-required="true"` | the control of a `required` single-control kind: `text`, `url`, `email`, `textarea`, `number`, `date`, `boolean`, `select`, `select-multiple`, `color` |
| `lang={locale}` | each locale's field and its language label, in `MultilingualTextPart` and in a multilingual `MultipleTextPart` row |

The caller's `aria-describedby` is read from the props by name and no longer travels in the rest props. A caller's own `aria-invalid` or `aria-required` still wins, because `Input`'s come before the rest-props spread.

### The `color` kind

Inline in `Input.svelte`, in the row of single-row kinds, between `select` and the generic `<input>`. No part renders it.

- **Value:** in, any string; shown and painted only when `parseColorString` reads it and the result is `#` and six hex digits. Out, through `onChange`: lowercase `#rrggbb`, or `undefined` for no colour. Nothing is emitted on mount, whatever the stored value.
- **Typed grammar** (ruling 3): after trimming surrounding whitespace, `#` or no `#` and three or six hexadecimal digits. `rgb(…)`, a name, five digits or anything longer is an invalid entry.
- **Ids:** hex field `{id}` (labelled by the row label through `for`), picker `{id}-picker`, picker label `{id}-picker-label` (sr-only, `components.input.colorPicker`), row label `{id}-label`. The picker is `aria-labelledby="{id}-label {id}-picker-label"`.
- **Hex field:** `type="text"`, `maxlength="7"`, `spellcheck="false"`, `autocapitalize="off"`, `autocomplete="off"`, no placeholder even when the caller passes one. **The caller's rest props are spread onto it**, so `data-testid="profile-color-hex"` passed to `Input` lands on the hex field; none is set otherwise.
- **Swatch:** a 24px round `aria-hidden` element, `border-md border-secondary`, `border-dashed` and no background while there is no colour; its `background-color` is set by a style directive from the committed colour alone. Its wrapper is `min-h-touch min-w-touch` with `focus-within:ring focus-within:ring-offset-2`, and holds the transparent `<input type="color">` over it. The picker opens at `#808080` when there is no colour and emits nothing until a colour is chosen.
- **An invalid entry:** no change emitted; the field keeps the typed text and is `aria-invalid`; the swatch and the picker keep the committed colour; the inline error (`components.input.error.invalidColor`) is `role="alert"` with the id the field's `aria-describedby` names. A valid entry, an empty field or a picked colour clears all three; a picked colour also replaces the typed text.
- **Locked:** with a colour, both controls `disabled`, the lock badge, the value and swatch shown. With none, the text `components.input.noColor` in `text-secondary` and the lock badge; no field, no picker, no swatch. The rule is `disabled || locked`, as `ImagePart`'s is.
- **No new test id, token, colour, icon or component**, and no arbitrary Tailwind value. The built stylesheet holds every class the row uses (`--spacing-touch: 2.75rem`, `--spacing-24: 1.5rem`).

### The parts

| Part | New props (each documented in its `.type.ts`) |
|---|---|
| `MultilingualTextPart` | `requiredLocale?: string` — rendered while translations are hidden, placed second, `aria-required`; `describedBy?: string` |
| `MultipleTextPart` | `describedBy?: string` |
| `SelectMultiplePart` | `required?: boolean` — `aria-required` on the dropdown; `describedBy?: string` |
| `ImagePart` | `describedBy?: string` — on the button and on the file input; `invalid?: boolean` — `aria-invalid` on the file input |

`MultilingualTextPart` now iterates the rendered locales, keyed by locale, in the order displayed, required, the rest. The language labels are visible (and the textarea variant takes its top padding and joined corners) whenever more than one field is rendered, which without the prop is exactly "while translations are shown".

### `ErrorMessage`

Inline variant: `<span class="text-error text-center"><span aria-hidden="true">{emoji}</span> {effectiveMessage}</span>`. Nothing else changed. The element's text content is the emoji, a space and the message, as before.

### `PreviewAllInputs`

One multilingual example with `required requiredLocale="en"` and a value in Finnish only, and one `type="color"` example.

## Task 1 — the cases that were red, and the controls

**Red at `08b86e839`** (`175-06-required-red.json`, exit 1): 87 cases, **46 failed, 41 passed**, every failure an `AssertionError`.

- Failed, `Input.described` (34 of its 68): the info line as the description of every control, one case per kind (14) and for the fields the toggle reveals (1); joined to the caller's own for seven kinds (7); the error announced, described and marked for `url` and `email` (2) and for a refused image file (1); `aria-required` on the nine single-control kinds (9).
- Failed, `Input.requiredLocale` (12 of its 19): the required locale's field rendered second under visible labels, for both kinds (2); the badge while the required entry is blank (1); the badge leaving when the entry is committed (1); the field order and that no field moves (1); one field when the required locale is the displayed one (1); the info line ending with the required language (1) and that sentence alone with `multilingualInfo=""` (1); one supported locale (1); `lang` for the two text kinds and the row list (3).
- Passed (41), which is the "no change without the prop" proof. In `Input.requiredLocale` (7): no badge when any locale holds text, and one field until the toggle; the badge on an empty value, editable and locked (2); today's info line; an unsupported `requiredLocale`; `requiredLocale` without `required`; and no badge once the required entry alone holds text, which the whole-value rule also gives. In `Input.described` (34): no description when there is no info line; the caller's description passed through alone; no control `aria-invalid` without an error (14 kinds); no control `aria-required` when the input is not (14 kinds); no one field of a multilingual or multi-text kind required as a whole (4).

The counts are read from the report, by file and by group.

**Green at `2499cf443`** (`175-06-required-green.json`, exit 0): the same 87, all passed. Both files are byte-identical at the two heads.

**The controls** (step 4). `git grep -n -E "<(input|select|textarea)([^A-Za-z]|$)" -- $I` at `bdd69de77` prints thirteen lines: eleven elements and two comment lines. `MultilingualTextPart`'s two are one row below.

| Element | Received |
|---|---|
| `Input.svelte` single-language `<textarea>` | description, error state, required |
| `Input.svelte` `<input type="checkbox">` (boolean) | the same |
| `Input.svelte` `<select>` | the same |
| `Input.svelte` generic `<input {type}>` (`text`, `url`, `email`, `number`, `date`) | the same |
| `Input.svelte` hex `<input type="text">` (colour) | the same |
| `Input.svelte` `<input type="color">` (the picker) | **no description**: it is named by the row label and its own label, and the hex field is the labelled control that carries the help and the error (UI contract, S3) |
| `MultilingualTextPart` `<textarea>` and `<input>` | description; `aria-required` on the required locale's field alone; `lang` |
| `MultipleTextPart` row `<input>` | description; `lang` when multilingual. Not required and never invalid: many controls, and the kind raises no error |
| `SelectMultiplePart` `<select>` | description; `aria-required` when `required`. Never invalid: the kind raises no error |
| `ImagePart` `<input type="file">` | description and error state. It is `class="hidden"`, so assistive technology does not meet it; **the `<button>` that opens the dialog, which the search does not print, carries the description too.** No `aria-required`: the button role does not support it |

## Task 2 — the cases that were red, and ruling 2

**Red at `67eee2ddf`** (`175-06-color-red.json`, exit 1): 42 cases, **41 failed, 1 passed**, every failure an `AssertionError` (the kind fell through to the generic `<input type="color">`, so every case mounted). The one that passed is the `ErrorMessage` case that pins today's text content. All 39 colour cases and the two `ErrorMessage` cases about what is spoken were red.

**Green at `bdd69de77`** (`175-06-color-green.json`, exit 0): the same 42, all passed. Both test files are identical at the two heads.

**Ruling 2 — the union took the fifteenth member.** `yarn workspace @openvaa/frontend check` at the working tree and at `bdd69de77`: 0 errors, 0 warnings, no "union too complex". The other falsifier, a type that widens to `any`, was tested with a scratch file of seven `@ts-expect-error` lines (a number as a colour's value; `requiredLocale` on `text`, `image`, `multiple-text-multilingual` and `color`; `options` on `color`; an unknown kind) beside three valid uses: `check` exit 0, so every expectation was met and the union still discriminates. The scratch file was removed and never staged. **No sibling component was built; plan 175-09 imports `Input`.** The type file's comment no longer states the union's size.

**Every caller of the inline error** (`git grep` at `bdd69de77`, sixteen): `Input.svelte` (its own error), `MultilingualTextPart` and `SelectMultiplePart` (the general fallback), `questions/OpinionQuestionInput.svelte`, `routes/admin/login`, and in the Contestant app `(protected)/+page`, `preview`, `profile`, `questions/[questionId]`, `settings`, `login`, `forgot-password`, `password-reset`, `preregister`, `register` and `register/password`. Each renders the same markup around the emoji and the same text content. The specs that read one of these messages address it by test id and match its text (searched `tests/tests` for the alert role and the two error test ids); none reads an accessible name off it.

## The code review checklist

Over both tasks' edits. Recorded before the gate rows; the one finding was fixed before them.

| Item | Outcome |
|---|---|
| Solves the issue | yes for what `Input` can do; no page uses it yet |
| OWASP top 10 | T-175-26: the swatch's `style` takes the parsed committed colour alone, re-checked against `#` and six hex digits after `rgbToHex`; a typed entry outside the grammar emits nothing; the injection string `#fff; background: url(x)` is a red-first case as a stored value and as a typed one. `lang` and the description ids come from the supported locales and from ids, not from user text |
| Code style guide | `Array<T>`, explicit return types, TSDoc on the new functions and constants; the dashed attribute is read by renaming it in the `$props()` destructuring; `Input`'s own attributes come before the rest-props spread. **Finding, fixed:** the colour section listed its helper before the handlers that call it; reordered top-down in the Task 2 commit (deviation 9) |
| No `any` | none |
| No repetition | the description, error state and required state of a single-control kind are one derived object spread at five places; the colour normaliser is one function for the stored, the typed and the picked value |
| New entities documented | every new prop in its `.type.ts` with a default marker; the `@component` blocks of `Input`, the four parts and `ErrorMessage` |
| Repo markdown updated | `parts/README.md` gained the paragraph on `describedBy` |
| Tracking events | not answered here: a kind and a prop of a base component add nothing a user can reach; plan 175-09's page answers it |
| New Svelte components | none |
| Errors handled | an invalid colour is shown through `Input`'s existing error path, which `ErrorMessage` logs |
| Failing checks | none |
| Parts sharing the dependency | sixteen callers of the inline error (above); every caller of `Input` gains attributes only — the slice's 22 scans and the unit suite's 2838 tests are green |
| WCAG A/AA, keyboard and screen reader | 1.3.1 / 4.1.2: description, invalid and required are programmatic; 3.1.2: `lang`; 3.3.1: the error is announced. axe 4.13 treats `aria-invalid` as global and gives a date input the textbox role, so `aria-required` is allowed on every control it is set on (read in `node_modules/axe-core/axe.js`). **Not done:** a browser read of the colour row |
| Docs guides | the generated component pages restate six docstrings and are stale until plan 175-13 |
| Comment hygiene | every added comment read; `yarn assert:comment-hygiene` run on the working tree before each of the four commits, exit 0 each time |
| Commit history | test, feat, test, feat; linear |
| No fixes of itself | Task 2's commit folds three attribute lines Task 1 added at four places into one spread; both tasks rewrite `Input.svelte` by plan |
| Formatting in its own commit | none |
| `[db]` tag | no database change |
| Backend, adapter and Edge Function sections | name nothing this plan touches |

**The components skill's re-check list:** docstrings and `.type.ts` files present; the parts stay out of the barrel; `generate:docs` is deferred to plan 175-13 by ruling 4; `.claude/skills/components/` was read and not edited — nothing in it counts kinds or names these props.

## Deviations from Plan

**1. A search in Task 1's action prints nothing on this host; its intent was run by another form.** Step 4's `git grep -n -E "<(input|select|textarea)\b" -- $I` exits **1** with no output: this host's `git grep -E` does not read `\b`. The population was derived with `([^A-Za-z]|$)` in its place, exit **0**, thirteen lines at the final head. No code was shaped by either search. The plan's two verify chains do not contain this search and both exit 0 as written.

**2. [Rule 3] `Input.focusReturn.svelte.test.ts` changed, a file the plan does not list.** Its `EXAMPLES` is a `Record<InputType, …>`, so the new kind is a type error there until it has an entry. It gained `color: { value: '#2546a8' }` and `'color'` in the list of kinds that hand no focus target to a part: 19 cases, all green, and the colour kind is held to zero ownership warnings.

**3. `parts/README.md` gained a paragraph, a file the plan does not list.** It states the `describedBy` contract a new part must follow.

**4. `aria-invalid` is not on every control.** The plan says a control has it while the error is shown. Only `url`, `email`, `image` and `color` can show one. The single-control kinds take it from the shared spread and `ImagePart` from `invalid`; `MultilingualTextPart`, `MultipleTextPart` and `SelectMultiplePart` have no such prop, because nothing would ever set it. A part whose kind gains an error needs the prop then.

**5. The image kind: the description is on the button as well, and nothing is `aria-required`.** The file input is `display: none`; the button is what a user operates. A button cannot carry `aria-required` (axe would refuse it), so a required image is announced by the badge's sr-only text alone, as today.

**6. The row label's id is conditional.** The UI contract's sketch puts `id="{id}-label"` on the row label. The label is shared by every single-row kind, so the id is set for the colour kind alone and the other kinds' markup is unchanged.

**7. Three choices the plan leaves open.** A stored value must also be `#` and six hex digits after `parseColorString` → `rgbToHex`, because `rgbToHex` returns five digits for a negative channel of functional notation. A typed entry is trimmed before the grammar is applied. A cleared colour is emitted as `undefined`.

**8. `SelectMultiplePart` is `aria-required` when `required`.** The plan names "a `required` single-control kind"; the dropdown is that kind's one field, so it is counted as one.

**9. Task 2's commit was amended once, before any gate or run.** `bed47a092` listed the colour normaliser before the two handlers that call it, against the style guide's top-down rule (the checklist's finding). `HEAD` was still that commit and nothing had been judged on it, so the reorder was folded in by `git commit --amend -- <path>`: `bdd69de77`. The green report and its `.head` were retaken on `bdd69de77`. `bed47a092` is not an ancestor of `HEAD`.

**10. Task 2's commit touches lines Task 1 added.** The three attributes of a single-control kind were three lines at four places after Task 1 and would have been at five with the hex field; they are one derived object now.

**Not recorded in `.planning/WINDOWS.md`:** there is no stub, no skipped test and no verify left unrun.

## What was not done or not verified

- **The colour row has not been rendered in a browser.** No route renders `type="color"` or `requiredLocale` until plan 175-09, and `PreviewAllInputs` is rendered by none. So: no axe scan of either, no measurement of the 44px hit area (the classes and the built tokens were read; jsdom has no layout), and nothing seen of the row at 320px.
- **The plan's two backstops are open:** the platform picker opening from the keyboard and returning focus to the swatch in Chromium and WebKit, and the focus ring on the wrapper in both themes.
- **"A locale stack with every locale expanded adds no horizontal scroll" was not measured.** The stack's layout classes are unchanged.
- **No full default E2E run**, by ruling 5.
- **`yarn workspace @openvaa/docs generate:docs` was not run**, by ruling 4.
- **A refused entry outlives a reset of `value` from outside.** When the caller sets `value` back while the hex field holds a refused text, the swatch and the picker follow and the field keeps the text and its error until the next commit. The `url` and `email` kinds behave the same way. See the note for plan 175-09.
- **`GEN-01` and `GEN-03` are not completed by this plan**: it supplies what the page plans use. `requirements-completed` is empty on purpose.

## What the next plans should know

- **175-09 — the party's name.** `<Input type="text-multilingual" label={t('common.name')} value={…} required={nameEditable} requiredLocale={nameEditable ? requiredNameLocale() : undefined} locked={!nameEditable} multilingualInfo="" onShadedBg aria-describedby="profile-name-note" containerProps={{ 'data-testid': 'profile-name' }} onChange={…} />`. `value` must be a plain object, never a `$state` proxy (`Input` clones it at mount and a proxy throws). `onChange` emits `Input`'s live proxy: stage `$state.snapshot(value)`, normalised. The caller's `aria-describedby` comes first in the attribute. Pass `requiredLocale` only while editable, or pass it always and let `required={nameEditable}` switch it: the prop does nothing without `required`. The abbreviation is the same without `required` and `requiredLocale`.
- **175-09 — the colour.** `<Input type="color" label={t('common.color')} value={color?.normal} locked={answersLocked} info={…} onShadedBg containerProps={{ 'data-testid': 'profile-color' }} data-testid="profile-color-hex" onChange={(value) => …} />`. `onChange` gives lowercase `#rrggbb` or `undefined`: stage `{ normal: value }` or `null`. Nothing is emitted for a stored value that is merely displayed, so an untouched colour is never staged. The error is `shared.inputError` inside the `profile-color` container. **If Cancel must also clear a refused entry, remount the input** (a `{#key}` on the store's reset): `Input` holds the refused text itself.
- **175-09 to 175-12, selectors:** the info line is `#{id}-info` and the error `#{id}-error` only when the page passes an `id`; otherwise the id is generated, and the description is reached through the control's `aria-describedby`. The required field of a name is `[aria-required="true"]` inside `profile-name`. With `requiredLocale` set to a locale other than the displayed one, **two** fields are visible before the toggle is pressed, and a locator that expects one text field in `profile-name` matches two.
- **175-09, the candidate's two name inputs:** `required` alone now sets `aria-required="true"` on the `<input>`; the page passes nothing for it.
- **175-12, axe entries:** the first scan of the colour row and of a two-field name stack is theirs. Expect `aria-required` on a `disabled` control wherever a locked input is still `required` — every locked required info question has it today, and the 22 scans pass with it.
- **175-13:** six `@component` docstrings changed — `Input` (the `color` kind, `requiredLocale`, `required`, a new *Accessibility* section), `MultilingualTextPart`, `MultipleTextPart`, `SelectMultiplePart`, `ImagePart`, `ErrorMessage` — so their generated pages are stale until `generate:docs`. The search form `\b` in a `git grep -E` does not work on this host (deviation 1), in case another plan's command uses it.
- **Phase 179:** `requiredLocale` is the prop the registration form's name field takes; it needs `required` beside it.
- **Orchestrator:** nothing in `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` or `CLAUDE.md` was edited; `CAND-APP-PLAN.md` stays untracked; nothing under `tests/e2e-runs/` was deleted.

## The state the local database is left in

Unchanged in kind from plan 175-05's close: no reset was run, pgTAP's helpers are still in `public`, and the `default` dataset is in the default project (the gate set's `unit` row writes it again). The slice's setups and teardowns all passed, so the E2E project is empty. The Supabase stack and Docker were never restarted; `docker builder prune -af` ran once, inside the E2E driver; the Docker VM had 14.62 GiB free.

## Files touched that the plan did not list

- `apps/frontend/src/lib/components/input/Input.focusReturn.svelte.test.ts` (deviation 2)
- `apps/frontend/src/lib/components/input/parts/README.md` (deviation 3)

A scratch type file, `zzTypeScratch.ts` in the input directory, was created and removed without being staged.

Gitignored evidence: `tests/e2e-runs/175-unit/175-06-required-red.json`, `-required-green.json`, `-color-red.json`, `-color-green.json`, each with its `.head`, `.log` and `.exit`, and `175-06-t1-verify.*`, `175-06-t2-verify.*`; `tests/e2e-runs/175-gates/175-06-close` with its `.log`, `.exit`, `.launched`, `.verdict.txt` and `.refusal-full-set.txt`; `tests/e2e-runs/175-e2e/175-06-a11y-slice` with its `.log`, `.exit`, `.launched` and `.verdict.txt`.

## Known Stubs

None.

## Threat Flags

None. The plan's register covers what was added: a value painted into an inline `style` (T-175-26, mitigated and tested), and attributes on a base component every caller shares (T-175-27, T-175-28, T-175-30).

## Self-Check: PASSED

Checked after writing:

- The four created test files and the fourteen modified files exist; `git diff --name-status 5f99944f3 bdd69de77` lists exactly those eighteen paths, none outside `apps/frontend/src/lib/components/`.
- `08b86e839`, `2499cf443`, `67eee2ddf` and `bdd69de77` are ancestors of `HEAD`; `git rev-list --count 5f99944f3..bdd69de77` is 4; `bed47a092` is not an ancestor.
- The four reports and their `.head` files exist under `tests/e2e-runs/175-unit/`; the case counts in this file were read from them by file and group.
- `175-06-t1-verify.exit` and `175-06-t2-verify.exit` hold 0; `tests/e2e-runs/175-gates/175-06-close.exit` and `tests/e2e-runs/175-e2e/175-06-a11y-slice.exit` hold 0.
