<!--@component

# Argument condensation layout

- Provides data AdminContext:
  - questions
- Adds polling
-->

<script lang="ts">
  import WithPolling from '$lib/admin/components/jobs/WithPolling.svelte';
  import { isValidResult } from '$lib/api/utils/isValidResult';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { Loading } from '$lib/components/loading';
  import { getAdminContext } from '$lib/contexts/admin/adminContext.js';
  import { logDebugError } from '$lib/utils/logger';
  import type { DPDataType } from '$lib/api/base/dataTypes';

  export let data;

  ////////////////////////////////////////////////////////////////////
  // Get context
  ////////////////////////////////////////////////////////////////////

  const { dataRoot } = getAdminContext();

  ////////////////////////////////////////////////////////////////////
  // Provide data
  ////////////////////////////////////////////////////////////////////

  let error: Error | undefined;
  let ready: boolean;
  $: {
    // If data is updated, we want to prevent loading the slot until the promises resolve
    error = undefined;
    ready = false;
    Promise.all([data.questionData]).then((data) => {
      error = update(data);
    });
  }
  $: if (error) logDebugError(error.message);

  /**
   * Handle the update inside a function so that we don't track $dataRoot, which would result in an infinite loop.
   * @returns `Error` if the data is invalid, `undefined` otherwise.
   */
  function update([questionData]: [DPDataType['questions'] | Error]): Error | undefined {
    if (!isValidResult(questionData, { allowEmpty: true })) return new Error('Error loading question data');
    $dataRoot.provideQuestionData(questionData);
    ready = true;
  }
</script>

{#if error}
  <ErrorMessage class="bg-base-300" />
{:else if !ready}
  <Loading />
{:else}
  <WithPolling>
    <slot />
  </WithPolling>
{/if}
