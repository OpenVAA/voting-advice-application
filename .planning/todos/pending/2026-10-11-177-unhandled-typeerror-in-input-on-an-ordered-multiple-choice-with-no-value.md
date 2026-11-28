---
created: 2026-10-11T00:00:00.000Z
title: "`Input` throws an unhandled TypeError in an effect when an ordered multiple-choice input has no value — once in every full E2E run since the phase's baseline"
area: Frontend / components (input)
severity: minor
source: Phase 177 plan 177-21's reading of the closing run's dev-server log (the plan asks for its error lines to be counted); the line is older than the phase; filed by 177-21
owner: unassigned — the next plan that edits `Input` or the profile's questions
files:
  - apps/frontend/src/lib/components/input/Input.svelte
  - apps/frontend/src/lib/components/input/QuestionInput.svelte
---

## Finding

The dev-server log of every full E2E run holds this line once, with the component stack below it:

```
[vite] (client) [Unhandled error] TypeError: Cannot read properties of undefined (reading 'map')
	in $effect
	in Input.svelte
	in QuestionInput.svelte
	in MainContent.svelte
	in +page.svelte
 > $effect src/lib/components/input/Input.svelte:226:31
    225 |        const selected = ordered
    226 |          ? (value as Array<Id>).map((v) => options.find((o) => o.id === v)!)
```

The effect that derives the selected options of a multiple-choice input reads `value` as an array in its ordered branch; with no value it is `undefined` and `.map` throws. The cast hides it from the type check.

**Measured:** the line is present exactly once in the dev-server log of `tests/e2e-runs/176-e2e/261011-vj-final` (the phase's baseline), `177-19-close`, `177-20-close` and `177-21-final` under `tests/e2e-runs/177-e2e/`. `Input` is unchanged by Phase 177 (`git diff` of `apps/frontend/src/lib/components/input` from the phase's base commit to its close is empty). No test fails on it: the suite reads no console.

**Inferred, not established:** which page and which test. In the closing run the line follows, within a second, the two messages of a refused image upload ("The file is invalid.", "The file is too large."), which are the contestant journey's profile steps; the input is a `QuestionInput` of a page, so most likely an ordered multiple-choice info question of the base dataset's profile, rendered before it has a value. The test that was running was not identified, and what a user sees was not observed: the effect throws, so the selected options of that input are not derived on that run of the effect.

## Solution

Read the value as an array or as nothing in that branch (`(value ?? [])`), with a component case of `Input` that mounts an ordered multiple-choice input with no value and asserts that nothing is thrown. Then check the dev-server log of a full run for the line.
