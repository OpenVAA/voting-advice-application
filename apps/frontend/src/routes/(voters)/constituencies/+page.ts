/**
 * Constituency selection loader
 *
 * Possibly redirect to another route. The behaviour depends on `appSettings.elections.startFromConstituencyGroup` and whether we have or can imply the `electionId` and `constituencyId` parameters.
 *
 * | `startFromConstituencyGroup` | `electionId`        | `constituencyId`    | Action                                   |
 * | ---------------------------- | ------------------- | ------------------- | ---------------------------------------- |
 * | Set                          | Any                 | Any                 | Do nothing (show Constituency selector)  |
 * | Not set                      | Not set nor implied | Any                 | Redirect to Elections                    |
 * | Not set                      | Set or implied      | Implied             | Redirect to Questions                    |
 * | Not set                      | Set or implied      | Not implied         | Do nothing (show Constituency selector)  |
 *
 * Not implied = Set or not set as long as not implied.
 * If `startFromConstituencyGroup` is set and both ids can be implied, the Election selector route will redirect to Questions, but we leave the decision to that route.
 *
 * The rows are decided by `constituenciesStepOutcome` of `$lib/routes`, the shared module for the order of the selection; this load maps its outcome to the Voter App's routes.
 */

import { staticSettings } from '@openvaa/app-shared';
import { DataRoot } from '@openvaa/data';
import { redirect } from '@sveltejs/kit';
import { buildRoute, constituenciesStepOutcome, parseParams } from '$lib/routes';
import { mergeAppSettings } from '$lib/utils/settings';
import type { Route } from '$lib/routes';

export async function load({ parent, params, route, url }) {
  const { appSettingsData, constituencyData, electionData } = await parent();
  const appSettings = mergeAppSettings(staticSettings, await appSettingsData);

  // Create a temporary data root we use for implication
  const dataRoot = new DataRoot();
  dataRoot.provideElectionData(await electionData);
  dataRoot.provideConstituencyData(await constituencyData);

  // Every election is on offer and `elections.disallowSelection` is honoured. A constituency is never implied while `startFromConstituencyGroup` is set: the constituency must then be selected, and the election selection comes after this page.
  const { electionId } = parseParams({ params, url });
  const outcome = constituenciesStepOutcome({
    dataRoot,
    appSettings,
    honourDisallowSelection: true,
    implyWithinChosenConstituencies: false,
    skipWhenFullyImplied: false,
    electionIds: electionId ? [electionId].flat() : undefined
  });

  // Deferred-target handling: forward the `?next=` target past auto-redirects on this page. `next` is not a persistent search param, so buildRoute strips it unless passed through `extraParams`.
  const nextSearch = url.searchParams.get('next');
  const nextForward: { next?: string } = nextSearch ? { next: nextSearch } : {};

  if (outcome.action === 'done') _redirect('Questions', nextForward);
  if (outcome.action === 'goto') _redirect('Elections', nextForward);
  // Show constituency selector
  return;

  function _redirect(target: Route, extraParams?: Record<string, string | Array<string> | undefined>): never {
    redirect(307, buildRoute({ route: target, ...(extraParams ?? {}) }, { params, route, url }));
  }
}
