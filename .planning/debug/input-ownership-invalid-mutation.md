---
status: diagnosed
trigger: "Four Svelte `ownership_invalid_mutation` warnings from Input.svelte's parts, logged when the Contestant app's profile page rendered (Phase 174.1 dev-server log). Operator decision G7 (a), 2026-10-08: file a todo and investigate before Phase 175 is planned. Diagnosis only — no application fix."
created: 2026-10-08T07:23:52Z
updated: 2026-10-08T07:38:00Z
goal: find_root_cause_only
symptoms_prefilled: true
---

## Current Focus

bug_class: Bohrbug (deterministic: fires on every mount of an affected Input kind in a dev build)
hypothesis: CONFIRMED — see Resolution.
test: done. Control and four variants on byte-identical copies; page-shaped reproduction through the real QuestionInput.
next_action: none in this session (goal: find_root_cause_only). The fix is described in `.planning/todos/pending/2026-10-08-175-input-ownership-invalid-mutation-on-the-contestant-profile.md`; the committed test `apps/frontend/src/lib/components/input/Input.focusReturn.svelte.test.ts` is its red/green target.

reasoning_checkpoint:
  hypothesis: "Three parts of Input write element references (`bind:this={mainInputs[i]}`) into a `$state([])` array that Input declares and passes to them as a plain prop; the dev compiler instruments a write to a prop and warns when the prop is unbound, the writer has a parent component and the value is a `$state` proxy."
  confirming_evidence:
    - "Real component, 14 kinds: exactly the three kinds rendered through MultilingualTextPart / SelectMultiplePart warn, with the logged text, file, line and column."
    - "Real QuestionInput over the e2e/base info-question kinds in sort order: exactly four warnings, in the logged order (58:21, 109:25, 87:23, 109:25)."
    - "Unmodified copy warns identically; `$bindable` + `bind:mainInputs` → zero; parts owning their refs + exported `focus()` → zero; plain array → `binding_property_non_reactive` instead (the proxy condition, isolated)."
  falsification_test: "Any of: an unmodified copy that does not warn; a variant that binds the prop and still warns; a kind with no part binding that warns. None observed."
  fix_rationale: "Either make the prop bound (the validator's own exemption) or stop passing it — the second removes the cross-component write itself rather than declaring it."
  blind_spots: "No browser run in this session: the reproduction is jsdom + the dev compiler. The logged warnings are from a browser, and the text, sites, count and order all match, so the gap is small. svelte-check typing of the recommended variant was not run (the copies were outside the tsconfig)."
  candidate_causes:
    - "code: unbound `$state` prop mutated by a child through `bind:this` (confirmed)"
    - "data: a `$state` proxy arriving as `value` from the page or the user-data store (eliminated — `userData.current` is a JSON clone, and no warning names `value`)"
    - "environment: a dev-only artefact of the dev server or HMR (eliminated — reproduced in vitest with no server; production compile carries no validator at all)"
  and_gate: "yes, three conditions, all inside the input package: the prop is unbound AND its value is a `$state` proxy AND the index expression is one the compiler can trace. Removing the first (optA) or the write itself (optB) clears it; removing the second (optD) only swaps the warning; the third is why MultipleTextPart is silent."

## Symptoms

expected: the profile page renders with no Svelte runtime warnings.
actual: four `ownership_invalid_mutation` warnings in the browser console (forwarded to the dev-server log) at 23:33:58 when the profile page was shown.
errors: |
  [svelte] ownership_invalid_mutation
  Mutating unbound props (`mainInputs`, at src/lib/components/input/parts/SelectMultiplePart.svelte:58:21) is strongly discouraged. Consider using `bind:mainInputs={...}` in src/lib/components/input/Input.svelte (or using a callback) instead
  (and three more, same text, at MultilingualTextPart.svelte:109:25, :87:23, :109:25)
reproduction: open the contestant profile page (`/contestant/<entityType>/<entityId>/profile`) on a dev build with the e2e/base dataset; log at tests/e2e-runs/174.1-reads/174.1-02-reads/devserver.log lines 27-38.
started: unknown; first noticed in the Phase 174.1 read session (2026-10-07).

## Eliminated

