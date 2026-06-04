# Phase 100: Domain B Wave B — Questions Layout Restructure - Pattern Map

**Mapped:** 2026-06-04
**Files analyzed:** 3 (1 modified layout, 1 new load, 1 collapsed leaf) + 1 modified E2E spec
**Analogs found:** 3 / 3 (all exact, in-tree production references)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `(voters)/(located)/questions/+layout.svelte` (MODIFIED — hoist target) | route (layout) | request-response (URL-driven render) | `results/[[electionTab]]/+layout.svelte` | exact (production unified-layout-with-empty-leaf) |
| `(voters)/(located)/questions/+layout.ts` (NEW — D-01) | route (load) | request-response | `results/[[electionTab]]/+layout.ts` | exact (parity, returns `{}`) |
| `(voters)/(located)/questions/[questionId]/+page.svelte` (MODIFIED — collapse to stub) | route (page) | n/a (empty stub) | `results/.../[[id]]/+page.svelte` | exact (verbatim empty-leaf) |
| `tests/tests/specs/voter/voter-journey.spec.ts` (MODIFIED — append D-03 assertion) | test | request-response (E2E nav) | existing `expectQuestionAndAdvance` helper usage in same spec | role-match (extend, not create) |

**Note:** Per D-02 / RESEARCH Anti-Patterns, do NOT introduce `[[questionId]]` (optional). Keep `[questionId]` (required); the layout branches on question presence vs `{@render children()}` for the intro/category siblings.

## Pattern Assignments

### `(voters)/(located)/questions/+layout.svelte` (route layout, request-response) — HOIST TARGET

**Primary analog:** `results/[[electionTab]]/+layout.svelte`
**Hoist source:** current `[questionId]/+page.svelte` (entire `<script>` + render block)
**Outer envelope to preserve:** current `questions/+layout.svelte` (the `{#if voterCtx.opinionQuestions.length > 0}` shell)

This file is assembled from THREE existing in-tree sources. Copy each region as cited below.

---

**REGION A — Outer envelope (PRESERVE verbatim from current `questions/+layout.svelte`)**

The existing layout shell stays as the outermost branch. Keep its context reads, `topBarSettings.use`, progress `$effect`, and the `opinionQuestions.length > 0` guard. The new question-rendering branch goes INSIDE the `{@render children?.()}` position (see Region E for the branching shape).

Current envelope (`questions/+layout.svelte:23-43`):
```svelte
const voterCtx = getVoterContext();
const { appSettings, getRoute, t } = voterCtx;
const { topBarSettings, progress } = getLayoutContext();
let { children }: { children: Snippet } = $props();

topBarSettings.use({
  progress: 'show',
  actions: { results: $appSettings.questions.showResultsLink ? 'show' : 'hide' }
});

$effect(() => {
  progress.max = voterCtx.selectedQuestionBlocks.questions.length + 1;
});
```
Render shell (`questions/+layout.svelte:45-60`) — the `{:else}` "noQuestions" `MainContent` block stays unchanged.

---

**REGION B — Hoisted contexts + question/questionBlock derivation (MOVE from leaf `+page.svelte:47-71`)**

Merge into the layout script. The leaf already follows the Context Destructuring Rule (stables destructured, `voterCtx.selectedQuestionBlocks` read directly) and uses per-field `parseParams(page)` — preserve verbatim. NOTE: the layout already destructures `{ appSettings, getRoute, t }`; extend to `{ answers, appSettings, dataRoot, getRoute, startEvent, t }` and add `video` from `getLayoutContext()`.

```svelte
let question = $derived.by<AnyQuestionVariant | undefined>(() => {
  const questionId = parseParams(page).questionId;   // per-field read (Spike 012 trap avoided)
  if (!questionId) error(500, 'No questionId provided.');
  try {
    return questionId === FIRST_QUESTION_ID
      ? voterCtx.selectedQuestionBlocks.blocks[0]?.[0]
      : $dataRoot.getQuestion(questionId);
  } catch {
    error(404, `Question with id ${questionId} not found.`);
  }
});
let questionBlock = $derived(question ? voterCtx.selectedQuestionBlocks.getByQuestion(question) : undefined);
```

