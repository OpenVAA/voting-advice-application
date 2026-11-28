/**
 * The effective selection-count bounds of a multi-choice categorical question, derived from its `minSelections` and `maxSelections` custom data and its number of choices.
 *
 * - `effectiveMin` is `minSelections ?? 1`, clamped so it can never fall below 1 — zero selections is ALWAYS invalid-as-unanswered, whether `minSelections` is omitted, null, or an explicitly supplied zero.
 * - `effectiveMax` is `maxSelections ?? choiceCount` — an omitted max defaults to the number of available choices.
 *
 * A caller that displays the bounds, such as a selection-count label, reads them here rather than recomputing `minSelections ?? 1`, which would tell the user zero selections are allowed while {@link isMultiChoiceCountValid} refuses to save them.
 * @param options.minSelections - The question's `minSelections` custom data.
 * @param options.maxSelections - The question's `maxSelections` custom data.
 * @param options.choiceCount - The number of choices the question has.
 * @returns The inclusive bounds a selection count must fall within.
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

/**
 * Whether a multi-choice categorical selection of `count` choices is a saveable answer: the count falls inclusively within the bounds {@link getEffectiveSelectionBounds} derives.
 * @param options.count - The number of selected choices.
 * @param options.minSelections - The question's `minSelections` custom data.
 * @param options.maxSelections - The question's `maxSelections` custom data.
 * @param options.choiceCount - The number of choices the question has.
 * @returns Whether the selection is valid.
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
  const { effectiveMin, effectiveMax } = getEffectiveSelectionBounds({ minSelections, maxSelections, choiceCount });
  return count >= effectiveMin && count <= effectiveMax;
}
