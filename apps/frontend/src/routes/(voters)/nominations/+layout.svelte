<!--@component

# All nominations layout

Provides the data used by the nominations route.

### Settings

- `entities.showAllNominations`: Affects whether this route is available (handled by `layout.ts`)
-->

<script lang="ts">
  import { isValidResult } from '$lib/api/utils/isValidResult.js';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { Loading } from '$lib/components/loading';
  import { getVoterContext } from '$lib/contexts/voter';
  import type { DPDataType } from '$lib/api/base/dataTypes';

  export let data;

  const { dataRoot } = getVoterContext();

  let error: Error | undefined;
  let ready: boolean;

  $: {
    // If data is updated, we want to prevent loading the slot until the promises resolve
    error = undefined;
    ready = false;
    Promise.all([data.nominationData]).then(async (data) => {
      error = await update(data);
    });
  }

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
    ready = true;
  }
</script>

{#if error}
  <ErrorMessage class="bg-base-300" />
{:else if !ready}
  <Loading />
{:else}
  <slot />
{/if}´
