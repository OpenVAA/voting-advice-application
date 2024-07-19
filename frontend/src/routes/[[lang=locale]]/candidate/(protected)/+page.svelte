<script lang="ts">
  import {t, locale} from '$lib/i18n';
  import {BasicPage} from '$lib/templates/basicPage';
  import {Button} from '$lib/components/button';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {getContext} from 'svelte';
  import {InfoBadge} from '$lib/components/infoBadge';
  import {LogoutButton} from '$lib/candidate/components/logoutButton';
  import {Warning} from '$lib/components/warning';
  import {type CandidateContext} from '$lib/utils/candidateStore';

  const {user, unansweredOpinionQuestions, unansweredRequiredInfoQuestions, questionsLocked} =
    getContext<CandidateContext>('candidate');
  const username = $user?.candidate?.firstName;

  const getNextAction = () => {
    if (
      $unansweredRequiredInfoQuestions?.length === 0 &&
      $unansweredOpinionQuestions?.length === 0
    ) {
      return {
        title: $t('candidateApp.homePage.ready'),
        explanation: $t('candidateApp.homePage.description'),
        tip: $t('candidateApp.homePage.tip'),
        buttonTextBasicInfo: !$questionsLocked
          ? $t('candidateApp.homePage.basicInfoButtonEdit')
          : $t('candidateApp.homePage.basicInfoButtonView'),
        buttonTextQuestion: !$questionsLocked
          ? $t('candidateApp.homePage.questionsButtonEdit')
          : $t('candidateApp.homePage.questionsButtonView'),
        buttonTextPrimaryActions: $t('candidateApp.homePage.previewButton'),
        href: $getRoute(Route.CandAppPreview)
      };
    } else if (
      $unansweredRequiredInfoQuestions?.length === 0 &&
      $unansweredOpinionQuestions?.length !== 0
    ) {
      return {
        title: $t('candidateApp.homePage.greeting', {username}),
        explanation: $t('candidateApp.homePage.explanation'),
        buttonTextBasicInfo: !$questionsLocked
          ? $t('candidateApp.homePage.basicInfoButtonEdit')
          : $t('candidateApp.homePage.basicInfoButtonView'),
        buttonTextQuestion: !$questionsLocked
          ? $t('candidateApp.homePage.questionsButton')
          : $t('candidateApp.homePage.questionsButtonView'),
        buttonTextPrimaryActions: !$questionsLocked
          ? $t('candidateApp.homePage.questionsButton')
          : $t('candidateApp.homePage.questionsButtonView'),
        href: $getRoute(Route.CandAppQuestions)
      };
    }
    return {
      title: $t('candidateApp.homePage.greeting', {username}),
      explanation: $t('candidateApp.homePage.explanation'),
      buttonTextBasicInfo: !$questionsLocked
        ? $t('candidateApp.homePage.basicInfoButton')
        : $t('candidateApp.homePage.basicInfoButtonView'),
      buttonTextQuestion: !$questionsLocked
        ? $t('candidateApp.homePage.questionsButton')
        : $t('candidateApp.homePage.questionsButtonView'),
      buttonTextPrimaryActions: !$questionsLocked
        ? $t('candidateApp.homePage.basicInfoButtonPrimaryActions')
        : $t('candidateApp.homePage.basicInfoButtonView'),
      href: $getRoute(Route.CandAppProfile)
    };
  };

  $: nextAction = {
    $locale, // Trigger reactivity when locale changes
    ...getNextAction()
  };
</script>

<!--Homepage for the user-->

<BasicPage title={nextAction.title}>
  <Warning display={!!$questionsLocked} slot="note">
    <p>{$t('candidateApp.homePage.editingNotAllowedNote')}</p>
    {#if $unansweredRequiredInfoQuestions?.length !== 0 || $unansweredOpinionQuestions?.length !== 0}
      <p>{$t('candidateApp.homePage.editingNotAllowedPartiallyFilled')}</p>
    {/if}
  </Warning>

  <p class="max-w-md text-center">
    {nextAction.explanation}
    {#if $unansweredRequiredInfoQuestions?.length === 0 && $unansweredOpinionQuestions?.length === 0}
      <div class="margin-10">
        {nextAction.tip}
      </div>
    {/if}
  </p>
  <Button
    text={nextAction.buttonTextBasicInfo}
    icon="profile"
    iconPos="left"
    href={$getRoute(Route.CandAppProfile)}>
    <svelte:fragment slot="badge">
      {#if $unansweredRequiredInfoQuestions && $unansweredRequiredInfoQuestions?.length > 0}
        <InfoBadge text={String($unansweredRequiredInfoQuestions?.length)} />
      {/if}
    </svelte:fragment>
  </Button>
  <Button
    text={nextAction.buttonTextQuestion}
    icon="opinion"
    iconPos="left"
    disabled={$unansweredRequiredInfoQuestions?.length !== 0}
    href={$getRoute(Route.CandAppQuestions)}>
    <svelte:fragment slot="badge">
      {#if $unansweredOpinionQuestions && $unansweredOpinionQuestions?.length > 0}
        <InfoBadge
          text={$unansweredOpinionQuestions.length}
          disabled={$unansweredRequiredInfoQuestions &&
            $unansweredRequiredInfoQuestions.length !== 0} />
      {/if}
    </svelte:fragment>
  </Button>
  <Button
    text={$t('candidateApp.homePage.previewButton')}
    icon="previewProfile"
    iconPos="left"
    disabled={$unansweredRequiredInfoQuestions?.length !== 0 ||
      $unansweredOpinionQuestions?.length !== 0}
    href={$getRoute(Route.CandAppPreview)} />

  <div class="flex w-full flex-col items-center justify-center" slot="primaryActions">
    <Button
      variant="main"
      text={nextAction.buttonTextPrimaryActions}
      icon="next"
      href={nextAction.href} />

    <LogoutButton variant="normal" icon={undefined} />
  </div>
</BasicPage>
