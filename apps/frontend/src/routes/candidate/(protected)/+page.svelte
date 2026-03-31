<!--@component

# Candidate app candidate welcome page

Shows a dynamic list of the actions the candidate should take to be included in the VAA.

### Settings

- `entities.hideIfMissingAnswers.candidate`: Affects message shown.
-->

<script lang="ts">
  import { LogoutButton } from '$lib/candidate/components/logoutButton';
  import { Button } from '$lib/components/button';
  import { HeroEmoji } from '$lib/components/heroEmoji';
  import { InfoBadge } from '$lib/components/infoBadge';
  import { Warning } from '$lib/components/warning';
  import { getCandidateContext } from '$lib/contexts/candidate';
  import MainContent from '../../MainContent.svelte';

  ////////////////////////////////////////////////////////////////////
  // Get contexts
  ////////////////////////////////////////////////////////////////////

  const {
    answersLocked,
    appSettings,
    getRoute,
    profileComplete,
    t,
    unansweredRequiredInfoQuestions,
    unansweredOpinionQuestions,
    userData
  } = getCandidateContext();

  ////////////////////////////////////////////////////////////////////
  // Create action list
  ////////////////////////////////////////////////////////////////////

  // React to changes in language and stores
  let nextAction = $derived.by(() => {
    const username = userData.current?.candidate.firstName || '?';
    if (profileComplete) {
      return {
        title: t('candidateApp.home.ready'),
        explanation: t('candidateApp.home.ingress.ready'),
        tip: t('candidateApp.home.previewTip'),
        buttonTextBasicInfo: !answersLocked
          ? t('candidateApp.home.basicInfo.edit')
          : t('candidateApp.home.basicInfo.view'),
        buttonTextQuestion: !answersLocked
          ? t('candidateApp.home.questions.edit')
          : t('candidateApp.home.questions.view'),
        buttonTextPrimaryActions: t('candidateApp.home.preview'),
        href: $getRoute('CandAppPreview')
      };
    } else if (unansweredRequiredInfoQuestions?.length === 0 && unansweredOpinionQuestions?.length !== 0) {
      return {
        title: t('candidateApp.common.greeting', { username }),
        explanation: t('candidateApp.home.ingress.notDone'),
        buttonTextBasicInfo: !answersLocked
          ? t('candidateApp.home.basicInfo.edit')
          : t('candidateApp.home.basicInfo.view'),
        buttonTextQuestion: !answersLocked
          ? t('candidateApp.home.questions.enter')
          : t('candidateApp.home.questions.view'),
        buttonTextPrimaryActions: !answersLocked
          ? t('candidateApp.home.questions.enter')
          : t('candidateApp.home.questions.view'),
        href: $getRoute('CandAppQuestions')
      };
    } else {
      return {
        title: t('candidateApp.common.greeting', { username }),
        explanation: t('candidateApp.home.ingress.notDone'),
        buttonTextBasicInfo: !answersLocked
          ? t('candidateApp.home.basicInfo.enter')
          : t('candidateApp.home.basicInfo.view'),
        buttonTextQuestion: !answersLocked
          ? t('candidateApp.home.questions.enter')
          : t('candidateApp.home.questions.view'),
        buttonTextPrimaryActions: !answersLocked
          ? t('candidateApp.home.basicInfo.enter')
          : t('candidateApp.home.basicInfo.view'),
        href: $getRoute('CandAppProfile')
      };
    }
  });
</script>

<MainContent title={nextAction.title}>
  {#snippet note()}
    {#if answersLocked}
      <Warning>
        {t('candidateApp.common.editingNotAllowed')}
        {#if unansweredRequiredInfoQuestions?.length !== 0 || ($appSettings.entities?.hideIfMissingAnswers?.candidate && unansweredOpinionQuestions?.length !== 0)}
          {t('candidateApp.common.isHiddenBecauseMissing')}
        {/if}
      </Warning>
    {/if}
  {/snippet}

  {#snippet hero()}
    <figure role="presentation">
      <HeroEmoji emoji={profileComplete ? t('dynamic.success.heroEmoji') : undefined} />
    </figure>
  {/snippet}

  <p class="text-center" data-testid="candidate-home-status">
    {nextAction.explanation}
  </p>

  {#if nextAction.tip}
    <p class="text-center" data-testid="candidate-home-tip">
      {nextAction.tip}
    </p>
  {/if}

  <div>
    <Button
      text={nextAction.buttonTextBasicInfo}
      icon="profile"
      iconPos="left"
      href={$getRoute('CandAppProfile')}
      data-testid="candidate-home-profile">
      {#snippet badge()}
        {#if unansweredRequiredInfoQuestions && unansweredRequiredInfoQuestions.length > 0}
          <InfoBadge text={String(unansweredRequiredInfoQuestions.length)} />
        {/if}
      {/snippet}
    </Button>
    <Button
      text={nextAction.buttonTextQuestion}
      icon="opinion"
      iconPos="left"
      disabled={unansweredRequiredInfoQuestions?.length !== 0}
      href={$getRoute('CandAppQuestions')}
      data-testid="candidate-home-questions">
      {#snippet badge()}
        {#if unansweredOpinionQuestions && unansweredOpinionQuestions?.length > 0}
          <InfoBadge
            text={unansweredOpinionQuestions.length}
            disabled={unansweredRequiredInfoQuestions?.length !== 0} />
        {/if}
      {/snippet}
    </Button>
    <Button
      text={t('candidateApp.home.preview')}
      icon="previewProfile"
      iconPos="left"
      disabled={unansweredRequiredInfoQuestions?.length !== 0}
      href={$getRoute('CandAppPreview')}
      data-testid="candidate-home-preview" />
  </div>

  {#snippet primaryActions()}
    <div class="flex w-full flex-col items-center justify-center">
      <Button
        variant="main"
        text={nextAction.buttonTextPrimaryActions}
        icon="next"
        href={nextAction.href}
        data-testid="candidate-home-continue" />
      <LogoutButton variant="normal" icon={undefined} data-testid="candidate-home-logout" />
    </div>
  {/snippet}
</MainContent>
