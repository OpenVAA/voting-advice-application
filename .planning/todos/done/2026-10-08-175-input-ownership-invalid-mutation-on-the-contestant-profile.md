---
created: 2026-10-08T07:40:00.000Z
title: Input's parts write element references through an unbound prop — the four ownership warnings on the contestant profile
area: Frontend / components (input)
severity: minor
source: Operator decision G7 (a) of 2026-10-08 (v2.16-OPERATOR-DECISIONS-2026-10-08.md § G7); the warnings were first recorded by Phase 174.1 (174.1-02-SUMMARY.md § Out-of-scope observations); diagnosed in .planning/debug/input-ownership-invalid-mutation.md
files:
  - apps/frontend/src/lib/components/input/Input.svelte
  - apps/frontend/src/lib/components/input/parts/MultilingualTextPart.svelte
  - apps/frontend/src/lib/components/input/parts/SelectMultiplePart.svelte
  - apps/frontend/src/lib/components/input/parts/MultipleTextPart.svelte
  - apps/frontend/src/lib/components/input/parts/MultilingualTextPart.type.ts
  - apps/frontend/src/lib/components/input/parts/SelectMultiplePart.type.ts
  - apps/frontend/src/lib/components/input/parts/MultipleTextPart.type.ts
  - apps/frontend/src/lib/components/input/Input.focusReturn.svelte.test.ts
---

## Problem

**In one paragraph, for the planner of Phase 175.** The four warnings are about `Input`'s own focus bookkeeping, not about a value. `Input.svelte` keeps an array of element references, `mainInputs`, so that it can return focus to its first field; it hands that array to three of its four parts as a plain prop, and each part fills it with `bind:this={mainInputs[i]}`. A dev build of Svelte reports a child writing into a `$state` object it was passed without `bind:`. Nothing the page, a context or `@openvaa/data` owns is mutated; no value is involved; nothing observable breaks; a production build carries no trace of it. It is a true report of an untidy contract between `Input` and its parts, fixable in about 25 lines inside `apps/frontend/src/lib/components/input/`. **Root cause: CONFIRMED** — reproduced without a browser and removed in two different ways, with a control.

### The warning, verbatim

`tests/e2e-runs/174.1-reads/174.1-02-reads/devserver.log`, lines 27–38 (gitignored, on this host), logged at 23:33:58 when the read session showed the profile page. Four warnings; a search for the name counts eight lines because each warning also prints its URL.

```
[svelte] ownership_invalid_mutation
Mutating unbound props (`mainInputs`, at src/lib/components/input/parts/SelectMultiplePart.svelte:58:21) is strongly discouraged. Consider using `bind:mainInputs={...}` in src/lib/components/input/Input.svelte (or using a callback) instead
https://svelte.dev/e/ownership_invalid_mutation
```

The other three are the same sentence at `MultilingualTextPart.svelte:109:25`, `MultilingualTextPart.svelte:87:23` and `MultilingualTextPart.svelte:109:25`, in that order.

### What is mutated, by whom, and who owns it

| | |
|---|---|
| Mutated | `mainInputs[<index>]` — an element reference written into an array |
| Declared | `Input.svelte:221`, `const mainInputs: Array<HTMLElement> = $state([]);` |
| Passed | `Input.svelte` → `MultipleTextPart`, `MultilingualTextPart`, `SelectMultiplePart` as `{mainInputs}`, no `bind:` |
| Written by | `bind:this={mainInputs[i]}` at `MultilingualTextPart.svelte:87` and `:109`, `bind:this={mainInputs[0]}` at `SelectMultiplePart.svelte:58`, `bind:this={mainInputs[index * fieldLocales.length + localeIndex]}` at `MultipleTextPart.svelte:194` |
| Read by | `Input.svelte`'s `refocus()` only (`mainInputs[0]?.focus()`), from two event handlers; no `$derived`, no `$effect`, no template reads it |
| Owner | `Input.svelte`, in fact and by the compiler's definition |

