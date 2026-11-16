/**
 * Decide what the entry of the nomination editor, which is the address of its election step, leads to (universal).
 *
 * The rows are decided by `electionsStepOutcome` of `$lib/routes`, the shared module for the order of the selection, which `electionsAddressForward` asks the Contestant App's way and maps to the editor's addresses: the election step is shown when several elections admit the entity's type, and otherwise the address forwards, in one redirect, to the step that has something to choose — the constituency step, or the details step when an election and its constituency are both implied. A redirect names its target by route key and passes the selection on in the editor's own search params.
 *
 * While a gate is pending or the facts of the entity's nominations are not known, nothing is decided and the load returns an empty selection: the layout above shows its own view in the page's place.
 *
 * The load returns `nominationSelection`, the selection the step starts from: the elections and constituencies the address names, each matched against what the entity may choose. Where the address names no election, the elections are those `startingSelectionOf` answers for the entity's nominations in the editor's reach, which `electionsStepSelection` asks: the elections the entity is nominated in, and none for an entity with no nomination. The page checks the elections of it on arrival.
 */

import { redirect } from '@sveltejs/kit';
import { getLocale } from '$lib/paraglide/runtime';
import {
  electionsAddressForward,
  electionsStepSelection,
  emptySelection,
  stepAddress,
  stepFactsOf
} from '../stepSelection';

export async function load({ params, parent, url }) {
  const facts = stepFactsOf({ parentData: await parent(), url });
  if (!facts) return { nominationSelection: emptySelection() };

  const forward = electionsAddressForward(facts);
  if (forward) redirect(307, stepAddress({ forward, params, locale: getLocale() }));

  return { nominationSelection: electionsStepSelection(facts) };
}
