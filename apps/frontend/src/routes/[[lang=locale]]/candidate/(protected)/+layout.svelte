<!--@component

# Candidate logged in main layout

- Provides data CandidateContext:
  - candidate user data
  - questions
- Shows the terms of use form if it has not been agreed to yet
-->

<script lang="ts">
  import { TermsOfUseForm } from '$candidate/components/termsOfUse';
  import { isValidResult } from '$lib/api/utils/isValidResult';
  import { Button } from '$lib/components/button';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { Loading } from '$lib/components/loading';
  import { getCandidateContext } from '$lib/contexts/candidate/candidateContext';
  import { logDebugError } from '$lib/utils/logger';
  import MainContent from '../../MainContent.svelte';
  import type { DPDataType } from '$lib/api/base/dataTypes';
  import type { CandidateUserData } from '$lib/api/base/dataWriter.type';

  export let data;

  ////////////////////////////////////////////////////////////////////
  // Get context
  ////////////////////////////////////////////////////////////////////

  const { dataRoot, logout, t, userData } = getCandidateContext();

  ////////////////////////////////////////////////////////////////////
  // Accept terms of use
  ////////////////////////////////////////////////////////////////////

  let showTermsOfUse = false;
  let status: ActionStatus = 'idle';
  let termsAccepted: boolean | undefined;

  async function handleSubmit() {
    if (!termsAccepted) return;
    status = 'loading';
    userData.setTermsOfUseAccepted(new Date().toJSON());
    await userData.save();
    showTermsOfUse = false;
    status = 'success';
  }

  async function handleCancel() {
    status = 'loading';
    await logout();
    status = 'idle';
  }

  ////////////////////////////////////////////////////////////////////
  // Provide data and possibly show terms of use form
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
    if (!candidateUserData.candidate.termsOfUseAccepted) showTermsOfUse = true;
    ready = true;
  }
</script>

{#if error}
  <ErrorMessage class="bg-base-300" />
{:else if !ready}
  <Loading />
{:else if showTermsOfUse}
  <MainContent title={$t('dynamic.candidateAppPrivacy.consent.title')}>
    <figure role="presentation" slot="hero">
      <HeroEmoji emoji={$t('dynamic.candidateAppPrivacy.consent.heroEmoji')} />
    </figure>
    <TermsOfUseForm bind:termsAccepted />
    <svelte:fragment slot="primaryActions">
      <Button
        text={$t('common.continue')}
        variant="main"
        disabled={!termsAccepted}
        loading={status === 'loading'}
        on:click={handleSubmit} />
      <Button color="warning" text={$t('common.logout')} loading={status === 'loading'} on:click={handleCancel} />
    </svelte:fragment>
  </MainContent>
{:else}
  <slot />
{/if}