"Owner" as svelte 5.57.1 defines it (`node_modules/svelte/src/internal/client/dev/ownership.js`, `src/compiler/phases/3-transform/client/visitors/shared/utils.js` `validate_mutation`): there is no bookkeeping on the object. In a dev compile every assignment whose left side is a member of a **prop** is wrapped in `$$ownership_validator.mutation(…)`, and at run time that warns when all three hold: the prop has no setter (it was not passed with `bind:`), the writing component has a parent component, and the value at the path is a `$state` proxy. The component the message names is simply the one that passed the prop. The compiled setter of the logged site is:

```js
$.bind_this(select, ($$value) => $$ownership_validator.mutation('mainInputs', ['mainInputs', 0], mainInputs()[0] = $$value, 58, 21), () => mainInputs()?.[0]);
```

`MultipleTextPart` makes the same write and compiles to a bare `mainInputs()[index * $.get(fieldLocales).length + localeIndex] = $$value`: `validate_mutation` gives up on a member path whose property is neither a literal nor an identifier. **It is silent through a limit of the compiler, not because it is different.** The warning census therefore understates the reach: three parts, four `bind:this` sites, two of the parts reported.

### Why it started

Before commit `41bee4002`, which added `parts/`, all three `bind:this={mainInputs[…]}` sites were in `Input.svelte` itself, beside the declaration (`git show 41bee4002^:apps/frontend/src/lib/components/input/Input.svelte`). Extracting the branches into parts turned a same-component write into a write through a prop. The comment that travelled with the markup — `bind: keep — $state target for bind:this; mainInputs is $state([]) in the owning Input.` — explains why the array is `$state`, not who may write to it.

No gate could have caught it: `svelte-check` reports 0 warnings because nothing warns at compile time (`Input.svelte` and the three parts compile clean), no unit test listened to `console.warn`, and the E2E harness records browser console lines for forensics (`tests/tests/fixtures/shared/forensicCapture.fixture.ts`) without failing on any.

### Reach

By kind, on mount of one `Input` (measured, 14 kinds, the real component):

| Kinds | Rendered through | Warnings on mount |
|---|---|---|
| `text-multilingual`, `textarea-multilingual` | `MultilingualTextPart` | 1 each |
| `select-multiple` | `SelectMultiplePart` | 1 |
| `multiple-text`, `multiple-text-multilingual` | `MultipleTextPart` | 0 — same write, not instrumented |
| `text`, `url`, `email`, `textarea`, `number`, `date`, `boolean`, `select` | inline in `Input.svelte` | 0 |
| `image` | `ImagePart`, which owns its own element reference | 0 |

Showing the translations adds one per extra locale (measured with two locales: +1). Unmounting adds one per bound field, because `bind:this` writes `null` on teardown (measured: 2 after the toggle, 1 for `select-multiple`).

By call site — every user of `Input` in `apps/frontend/src` (searched 2026-10-08 at `cb2882d8d`; there is none in the voter or admin apps, and the registration and sign-in forms do not use it):

| Call site | Kinds | Affected |
|---|---|---|
| `routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/profile/+page.svelte` | `QuestionInput` per info question; direct `text` and `image` | yes — one warning per editable text or long-text question (unless the question switches multilingual off) and per multiple-choice question. Locked text questions are rendered single-language and log none; a locked multiple-choice question still binds its dropdown (read from the markup, not measured). The direct `text` and `image` inputs: none |
| `…/questions/[questionId]/+page.svelte` | `textarea-multilingual` for the open-answer comment (`textarea` when the question opts out) | yes — one per question page, by the kind; **not opened in a browser** |
| `…/settings/+page.svelte` | `text` | no |
| `lib/components/input/PreviewAllInputs.svelte` | every kind | six inputs of the reported kinds, counted from the markup; no route renders it |

The profile page's four are fully accounted for by the `e2e/base` info questions in their sort order: the multiple-choice question (`SelectMultiplePart` 58:21), the short text (`MultilingualTextPart` 109:25), the long text (87:23) and one constituency-filtered text (109:25). The `multipleText` question is the silent one. A host component rendering the real `QuestionInput` for those kinds in that order logs exactly these four, in this order.

It is not specific to the profile page and no call site can cause or prevent it.

### Does anything break

No. Measured on the real component in vitest (jsdom, dev compile):

