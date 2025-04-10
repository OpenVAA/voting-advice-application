import { fail } from '@sveltejs/kit';
import { adminWriter as adminWriterPromise } from '$lib/api/adminWriter';
import { dataProvider as dataProviderPromise } from '$lib/api/dataProvider';
import type { Actions, PageServerLoad } from './$types';

export const load = (async ({ fetch }: { fetch: typeof globalThis.fetch }) => {
  try {
    // Get data provider and fetch elections
    const dataProvider = await dataProviderPromise;
    dataProvider.init({ fetch });

    // Get elections data
    const elections = await dataProvider.getElectionData();

    // Add candidate/party counts to elections
    const enrichedElections: Array<{
      id: number;
      name: string;
      candidateCount: number;
      partyCount: number;
    }> = [];

    elections.forEach((election, index) => {
      // For each election, add placeholder counts
      // In a real implementation, you would calculate these from actual data
      enrichedElections.push({
        id: index + 1,
        name: election.name,
        candidateCount: Math.floor(Math.random() * 1000), // Placeholder
        partyCount: Math.floor(Math.random() * 20) // Placeholder
      });
    });

    return {
      elections: enrichedElections
    };
  } catch (error) {
    console.error('Error loading elections:', error);
    return {
      elections: []
    };
  }
}) satisfies PageServerLoad;

export const actions: Actions = {
  default: async ({ request }) => {
    try {
      // Parse the form data to get selected election IDs
      const formData = await request.formData();
      const selectedElectionIds: Array<string> = [];

      // Extract the election IDs from form data
      for (const [key, value] of formData.entries()) {
        if (value === 'on') {
          selectedElectionIds.push(key);
        }
      }

      // Get the admin writer and initialize it
      const adminWriter = await adminWriterPromise;
      adminWriter.init({ fetch });

      // If elections are selected, compute for those elections, otherwise compute for all
      const computeOptions = selectedElectionIds.length > 0 ? { electionIds: selectedElectionIds } : undefined;

      // Call the compute factor loadings function with the selected elections
      const result = await adminWriter.computeFactorLoadings(computeOptions);

      return result;
    } catch (error) {
      console.error('Factor analysis error:', error);
      return fail(500, { type: 'error', message: 'Internal server error' });
    }
  }
};
