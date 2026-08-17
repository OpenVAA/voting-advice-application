/**
 * The single source of truth for the multi-choice categorical
 * selection-count validity used by `OpinionQuestionInput` (and, transitively,
 * the voter persistence gate + candidate Save gate).
 *
 * A selection is valid (a saveable answer) when its `count` falls inclusively
 * within `[effectiveMin, effectiveMax]`, where:
 * - `effectiveMin = minSelections ?? 1` — zero selections is ALWAYS
 *   invalid-as-unanswered, even when `minSelections` is omitted.
 * - `effectiveMax = maxSelections ?? choiceCount` — an omitted max defaults to
 *   the number of available choices.
 *
 * This is the exact formula previously inlined in
 * `OpinionQuestionInput.svelte`'s validity `$effect`; extracting it keeps the
 * component and its unit test in lockstep on the boundary semantics.
 */
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
  const effectiveMin = minSelections ?? 1;
  const effectiveMax = maxSelections ?? choiceCount;
  return count >= effectiveMin && count <= effectiveMax;
}
