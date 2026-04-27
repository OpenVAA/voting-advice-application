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
  import { tick, untrack } from 'svelte';
  import type { Snippet } from 'svelte';
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

  let { data, children }: { data: any; children: Snippet } = $props();

  // Keep context ref for reactive getter access (destructuring captures static values)
  const voterCtx = getVoterContext();
  const { dataRoot, getRoute, t } = voterCtx;

  /**
   * Maximum time to wait for the `voterCtx.nominationsAvailable` value to settle after
   * providing data to the `dataRoot`. The reactive chain through multiple
   * `$derived` levels may need several microtasks to propagate.
   */
  const NOMINATIONS_SETTLE_TIMEOUT = 3000;

  type NominationStatus = 'all' | 'none' | 'some';

  let error = $state<Error | undefined>(undefined);
  let modalRef: Modal;
  let ready = $state(false);
  let hasNominations = $state<NominationStatus>('none');

  $effect(() => {
    // Read data synchronously to register as dependency
    const questionData = data.questionData;
    const nominationData = data.nominationData;
    // Reset state
    error = undefined;
    ready = false;
    Promise.all([questionData, nominationData]).then(async (resolved) => {
      const updateError = await updateAsync(resolved);
      error = updateError;
    });
  });

  /**
   * Handle the update inside a function so that we don't track $dataRoot, which would result in an infinite loop.
   * @returns `Error` if the data is invalid, `undefined` otherwise.
   */
  async function updateAsync([questionData, nominationData]: [
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
    // Wait for the reactive chain (VoterContext.selectedElections +
    // nominationsAvailable, both $derived/$effect over dataRoot + URL params)
    // to propagate before reading nomination status. The original sync read
    // raced the $effect that recomputes selectedElections — without the wait,
    // matches[activeElectionId] would still be undefined when the layout
    // first paints, locking the results page in a "Loading…" state until the
    // user manually navigated (variant-constituency.spec.ts:148 regression).
    const nomStatus = await awaitNominationsSettled();
    hasNominations = nomStatus;
    if (nomStatus !== 'all') modalRef?.openModal();
    ready = true;
    return undefined;
  }

  /**
   * Wait for the `voterCtx.nominationsAvailable` reactive value to settle by polling
   * inside an $effect instead of using store `.subscribe()`. Resolves
   * immediately if nominations are already available, otherwise waits for the
   * reactive chain to propagate with a safety timeout.
   */
  function awaitNominationsSettled(): Promise<NominationStatus> {
    return new Promise((resolve) => {
      let resolved = false;
      let debounceTimer: ReturnType<typeof setTimeout>;

      function done(status: NominationStatus) {
        if (resolved) return;
        resolved = true;
        clearTimeout(debounceTimer);
        clearTimeout(safetyTimer);
        cleanupEffect?.();
        resolve(status);
      }

      const safetyTimer = setTimeout(
        () => done(checkNominations(untrack(() => voterCtx.nominationsAvailable))),
        NOMINATIONS_SETTLE_TIMEOUT
      );

      // Use $effect.root to create a detached reactive scope we can clean up
      const cleanupEffect = $effect.root(() => {
        $effect(() => {
          const value = voterCtx.nominationsAvailable;
          const status = checkNominations(value);
          if (status === 'all') {
            // All nominations confirmed — defer to next microtask so cleanup is assigned
            queueMicrotask(() => done(status));
          } else {
            // Not all nominations yet — debounce to let the chain settle,
            // then resolve with whatever the final status is
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => done(checkNominations(untrack(() => voterCtx.nominationsAvailable))), 100);
          }
        });
      });
    });
  }

  function checkNominations(available: Record<string, boolean>): NominationStatus {
    const values = Object.values(available);
    if (!values.length) return 'none';
    if (values.every(Boolean)) return 'all';
    if (values.some(Boolean)) return 'some';
    return 'none';
  }
</script>

{#if error}
  <ErrorMessage class="bg-base-300" />
{:else if !ready}
  <Loading />
{:else}
  {@render children?.()}
{/if}

{#if hasNominations !== 'all'}
  <Modal
    title={hasNominations === 'none'
      ? t('results.missingNominations.noNominations.title')
      : t('results.missingNominations.someNominations.title')}
    closeOnBackdropClick={false}
    bind:this={modalRef}>
    <p>
      {@html sanitizeHtml(
        hasNominations === 'none'
          ? t('results.missingNominations.noNominations.content')
          : t('results.missingNominations.someNominations.content')
      )}
    </p>
    {#if hasNominations === 'some'}
      <div class="gap-md mx-auto flex w-max flex-col items-start">
        {#each voterCtx.selectedElections as election}
          {@const available = voterCtx.nominationsAvailable[election.id]}
          <div class="gap-sm flex flex-row items-center font-bold {available ? 'text-success' : 'text-warning'}">
            <Icon name={available ? 'check' : 'close'} />
            <span>{election.name}</span>
            {#if !available}
              <span class="text-secondary font-normal"
                >({t('results.missingNominations.noNominationsForElection')})</span>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
    {#snippet actions()}
      <div class="mx-auto flex w-full max-w-md flex-col">
        <Button onclick={() => modalRef?.closeModal()} text={t('common.continue')} variant="main" />
        <Button
          onclick={() => {
            goto($getRoute('Home'));
            modalRef?.closeModal();
          }}
          text={t('common.returnHome')} />
      </div>
    {/snippet}
  </Modal>
{/if}
