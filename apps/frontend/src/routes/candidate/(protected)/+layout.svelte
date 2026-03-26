<svelte:options runes />

<!--@component

# Candidate logged in main layout

- Provides data CandidateContext:
  - candidate user data
  - questions
- Shows the terms of use form if it has not been agreed to yet
-->

<script lang="ts">
  import type { Snippet } from 'svelte';
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

  let { data, children }: { data: any; children: Snippet } = $props();

  ////////////////////////////////////////////////////////////////////
  // Get context
  ////////////////////////////////////////////////////////////////////

  const { dataRoot, logout, t, userData } = getCandidateContext();

  ////////////////////////////////////////////////////////////////////
  // Accept terms of use
  ////////////////////////////////////////////////////////////////////

  let status = $state<ActionStatus>('idle');
  let termsAccepted = $state(false);

  async function handleSubmit() {
    if (!termsAccepted) return;
    status = 'loading';
    userData.setTermsOfUseAccepted(new Date().toJSON());
    await userData.save();
    layoutState = 'ready';
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

  /**
   * Single state variable for layout rendering. Consolidates `ready`, `error`, and
   * `showTermsOfUse` into one write to work around a Svelte 5 hydration issue where
   * writing to multiple `$state` variables inside `.then()` from `$effect` doesn't
   * trigger DOM re-renders after SSR+hydration.
   */
  let layoutState = $state<'loading' | 'error' | 'terms' | 'ready'>('loading');

  $effect(() => {
    // Read data synchronously to register as dependency
    const questionData = data.questionData;
    const candidateUserData = data.candidateUserData;
    // Reset state
    layoutState = 'loading';
    Promise.all([questionData, candidateUserData]).then((resolved) => {
      update(resolved);
    });
  });

  /**
   * Process loaded data. Sets `layoutState` as a single write — the only `$state`
   * mutation inside the `.then()` callback.
   */
  function update([questionData, candidateUserData]: [
    DPDataType['questions'] | Error,
    CandidateUserData<true> | undefined
  ]): void {
    if (!isValidResult(questionData, { allowEmpty: true })) {
      logDebugError('Error loading question data');
      layoutState = 'error';
      return;
    }
    if (!candidateUserData?.nominations || !candidateUserData?.candidate) {
      logDebugError('Error loading candidate data');
      layoutState = 'error';
      return;
    }
    const { entities, nominations } = candidateUserData.nominations;
    $dataRoot.provideQuestionData(questionData);
    $dataRoot.provideEntityData(entities);
    $dataRoot.provideNominationData(nominations);
    userData.init(candidateUserData);
    layoutState = !candidateUserData.candidate.termsOfUseAccepted ? 'terms' : 'ready';
  }
</script>

{#if layoutState === 'error'}
  <ErrorMessage class="bg-base-300" />
{:else if layoutState === 'loading'}
  <Loading />
{:else if layoutState === 'terms'}
  <MainContent title={t('dynamic.candidateAppPrivacy.consent.title')}>
    {#snippet hero()}
      <figure role="presentation">
        <HeroEmoji emoji={t('dynamic.candidateAppPrivacy.consent.heroEmoji')} />
      </figure>
    {/snippet}
    <TermsOfUseForm bind:termsAccepted />
    {#snippet primaryActions()}
      <Button
        text={t('common.continue')}
        variant="main"
        disabled={!termsAccepted}
        loading={status === 'loading'}
        onclick={handleSubmit} />
      <Button color="warning" text={t('common.logout')} loading={status === 'loading'} onclick={handleCancel} />
    {/snippet}
  </MainContent>
{:else}
  {@render children?.()}
{/if}
