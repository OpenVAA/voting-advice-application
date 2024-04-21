<script lang="ts">
  import {t, locale} from '$lib/i18n';
  import {BasicPage} from '$lib/templates/basicPage';
  import {Button} from '$lib/components/button';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {getContext} from 'svelte';
  import {get} from 'svelte/store';
  import {InfoBadge} from '$lib/components/infoBadge';
  import {LogoutButton} from '$lib/candidate/components/logoutButton';
  import {Warning} from '$lib/components/warning';
  import {type CandidateContext} from '$lib/utils/candidateStore';

  const {
    userStore,
    basicInfoFilledStore,
    nofUnansweredBasicInfoQuestionsStore: nofUnansweredBasicInfoQuestions,
    opinionQuestionsFilledStore,
    nofUnansweredOpinionQuestionsStore: nofUnansweredOpinionQuestions,
    questionsLockedStore
  } = getContext<CandidateContext>('candidate');
  const user = get(userStore);
  const username = user?.candidate?.firstName;

  $: questionsLocked = $questionsLockedStore;

  let opinionQuestionsLeft: number | undefined;
  nofUnansweredOpinionQuestions?.subscribe((value) => {
    opinionQuestionsLeft = value;
  });

  let opinionQuestionsFilled: boolean | undefined;
  opinionQuestionsFilledStore?.subscribe((value) => {
    opinionQuestionsFilled = value;
  });

  let basicInfoQuestionsLeft: number | undefined;
  nofUnansweredBasicInfoQuestions?.subscribe((value) => {
    basicInfoQuestionsLeft = value;
  });

  let basicInfoFilled: boolean | undefined;
  basicInfoFilledStore?.subscribe((value) => {
    basicInfoFilled = value;
  });

  const getNextAction = () => {
    if (basicInfoFilled && opinionQuestionsFilled) {
      return {
        title: $t('candidateApp.homePage.ready'),
        explanation: $t('candidateApp.homePage.description'),
        tip: $t('candidateApp.homePage.tip'),
        buttonTextBasicInfo: !questionsLocked
          ? $t('candidateApp.homePage.basicInfoButtonEdit')
          : $t('candidateApp.homePage.basicInfoButtonView'),
        buttonTextQuestion: !questionsLocked
          ? $t('candidateApp.homePage.questionsButtonEdit')
          : $t('candidateApp.homePage.questionsButtonView'),
        buttonTextPrimaryActions: $t('candidateApp.homePage.previewButton'),
        href: $getRoute(Route.CandAppPreview)
      };
    } else if (basicInfoFilled && !opinionQuestionsFilled) {
      return {
        title: $t('candidateApp.homePage.greeting', {username}),
        explanation: $t('candidateApp.homePage.explanation'),
        buttonTextBasicInfo: !questionsLocked
          ? $t('candidateApp.homePage.basicInfoButtonEdit')
          : $t('candidateApp.homePage.basicInfoButtonView'),
        buttonTextQuestion: !questionsLocked
          ? $t('candidateApp.homePage.questionsButton')
          : $t('candidateApp.homePage.questionsButtonView'),
        buttonTextPrimaryActions: !questionsLocked
          ? $t('candidateApp.homePage.questionsButton')
          : $t('candidateApp.homePage.questionsButtonView'),
        href: $getRoute(Route.CandAppQuestions)
      };
    }
    return {
      title: $t('candidateApp.homePage.greeting', {username}),
      explanation: $t('candidateApp.homePage.explanation'),
      buttonTextBasicInfo: !questionsLocked
        ? $t('candidateApp.homePage.basicInfoButton')
        : $t('candidateApp.homePage.basicInfoButtonView'),
      buttonTextQuestion: !questionsLocked
        ? $t('candidateApp.homePage.questionsButton')
        : $t('candidateApp.homePage.questionsButtonView'),
      buttonTextPrimaryActions: !questionsLocked
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
  <Warning display={!!questionsLocked} slot="note">
    <p>{$t('candidateApp.homePage.editingNotAllowedNote')}</p>
    {#if !opinionQuestionsFilled || !basicInfoFilled}
      <p>{$t('candidateApp.homePage.editingNotAllowedPartiallyFilled')}</p>
    {/if}
  </Warning>

  <p class="max-w-md text-center">
    {nextAction.explanation}
    {#if basicInfoFilled && opinionQuestionsFilled}
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
    {#if basicInfoQuestionsLeft && basicInfoQuestionsLeft > 0}
      <InfoBadge text={basicInfoQuestionsLeft} classes="-left-4 -top-4" />
    {/if}
  </Button>
  <Button
    text={nextAction.buttonTextQuestion}
    icon="opinion"
    iconPos="left"
    disabled={!basicInfoFilled}
    href={$getRoute(Route.CandAppQuestions)}>
    {#if opinionQuestionsLeft && opinionQuestionsLeft > 0}
      <InfoBadge text={opinionQuestionsLeft} disabled={!basicInfoFilled} classes="-left-4 -top-4" />
    {/if}
  </Button>
  <Button
    text={$t('candidateApp.homePage.previewButton')}
    icon="previewProfile"
    iconPos="left"
    disabled={!(basicInfoFilled && opinionQuestionsFilled)}
    href={$getRoute(Route.CandAppPreview)}>
  </Button>

  <div class="flex w-full flex-col items-center justify-center" slot="primaryActions">
    <Button
      variant="main"
      text={nextAction.buttonTextPrimaryActions}
      icon="next"
      href={nextAction.href} />

    <LogoutButton />
  </div>
</BasicPage>
