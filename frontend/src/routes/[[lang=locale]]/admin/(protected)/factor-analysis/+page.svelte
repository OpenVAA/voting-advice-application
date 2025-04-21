<!--@component
# Factor Analysis Page

Page for computing and managing factor analysis for elections
-->

<script lang="ts">
  import { enhance } from '$app/forms';
  import { getAppContext } from '$lib/contexts/app';
  import { Button } from '$lib/components/button';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { SuccessMessage } from '$lib/components/successMessage';
  import MainContent from '../../../MainContent.svelte';

  // Get the data from the server
  export let data;
  const { elections } = data;

  const { t } = getAppContext();

  // Track selected elections
  let selectedElections: Record<number, boolean> = {};

  // Reactive variable to track if any election is selected
  $: anyElectionSelected = Object.values(selectedElections).some(Boolean);

  // Initialize all elections as selected if we have elections
  // Only initialize once when the component loads
  $: if (elections && elections.length > 0 && Object.keys(selectedElections).length === 0) {
    elections.forEach((election: any) => {
      selectedElections[election.id] = true;
    });
  }

  let status: 'idle' | 'loading' | 'success' | 'error' = 'idle';

  const handleSubmit = () => {
    console.log('Form submission started');
    status = 'loading';

    return async ({ result, update }: { result: { type: string }; update: () => void }) => {
      console.log('Form submission completed, result:', result);

      if (result.type === 'failure') {
        status = 'error';
      } else {
        status = 'success';
        console.log('Factors computed successfully');
      }

      await update();
    };
  };
</script>

<MainContent title={$t('adminApp.factorAnalysis.title')}>
  <div class="flex flex-col items-center">
    <p class="mb-lg max-w-xl text-center">
      {$t('adminApp.factorAnalysis.compute.description')}
    </p>

    <form method="POST" class="grid w-full max-w-xl gap-lg" use:enhance={handleSubmit}>
      <h2 class="font-medium">{$t('adminApp.factorAnalysis.compute.title')}</h2>

      <p class="mb-lg max-w-xl">{$t('adminApp.factorAnalysis.compute.selectElections')}</p>

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
                      {election.candidateCount || 0}
                      {$t('adminApp.factorAnalysis.compute.candidates')}
                      {#if election.partyCount && election.partyCount > 0}
                        {$t('adminApp.factorAnalysis.compute.parties.some', {
                          count: election.partyCount
                        })}
                      {:else}
                        {$t('adminApp.factorAnalysis.compute.parties.none')}
                      {/if}
                      {$t('adminApp.factorAnalysis.compute.haveAnswered')}
                    </span>
                  </div>
                {/if}
              </div>
            </label>
          {/each}
        </div>
      {:else}
        <p class="text-neutral">{$t('adminApp.factorAnalysis.compute.noElections')}</p>
      {/if}

      {#if status === 'error'}
        <ErrorMessage inline message={$t('adminApp.factorAnalysis.compute.error')} class="mb-md" />
      {:else if status === 'success'}
        <SuccessMessage inline message={$t('common.success')} class="mb-md" />
      {/if}

      <div class="flex flex-col items-center gap-sm">
        <Button
          text={status === 'loading'
            ? $t('adminApp.factorAnalysis.compute.buttonLoading')
            : $t('adminApp.factorAnalysis.compute.button')}
          type="submit"
          variant="main"
          loading={status === 'loading'}
          disabled={status === 'loading' || !anyElectionSelected} />

        {#if status === 'loading'}
          <p class="text-sm text-neutral">{$t('adminApp.factorAnalysis.compute.mayTakeTime')}</p>
        {/if}
      </div>
    </form>
  </div>
</MainContent>
