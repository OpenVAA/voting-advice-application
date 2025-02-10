<!--@component

# Candidate app profile basic info page

Shows the candidate's basic information, some of which is editable.

### Settings

- `entities.hideIfMissingAnswers.candidate`: Affects message shown.
-->

<script lang="ts">
  import { type AnyQuestionVariant, CandidateNomination, ENTITY_TYPE, isEmptyValue } from '@openvaa/data';
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
  import type { CustomData, LocalizedAnswer } from '@openvaa/app-shared';

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
      const { election, constituency, electionSymbol, parentNomination, customData } = nomination;
      // Unconfirmed may be inherited from parent nomination
      let unconfirmed = !!(customData as CustomData['Nomination']).unconfirmed;
      if (!unconfirmed && parentNomination)
        unconfirmed = !!(parentNomination.customData as CustomData['Nomination']).unconfirmed;
      return {
        election: election.shortName,
        constituency: constituency.shortName,
        organization: parentNomination ? parentNomination.entity.shortName : undefined,
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
  // Handle saving answers
  ////////////////////////////////////////////////////////////////////

  $: {
    if ($unansweredOpinionQuestions.length && !$answersLocked) {
      submitLabel = $t('common.saveAndContinue');
      submitRoute = $getRoute('CandAppQuestions');
    } else {
      submitLabel = $answersLocked ? $t('common.return') : $t('common.saveAndReturn');
      submitRoute = $getRoute('CandAppHome');
    }
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
      logDebugError(`Error saving userData: ${e?.message}`);
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
  // Check if the form is dirty or empty and define submit label
  ////////////////////////////////////////////////////////////////////

  $: canSubmit =
    status !== 'loading' &&
    !$requiredInfoQuestions.some((q) => isEmptyValue($userData?.candidate.answers?.[q.id]?.value));

  $: submitLabel = !$hasUnsaved
    ? $t('common.continue')
    : $unansweredOpinionQuestions?.length
      ? $t('common.saveAndContinue')
      : $t('common.saveAndReturn');

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

  <InputGroup info={$t('candidateApp.basicInfo.disclaimer')} class="mt-lg">
    <Input type="text" label={$t('common.firstName')} value={$userData?.candidate.firstName} onShadedBg locked />
    <Input type="text" label={$t('common.lastName')} value={$userData?.candidate.lastName} onShadedBg locked />
  </InputGroup>

  <!-- Immutable nominations -->

  <section class="self-stretch">
    <h2 class={subheadingClass}>{$t('candidateApp.basicInfo.nominations.title')}</h2>

    <div class="flex flex-col gap-lg">
      {#each nominations as nomination, i}
        {@const { election, constituency, organization, electionSymbol, unconfirmed } = parseNomination(nomination)}
        <InputGroup
          title={election}
          info={i === nominations.length - 1 ? $t('candidateApp.basicInfo.nominations.description') : undefined}>
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

  <section class="self-stretch">
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

      <!-- Info questions -->

      {#each $infoQuestions as question}
        {@const answer = $userData?.candidate.answers?.[question.id]}

        <QuestionInput {question} {answer} onChange={handleQuestionInputChange} locked={$answersLocked} onShadedBg />
      {/each}
    </div>
  </section>

  <!-- Submit button and error messages -->

  <svelte:fragment slot="primaryActions">
    {#if !$answersLocked && $requiredInfoQuestions.length}
      <div class="mx-md my-md transition-opacity" class:opacity-0={canSubmit}>
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
          type="submit"
          data-testid="submitButton"
          variant="main"
          icon="next" />
        <Button text={$t('common.cancel')} on:click={handleCancel} color="warning" />
      {:else}
        <Button text={$t('common.return')} href={$getRoute('CandAppHome')} variant="main" />
      {/if}
    </div>
  </svelte:fragment>
</MainContent>