- Focus returns to the first field after the translations toggle (`text-multilingual`, `textarea-multilingual`, `multiple-text-multilingual`) and to the dropdown after a selected option is deleted — the child's write does reach `Input`'s array.
- Editing a multilingual field emits the right value (`{ en: 'edited' }`) and logs no further warning; the object handed in as `value` is unchanged afterwards.
- A production compile (`dev: false`) of `Input.svelte` and the three parts contains no `ownership_validator` at all.

What it costs is dev-console and dev-server-log noise in proportion to the number of such inputs, behind which a warning about a real value would be easy to miss, and a part contract that the next part will copy.

### What Phase 175 inherits if nothing is done

- A multilingual name field is a `text-multilingual` input: one more warning per field on mount, one per extra locale when translations are shown, one per field on unmount.
- A colour field rendered inline in `Input.svelte` (as `date` and `number` are) adds none. A colour field built as a new part that takes `mainInputs` copies the pattern — and warns or stays silent depending only on how its index expression is written.

### Two adjacent facts, measured, not the cause

Found while probing; neither is triggered by a current call site, both constrain a new caller of the object-valued kinds.

1. **`Input` throws when `value` is a `$state` proxy of an object or an array.** `Input.svelte:168` runs `structuredClone(value)`, and a proxy cannot be cloned: a host passing `let v = $state({ en: 'x' })` to a `text-multilingual` input fails at mount with `DataCloneError: #<Object> could not be cloned` (same for `select-multiple` with an array). Today's callers hand in plain objects — `userData.current` is a JSON round-trip clone (`contestantUserDataState.svelte.ts`, `#current`) — which is read from the source, not measured in a browser.
2. **`onChange` hands out `Input`'s live state.** For `text-multilingual`, `textarea-multilingual` and `select-multiple` the emitted value is itself a `$state` proxy (`structuredClone` of it throws `DataCloneError`): a local write to an unbound `$bindable` prop is proxied by Svelte's `prop()`. The profile page wraps it in `{ value }` and gives it to `userData.setAnswer`; what the draft store does with a proxy was not looked into.

### Measured and inferred

Measured (vitest, the frontend workspace, 2026-10-08): the per-kind census; the page-shaped reproduction through `QuestionInput`; focus return; the emitted value; the compiled setters, dev and production; every fix option below except C; the two adjacent facts.

Inferred: that the fourth logged warning is a constituency-filtered text question (the count and order fit; the entity the read session opened was not checked); the question page's one warning per page (the kind is measured, the page was not opened); the unmount warnings on the real page; that no current caller passes a proxy.

Not done: no browser run. The reproduction is jsdom plus the dev compiler; the logged text, sites, count and order all match it.

## Solution

Options, each tried on a byte-identical copy of `Input.svelte` and its parts in a gitignored scratch directory, beside an unmodified copy as the control (which warned exactly as the real component does). No tracked application file was changed.

| | Change | Result | Cost and reach |
|---|---|---|---|
| **A** | `mainInputs = $bindable()` in the three parts; `let` instead of `const` in `Input.svelte`; `bind:mainInputs` at its three call sites | 0 warnings of any kind; focus return intact | ~10 lines, 4 files + 3 type files. Keeps a shared mutable array as the contract. A new part must remember both halves, and forgetting is not reliably reported (the `MultipleTextPart` case) |
| **B** | Each part keeps its own `const inputs: Array<HTMLElement> = $state([])`, binds into that, and exports `focus()`; `Input.svelte` drops `mainInputs`, holds the rendered part with `bind:this={part}` and `refocus()` calls `part?.focus()` | 0 warnings of any kind; focus return intact in all four cases | ~25 lines, the same 7 files. Removes the prop from the contract: only a method crosses the boundary |
| C | `Input` passes a registration callback, or the parts use an attachment | not tried | More surface than B, no precedent in the library |
| D | Make `mainInputs` a plain array | `binding_property_non_reactive` at all four sites instead | Rejected — swaps one warning for another |
| E | `<!-- svelte-ignore ownership_invalid_mutation -->` on the three elements | unchanged: still instrumented, still warns | Rejected — the compiler builds a `bind:this` assignment without the ignore list (`build_bind_this`), so on this target the warning can be annotated but not silenced |