- hypothesis: "The page, a context or `@openvaa/data` owns the mutated object (the operator's worry: Input mutating state it does not own)"
  evidence: every warning names `mainInputs`, declared at Input.svelte:221 and read only by Input's `refocus()`. A page-shaped mount with plain answers warns the same four times; editing a field adds none; the object handed in is byte-identical afterwards.
  timestamp: 2026-10-08T07:30Z

- hypothesis: "Make `mainInputs` a plain array and the warning is gone"
  evidence: measured — `binding_property_non_reactive` at all four `bind:this` sites instead, including MultipleTextPart.
  timestamp: 2026-10-08T07:30Z

- hypothesis: "`<!-- svelte-ignore ownership_invalid_mutation -->` silences it"
  evidence: measured — the compiled setter is still wrapped and the probe still warns. `build_bind_this` builds the binding's assignment as a fresh node with no ignore list (svelte 5.57.1).
  timestamp: 2026-10-08T07:30Z

## Evidence

- timestamp: 2026-10-08T07:18Z (approx.)
  checked: tests/e2e-runs/174.1-reads/174.1-02-reads/devserver.log lines 27-38
  found: four warnings (eight grep hits = name line + URL line each). All name the prop `mainInputs`, the parent `src/lib/components/input/Input.svelte`, and a `bind:this` site in a part — SelectMultiplePart.svelte:58:21 once, MultilingualTextPart.svelte:109:25 twice, MultilingualTextPart.svelte:87:23 once.
  implication: the mutated binding is not `value` and not anything owned by the page, a context or `@openvaa/data`; it is Input's own focus-target array, mutated by Input's own children.

- timestamp: 2026-10-08T07:20Z (approx.)
  checked: apps/frontend/src/lib/components/input/Input.svelte:221 and :392/:404/:435; the three parts' `bind:this` lines
  found: `const mainInputs: Array<HTMLElement> = $state([]);` passed as `{mainInputs}` (no `bind:`) to MultipleTextPart, MultilingualTextPart, SelectMultiplePart; each does `bind:this={mainInputs[<index>]}`. ImagePart takes no `mainInputs`.
  implication: three parts mutate an unbound prop whose value is a `$state` proxy.

- timestamp: 2026-10-08T07:22Z (approx.)
  checked: installed svelte 5.57.1 — src/internal/client/dev/ownership.js, src/compiler/phases/3-transform/client/visitors/shared/utils.js (`validate_mutation`), visitors/BindDirective.js
  found: the check is compile-time instrumentation, dev only. `bind:this={mainInputs[i]}` generates `mainInputs[i] = $$value`, visited as an AssignmentExpression and wrapped in `$$ownership_validator.mutation('mainInputs', ['mainInputs', i], …, line, col)` because `mainInputs` is a `prop` binding. At run time it warns unless the prop is bound (has a setter descriptor) or unset, the component has no parent component, or the value at the path is not a `$state` proxy (`STATE_SYMBOL`). The "owner" in the message is simply the immediate parent component's filename.
  implication: "owner" = Input.svelte, by the compiler's definition and in fact. The warning is not about the page; no call site can cause or prevent it.

- timestamp: 2026-10-08T07:25Z
  checked: scratch vitest probe mounting the real `Input` once per kind (14 kinds), counting `console.warn` lines holding `ownership_invalid_mutation`
  found: mount — text-multilingual 1 (MultilingualTextPart.svelte:109:25), textarea-multilingual 1 (:87:23), select-multiple 1 (SelectMultiplePart.svelte:58:21); every other kind 0, INCLUDING multiple-text and multiple-text-multilingual. Showing translations adds 1 per extra locale; unmount adds 1 per bound element (bind:this teardown writes null). Text is byte-identical to the logged warnings.
  implication: reproduced deterministically without a browser, a page, a context or a database. The four logged warnings are 1 select-multiple + 2 text-multilingual + 1 textarea-multilingual info questions.

- timestamp: 2026-10-08T07:26Z (approx.)
  checked: dev-mode compile of the three parts with svelte/compiler 5.57.1
  found: MultilingualTextPart and SelectMultiplePart setters are `$$ownership_validator.mutation('mainInputs', ['mainInputs', i], mainInputs()[i] = $$value, <line>, <col>)`. MultipleTextPart's setter is the bare `mainInputs()[index * $.get(fieldLocales).length + localeIndex] = $$value` — the same write, uninstrumented, because `validate_mutation` gives up on a member path whose property is neither a literal nor an identifier.
  implication: MultipleTextPart mutates the same unbound prop the same way and is silent only through a limit of the compiler's path analysis. The census of warnings understates the reach: three parts, four `bind:this` sites.

