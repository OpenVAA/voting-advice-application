# Deferred Items — Phase 129

Out-of-scope issues discovered during execution, logged per the executor SCOPE BOUNDARY rule
(only auto-fix issues directly caused by the current task's changes).

## Discovered during plan 129-05 (Task 2, svelte-check run)

Pre-existing svelte-check errors in **sibling-plan files** (NOT touched by plan 05). Confirmed via
`git log` that these files were last modified by plans 129-02 / 129-04:

- `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` 585-586 —
  `Property 'min'/'max' does not exist on type '{ allowOpen: boolean; }'` (plan 129-02 bridge territory).
- `apps/frontend/src/lib/components/questions/NumberScaleInput.svelte` 79/82 — `state_referenced_locally`
  warnings (plan 129-04).
- `apps/frontend/src/lib/components/questions/OpinionQuestionInput.svelte` 122 — "union type too complex"
  + `value: unknown` not assignable to `number | null | undefined` for the NumberScaleInput branch (plan 129-04).

Plan 05's own files (`QuestionInput.svelte`, `MultipleTextInput.svelte`, `MultipleTextInput.type.ts`)
produce **zero** svelte-check errors/warnings. The above belong to plans 02/04 and should be resolved
in those plans' scope (or the phase's svelte-check-zero milestone gate), not here.
