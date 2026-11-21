/**
 * Decide what the address of the nomination editor's constituency step leads to (universal).
 *
 * The rows are decided by `constituenciesStepOutcome` of `$lib/routes`, the shared module for the order of the selection, which `constituenciesAddressForward` asks the Contestant App's way and maps to the editor's addresses: the step is shown when a chosen election has several constituencies, or when a constituency group is chosen first. Otherwise the address forwards in one redirect: to the editor's entry when no election is chosen or implied, and to the details step when every chosen election has a single constituency. A redirect names its target by route key and passes the selection on in the editor's own search params.
 *
 * Which of the chosen elections the question is asked about is decided by `constituencyChoiceOf` over the entity's writable nominations, which the two functions called here ask: an election in which the entity holds several nominations has no constituency to choose, unless the entity chooses several constituencies in one election, as an organization does. When no chosen election is left to choose for, the address forwards to the details step with the chosen elections.
 *
 * While a gate is pending or the facts of the entity's nominations are not known, nothing is decided and the load returns an empty selection and an empty choice: the layout above shows its own view in the page's place.
 *
 * The load returns:
 * - `nominationSelection`: the elections and constituencies the address names, each matched against what the entity may choose, with the one admissible election as the chosen one when the address names none. The page passes its elections on.
 * - `nominationConstituencyChoice`: the elections the page's selector is handed, the elections that have a section in a selector's place, whether the selector takes several constituencies in each election, and for each election the selector is handed the constituencies to select on arrival: the one the address names for it, and otherwise that of the entity's one nomination in it; for an entity that chooses several, those of the address the election is held in, and otherwise those of all its nominations in it.
 */

import { redirect } from '@sveltejs/kit';
import { getLocale } from '$lib/paraglide/runtime';
import {
  constituenciesAddressForward,
  constituenciesStepChoice,
  constituenciesStepSelection,
  emptySelection,
  stepAddress,
  stepInputOf
} from '../stepSelection';
import type { ConstituencyStepChoice } from '../stepSelection';

export async function load({ params, parent, url }) {
  const facts = stepInputOf({ parentData: await parent(), url });
  if (!facts) {
    const nothing: ConstituencyStepChoice = { toChoose: [], kept: [], onArrival: {}, severalConstituencies: false };
    return { nominationSelection: emptySelection(), nominationConstituencyChoice: nothing };
  }

  const forward = constituenciesAddressForward(facts);
  if (forward) redirect(307, stepAddress({ forward, params, locale: getLocale() }));

  return {
    nominationSelection: constituenciesStepSelection(facts),
    nominationConstituencyChoice: constituenciesStepChoice(facts)
  };
}
