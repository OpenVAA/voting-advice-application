/**
 * Check whether we have the necessary electionId and constituencyId parameters or if we can imply them:
 * 1. If we don't have, them redirect to the necessary selection page.
 * 2. If we do, download the question and nomination data.
 *
 * Load the data used by the located parts of the voter app, i.e. those requiring the elections and constituencies to be selected.
 *
 * TODO: Validate that the constituencies provided are applicable to the elections
 */

import { staticSettings } from '@openvaa/app-shared';
import { DataRoot } from '@openvaa/data';
import { redirect } from '@sveltejs/kit';
import { dataProvider as dataProviderPromise } from '$lib/api/dataProvider';
import { buildRoute, getImpliedConstituencyIds, getImpliedElectionIds, parseParams } from '$lib/utils/route';
import { mergeAppSettings } from '$lib/utils/settings';
import type { Id } from '@openvaa/core';

export async function load({ fetch, parent, params: { lang }, untrack, url }) {
  let electionId: Id | Array<Id> | undefined;
  let constituencyId: Id | Array<Id> | undefined;

  // We need to be careful to not rerun the load function unnecessarily. That's why we also only access the `lang` route param
  untrack(() => ({ electionId, constituencyId } = parseParams({ url })));

  // Try to imply ids if not provided
  if (!electionId || !constituencyId) {
    const { appSettingsData, constituencyData, electionData } = await parent();
    const appSettings = mergeAppSettings(staticSettings, await appSettingsData);

    // Create a temporary data root we use for implication
    const dataRoot = new DataRoot();
    dataRoot.provideElectionData(await electionData);
    dataRoot.provideConstituencyData(await constituencyData);
    electionId = getImpliedElectionIds({
      appSettings,
      dataRoot,
      selectedConstituencyIds: constituencyId ? [constituencyId].flat() : undefined
    });

    if (!electionId) {
      redirect(
        307,
        buildRoute({
          route: 'Elections',
          lang
        })
      );
    }

    if (!constituencyId) {
      constituencyId = getImpliedConstituencyIds({
        dataRoot,
        selectedElectionIds: [electionId].flat()
      });
      if (!constituencyId) {
        redirect(
          307,
          buildRoute({
            route: 'Constituencies',
            electionId,
            lang
          })
        );
      }
    }
  }

  // Get data
  const dataProvider = await dataProviderPromise;
  dataProvider.init({ fetch });
  return {
    questionData: dataProvider
      .getQuestionData({
        electionId,
        locale: lang
      })
      .catch((e) => e),
    nominationData: dataProvider
      .getNominationData({
        electionId,
        constituencyId,
        locale: lang
      })
      .catch((e) => e),
    factorLoadingData: dataProvider
      .getFactorLoadingData({
        electionId,
        locale: lang
      })
      .catch((e) => e)
  };
}
