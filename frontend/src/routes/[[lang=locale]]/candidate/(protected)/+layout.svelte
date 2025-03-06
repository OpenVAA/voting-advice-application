<!--@component

# Candidate logged in main layout

- Provides data CandidateContext:
  - candidate user data
  - questions
-->

<script lang="ts">
  import { isValidResult } from '$lib/api/utils/isValidResult';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { Loading } from '$lib/components/loading';
  import { getCandidateContext } from '$lib/contexts/candidate/candidateContext';
  import { logDebugError } from '$lib/utils/logger';
  import type { DPDataType } from '$lib/api/base/dataTypes';
  import type { CandidateUserData } from '$lib/api/base/dataWriter.type';

  export let data;

  ////////////////////////////////////////////////////////////////////
  // Get context
  ////////////////////////////////////////////////////////////////////

  const { dataRoot, userData } = getCandidateContext();

  ////////////////////////////////////////////////////////////////////
  // Provide data
  ////////////////////////////////////////////////////////////////////

  let error: Error | undefined;
  let ready: boolean;
  $: {
    // If data is updated, we want to prevent loading the slot until the promises resolve
    error = undefined;
    ready = false;
    Promise.all([data.questionData, data.candidateUserData]).then((data) => {
      error = update(data);
    });
  }
  $: if (error) logDebugError(error.message);

  /**
   * Handle the update inside a function so that we don't track $dataRoot, which would result in an infinite loop.
   * @returns `Error` if the data is invalid, `undefined` otherwise.
   */
  function update([questionData, candidateUserData]: [
    DPDataType['questions'] | Error,
    CandidateUserData<true> | undefined
  ]): Error | undefined {
    if (!isValidResult(questionData, { allowEmpty: true })) return new Error('Error loading question data');
    if (!candidateUserData?.nominations || !candidateUserData?.candidate)
      return new Error('Error loading candidate data');
    const { entities, nominations } = candidateUserData.nominations;
    $dataRoot.provideQuestionData(questionData);
    $dataRoot.provideEntityData(entities);
    $dataRoot.provideNominationData(nominations);
    userData.init(candidateUserData);
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
