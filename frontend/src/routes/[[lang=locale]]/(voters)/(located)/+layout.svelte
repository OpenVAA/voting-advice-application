<!--@component

# Located section main layout

Provides the data used by the located – i.e. those requiring the elections and constituencies to be selected – parts of voter app to the `dataRoot`, which are loaded by `+layout.ts`.

Displays a warning if the selected constituency does not have nominations in all of the selected elections.

### Settings

- `header.showHelp`: Whether the help button is shown in the header.
- `header.showFeedback`: Whether the feedback button is shown in the header.
- `analytics.platform`: Affects whether the analytics service is loaded.
- `analytics.trackEvents`: Affects whether the data consent popup is shown.
-->

<script lang="ts">
  import { goto } from '$app/navigation';
  import { isValidResult } from '$lib/api/utils/isValidResult.js';
  import { Button } from '$lib/components/button';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { Icon } from '$lib/components/icon';
  import { Loading } from '$lib/components/loading';
  import { Modal } from '$lib/components/modal';
  import { getVoterContext } from '$lib/contexts/voter';
  import { sanitizeHtml } from '$lib/utils/sanitize.js';
  import type { DPDataType } from '$lib/api/base/dataTypes';
  import { tick } from 'svelte';

  export let data;

  const { dataRoot, getRoute, nominationsAvailable, selectedElections, t } = getVoterContext();

  let error: Error | undefined;
  let closeModal: () => void;
  let openModal: () => void;
  let ready: boolean;
  let hasNominations: 'all' | 'none' | 'some';
  $: {
    // If data is updated, we want to prevent loading the slot until the promises resolve
    error = undefined;
    ready = false;
    Promise.all([data.questionData, data.nominationData]).then(async (data) => {
      error = await update(data);
    });
  }

  /**
   * Handle the update inside a function so that we don't track $dataRoot, which would result in an infinite loop.
   * @returns `Error` if the data is invalid, `undefined` otherwise.
   */
  async function update([questionData, nominationData]: [
    DPDataType['questions'] | Error,
    DPDataType['nominations'] | Error
  ]): Promise<Error | undefined> {
    if (!isValidResult(questionData, { allowEmpty: true })) return new Error('Error loading question data');
    if (!isValidResult(nominationData, { allowEmpty: true })) return new Error('Error loading nomination data');
    $dataRoot.update(() => {
      $dataRoot.provideQuestionData(questionData);
      $dataRoot.provideEntityData(nominationData.entities);
      $dataRoot.provideNominationData(nominationData.nominations);
    });
    // Allow time for the nominationsAvailable store to be updated, which may be delayed on some browsers
    await tick();
    if (Object.values($nominationsAvailable).every(Boolean)) hasNominations = 'all';
    else if (Object.values($nominationsAvailable).some(Boolean)) hasNominations = 'some';
    else hasNominations = 'none';
    if (hasNominations !== 'all') openModal?.();
    ready = true;
  }
</script>

{#if error}
  <ErrorMessage class="bg-base-300" />
{:else if !ready}
  <Loading />
{:else}
  <slot />
{/if}

{#if hasNominations !== 'all'}
  <Modal
    title={hasNominations === 'none'
      ? $t('results.missingNominations.noNominations.title')
      : $t('results.missingNominations.someNominations.title')}
    closeOnBackdropClick={false}
    bind:openModal
    bind:closeModal>
    <p>
      {@html sanitizeHtml(
        hasNominations === 'none'
          ? $t('results.missingNominations.noNominations.content')
          : $t('results.missingNominations.someNominations.content')
      )}
    </p>
    {#if hasNominations === 'some'}
      <div class="mx-auto flex w-max flex-col items-start gap-md">
        {#each $selectedElections as election}
          {@const available = $nominationsAvailable[election.id]}
          <div class="flex flex-row items-center gap-sm font-bold {available ? 'text-success' : 'text-warning'}">
            <Icon name={available ? 'check' : 'close'} />
            <span>{election.name}</span>
            {#if !available}
              <span class="font-normal text-secondary"
                >({$t('results.missingNominations.noNominationsForElection')})</span>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
    <div slot="actions" class="mx-auto flex w-full max-w-md flex-col">
      <Button on:click={closeModal} text={$t('common.continue')} variant="main" />
      <Button
        on:click={() => {
          goto($getRoute('Home'));
          closeModal();
        }}
        text={$t('common.returnHome')} />
    </div>
  </Modal>
{/if}