> A `[questionId]` route will always supply `questionId`. On the intro (`questions/+page.svelte`) and category (`category/[categoryId]/+page.svelte`) routes `page.params.questionId` is `undefined`, so the `error(500)` path must NOT fire on those. Gate the question UI on `question && questionBlock` truthiness (Region E) — the derivation only runs in markup that is guarded. Verify: `error(500)` inside `$derived.by` will throw on intro routes if the derivation is evaluated. Plan should guard the derivation read (early-return `undefined` when no `questionId`) rather than `error(500)` — preserve current 404/500 semantics ONLY for the `[questionId]` route. (See Pitfall 2.)

---

**REGION C — Side-effect `$effect` + lifecycle (MOVE from leaf `+page.svelte:74-105`, AUDIT per Pitfall 3/4)**

```svelte
$effect(() => {
  if (!questionBlock) {
    if (question) {                          // two-level guard — redirect only on genuine miss
      const questionId = parseParams(page).questionId;
      logDebugError(`Question with id ${questionId} not found ... Rerouting ...`);
      goto($getRoute('Questions'));
    }
  } else {
    progress.current.set(questionBlock.index + 1);
    if (question) {
      const customData = getCustomData(question);
      if (customData?.video) video.load(customData.video);
    }
  }
});
```
- Pitfall 4: KEEP the two-level `if (!questionBlock) { if (question) ... }` guard — it prevents a redirect on transient `$derived` recompute.
- Pitfall 3: the `onMount` `?start=` handler (`+page.svelte:97-105`) fires once per mount. On the persistent layout it fires once per session, not per question. AUDIT: port to `afterNavigate` or `$effect(() => { page.params.questionId; ... })` if it must run per deep-link; the research notes it may already be correct (start only present on entry URL). Document the decision.

---

**REGION D — Handlers (MOVE verbatim from leaf `+page.svelte:111-161`)**

`disabled` `$state`, `handleAnswer`, `handleDelete`, `handleJump` move unchanged. Keep `disabled` `$state` in the layout script (OUTSIDE any `{#key}` — survives variant remount, per Open Question 2). Keep `noScroll: true` in `handleJump`'s `goto` (Anti-Pattern: do not drop it — fights Phase 99 `preventScroll` focus).

---

**REGION E — Render branch (MOVE from leaf `+page.svelte:164-239`) with `{#key question.type}` (QLAYOUT-02)**

Branch the layout: render the question `MainContent` when `question && questionBlock`, else `{@render children?.()}` so intro + category siblings render. This replaces the leaf's `{#if question && questionBlock} ... {:else}<Loading/>` AND the current layout's bare `{@render children?.()}`.

Phase 99 markers — copy VERBATIM (Pitfall 1 grep gate): `view-transition-name: question-hero` on the hero `<figure>` (leaf line 171); `data-focus-on-nav`, `tabindex="-1"`, `view-transition-name: question-heading` on `QuestionHeading` (leaf lines 179-185); `MainContent title={text}` must stay (feeds Phase 99 `routeTitle` announcer).

The `{#key}` boundary — wrap ONLY `OpinionQuestionInput`. Mirror production `{#key }${activeElectionId}:${activeEntityType}``` at `results/[[electionTab]]/+layout.svelte:400`:
```svelte
{#key question.type}
  <OpinionQuestionInput
    question={question!}
    answer={answers.answers[question!.id]}
    onChange={handleAnswer}
    data-testid="voter-questions-input" />
{/key}
```
`QuestionActions` stays OUTSIDE the `{#key}` (prop-driven, no variant `$state` — Assumption A1; planner verifies by reading the component). Forbidden: `{#key question.id}` / `{#key questionId}` (D-02).

**Imports pattern** — merge the leaf's imports into the layout, RE-PATHING by one level (Pitfall 5):
```svelte
import MainContent from '../../../MainContent.svelte';  // was ../../../../ in leaf; layout is one shallower
```
Layout already imports `MainContent` at `../../../MainContent.svelte` — match it. Add: `getCustomData`, `error`, `goto`, `page`, `Hero`, `Loading`, the four `$lib/components/questions` symbols, `QuestionHeading`, `logDebugError`, `FIRST_QUESTION_ID`/`parseParams`, `DELAY`, type `AnyQuestionVariant`. Audit `onMount` import need per Region C decision.

---

### `(voters)/(located)/questions/+layout.ts` (route load, request-response) — NEW (D-01)

**Analog:** `results/[[electionTab]]/+layout.ts` (verified returns `{}` after guards)

