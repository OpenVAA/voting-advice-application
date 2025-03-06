import { order } from '@openvaa/data';
import type { AnyNominationVariant, AnyQuestionVariant } from '@openvaa/data';

/**
 * Moves items with a specified value to the front of the array while retaining the order of other items.
 * @param array - The array to sort.
 * @param target . The value to move to the front.
 * @returns A new array with the target value at the front.
 */
export function sortToFirst<TItem>(array: ReadonlyArray<TItem>, targetValue: TItem): Array<TItem> {
  return array.toSorted((a, b) => {
    if (a === targetValue && b !== targetValue) return -1;
    if (b === targetValue && a !== targetValue) return 1;
    return 0;
  });
}

/**
 * Compare the election symbols of two `Nomination`s. If they are integer-like they will be compared as numbers else as strings.
 */
export function compareElectionSymbols(
  a: Pick<AnyNominationVariant, 'electionSymbol'>,
  b: Pick<AnyNominationVariant, 'electionSymbol'>,
  locale?: string
) {
  // If either is missing the election symbol, it will be sorted last
  if (!a.electionSymbol) {
    if (b.electionSymbol) return 1;
    return 0;
  } else if (!b.electionSymbol) return -1;
  const [aInt, bInt] = [parseInt(a.electionSymbol), parseInt(b.electionSymbol)];
  return `${aInt}` === a.electionSymbol && `${bInt}` === b.electionSymbol
    ? aInt - bInt
    : a.electionSymbol.localeCompare(b.electionSymbol, locale);
}

/**
 * Sort `Question`s by their category and own order.
 * TODO: This may deprecated in the future, if we extend `@openvaa/data` a bit.
 */
export function sortQuestions(questions: Array<AnyQuestionVariant>): Array<AnyQuestionVariant> {
  return questions.toSorted((a, b) => {
    const categoryOrder = order(a.category, b.category);
    if (categoryOrder !== 0) return categoryOrder;
    return order(a, b);
  });
}
