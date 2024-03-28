<script lang="ts">
  import {t} from '$lib/i18n';
  import {BasicPage} from '$lib/templates/basicPage';
  import {Button} from '$lib/components/button';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {type CandidateContext} from '$lib/utils/candidateStore';
  import {getContext} from 'svelte';
  import {get} from 'svelte/store';
  import InfoBadge from '$lib/components/infoBadge/infoBadge.svelte';
  import {LogoutButton} from '$lib/candidate/components/logoutButton';

  const {
    userStore,
    basicInfoFilledStore,
    nofUnasweredBasicInfoQuestionsStore: nofUnansweredBasicInfoQuestions,
    opinionQuestionsFilledStore,
    nofUnansweredOpinionQuestionsStore: nofUnansweredOpinionQuestions
  } = getContext<CandidateContext>('candidate');
  const user = get(userStore);
  const userName = user?.candidate?.firstName;

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

  function getNextAction() {
    if (!!basicInfoFilled && !!opinionQuestionsFilled) {
      return {
        title: $t('candidateApp.allDataFilled.title'),
        explanation: $t('candidateApp.homePage.explanationWhenReady'),
        buttonText: $t('candidateApp.homePage.previewButton'),
        href: $getRoute(Route.CandAppPreview)
      };
    } else if (!!basicInfoFilled && !opinionQuestionsFilled) {
      return {
        title: $t('candidateApp.homePage.greeting', {userName}),
        explanation: $t('candidateApp.homePage.explanation'),
        buttonText: $t('candidateApp.homePage.questionsButton'),
        href: $getRoute(Route.CandAppQuestions)
      };
    } else {
      return {
        title: $t('candidateApp.homePage.greeting', {userName}),
        explanation: $t('candidateApp.homePage.explanation'),
        buttonText: $t('candidateApp.homePage.basicInfoButton'),
        href: $getRoute(Route.CandAppProfile)
      };
    }
  }
</script>

<!--Homepage for the user-->

<BasicPage title={getNextAction().title}>
  <p class="max-w-md text-center">
    {getNextAction().explanation}
  </p>
  <Button
    text={$t('candidateApp.homePage.basicInfoButton')}
    icon="profile"
    iconPos="left"
    href={$getRoute(Route.CandAppProfile)}>
    {#if basicInfoQuestionsLeft && basicInfoQuestionsLeft > 0}
      <InfoBadge text={String(basicInfoQuestionsLeft)} classes="-left-4 -top-4" />
    {/if}
  </Button>
  <Button
    text={$t('candidateApp.homePage.questionsButton')}
    icon="opinion"
    iconPos="left"
    disabled={!basicInfoFilled}
    href={$getRoute(Route.CandAppQuestions)}>
    {#if opinionQuestionsLeft && opinionQuestionsLeft > 0}
      <InfoBadge
        text={String(opinionQuestionsLeft)}
        disabled={!basicInfoFilled}
        classes="-left-4 -top-4" />
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
      text={getNextAction().buttonText}
      icon="next"
      href={getNextAction().href} />

    <LogoutButton variantIcon={false}></LogoutButton>
  </div>
</BasicPage>