Per Open Question 1 + Assumption A4: question data flows through `voterCtx` (client contexts), not page `load` data. Create the parity file with a typed `LayoutLoad` that returns `{}` (a stub establishing the unified-layout pattern), unless the plan identifies a real server guard. Mirror the const-form annotation + eslint-disable from the analog:
```ts
import type { LayoutLoad } from './$types';

// eslint-disable-next-line func-style -- reason: SvelteKit LayoutLoad type-binding requires const-form annotation
export const load: LayoutLoad = async () => {
  return {};
};
```
No `any` (CLAUDE.md). Run `yarn build` after creating so `./$types` regenerates the `LayoutLoad` type (Runtime State Inventory — stale `.svelte-kit` mis-types).

---

### `(voters)/(located)/questions/[questionId]/+page.svelte` (route page) — COLLAPSE TO STUB (QLAYOUT-01)

**Analog (verbatim):** `results/.../[[id]]/+page.svelte:39-41`

Replace the entire file (all 239 lines) with the empty-leaf shape:
```svelte
<!-- Empty leaf — rendering owned by questions/+layout.svelte (results shape / spike 014b). -->
<script lang="ts">
  // Intentionally empty — questions/+layout.svelte owns question rendering.
</script>
```
Grep gate (QLAYOUT-01): leaf has empty `<script>` body; `grep -c "MainContent" questions/+layout.svelte` > 0.

---

### `tests/tests/specs/voter/voter-journey.spec.ts` (test) — APPEND D-03 assertion

**Analog:** existing `expectQuestionAndAdvance` helper usage + the page-reuse comment at `voter-journey.spec.ts:212-224` (load-bearing context).

Append (NOT a new spec): after answering N questions, navigate back/forward and assert a previously answered option remains set (e.g. answered option `toBeChecked`). Reuse `expectQuestionAndAdvance` + add a back-navigation step. This asserts the exact behavior the restructure must preserve (layout-owned `$state` + `voterCtx.answers` survive Q→Q).

## Shared Patterns

### Context Destructuring Rule (CLAUDE.md)
**Source:** current leaf `+page.svelte:47-48`, current layout `+layout.svelte:23-24`
**Apply to:** the hoisted layout script
Stable refs destructured: `{ answers, appSettings, dataRoot, getRoute, startEvent, t }` + `{ progress, video, topBarSettings }`. Reactive accessors read via `voterCtx.X`: `voterCtx.selectedQuestionBlocks`, `voterCtx.opinionQuestions`. Never destructure the reactive ones.

### Per-field `page` reads (CLAUDE.md / Spike 012)
**Source:** `parseParams(page)` in leaf; `page.params.questionId` in spike 014b line 25
**Apply to:** every `page` read in the hoisted derivations — `page.params.questionId` / `parseParams(page)`, never `$derived(page).params.X`.

### `{#key}` variant-scoped remount
**Source:** `results/[[electionTab]]/+layout.svelte:399-414`
**Apply to:** the `OpinionQuestionInput` wrap only — `{#key question.type}`.

### Phase 99 a11y/transition markers (PRESERVE — regression gate)
**Source:** leaf `+page.svelte:171` (`view-transition-name: question-hero`), `:179-185` (`data-focus-on-nav`, `tabindex="-1"`, `view-transition-name: question-heading`), `MainContent title=`
**Apply to:** the hoisted render branch verbatim. Grep gate: all four markers present in `+layout.svelte`. Phase 99 root-layout hooks (focus reset + `#route-announcer`) are NOT touched — this phase only re-emits the target markers from the new location.

### Empty-leaf comment convention
**Source:** `results/.../[[id]]/+page.svelte:40`
**Apply to:** the collapsed `[questionId]/+page.svelte`.

## No Analog Found

None. Every file maps to an exact in-tree production analog (`results/[[electionTab]]/` triplet) plus the validated spike (`runes-test/nav-keyed-content/questions/+layout.svelte`, 014b) and the hoist source (current `questions/[questionId]/+page.svelte`). This is a pure move+collapse refactor.

## Metadata

**Analog search scope:** `apps/frontend/src/routes/(voters)/(located)/questions/`, `.../results/[[electionTab]]/`, `apps/frontend/src/routes/runes-test/nav-keyed-content/`, `tests/tests/specs/voter/`
**Files scanned:** 7 (2 read in full as hoist source/envelope; 5 read as analogs/structure-confirm)
**A3 confirmed:** no `+layout.ts` currently exists under `questions/` (verified via `ls`) — the new file is greenfield-parity, not a merge.
**Pattern extraction date:** 2026-06-04
