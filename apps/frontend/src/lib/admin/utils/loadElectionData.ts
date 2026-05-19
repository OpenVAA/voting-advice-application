import { DataRoot } from '@openvaa/data';
import { dataProvider as dataProviderPromise } from '$lib/api/dataProvider';
import { isValidResult } from '$lib/api/utils/isValidResult';
import type { Id } from '@openvaa/core';
import type { DPDataType } from '$lib/api/base/dataTypes';

/**
 * Loads election-related data for admin features like argument condensation and question info generation.
 * This utility centralizes the common data loading logic used across different admin features.
 *
 * @param args.electionId - The ID of the election to load data for
 * @param args.locale - The locale/language for the data
 * @param args.fetch - SvelteKit fetch function for data loading
 * @returns Promise resolving to a DataRoot instance with all election data loaded
 * @throws Error if any required data fails to load
 */
export async function loadElectionData({
  electionId,
  locale,
  fetch
}: {
  electionId: Id;
  locale: string;
  fetch: Fetch;
}): Promise<DataRoot> {
  // Initialize data provider
  const dataProvider = await dataProviderPromise;
  dataProvider.init({ fetch });

  // Load all required data in parallel
  const [electionData, constituencyData, questionData, nominationData] = (await Promise.all([
    dataProvider.getElectionData({ locale }).catch((e) => e),
    dataProvider.getConstituencyData({ locale }).catch((e) => e),
    dataProvider
      .getQuestionData({
        electionId,
        locale
      })
      .catch((e) => e),
    dataProvider
      .getNominationData({
        electionId,
        locale
      })
      .catch((e) => e)
  ])) as [DPDataType['elections'], DPDataType['constituencies'], DPDataType['questions'], DPDataType['nominations']];

  // Validate that all required data loaded successfully
  if (!isValidResult(electionData)) throw new Error('Error loading election data');
  if (!isValidResult(constituencyData, { allowEmpty: true })) throw new Error('Error loading constituency data');
  if (!isValidResult(questionData, { allowEmpty: true })) throw new Error('Error loading question data');
  if (!isValidResult(nominationData, { allowEmpty: true })) throw new Error('Error loading nomination data');

  // Create and populate DataRoot
  const dataRoot = new DataRoot();
  dataRoot.update(() => {
    dataRoot.provideElectionData(electionData);
    dataRoot.provideConstituencyData(constituencyData);
    dataRoot.provideQuestionData(questionData);
    dataRoot.provideEntityData(nominationData.entities);
    dataRoot.provideNominationData(nominationData.nominations);
  });

  return dataRoot;
}
