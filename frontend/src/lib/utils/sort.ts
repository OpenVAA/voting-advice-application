import {locale} from '$lib/i18n';

/**
 * Sort candidates by election symbol, then last name, then first name.
 */
export function sortCandidates(a: CandidateProps, b: CandidateProps) {
  let res = compareElectionSymbols(a, b);
  if (res === 0) res = a.lastName.localeCompare(b.lastName, locale.get());
  if (res === 0) res = a.firstName.localeCompare(b.firstName, locale.get());
  return res;
}

/**
 * Sort parties by election symbol, then name
 */
export function sortParties(a: PartyProps, b: PartyProps) {
  let res = compareElectionSymbols(a, b);
  if (res === 0) res = a.name.localeCompare(b.name, locale.get());
  return res;
}

/**
 * Compare two election symbols. If they are integer-like they will be compared as numbers else as strings.
 */
export function compareElectionSymbols(
  a: Pick<CandidateProps, 'electionSymbol'>,
  b: Pick<CandidateProps, 'electionSymbol'>
) {
  // If either is missing the election symbol, it will be sorted last
  if (!a.electionSymbol) {
    if (b.electionSymbol) return 1;
    return 0;
  } else if (!b.electionSymbol) return -1;
  const [aInt, bInt] = [parseInt(a.electionSymbol), parseInt(b.electionSymbol)];
  return `${aInt}` === a.electionSymbol && `${bInt}` === b.electionSymbol
    ? aInt - bInt
    : a.electionSymbol.localeCompare(b.electionSymbol, locale.get());
}
