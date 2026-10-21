/**
 * Decide what the address of the nomination editor's details step leads to, and what the selection it carries chose (universal).
 *
 * The decision is that of `detailsAddressOutcome`. An address that names an election and, for each election with several constituencies, a constituency is served. A chosen election in which the entity holds several nominations needs no constituency: those nominations are kept as they are stored. An address that lacks what the step needs forwards, in one redirect, to the step that collects it: to the editor's entry when no election is chosen or implied, and to the constituency step when a chosen election that takes a constituency has none. A redirect names its target by route key and passes the selection on in the editor's own search params. No error page is shown for an id that names nothing: the id is dropped.
 *
 * While a gate is pending or the facts of the entity's nominations are not known, nothing is decided and the load returns no contest and no kept election: the layout above shows its own view in the page's place.
 *
 * The load returns:
 * - `nominationContests`: one election and constituency for each chosen election that takes a constituency, in the order the elections are offered.
 * - `nominationKeptElectionIds`: the ids of the chosen elections whose nominations are kept as they are stored.
 *
 * The page shows a card for every nomination of the entity in the editor's reach, whatever the address chose: the selection decides which new pairs get a card and in which state an existing card starts.
 */

import { redirect } from '@sveltejs/kit';
import { getLocale } from '$lib/paraglide/runtime';
import { detailsAddressOutcome, stepAddress, stepFactsOf } from '../stepSelection';
import type { Id } from '@openvaa/core';
import type { NominationContest } from '$lib/api/base/dataWriter.type';

export async function load({ params, parent, url }) {
  const facts = stepFactsOf({ parentData: await parent(), url });
  if (!facts) return { nominationContests: new Array<NominationContest>(), nominationKeptElectionIds: new Array<Id>() };

  const outcome = detailsAddressOutcome(facts);
  if ('step' in outcome) redirect(307, stepAddress({ forward: outcome, params, locale: getLocale() }));

  return { nominationContests: outcome.contests, nominationKeptElectionIds: outcome.keptElectionIds };
}
