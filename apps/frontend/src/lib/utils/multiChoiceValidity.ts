/**
 * The single source of truth for the multi-choice categorical selection-count validity used by `OpinionQuestionInput` (and, transitively, the voter persistence gate + candidate Save gate).
 *
 * A selection is valid (a saveable answer) when its `count` falls inclusively within `[effectiveMin, effectiveMax]`, where:
 * - `effectiveMin` is `minSelections ?? 1`, clamped so it can never fall below 1 — zero selections is ALWAYS invalid-as-unanswered, whether `minSelections` is omitted, null, or an explicitly supplied zero.
 * - `effectiveMax = maxSelections ?? choiceCount` — an omitted max defaults to
 *   the number of available choices.
 *
 * This is the exact formula previously inlined in `OpinionQuestionInput.svelte`'s validity `$effect`; extracting it keeps the component and its unit test in lockstep on the boundary semantics.
 *
 * `getEffectiveSelectionBounds` exposes the same two bounds for callers that need to DISPLAY them rather than decide saveability — `QuestionChoices`' selection-count helper text. It is exported so that derivation lives here once: a caller that recomputed `minSelections ?? 1` for a label would tell the user zero selections are allowed while this gate refuses to save them.
 */
export function getEffectiveSelectionBounds({
  minSelections,
  maxSelections,
  choiceCount
}: {
  minSelections?: number | null;
  maxSelections?: number | null;
  choiceCount: number;
}): { effectiveMin: number; effectiveMax: number } {
  return {
    effectiveMin: Math.max(minSelections ?? 1, 1),
    effectiveMax: maxSelections ?? choiceCount
  };
}

export function isMultiChoiceCountValid({
  count,
  minSelections,
  maxSelections,
  choiceCount
}: {
  count: number;
  minSelections?: number | null;
  maxSelections?: number | null;
  choiceCount: number;
}): boolean {
  const { effectiveMin, effectiveMax } = getEffectiveSelectionBounds({ minSelections, maxSelections, choiceCount });
  return count >= effectiveMin && count <= effectiveMax;
}
