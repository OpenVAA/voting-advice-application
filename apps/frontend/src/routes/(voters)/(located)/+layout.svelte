<svelte:options runes />

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
  import { get } from 'svelte/store';
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

  const { dataRoot, getRoute, nominationsAvailable, selectedElections, t } = getVoterContext();

  /**
   * Maximum time to wait for the `nominationsAvailable` store to settle after
   * providing data to the `dataRoot`. The reactive chain through multiple
   * `parsimoniusDerived` levels may need several microtasks to propagate,
   * especially under Svelte 5's store compatibility layer.
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
      error = await update(resolved);
    });
  });

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
    hasNominations = await awaitNominationsSettled();
    if (hasNominations !== 'all') modalRef?.openModal();
    ready = true;
  }

  /**
   * Wait for the `nominationsAvailable` store to settle by subscribing and
   * watching for changes instead of relying on fixed timeouts. Resolves
   * immediately if nominations are already available, otherwise waits for the
   * reactive chain to propagate with a safety timeout.
   *
   * TODO[Svelte 5]: Rewrite with Svelte 5 runes ($derived / $effect) once the
   * legacy store compatibility layer and alwaysNotifyStore workaround in
   * dataContext.ts are replaced with native reactivity.
   */
  function awaitNominationsSettled(): Promise<NominationStatus> {
    return new Promise((resolve) => {
      let resolved = false;
      let debounceTimer: ReturnType<typeof setTimeout>;
      let unsub: () => void;

      function done(status: NominationStatus) {
        if (resolved) return;
        resolved = true;
        clearTimeout(debounceTimer);
        clearTimeout(safetyTimer);
        unsub?.();
        resolve(status);
      }

      const safetyTimer = setTimeout(
        () => done(checkNominations(get(nominationsAvailable))),
        NOMINATIONS_SETTLE_TIMEOUT
      );

      unsub = nominationsAvailable.subscribe((value) => {
        const status = checkNominations(value);
        if (status === 'all') {
          // All nominations confirmed — defer to next microtask so unsub is assigned
          queueMicrotask(() => done(status));
        } else {
          // Not all nominations yet — debounce to let the chain settle,
          // then resolve with whatever the final status is
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => done(checkNominations(get(nominationsAvailable))), 100);
        }
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
        {#each $selectedElections as election}
          {@const available = $nominationsAvailable[election.id]}
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
