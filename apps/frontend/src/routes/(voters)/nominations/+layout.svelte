<!--@component

# All nominations layout

Provides the data used by the nominations route.

### Settings

- `entities.showAllNominations`: Affects whether this route is available (handled by `layout.ts`)
-->

<script lang="ts">
  import { tick } from 'svelte';
  import type { Snippet } from 'svelte';
  import { isValidResult } from '$lib/api/utils/isValidResult.js';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { Loading } from '$lib/components/loading';
  import { getVoterContext } from '$lib/contexts/voter';
  import type { DPDataType } from '$lib/api/base/dataTypes';

  let { data, children }: { data: any; children: Snippet } = $props();

  const { dataRoot } = getVoterContext();

  let error = $state<Error | undefined>(undefined);
  let ready = $state(false);

  $effect(() => {
    // Read data synchronously to register as dependency
    const nominationData = data.nominationData;
    // Reset state
    error = undefined;
    ready = false;
    Promise.all([nominationData]).then(async (resolved) => {
      error = await update(resolved);
    });
  });

  /**
   * Handle the update inside a function so that we don't track $dataRoot, which would result in an infinite loop.
   * @returns `Error` if the data is invalid, `undefined` otherwise.
   */
  async function update([nominationData]: [DPDataType['nominations'] | Error]): Promise<Error | undefined> {
    if (!isValidResult(nominationData, { allowEmpty: true })) return new Error('Error loading nomination data');
    $dataRoot.update(() => {
      $dataRoot.provideEntityData(nominationData.entities);
      $dataRoot.provideNominationData(nominationData.nominations);
    });
    await tick();
    ready = true;
  }
</script>

{#if error}
  <ErrorMessage class="bg-base-300" />
{:else if !ready}
  <Loading />
{:else}
  {@render children?.()}
{/if}
