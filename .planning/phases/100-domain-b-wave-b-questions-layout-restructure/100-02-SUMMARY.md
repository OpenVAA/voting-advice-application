---
phase: 100-domain-b-wave-b-questions-layout-restructure
plan: 02
subsystem: voter-frontend / questions-route
tags: [svelte5, sveltekit, routing, unified-layout, QLAYOUT-01, QLAYOUT-02, phase-99-a11y, view-transitions, wave-2]
requires:
  - "100-01 (D-03 answer-survival assertion in voter-journey.spec.ts — the regression gate this restructure must keep green)"
  - "results/[[electionTab]]/+layout.svelte + +layout.ts (production unified-layout-with-empty-leaf analog)"
  - "Phase 99 Wave A a11y/transition markers (view-transition-name hero/heading, data-focus-on-nav, tabindex=-1, MainContent title announcer)"
provides:
  - "questions/+layout.svelte owns the persistent question render shell (QLAYOUT-01): hero/heading/info/input/actions + handlers + derivations hoisted from the leaf"
  - "questions/+layout.ts parity LayoutLoad returning {} (D-01)"
  - "questions/[questionId]/+page.svelte empty leaf stub (QLAYOUT-01)"
  - "{#key question.type} variant remount boundary (QLAYOUT-02) — input survives same-type Q→Q, remounts only at a type boundary"
affects:
  - "Phase 101 milestone-close E2E gate (voter-journey incl. D-03 + a11y-smoke route-announcer/focus must stay green on the restructured tree)"
tech_stack:
  added: []
  patterns:
    - "Unified-layout-with-empty-leaf (layout owns render shell; leaf is an empty stub) — mirrors results/[[electionTab]]/ triplet"
    - "{#key question.type} variant-scoped remount (mirrors results +layout.svelte:400 scope-tuple {#key})"
    - "Sibling-route guard: derivation early-returns undefined on absent questionId (no throw); render gates on question && questionBlock, else {@render children()}"
    - "Context Destructuring Rule: stables destructured, voterCtx.selectedQuestionBlocks/opinionQuestions read via ctx.X; per-field parseParams(page) reads"
key_files:
  created:
    - "apps/frontend/src/routes/(voters)/(located)/questions/+layout.ts"
  modified:
    - "apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte"
    - "apps/frontend/src/routes/(voters)/(located)/questions/[questionId]/+page.svelte"
decisions:
  - "Assumption A2 / Pitfall 3: kept the ?start= handler as onMount in the layout. The start param is only present on the entry URL of a 'start answering from here' deep-link, so it must fire once per session — exactly what onMount on the persistent layout provides. Porting to afterNavigate/$effect would re-fire per hop and is unnecessary; onMount preserves current behavior verbatim."
  - "Sibling-route guard: replaced the leaf's `if (!questionId) error(500)` with an early-return of undefined so intro + category sibling routes (where page.params.questionId is undefined) render via {@render children()} and never throw. Preserved the unknown-id try/catch → error(404) for a real [questionId] route with a bad id."
  - "disabled $state + QuestionActions stay OUTSIDE {#key question.type}; only OpinionQuestionInput is wrapped, so the disabled flag + voterCtx.answers survive a variant remount (A1: QuestionActions verified zero $state)."
  - "Removed the unused Loading import: Region E replaces the leaf's {:else}<Loading/> with {@render children?.()}, so Loading is no longer referenced in the layout."
metrics:
  duration: ~12min
  completed: 2026-06-04
  tasks: 3
  files: 3
---

# Phase 100 Plan 02: Questions Layout Restructure Summary

Hoisted the entire `/questions` render shell from the `[questionId]/+page.svelte` leaf into the parent `questions/+layout.svelte` (the unified-layout-with-empty-leaf shape that already ships at `results/[[electionTab]]/+layout.svelte`), added the parity `questions/+layout.ts` load (D-01), collapsed the leaf to an empty stub (QLAYOUT-01), and moved variant remounting to `{#key question.type}` (QLAYOUT-02) — preserving every Phase 99 Wave A a11y/transition marker verbatim and keeping the intro + category sibling routes rendering through the layout's `{@render children()}` branch.

## What Was Built

**Task 1 — `questions/+layout.ts` (D-01 parity load):** new typed `export const load: LayoutLoad = async () => ({})` mirroring `results/[[electionTab]]/+layout.ts`'s const-form + return-`{}` shape, with the `// eslint-disable-next-line func-style` reason and a doc-comment noting data flows via `voterCtx` (load is a parity stub establishing the unified-layout pattern; no server guard). Ran `yarn build` so `.svelte-kit` regenerates `./$types` with the new `LayoutLoad`.

**Task 2 — hoist into `questions/+layout.svelte` (Regions A–E):**
- **Region A (preserved):** the outer envelope — `getVoterContext()`/`getLayoutContext()` reads, `topBarSettings.use({...})`, the `progress.max` `$effect`, and the `{#if voterCtx.opinionQuestions.length > 0} ... {:else} ...noQuestions MainContent... {/if}` shell. The new question branch lives inside the truthy branch.
- **Region B:** merged the hoisted contexts (`{ answers, appSettings, dataRoot, getRoute, startEvent, t }` + `{ topBarSettings, progress, video }`), the `question` `$derived.by` and `questionBlock` `$derived`, per-field `parseParams(page)` reads. The absent-`questionId` branch now EARLY-RETURNS `undefined` (sibling-route guard) instead of throwing; the unknown-id `try/catch → error(404)` is preserved.
- **Region C:** moved the side-effect `$effect` (progress.current.set + video.load + the two-level `if (!questionBlock) { if (question) goto(...) }` redirect guard, kept per Pitfall 4) and the `?start=` `onMount` (kept as `onMount` per Assumption A2).
- **Region D:** moved `disabled` `$state` + `handleAnswer` / `handleDelete` / `handleJump` verbatim (kept `noScroll: true` in `handleJump`).
- **Region E:** the render branch — question `MainContent` renders only when `question && questionBlock`, else `{@render children?.()}`. `OpinionQuestionInput` wrapped in `{#key question.type}`; `QuestionActions` outside the key. All four Phase 99 markers copied verbatim. `MainContent` import re-pathed `../../../../` → `../../../`.

