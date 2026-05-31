---
phase: quick-260531-we7
plan: 01
subsystem: frontend-input
tags: [bugfix, input, number-question, validation, candidate-app, voter-app]
requires:
  - "backend validate_answer_value RPC (apps/supabase) — authoritative number-type gate (unchanged)"
provides:
  - "Number input change handler emits a real JS number | undefined, never a string"
affects:
  - "Every number question rendered via Input / QuestionInput (candidate + voter apps)"
tech-stack:
  added: []
  patterns:
    - "instanceof HTMLInputElement narrowing to access valueAsNumber without any"
    - "NaN/empty valueAsNumber -> undefined (cleared), per CLAUDE.md no-any strict TS"
key-files:
  created: []
  modified:
    - apps/frontend/src/lib/components/input/Input.svelte
decisions:
  - "Single generic fix point in handleChange (WE7-NUM-COERCE) — applies everywhere number inputs render"
  - "Empty/non-numeric field -> undefined (cleared), never NaN, never empty string"
metrics:
  duration: ~6min
  completed: 2026-05-31
  tasks_completed: 1
  files_modified: 1
---

# Phase quick-260531-we7 Plan 01: Fix setAnswers number-question coercion Summary

One-liner: Added a `type === 'number'` branch to `Input.svelte`'s `handleChange` that coerces the DOM string value to a real JS `number` via `valueAsNumber` (or `undefined` when cleared), fixing the "setAnswers: Answer for number question must be a number" backend-validation error.

## What Was Built

The frontend previously emitted the raw `<input>.value` (always a string) for `number` inputs, which fell into `handleChange`'s catch-all `else`. The backend `validate_answer_value` RPC requires a JSON number, so the string failed validation.

The fix inserts a new branch in `handleChange` (Input.svelte), immediately before the catch-all `else` and after the `email` branch:

```ts
} else if (type === 'number' && currentTarget instanceof HTMLInputElement) {
  // `valueAsNumber` is NaN for an empty or non-numeric field — map that to a cleared value.
  const numericValue = currentTarget.valueAsNumber;
  value = Number.isNaN(numericValue) ? undefined : numericValue;
```

- `valueAsNumber` (native `HTMLInputElement` numeric accessor) yields a real `number`.
- `NaN` (empty / non-numeric field) maps to `undefined` (cleared), never `NaN`, never a string.
- The `instanceof HTMLInputElement` guard narrows `currentTarget` so `valueAsNumber` is accessible without `any` — same narrowing pattern already used in the checkbox and file branches.
- The `number` variant's value type is `number | null` (`value?: TValue | null` in Input.type.ts), so assigning `undefined` is type-safe.

The catch-all `else` still handles the remaining string-valued types (date, text). No render markup, `ensureValue()`, or other branch was touched.

## Task Completion

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | Coerce number input value to a real number in handleChange | 41ee79340 | apps/frontend/src/lib/components/input/Input.svelte |

## Verification

Automated gate (Task 1 `<verify>`): `cd apps/frontend && yarn svelte-kit sync && yarn check`

- `Input.svelte`: NO errors and NO warnings introduced (grep-confirmed clean).
- No `any` introduced; strict TS preserved via `instanceof HTMLInputElement` narrowing.
- Full-suite `yarn check` reports 158 pre-existing errors across unrelated files (admin job routes `cookies`/`qs` declarations, `runes-test/*` fixtures, settings page, LanguageSelection store typing). These are OUT OF SCOPE per the executor scope boundary — none are in or caused by the modified file. Logged here for visibility; not fixed.

## Deviations from Plan

None — plan executed exactly as written.

## Threat Model Notes

- **T-we7-01 (accept):** Backend `validate_answer_value` remains the authoritative gate; this fix makes the client honour that contract. Server check unchanged.
- **T-we7-02 (mitigate):** Implemented — empty/NaN `valueAsNumber` maps to `undefined` (cleared), so a blank field never emits `NaN`.
- **T-we7-SC:** N/A — no package installs.

No new security-relevant surface introduced.

## Self-Check: PASSED

- FOUND: apps/frontend/src/lib/components/input/Input.svelte (branch present, contains `valueAsNumber`)
- FOUND: commit 41ee79340

## Checkpoint Status

Task 1 complete and committed. The plan's next task is a `type="checkpoint:human-verify"` (`gate="blocking"`) — manual browser UAT in the candidate app (save a number question, reload, clear-and-save, sanity-check a non-number input). Per execution constraints, the executor STOPS here and hands off to the orchestrator/user for manual verification.
