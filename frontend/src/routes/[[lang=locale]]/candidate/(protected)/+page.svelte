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

  let nextAction: {
    title: string;
    explanation: string;
    tip?: string;
    buttonTextBasicInfo: string;
    buttonTextQuestion: string;
    buttonTextPrimaryActions: string;
    href: string;
  };

  // React to changes in language and stores
  $: {
    const username = $userData?.candidate.firstName || '?';
    if ($profileComplete) {
      nextAction = {
        title: $t('candidateApp.home.ready'),
        explanation: $t('candidateApp.home.ingress.ready'),
        tip: $t('candidateApp.home.previewTip'),
        buttonTextBasicInfo: !$answersLocked
          ? $t('candidateApp.home.basicInfo.edit')
          : $t('candidateApp.home.basicInfo.view'),
        buttonTextQuestion: !$answersLocked
          ? $t('candidateApp.home.questions.edit')
          : $t('candidateApp.home.questions.view'),
        buttonTextPrimaryActions: $t('candidateApp.home.preview'),
        href: $getRoute('CandAppPreview')
      };
    } else if ($unansweredRequiredInfoQuestions?.length === 0 && $unansweredOpinionQuestions?.length !== 0) {
      nextAction = {
        title: $t('candidateApp.common.greeting', { username }),
        explanation: $t('candidateApp.home.ingress.notDone'),
        buttonTextBasicInfo: !$answersLocked
          ? $t('candidateApp.home.basicInfo.edit')
          : $t('candidateApp.home.basicInfo.view'),
        buttonTextQuestion: !$answersLocked
          ? $t('candidateApp.home.questions.enter')
          : $t('candidateApp.home.questions.view'),
        buttonTextPrimaryActions: !$answersLocked
          ? $t('candidateApp.home.questions.enter')
          : $t('candidateApp.home.questions.view'),
        href: $getRoute('CandAppQuestions')
      };
    } else {
      nextAction = {
        title: $t('candidateApp.common.greeting', { username }),
        explanation: $t('candidateApp.home.ingress.notDone'),
        buttonTextBasicInfo: !$answersLocked
          ? $t('candidateApp.home.basicInfo.enter')
          : $t('candidateApp.home.basicInfo.view'),
        buttonTextQuestion: !$answersLocked
          ? $t('candidateApp.home.questions.enter')
          : $t('candidateApp.home.questions.view'),
        buttonTextPrimaryActions: !$answersLocked
          ? $t('candidateApp.home.basicInfo.enter')
          : $t('candidateApp.home.basicInfo.view'),
        href: $getRoute('CandAppProfile')
      };
    }
  }
</script>

<MainContent title={nextAction.title}>
  <svelte:fragment slot="note">
    {#if $answersLocked}
      <Warning>
        {$t('candidateApp.common.editingNotAllowed')}
        {#if $unansweredRequiredInfoQuestions?.length !== 0 || ($appSettings.entities?.hideIfMissingAnswers?.candidate && $unansweredOpinionQuestions?.length !== 0)}
          {$t('candidateApp.common.isHiddenBecauseMissing')}
        {/if}
      </Warning>
    {/if}
  </svelte:fragment>

  <figure role="presentation" slot="hero">
    <HeroEmoji emoji={$profileComplete ? $t('dynamic.success.heroEmoji') : undefined} />
  </figure>  

  <p class="text-center">
    {nextAction.explanation}
  </p>

  {#if nextAction.tip}
    <p class="text-center">
      {nextAction.tip}
    </p>
  {/if}

  <div>
    <Button text={nextAction.buttonTextBasicInfo} icon="profile" iconPos="left" href={$getRoute('CandAppProfile')}>
      <svelte:fragment slot="badge">
        {#if $unansweredRequiredInfoQuestions && $unansweredRequiredInfoQuestions.length > 0}
          <InfoBadge text={String($unansweredRequiredInfoQuestions.length)} />
        {/if}
      </svelte:fragment>
    </Button>
    <Button
      text={nextAction.buttonTextQuestion}
      icon="opinion"
      iconPos="left"
      disabled={$unansweredRequiredInfoQuestions?.length !== 0}
      href={$getRoute('CandAppQuestions')}>
      <svelte:fragment slot="badge">
        {#if $unansweredOpinionQuestions && $unansweredOpinionQuestions?.length > 0}
          <InfoBadge
            text={$unansweredOpinionQuestions.length}
            disabled={$unansweredRequiredInfoQuestions?.length !== 0} />
        {/if}
      </svelte:fragment>
    </Button>
    <Button
      text={$t('candidateApp.home.preview')}
      icon="previewProfile"
      iconPos="left"
      disabled={$unansweredRequiredInfoQuestions?.length !== 0}
      href={$getRoute('CandAppPreview')} />
  </div>

  <div class="flex w-full flex-col items-center justify-center" slot="primaryActions">
    <Button variant="main" text={nextAction.buttonTextPrimaryActions} icon="next" href={nextAction.href} />
    <LogoutButton variant="normal" icon={undefined} />
  </div>
</MainContent>