- timestamp: 2026-10-08T07:28Z (approx.)
  checked: `git show 41bee4002^:apps/frontend/src/lib/components/input/Input.svelte`
  found: before the commit that added `parts/`, all three `bind:this={mainInputs[…]}` sites were inside Input.svelte itself, beside the `$state([])` declaration.
  implication: the write became a cross-component prop mutation when the branches were extracted into parts; the `bind: keep — $state target for bind:this` comment travelled with the markup and explains why the array is `$state`, not who may write to it.

- timestamp: 2026-10-08T07:27Z (approx.)
  checked: apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts (`#current`)
  found: `userData.current` is a JSON round-trip clone — a plain object, not a `$state` proxy.
  implication: the `value` the profile page hands to Input is not reactive state; `value` is not part of these warnings on any route.

- timestamp: 2026-10-08T07:30Z
  checked: probe over the real component, an unmodified copy (control) and four variants, each a byte-identical copy of Input.svelte + parts with one change, in a gitignored scratch directory
  found: real = control (1/1/1 on mount for text-multilingual, textarea-multilingual, select-multiple; +1 per extra locale on toggle; +1 per bound field on unmount). optA (`$bindable` + `bind:mainInputs`): 0 warnings of any kind. optB (parts own `inputs`, export `focus()`, Input binds the part): 0. optD (plain array): `binding_property_non_reactive` at every site. optE (svelte-ignore): unchanged. Focus return after the toggle and after an option delete: true in every variant. Emitted values correct; the value handed in is untouched.
  implication: root cause confirmed by removal, with a control. The mutation has no observable consequence beyond the warning.

- timestamp: 2026-10-08T07:32Z
  checked: a host component rendering the real QuestionInput for the e2e/base info-question kinds in sort order (multipleChoiceCategorical, singleChoiceCategorical, text, text+longText, text+link, number, boolean, date, multipleText, text)
  found: four warnings on mount, in the logged order and with the logged text. Editing a multilingual field: no further warning, `{ en: 'edited' }` emitted.
  implication: the log is fully accounted for — one select-multiple, two text-multilingual, one textarea-multilingual; the multipleText question is the silent MultipleTextPart.

- timestamp: 2026-10-08T07:31Z (approx.)
  checked: production compile (`dev: false`) of Input and the three parts
  found: zero mentions of `ownership_validator`.
  implication: dev-only; nothing reaches a production bundle.

- timestamp: 2026-10-08T07:30Z
  checked: adjacent, with a host handing Input a `$state` proxy as `value`; and `structuredClone` of what `onChange` emits
  found: `DataCloneError` at Input's initial `structuredClone(value)` for text-multilingual and select-multiple; and the emitted value of text-multilingual, textarea-multilingual and select-multiple is itself uncloneable (a `$state` proxy — `prop()` proxies a local write to an unbound bindable prop).
  implication: not the cause of the warnings and not triggered by a current call site, but both are constraints on any new caller of the object-valued kinds.

## Resolution

root_cause: Input.svelte declares its focus-target array as `const mainInputs = $state([])` (line 221) and passes it to MultilingualTextPart, SelectMultiplePart and MultipleTextPart as a plain prop; each part writes element references into it with `bind:this={mainInputs[<index>]}`. A dev build instruments a write to a prop and warns when the prop is unbound and its value is a `$state` proxy. The write was a same-component one until the branches were extracted into `parts/` (commit 41bee4002). MultipleTextPart makes the same write and is silent only because its index is a compound expression the compiler does not trace.
fix: not applied (diagnosis only). Recommended: the parts own their element references and export `focus()`; Input holds the rendered part with `bind:this` and calls it. Alternative: `$bindable` + `bind:mainInputs`. Both measured at zero warnings with focus return intact.
verification: CONFIRMED by reproduction and removal — control and variants on copies; see the Evidence entry for the control and four variants. No tracked application file was changed.
files_changed: []