**Task 3 — empty leaf stub (QLAYOUT-01):** replaced all 239 lines of `[questionId]/+page.svelte` with the 4-line empty-leaf stub (HTML comment + empty `<script lang="ts">` body), matching `results/.../[[id]]/+page.svelte`.

## Verification

- `cd apps/frontend && yarn build` → exit 0 after every task (catches import-depth, parse, `{#key}` errors).
- `npx eslint` on the hoisted layout + the emptied leaf → exit 0 each.
- `yarn workspace @openvaa/frontend test:unit` → 725 passed (46 files), unchanged.
- Grep acceptance gates (all pass): `{#key question.type}` present; `{#key question.id}`/`{#key questionId}` absent; all four Phase 99 markers (`view-transition-name: question-hero`, `view-transition-name: question-heading`, `data-focus-on-nav`, `tabindex="-1"`) present; `MainContent title=` present; `error(500` count 0 (early-return) + `error(404` preserved; `@render children` preserved; per-field `parseParams(page)` (no `$derived(page).` proxy-trap); `noScroll` preserved; re-pathed three-level `MainContent` import (no four-level); `opinionQuestions.length` + `topBarSettings.use` envelope preserved; no `any`; leaf is a 4-line stub with no `MainContent`/imports/handlers.
- Phase 99 marker diff (old leaf vs new layout) confirms the four markers + `MainContent title={text}` moved verbatim with no edits.

**Operator/wave gate (not blocking this autonomous plan):** the live-stack E2E — `yarn db:reset && yarn db:seed --template e2e/base --likert-only && yarn dev` then `yarn test:e2e --project=voter-journey` GREEN (incl. the Plan 01 D-03 answer-survival assertion) AND `PLAYWRIGHT_A11Y=1 yarn test:e2e --project=a11y-smoke` GREEN — is the Phase 101 milestone-close gate, deferred per the plan's verification block.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed the unused `Loading` import from the hoisted layout**
- **Found during:** Task 2 (eslint gate flagged `'Loading' is defined but never used`).
- **Issue:** The plan's import list named `Loading` to add, but Region E explicitly replaces the leaf's `{:else}<Loading/>` fallback with `{@render children?.()}`, so `Loading` ends up unreferenced — eslint (a required Task 2 gate) errored.
- **Fix:** Dropped the `import { Loading } from '$lib/components/loading'` line. No behavior change (the `<Loading />` it backed was already being replaced by the sibling-children render).
- **Files modified:** `apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte`.
- **Commit:** `22b72f0de`.

**2. [Rule 3 - Blocking] Reworded an explanatory comment to keep the `error(500` grep gate at 0**
- **Found during:** Task 2 (acceptance grep `grep -c "error(500"` must return 0).
- **Issue:** A code comment described the guard as "NOT error(500)", which the literal grep counted as an `error(500` occurrence even though no such call exists.
- **Fix:** Reworded the comment to "the leaf's old absent-id throw is dropped" so the literal token no longer appears; the actual code has zero `error(500)` calls.
- **Files modified:** same layout file.
- **Commit:** `22b72f0de`.

## Threat Surface

No new trust boundary, I/O, auth, network, or input-validation surface. Per the plan's threat register (T-100-02 accept / T-100-03 mitigate / T-100-SC N/A): pure client-side SvelteKit route/layout restructure. The `questionId` path-param is validated/resolved exactly as before (`try/catch → error(404)` moved verbatim leaf→layout). The only new safety-relevant element is the sibling-route guard, which NARROWS (does not broaden) what renders the question UI: the question branch fires only when `question && questionBlock` are truthy, and the absent-`questionId` early-return prevents any error path from firing on the intro/category routes. No package installs.

## Known Stubs

None that block the plan goal. `questions/[questionId]/+page.svelte` is now an intentional empty-leaf stub by design (QLAYOUT-01) — rendering is owned by `questions/+layout.svelte`. This is the production unified-layout pattern (mirrors `results/.../[[id]]/+page.svelte`), not an unfinished placeholder.

## Deferred Issues

One pre-existing svelte-check error relocated verbatim with a Phase 99 marker (NOT introduced by this plan). Logged to `deferred-items.md`:
- `questions/+layout.svelte:225` — `tabindex="-1"` on `QuestionHeading` → `Type 'string' is not assignable to type 'number'`. The identical pattern still errors at the untouched `candidate/(protected)/questions/[questionId]/+page.svelte:277`. Net svelte-check error count for this marker is unchanged (moved leaf→layout). Not fixed here because Phase 100 mandates preserving the marker verbatim and `yarn build` (the plan's primary gate) is clean. Suggested follow-up: type `QuestionHeading`'s forwarded `tabindex` prop to accept `string | number`, then update the voter layout + candidate leaf together.

## Self-Check: PASSED

- FOUND: `apps/frontend/src/routes/(voters)/(located)/questions/+layout.ts`
- FOUND: `apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte` (hoisted; 5 MainContent refs, `{#key question.type}`, four Phase 99 markers)
- FOUND: `apps/frontend/src/routes/(voters)/(located)/questions/[questionId]/+page.svelte` (4-line stub)
- FOUND: commit `975c6f34e` (Task 1)
- FOUND: commit `22b72f0de` (Task 2)
- FOUND: commit `59be4ea4c` (Task 3)
