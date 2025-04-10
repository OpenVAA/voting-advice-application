<!--@component
# Factor Analysis Page

Page for computing and managing factor analysis for elections
-->

<script lang="ts">
  import { enhance } from '$app/forms';
  import { getAppContext } from '$lib/contexts/app';
  import { Button } from '$lib/components/button';
  import { Checkbox } from '$lib/components/checkbox';
  import MainContent from '../../../MainContent.svelte';

  // Get the data from the server
  export let data;
  const { elections } = data;

  const { t } = getAppContext();

  // Track selected elections
  let selectedElections: Record<number, boolean> = {};

  // Initialize all elections as selected if we have elections
  $: if (elections && elections.length > 0) {
    elections.forEach((election: any) => {
      selectedElections[election.id] = true;
    });
  }

  let isComputing = false;
  let error: string | null = null;

  const handleSubmit = () => {
    console.log('Form submission started');
    isComputing = true;
    error = null;

    return async ({ result, update }: { result: { type: string }; update: () => void }) => {
      console.log('Form submission completed, result:', result);
      isComputing = false;

      if (result.type === 'failure') {
        error = 'Failed to compute factors';
      } else {
        console.log('Factors computed successfully');
      }

      await update();
    };
  };

  // Helper to check if any election is selected
  const isAnyElectionSelected = () => Object.values(selectedElections).some(Boolean);
</script>

<MainContent title="Factor analysis">
  <div class="flex flex-col items-center">
    <p class="mb-lg max-w-xl text-center">
      Compute the latent factors from the answers given by candidates and parties.
    </p>

    <form method="POST" class="grid w-full max-w-xl gap-lg" use:enhance={handleSubmit}>
      <h2 class="font-medium">Compute factors</h2>

      <p class="mb-lg max-w-xl">Select the elections for which to compute the factors.</p>

      {#if elections && elections.length > 0}
        <div class="grid gap-md">
          {#each elections as election}
            <label class="flex items-start">
              <input
                type="checkbox"
                name={election.id}
                bind:checked={selectedElections[election.id]}
                class="checkbox-primary checkbox checkbox-lg" />
              <div class="ml-4">
                <span class="font-medium">{election.name}</span>
                {#if election.candidateCount !== undefined || election.partyCount !== undefined}
                  <div class="mt-1">
                    <span class="text-sm text-neutral">
                      {election.candidateCount || 0} candidates
                      {#if election.partyCount && election.partyCount > 0}
                        and {election.partyCount} parties
                      {:else}
                        and no parties
                      {/if}
                      have answered
                    </span>
                  </div>
                {/if}
              </div>
            </label>
          {/each}
        </div>
      {:else}
        <p class="text-neutral">No elections available</p>
      {/if}

      {#if error}
        <p class="text-sm text-error">{error}</p>
      {/if}

      <div class="flex flex-col items-center gap-sm">
        <Button
          text={isComputing ? 'Computing factors...' : 'Compute factors'}
          type="submit"
          variant="main"
          disabled={isComputing || !isAnyElectionSelected()} />

        {#if isComputing}
          <p class="text-sm text-neutral">This may take some time.</p>
        {/if}
      </div>
    </form>
  </div>
</MainContent>
