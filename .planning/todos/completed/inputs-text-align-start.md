---
created: 2026-11-23
title: Align the text of every Input to the start, email inputs included
area: frontend
severity: minor
source: phase 189.1 UAT, test 2 (operator, bank sign-in on staging)
owner: a later frontend phase
files:
  - apps/frontend/src/lib/components/input/shared.ts
  - apps/frontend/src/lib/components/input/Input.svelte
completed: 2026-11-24
status: completed
---

## Problem

Requested by the operator on 2026-11-23: the text of the `Input` component, email inputs included, should align to the start. `shared.ts` gives the text input and the select `text-end` (and the input `justify-end`), so typed values sit at the end of the field; `Input.svelte` has a `text-center` element too.

## Done when

- Every `Input` variant aligns its value and placeholder with `text-start` (a logical value, so RTL locales follow), the email input included.
- The `text-center` in `Input.svelte` is either changed with them or kept for a stated reason.
- The component tests and the axe scans of the forms that use `Input` still pass, and no layout depending on the end alignment breaks.

## Closed (phase 189.1.1)

Fixed by plan 189.1.1-08 (`.planning/workstreams/deployment/phases/189.1.1-address-tech-debt-the-consent-prompt-covers-an-answer-choice/189.1.1-08-PLAN.md`), commit `fe1c5754f`; evidence in that phase's `evidence/189.1.1-08-controls.md`.

- **Every `Input` variant aligns its value and placeholder with `text-start`, the email input included.** `inputClass` and `selectClass` in `apps/frontend/src/lib/components/input/shared.ts` use `text-start`, and `inputClass` no longer carries `justify-end`. `inputClass` serves the text, url, email, password, colour, number and date kinds and the multilingual text part; `selectClass` serves the select and the select-multiple dropdown. `Input.textAlign.svelte.test.ts` holds it for the text, email and select controls: red before the change (3 failed, `the text control has no text-start`), green after.
- **The `text-center` in `Input.svelte` is kept, for a stated reason.** It is on the error message under the field (`class="my-sm text-center"`), not on the value: the message sits centred under the whole field.
- **The component tests and the axe scans of the forms that use `Input` still pass.** `yarn workspace @openvaa/frontend test:unit src/lib/components/input/`: 12 files, 251 tests passed. At `E2E_HEAD=fe1c5754f` the form projects are green: `contestant-email-registration`, `contestant-code-registration`, `contestant-password-recovery`, `admin-account-flows`, `contestant-entry-scan` (the entry screens' axe scans in both themes), `contestant-journey`, with `contestant-a11y-scan` and `a11y-smoke`. The row container (`inputAndIconContainerClass`) and `SelectMultiplePart`'s `!justify-end` row keep their layout, so nothing laid out by the end alignment moved; the visual baselines are unchanged (`VISUAL_RESULT=unchanged`).
