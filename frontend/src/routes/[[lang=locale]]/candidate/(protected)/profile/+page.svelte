<!--@component

# Candidate app profile basic info page

Shows the candidate's basic information, some of which is editable.

### Settings

- `entities.hideIfMissingAnswers.candidate`: Affects message shown.
-->

<script lang="ts">
  import { getCustomData, type LocalizedAnswer } from '@openvaa/app-shared';
  import { type AnyQuestionVariant, ENTITY_TYPE, isEmptyValue } from '@openvaa/data';
  import { onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { Button } from '$lib/components/button';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { Icon } from '$lib/components/icon';
  import { Input, InputGroup, QuestionInput } from '$lib/components/input';
  import { iconBadgeClass } from '$lib/components/input';
  import PreventNavigation from '$lib/components/preventNavigation/PreventNavigation.svelte';
  import { SuccessMessage } from '$lib/components/successMessage';
  import { Warning } from '$lib/components/warning';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { logDebugError } from '$lib/utils/logger';
  import MainContent from '../../../MainContent.svelte';
  import type { CandidateNomination } from '@openvaa/data';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const {
    answersLocked,
    appSettings,
    dataRoot,
    getRoute,
    infoQuestions,
    profileComplete,
    requiredInfoQuestions,
    unansweredRequiredInfoQuestions,
    unansweredOpinionQuestions,
    t,
    userData
  } = getCandidateContext();
  const { pageStyles } = getLayoutContext(onDestroy);

  ////////////////////////////////////////////////////////////////////
  // State variables
  ////////////////////////////////////////////////////////////////////

  const { hasUnsaved } = userData;

  let allRequiredFilled = false;
  let bypassPreventNavigation = false;
  let canSubmit: boolean;
  let nominations: Array<CandidateNomination>;
  let status: ActionStatus = 'idle';
  let submitLabel: string;
  let submitRoute: string;

  ////////////////////////////////////////////////////////////////////
  // Display immutable data
  ////////////////////////////////////////////////////////////////////

  $: nominations = $userData?.candidate
    ? $dataRoot.getNominationsForEntity({ type: ENTITY_TYPE.Candidate, id: $userData.candidate.id })
    : [];

  /**
   * Return the data from a nomination needed for displaying it.
   */
  function parseNomination(nomination: CandidateNomination): {
    election?: string;
    constituency?: string;
    organization?: string;
    electionSymbol?: string;
    unconfirmed?: boolean;
  } {
    try {
      const { election, constituency, electionSymbol, parentNomination } = nomination;
      const customData = getCustomData(nomination);
      // Unconfirmed may be inherited from parent nomination
      let unconfirmed = !!customData.unconfirmed;
      if (!unconfirmed && parentNomination) unconfirmed = !!getCustomData(parentNomination).unconfirmed;
      return {
        election: election.name,
        constituency: constituency.name,
        organization: parentNomination ? parentNomination.entity.name : undefined,
        electionSymbol,
        unconfirmed
      };
    } catch (e) {
      logDebugError(`Error formatting nomination: ${e}`);
      return {
        unconfirmed: true
      };
    }
  }

  ////////////////////////////////////////////////////////////////////
  // Handle saving answers and define submit label and notes
  ////////////////////////////////////////////////////////////////////

  $: canSubmit = status !== 'loading';

  $: allRequiredFilled = !$requiredInfoQuestions.some((q) => isEmptyValue($userData?.candidate.answers?.[q.id]?.value));

  $: if (allRequiredFilled && $unansweredOpinionQuestions.length && !$answersLocked) {
    submitLabel = $hasUnsaved ? $t('common.saveAndContinue') : $t('common.continue');
    submitRoute = $getRoute('CandAppQuestions');
  } else {
    submitRoute = $getRoute('CandAppHome');
    submitLabel = $answersLocked || !$hasUnsaved ? $t('common.return') : $t('common.saveAndReturn');
  }

  function handleImageInputChange(value: unknown): void {
    if (!value) {
      userData.resetImage();
      return;
    }
    const image = value as ImageWithFile;
    userData.setImage(image);
  }

  function handleQuestionInputChange({ value, question }: { value: unknown; question: AnyQuestionVariant }): void {
    const answer = { value } as LocalizedAnswer;
    userData.setAnswer(question.id, answer);
  }

  async function handleSubmit(): Promise<void> {
    if (!canSubmit) {
      status = 'error';
      logDebugError('[Candidate app question page]: handleSubmit called when canSubmit is false');
      return;
    }
    status = 'loading';
    // Request email to be sent in the backend
    const result = await userData.save().catch((e) => {
      logDebugError(`[Candidate app question page] Error saving userData: ${e?.message}`);
      return undefined;
    });
    if (result?.type !== 'success') {
      status = 'error';
      return;
    }
    status = 'success';
    goto(submitRoute);
  }

  /**
   * Handle cancel button click.
   */
  function handleCancel(): void {
    bypassPreventNavigation = true;
    userData.resetUnsaved();
    goto($getRoute('CandAppHome')).then(() => (bypassPreventNavigation = false));
  }

  /**
   * Reset saved answers when leaving the page.
   */
  function handleNavigationConfirm(): void {
    userData.resetUnsaved();
  }

  ////////////////////////////////////////////////////////////////////
  // Styling
  ////////////////////////////////////////////////////////////////////

  pageStyles.push({ drawer: { background: 'bg-base-200' } });

  const subheadingClass = 'text-lg mt-lg mb-md mx-md';
</script>

<PreventNavigation
  active={() => !bypassPreventNavigation && $hasUnsaved && !$answersLocked}
  onConfirm={handleNavigationConfirm} />

<MainContent title={$t('candidateApp.basicInfo.title')}>
  <svelte:fragment slot="note">
    {#if $answersLocked}
      <Warning>
        {$t('candidateApp.common.editingNotAllowed')}
        {#if $unansweredRequiredInfoQuestions?.length !== 0 || ($appSettings.entities?.hideIfMissingAnswers?.candidate && $unansweredOpinionQuestions?.length !== 0)}
          {$t('candidateApp.common.isHiddenBecauseMissing')}
        {/if}
      </Warning>
    {:else if $profileComplete}
      <SuccessMessage inline message={$t('candidateApp.common.fullyCompleted')} />
    {/if}
  </svelte:fragment>

  <p class="text-center">
    {$t('candidateApp.basicInfo.instructions')}
  </p>

  <!-- Immutable personal data -->

  <section>
    <h2 class={subheadingClass}>{$t('dynamic.candidateAppBasicInfo.immutableData.title')}</h2>
    <p class="mx-md">{$t('dynamic.candidateAppBasicInfo.immutableData.ingress')}</p>
    <InputGroup class="mt-lg">
      <Input type="text" label={$t('common.firstName')} value={$userData?.candidate.firstName} onShadedBg locked />
      <Input type="text" label={$t('common.lastName')} value={$userData?.candidate.lastName} onShadedBg locked />

      <!-- Locked Info questions -->
      {#each $infoQuestions.filter((q) => getCustomData(q).locked) as question}
        {@const answer = $userData?.candidate.answers?.[question.id]}
        <QuestionInput
          {question}
          {answer}
          locked
          onShadedBg
          disableMultilingual
          placeholder={$t('dynamic.candidateAppBasicInfo.immutableData.emptyPlaceholder')} />
      {/each}
    </InputGroup>
  </section>

  <!-- Immutable nominations -->

  <section>
    <h2 class={subheadingClass}>{$t('candidateApp.basicInfo.nominations.title')}</h2>
    <p class="mx-md">{$t('candidateApp.basicInfo.nominations.description')}</p>

    <div class="flex flex-col gap-lg">
      {#each nominations as nomination}
        {@const { election, constituency, organization, electionSymbol, unconfirmed } = parseNomination(nomination)}
        <InputGroup title={election}>
          {#if constituency}
            <Input type="text" label={$t('common.constituency')} value={constituency} onShadedBg locked />
          {/if}
          {#if organization}
            <Input type="text" label={$t('common.electionList')} value={organization} onShadedBg locked />
          {/if}
          {#if electionSymbol}
            <Input type="text" label={$t('common.electionSymbol.candidate')} value={electionSymbol} onShadedBg locked />
          {/if}
          <Input
            type="text"
            label={$t('common.state')}
            value={unconfirmed ? $t('common.pending') : $t('common.confirmed')}
            onShadedBg
            locked />
        </InputGroup>
      {/each}
    </div>
  </section>

  <!-- Editable data -->

  <section>
    <h2 class={subheadingClass}>{$t('candidateApp.basicInfo.editableInfos.title')}</h2>

    <div class="flex flex-col gap-md">
      <!-- Image -->

      <Input
        type="image"
        label={$t('common.candidatePortrait')}
        value={$userData?.candidate.image}
        onChange={handleImageInputChange}
        locked={$answersLocked}
        onShadedBg />

      <!-- Editable Info questions -->

      {#each $infoQuestions.filter((q) => !getCustomData(q).locked) as question}
        {@const answer = $userData?.candidate.answers?.[question.id]}
        <QuestionInput {question} {answer} onChange={handleQuestionInputChange} locked={$answersLocked} onShadedBg />
      {/each}
    </div>
  </section>

  <!-- Submit button and error messages -->

  <svelte:fragment slot="primaryActions">
    {#if !$answersLocked}
      <div class="mx-md mb-lg mt-md transition-opacity" class:opacity-0={status === 'loading' || allRequiredFilled}>
        <Icon name="required" class="{iconBadgeClass} text-warning" /><span class="sr-only"
          >{$t('common.required')}</span>
        {$t('candidateApp.basicInfo.requiredInfo')}
      </div>
    {/if}

    {#if status === 'error'}
      <ErrorMessage inline message={$t('candidateApp.error.saveFailed')} class="mb-lg mt-md" />
    {/if}

    <div class="grid w-full justify-items-center">
      {#if !$answersLocked}
        <Button
          text={submitLabel}
          on:click={handleSubmit}
          disabled={!canSubmit}
          loading={status === 'loading'}
          loadingText={$t('common.saving')}
          type="submit"
          data-testid="submitButton"
          variant="main"
          icon="next" />
        <Button text={$t('common.cancel')} disabled={!$hasUnsaved} on:click={handleCancel} color="warning" />
      {:else}
        <Button text={$t('common.return')} href={$getRoute('CandAppHome')} variant="main" />
      {/if}
    </div>
  </svelte:fragment>
</MainContent>

<style lang="postcss">
  section {
    @apply mt-lg self-stretch;
  }
</style>
