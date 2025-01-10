<!--@component

# Located section main layout

Provides the data used by the located – i.e. those requiring the elections and constituencies to be selected – parts of voter app to the `dataRoot`, which are loaded by `+layout.ts`.

### Settings

- `header.showHelp`: Whether the help button is shown in the header.
- `header.showFeedback`: Whether the feedback button is shown in the header.
- `analytics.platform`: Affects whether the analytics service is loaded.
- `analytics.trackEvents`: Affects whether the data consent popup is shown.
-->

<script lang="ts">
  import { isValidResult } from '$lib/api/utils/isValidResult.js';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { Loading } from '$lib/components/loading';
  import { getVoterContext } from '$lib/contexts/voter';
  import { logDebugError } from '$lib/utils/logger.js';
  import type { DPDataType } from '$lib/api/base/dataTypes';

  export let data;

  const { dataRoot } = getVoterContext();

  let error: Error | undefined;
  let ready: boolean;
  $: {
    // If data is updated, we want to prevent loading the slot until the promises resolve
    error = undefined;
    ready = false;
    Promise.all([data.questionData, data.nominationData]).then((data) => {
      error = update(data);
    });
  }
  $: if (error) logDebugError(error.message);

  /**
   * Handle the update inside a function so that we don't track $dataRoot, which would result in an infinite loop.
   * @returns `Error` if the data is invalid, `undefined` otherwise.
   */
  function update([questionData, nominationData]: [
    DPDataType['questions'] | Error,
    DPDataType['nominations'] | Error
  ]): Error | undefined {
    if (!isValidResult(questionData, { allowEmpty: true })) return new Error('Error loading question data');
    if (!isValidResult(nominationData, { allowEmpty: true })) return new Error('Error loading nomination data');
    $dataRoot.provideQuestionData(questionData);
    $dataRoot.provideEntityData(nominationData.entities);
    $dataRoot.provideNominationData(nominationData.nominations);
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
