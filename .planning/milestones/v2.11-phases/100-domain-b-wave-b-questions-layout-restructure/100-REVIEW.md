---
phase: 100-domain-b-wave-b-questions-layout-restructure
reviewed: 2026-06-05T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - apps/frontend/src/routes/(voters)/(located)/questions/+layout.ts
  - apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte
  - apps/frontend/src/routes/(voters)/(located)/questions/[questionId]/+page.svelte
  - tests/tests/specs/voter/voter-journey.spec.ts
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
---

# Phase 100: Code Review Report

**Reviewed:** 2026-06-05T00:00:00Z
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

This is the Domain B Wave B questions-layout restructure: question rendering is
hoisted from `[questionId]/+page.svelte` into the parent
`questions/+layout.svelte` (unified-layout-with-empty-leaf, mirroring the
shipping `results/[[electionTab]]/+layout.svelte`). I verified the hoist against
the pre-restructure baseline (`1a3444914`), the results reference pattern, the
e2e/base seed dataset, and the global a11y/transition infrastructure in the root
`+layout.svelte`.

**What is correct and preserved:**
- The `{#key question.type}` block (not `question.id`) is correctly scoped to the
  type boundary (QLAYOUT-02 / D-02). Layout-owned `disabled` `$state` and
  `voterCtx.answers` live OUTSIDE the keyed block and survive the remount (D-03).
- All Phase 99 a11y/transition markers are preserved **verbatim** in the hoisted
  branch: `view-transition-name: question-hero` / `question-heading`,
  `data-focus-on-nav`, `tabindex="-1"`. The `aria-live` route announcer,
  `afterNavigate` focus reset, and `prefers-reduced-motion` handling live in the
  root `+layout.svelte` and are untouched by this hoist.
- Sibling routes (intro `+page.svelte`, category `[categoryId]/+page.svelte`)
  still render via `{@render children?.()}` — the new `question`/`questionBlock`
  truthiness gate falls through to `children` when `page.params.questionId` is
  undefined. The old leaf's `error(500, 'No questionId provided.')` throw is
  correctly dropped (it would have broken siblings had it been hoisted as-is).
- The `opinionQuestions.length > 0` outer gate that shadows `children` is
  unchanged from the baseline — not a regression.
- `+layout.ts` is a faithful parity stub matching the results pattern; returning
  `{}` with no server guard is correct since question data flows through
  client-side `voterCtx`, not page load data.

**Key concerns:** a dropped `<Loading>` fallback that now renders a blank screen
during the transient question-not-yet-resolved window, an `$effect`-driven
`goto` redirect that can race on the persistent layout, and a factually wrong
comment in the D-03 test that mislabels the question type being crossed (the
test logic is nonetheless sound).

## Warnings

### WR-01: `<Loading>` fallback dropped — blank screen during transient resolve window on a real `[questionId]` route

