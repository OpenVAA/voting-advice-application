---
status: diagnosed
trigger: "Test 5 in UAT (179.1): 'Make password input a subtype of Input.'"
created: 2026-10-31T17:10:00Z
updated: 2026-10-31T19:09:00Z
---

## Current Focus

bug_class: Bohrbug (deterministic; a design gap, not a runtime defect)
hypothesis: CONFIRMED - Input has no password kind; a value of `password` reaches the date/number branch (6.5), with no toggle and no per-keystroke value, so a real subtype needs its own branch and not just a new union member
test: Done - scratch vitest probe outside the repository
expecting: Done - results in Evidence
next_action: Hand the diagnosis back to the orchestrator; no fix in this mode

## Symptoms

expected: The password field is a type of the multi-type Input component rather than a separate component with its own native input.
actual: "Make password input a subtype of Input." The operator asked for this design change after being told PasswordField renders its own native input.
errors: None reported
reproduction: Test 5 in UAT
started: Discovered during UAT

## Eliminated

## Evidence

- timestamp: 2026-10-31T17:15:00Z
  checked: Input.type.ts InputProps union, Input.svelte branches
  found: No `password` member among the 15 kinds. The only native password control in the frontend is PasswordField.svelte:83-96 (git grep of type="password" outside tests)
  implication: H1 confirmed by reading - the field really is separate from Input

- timestamp: 2026-10-31T17:16:00Z
  checked: 179.1-20-PLAN.md, 179.1-20-SUMMARY.md, 179-UAT.md G-179-2
  found: G-179-2 asked that "every step's email and code fields use the Input component". Plan 20 rebuilt EmailField and RegistrationCodeField on Input. The password field was never in scope, and no decision excludes it
  implication: The gap is scope, not a regression. Git history shows PasswordField only gaining props in 178-09 and 178-11

- timestamp: 2026-10-31T17:17:00Z
  checked: Input.svelte handleChange, fieldText binding (lines 296, 692) and EmailField.svelte handleInput
  found: The text kinds write `value` only on `change`; EmailField's comment says "Input takes an entry in when it is committed; the caller is handed every keystroke" and it passes an oninput to do that
  implication: PasswordField's `bind:value={password}` is live per keystroke, which Input's text path is not. Consumers rely on it: admin login canSubmit, PasswordValidator's rule list, the edit-clears-error handlers

- timestamp: 2026-10-31T19:05:00Z
  checked: Scratch vitest probe outside the repository (scratchpad/pw/probe.test.ts) mounting the current Input with type="password" and the current PasswordField
  found: Input - 0 buttons; value undefined on mount and after an input event, "abc" only after a change event; nativeRequired false, aria-required "true", required badge rendered; name, autocomplete, passwordrules and data-testid all reach the control. PasswordField - 1 button; value "abc" after the input event; native required true, aria-required absent
  implication: H2 confirmed. A new union member alone is not a subtype: it needs its own branch with a toggle and a live value. The four attributes need no new plumbing

- timestamp: 2026-10-31T19:06:00Z
  checked: Served HTML of http://localhost:5173/contestant/login/email
  found: One form holds both shapes. Email is an Input (in-row label with inputLabelClass, control with inputClass); password has an outside `<label class="text-start">` and `class="input w-full"`
  implication: The inconsistency the operator described is visible on the running application, not only in the source

- timestamp: 2026-10-31T19:07:00Z
  checked: Vitest on the paths holding PasswordField, PasswordSignIn, PasswordSetter, the two sign-in pages and setPasswordLayout
  found: 8 files, 220 of 220 pass on the current tree. PasswordField 11 cases, PasswordSignIn 22, PasswordSetter 33
  implication: Green baseline, and the size of the unit population pinned to the present markup

- timestamp: 2026-10-31T19:08:00Z
  checked: git grep for password-field across tests/ and server actions for the field name
  found: testIds.contestant.password.field is read in 7 E2E files. password-field-toggle has no E2E reader. Three server actions read data.get('password')
  implication: The test id and the default name must be kept. All E2E selectors keep working if they are

## Resolution

root_cause: The Input component has no password kind. Its InputProps union stops at 15 kinds with no `password`, and the frontend's only native password control lives in the stand-alone PasswordField. Phase 179.1 plan 20 moved only the email and code fields onto Input because G-179-2 named only those two; no decision kept the password field out, it was simply not in scope. Passing type="password" to Input today reaches the date/number branch, which has no show/hide toggle and hands the caller the value only on `change`, not on each keystroke as PasswordField does.
fix: not applied (goal: find_root_cause_only)
verification: not applicable (diagnosis only)
files_changed: []
