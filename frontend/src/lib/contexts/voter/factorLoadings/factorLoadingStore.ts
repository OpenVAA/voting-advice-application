import { derived, type Readable, writable } from 'svelte/store';
import { FactorLoading } from './factorLoading';
import type { AnyQuestionVariant, DataRoot, Election, Id } from '@openvaa/data';
import type { FactorLoadingData } from './factorLoading.type';

/**
 * Creates a store for factor loadings based on selected elections and raw factor loading data
 */
export function createFactorLoadingStore() {
  // Store for the raw factor loading data
  const rawFactorLoadings = writable<Array<FactorLoadingData>>([]);

  // Function to set/update the raw factor loading data
  function setFactorLoadingData(data: Array<FactorLoadingData>) {
    rawFactorLoadings.set(data);
  }

  // Function that creates the derived store
  function factorLoadingStore({
    dataRoot,
    selectedElections
  }: {
    dataRoot: Readable<DataRoot>;
    selectedElections: Readable<Array<Election>>;
  }): Readable<Array<FactorLoading>> {
    return derived(
      [rawFactorLoadings, selectedElections, dataRoot],
      ([rawLoadings, selectedElections, dataRoot]) => {
        if (
          !rawLoadings ||
          rawLoadings.length === 0 ||
          !selectedElections ||
          selectedElections.length === 0
        ) {
          return [];
        }

        // Get the IDs of all selected elections
        const electionIds = selectedElections.map((election) => election.id);

        // Create a function that gets questions from dataRoot
        function getQuestion(id: Id): AnyQuestionVariant {
          return dataRoot.getQuestion(id);
        }

        // Filter and transform raw data to FactorLoading instances
        return rawLoadings
          .filter((fl) => electionIds.includes(fl.electionId))
          .map((data) => new FactorLoading(data, getQuestion));
      }
    );
  }

  return {
    setFactorLoadingData,
    factorLoadingStore
  };
}