**✓ RESOLVED** — commit `c4d6a082e`. Re-added the `Loading` import and split the `{:else}` into `{:else if parseParams(page).questionId}` → `<Loading class="mt-lg" />` (the old leaf's verbatim fallback for a resolving `[questionId]` route) and `{:else}` → `{@render children?.()}` (sibling intro/category routes). Behavior now matches the pre-hoist leaf; siblings unaffected. Build + lint + unit (725/725) green.

**File:** `apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte:285-287`
**Issue:** In the pre-hoist leaf, when `question && questionBlock` was falsy the
template rendered `{:else} <Loading class="mt-lg" />`. In the hoisted layout the
`{:else}` branch instead renders `{@render children?.()}`, and the leaf
(`[questionId]/+page.svelte`) is now an empty stub that renders nothing. On a
real `/questions/<id>` route there is a transient window where `questionId` is
defined (so `question` resolves via `$dataRoot.getQuestion`) but
`voterCtx.selectedQuestionBlocks` has not yet populated, so `questionBlock` is
`undefined`. During that window the user now sees a **blank screen** instead of
the loading spinner. This is the redirect-effect window handled at lines 107-115
(`if (!questionBlock) { if (question) { ... goto(...) } }`). It is also the
SSR/hydration window. The `<Loading>` was a deliberate UX affordance and was
silently lost in the hoist.
**Fix:** Restore the loading affordance for the `[questionId]`-route case while
still yielding to `children` for the sibling (undefined-questionId) routes. Gate
on whether a `questionId` is present:
```svelte
{:else}
  {#if parseParams(page).questionId}
    <Loading class="mt-lg" />
  {:else}
    {@render children?.()}
  {/if}
{/if}
```
(Re-add the `Loading` import that was removed from the leaf.) This distinguishes
"on a question route, still resolving" (spinner) from "on a sibling route"
(children).

### WR-02: `$effect`-driven `goto('Questions')` redirect now lives on the persistent layout — re-fires on every reactive churn, not once per page mount

**△ DISPOSITIONED — pre-existing, not introduced by this phase (no code change).** Three reasons: (1) per the project's own spike findings (CLAUDE.md skill routing), SvelteKit already reused the old `[questionId]/+page.svelte` across param-only navigations, so this `$effect` already re-ran on every Q→Q hop without remounting — the hoist does not change that. (2) On the sibling routes the layout newly renders (intro/category), `parseParams(page).questionId` is `undefined` → `question` is `undefined` → the redirect branch (`if (!questionBlock) { if (question) … }`) is a provable no-op. (3) The `start` handler immediately below was deliberately kept `onMount` with an in-code comment explaining the persistent-layout lifetime; the redirect `$effect` was moved verbatim and its `question && !questionBlock` trigger is unchanged. The transient `question`-resolved-before-`questionBlock` window it describes is the known pre-existing voter-app cold-deeplink race (explicitly deferred to v2.11+ in STATE.md), not a Phase 100 regression. Left as-is to avoid scope creep into pre-existing cold-deeplink behavior; the WR-01 fix already removes the only net-new visual symptom (blank vs. spinner) in that window.

**File:** `apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte:107-124`
**Issue:** The "question not found in selectedQuestionBlocks → reroute" side
effect was moved verbatim from a per-navigation leaf `+page.svelte` into a
**persistent** layout that mounts once per session and stays mounted across every
Q→Q hop. The `$effect` re-runs whenever any of its reactive reads change
(`questionBlock`, `question`, `page`). On the persistent layout this effect is
now live for the entire questions session. If `selectedQuestionBlocks`
transiently empties or reorders (e.g. `firstQuestionId` mutation in the `start`
handler at line 141, or a constituency/election scope change while still on a
question URL), the guard can fire `goto($getRoute('Questions'))` mid-session,
yanking the user back to the intro. Under the old per-page leaf this effect was
scoped to a single navigation and torn down on the next hop; the persistence
changes its lifetime and re-entrancy profile. Note the contrast with the
deliberately-`onMount` `start` handler (lines 136-144), whose own comment
explains why it must NOT be an `$effect` on the persistent layout — the same
reasoning was not applied to this redirect effect.
**Fix:** Guard the redirect so it only fires for a genuinely-unresolvable
question on an actual `[questionId]` route, and ideally debounce against the
known transient (selectedQuestionBlocks not yet populated). At minimum, confirm
`question` is a real lookup (not the `FIRST_QUESTION_ID` placeholder) and that
`selectedQuestionBlocks.questions.length > 0` before navigating away:
```ts
$effect(() => {
  if (questionBlock) {
    progress.current.set(questionBlock.index + 1);
    if (question) {
      const customData = getCustomData(question);
      if (customData?.video) video.load(customData.video);
    }
    return;
  }
  // Only reroute when blocks ARE populated but this question is genuinely absent.
  if (question && voterCtx.selectedQuestionBlocks.questions.length > 0) {
    logDebugError(/* ... */);
    goto($getRoute('Questions'));
  }
});
```

### WR-03: D-03 test comment mislabels the crossed question type ("Base-4 is Likert4") — the contract is documented against a wrong fact

**✓ RESOLVED** — commits `a6531407d` (in-step comments) + `1fe9d6020` (residual outer `// reason:` mention caught by the verifier). Verified against the seed (`packages/dev-seed/src/templates/e2e/base.ts`): Base-4 is `singleChoiceCategorical` (`test-e2e-base-qu-opin-base-4-categorical`), Base-5 is `boolean`. All four comment mentions now read Boolean→Categorical (not Boolean→Likert). The assertion itself was already correct (a real type boundary either way); only the rationale text was wrong. tsc + eslint clean.

**File:** `tests/tests/specs/voter/voter-journey.spec.ts:632-635, 640-642`
**Issue:** The D-03 answer-survival step comments assert: "Base-5 is Boolean;
Base-4 is Likert4 — so a single back-navigation crosses the Boolean→Likert type
boundary" and "Navigate BACK across the type boundary to Base-4 (Likert)". Per
the seed (`packages/dev-seed/src/templates/e2e/base.ts:782-784`), Base-4 is
`singleChoiceCategorical`, **not** Likert (`singleChoiceOrdinal`). The actual
crossing is Boolean → **Categorical**. The test still genuinely crosses a
`question.type` boundary (boolean ≠ singleChoiceCategorical), so the assertion
exercises the `{#key question.type}` remount as intended and the test passes — but
the rationale comment that documents WHY this is a valid D-03 gate is factually
wrong, which will mislead the next maintainer reasoning about the boundary
(e.g. if Base-4 is later changed, they may believe the Likert path is covered
when it is not). The neighboring assertion at line 638 correctly uses
`TEXT_RE.baseOpinion5Boolean`, and line 655 only asserts `not baseOpinion5Boolean`
for the back-target, so the heading is never pinned to a specific Base-4 type —
the wrong label is purely in prose.
**Fix:** Correct the comment to reflect the seed: Base-4 is Categorical. e.g.
"Base-5 is Boolean; Base-4 is singleChoiceCategorical — so a single back-nav
crosses the Boolean→Categorical type boundary, exercising the `{#key
question.type}` remount." Optionally tighten line 655 to positively assert the
back-target heading is Base-4 Categorical so the crossing is pinned, not merely
"not Boolean".

## Info

### IN-01: Non-null assertions (`question!`) inside a block already guarded by `question && questionBlock`

**File:** `apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte:222, 255-256, 262-264, 267`
**Issue:** Within the `{#if question && questionBlock}` branch the template uses
`question!` / `questionBlock!` non-null assertions repeatedly. The guard already
narrows truthiness, but Svelte's `{@const}`/snippet scoping does not propagate
the narrowing into the nested `{#snippet}` callbacks, so the `!` is currently
required to satisfy the compiler. This is carried over verbatim from the leaf and
is not a defect, but the `!` density obscures which reads are genuinely
guard-covered. No action required; noting for maintainability awareness.
**Fix:** Optionally hoist `{@const q = question}` / `{@const qb = questionBlock}`
narrowed locals at the top of the branch and reference those, removing the `!`.

### IN-02: `customData` computed twice per render on the question route

**File:** `apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte:120, 208`
**Issue:** `getCustomData(question)` is called in the side-effect `$effect`
(line 120) and again as a template `{@const customData = getCustomData(question)}`
(line 208), and a third time is unnecessary but the two are independent. Minor
duplicated work; not a correctness issue (out-of-scope perf, noted only as a
quality observation). Behavior matches the pre-hoist leaf.
**Fix:** None required. If consolidating later, derive `customData` once via
`$derived` and read it in both the effect and template.

### IN-03: Empty leaf retains a `<script lang="ts">` block with only a comment

**File:** `apps/frontend/src/routes/(voters)/(located)/questions/[questionId]/+page.svelte:2-4`
**Issue:** The empty-leaf stub keeps a `<script lang="ts">` block containing only
a comment. This is harmless and matches the documented "empty leaf" intent, but
the script block is not load-bearing — the comment alone (top-of-file HTML
comment, already present at line 1) conveys the intent. Mirrors the results-shape
convention loosely; the results leaf may differ.
**Fix:** Optional — the `<script>` block can be removed entirely, leaving just
the top-of-file explanatory comment. Keeping it is also acceptable for
discoverability.

---

_Reviewed: 2026-06-05T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