**Recommended: B.** It is how the library already does imperative actions across a component boundary: `lib/contestant/components/passwordField/PasswordField.svelte` exports `focus()` over a private `bind:this` reference, and `Modal`, `Alert`, `Drawer`, `Video` and `Feedback` are all driven through `bind:this` and exported functions. `ImagePart`, in the same directory, already owns its element reference for the stated reason that it is not observable outside the branch. `$bindable` is used in the library for values a parent reads (`password`, `selected`, `activeTab`); nothing reads `mainInputs` reactively. A is acceptable if the smallest diff is wanted.

**When.** Before the page rework and before any plan that adds a kind or a part to `Input` — as the first plan of Phase 175. It does not need to precede the phase's planning: it changes nothing about the phase's scope, and the planner needs only this file. Doing it later in the phase, or after it, means the new multilingual field ships more of the same warning and a new part is written against the contract this removes.

What the change touches:

- `Input.svelte` — the declaration at line 221 and its two-line comment, `refocus()`, the three call sites.
- `parts/MultilingualTextPart.svelte`, `parts/SelectMultiplePart.svelte`, `parts/MultipleTextPart.svelte` — the props destructuring, the bind targets, the `bind: keep` comments, the `@component` docstring (a `focus()` export to mention).
- The three `parts/*.type.ts` — the `mainInputs` member goes.
- `Input.focusReturn.svelte.test.ts` — see below.
- If a docstring changes, `yarn workspace @openvaa/docs generate:docs`, and the re-check list at the end of `.claude/skills/components/SKILL.md`.

Not checked for B: `svelte-check` on the type of the bound part (the copies sat outside the tsconfig), and a `type` prop that changes while mounted.

**The guard is already in the tree.** `apps/frontend/src/lib/components/input/Input.focusReturn.svelte.test.ts` passes on the current code (`cd apps/frontend && yarn test:unit src/lib/components/input/Input.focusReturn.svelte.test.ts`, 16 cases) and holds two things:

- *Focus return* (4 cases) — must stay green through the change. Shown to fail when `refocus()` is emptied.
- *Ownership warnings on mount* — currently asserts one warning for each of the three reported kinds and none for the nine kinds that hand no focus target to a part. Under A and under B the three "logs one" cases go red and everything else stays green; the fix replaces those three expectations with zero, and should add the two multi-text kinds, which the test leaves out today because their silence says nothing.

The change is in component code used by the profile and question pages, so the full E2E suite is its closing gate.

## Resolution

**Closed 2026-10-09** by Phase 175 plan 175-01, at the phase's close (plan 175-13).

- **What was done: option B.** Each part keeps its own element references and exports `focus()`; `Input.svelte` holds the rendered part with `bind:this` and asks it to take focus. The `mainInputs` array and the prop that carried it are gone from `Input.svelte`, the three parts and their type files. Commit `548fc75b9` (`fix(175-01): each Input part owns its element references and exports focus()`), after the red commit `26f8e73a7` (`test(175-01): Input logs no ownership warning for any kind`).
- **The guard is at zero for every kind.** `Input.focusReturn.svelte.test.ts` asserts no ownership warning on mount for every kind of `Input`, the two multi-text kinds and the `color` kind added later in the phase included, and keeps its four focus-return cases. It is part of the frontend unit suite, green in the phase's closing gate set (`tests/e2e-runs/175-gates/175-13-final`, the `unit` row: 182 files, 3146 tests).
- **Proven in a browser.** The reproduction this todo rests on was jsdom plus the dev compiler. Every full E2E run of the phase since plan 175-05 drove the profile and the question pages on the repaired component; in the closing run `175-13-final` (268 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run, 110 projects, head `4c930217c`) the dev server's log holds **no** `ownership_invalid_mutation` line and no `[svelte]` warning at all (`tests/e2e-runs/175-e2e/175-13-final/devserver.log`, searched). The log this todo quotes held four.
- **What the phase built on it.** The multilingual name fields are `text-multilingual` inputs and the colour is a kind rendered inline; neither adds a warning. `parts/README.md` states the contract a new part follows.
- **The two adjacent facts stand as described.** `Input` still throws when handed a `$state` proxy as `value` (accepted, T-175-29: callers hand in plain objects), and `onChange` still hands out `Input`'s live state; the contestant store copies and normalises what it is given (plan 175-07).
