<script lang="ts">
  import { getContext } from 'svelte';
  import { LogoutButton } from '$lib/candidate/components/logoutButton';
  import { Button } from '$lib/components/button';
  import { InfoBadge } from '$lib/components/infoBadge';
  import { Warning } from '$lib/components/warning';
  import { locale, t } from '$lib/i18n';
  import { settings } from '$lib/legacy-stores';
  import { type CandidateContext } from '$lib/utils/legacy-candidateContext';
  import { getRoute, ROUTE } from '$lib/utils/legacy-navigation';
  import Layout from '../../Layout.svelte';

  const { user, unansweredOpinionQuestions, unansweredRequiredInfoQuestions, answersLocked } =
    getContext<CandidateContext>('candidate');
  const username = $user?.candidate?.firstName;

  function getNextAction() {
    if ($unansweredRequiredInfoQuestions?.length === 0 && $unansweredOpinionQuestions?.length === 0) {
      return {
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
        href: $getRoute(ROUTE.CandAppPreview)
      };
    } else if ($unansweredRequiredInfoQuestions?.length === 0 && $unansweredOpinionQuestions?.length !== 0) {
      return {
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
        href: $getRoute(ROUTE.CandAppQuestions)
      };
    }
    return {
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
      href: $getRoute(ROUTE.CandAppProfile)
    };
  }

  $: nextAction = {
    $locale, // Trigger reactivity when locale changes
    ...getNextAction()
  };
</script>

<!--Homepage for the user-->

<Layout title={nextAction.title}>
  <div class="mt-xl text-center text-secondary" role="note" slot="note">
    <Warning display={!!$answersLocked}>
      <p>{$t('candidateApp.common.editingNotAllowed')}</p>
      {#if $unansweredRequiredInfoQuestions?.length !== 0 || ($settings.entities?.hideIfMissingAnswers?.candidate && $unansweredOpinionQuestions?.length !== 0)}
        <p>{$t('candidateApp.common.isHiddenBecauseMissing')}</p>
      {/if}
    </Warning>
  </div>

  <p class="max-w-md text-center">
    {nextAction.explanation}
    {#if $unansweredRequiredInfoQuestions?.length === 0 && $unansweredOpinionQuestions?.length === 0}
      <div class="margin-10">
        {nextAction.tip}
      </div>
    {/if}
  </p>
  <Button text={nextAction.buttonTextBasicInfo} icon="profile" iconPos="left" href={$getRoute(ROUTE.CandAppProfile)}>
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
    href={$getRoute(ROUTE.CandAppQuestions)}>
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
    href={$getRoute(ROUTE.CandAppPreview)} />

  <div class="flex w-full flex-col items-center justify-center" slot="primaryActions">
    <Button variant="main" text={nextAction.buttonTextPrimaryActions} icon="next" href={nextAction.href} />

    <LogoutButton variant="normal" icon={undefined} />
  </div>
</Layout>
