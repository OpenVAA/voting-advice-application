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
  import Warning from '$lib/components/warning/Warning.svelte';

  const {
    userStore,
    basicInfoFilledStore,
    nofUnasweredBasicInfoQuestionsStore: nofUnansweredBasicInfoQuestions,
    opinionQuestionsFilledStore,
    nofUnansweredOpinionQuestionsStore: nofUnansweredOpinionQuestions,
    questionsStore
  } = getContext<CandidateContext>('candidate');
  const user = get(userStore);
  const userName = user?.candidate?.firstName;

  let dataEditable: boolean;

  let questions = get(questionsStore) ?? [];

  if (questions) {
    //TODO: use store when store is implemented
    dataEditable = Object.values(questions)[0].editable;
  }

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
        title: $t('candidateApp.homePage.title'),
        explanation: $t('candidateApp.homePage.description'),
        tip: $t('candidateApp.homePage.tip'),
        buttonTextBasicInfo: $t('candidateApp.homePage.basicInfoButtonView'),
        buttonTextQuestion: $t('candidateApp.homePage.questionsButtonView'),
        buttonTextPrimaryActions: $t('candidateApp.homePage.previewButton'),
        href: $getRoute(Route.CandAppPreview)
      };
    } else if (basicInfoFilled && !opinionQuestionsFilled) {
      return {
        title: $t('candidateApp.homePage.greeting', {userName}),
        explanation: $t('candidateApp.homePage.explanation'),
        buttonTextBasicInfo: $t('candidateApp.homePage.basicInfoButtonEdit'),
        buttonTextQuestion: $t('candidateApp.homePage.questionsButton'),
        buttonTextPrimaryActions: $t('candidateApp.homePage.questionsButton'),
        href: $getRoute(Route.CandAppQuestions)
      };
    }
    return {
      title: $t('candidateApp.homePage.greeting', {userName}),
      explanation: $t('candidateApp.homePage.explanation'),
      buttonTextBasicInfo: $t('candidateApp.homePage.basicInfoButton'),
      buttonTextQuestion: $t('candidateApp.homePage.questionsButton'),
      buttonTextPrimaryActions: $t('candidateApp.homePage.basicInfoButtonPrimaryActions'),
      href: $getRoute(Route.CandAppProfile)
    };
  };
</script>

<!--Homepage for the user-->

<BasicPage title={getNextAction().title}>
  <Warning display={!dataEditable} slot="note">
    <p>{$t('candidateApp.homePage.editingNotAllowedNote')}</p>
    {#if !opinionQuestionsFilled || !basicInfoFilled}
      <p>{$t('candidateApp.homePage.editingNotAllowedPartiallyFilled')}</p>
    {/if}
  </Warning>

  <p class="max-w-md text-center">
    {getNextAction().explanation}
    {#if basicInfoFilled && opinionQuestionsFilled}
      <div class="margin-10">
        {getNextAction().tip}
      </div>
    {/if}
  </p>
  <Button
    text={getNextAction().buttonTextBasicInfo}
    icon="profile"
    iconPos="left"
    href={$getRoute(Route.CandAppProfile)}>
    {#if basicInfoQuestionsLeft && basicInfoQuestionsLeft > 0}
      <InfoBadge text={basicInfoQuestionsLeft} classes="-left-4 -top-4" />
    {/if}
  </Button>
  <Button
    text={getNextAction().buttonTextQuestion}
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
    {#if !(!dataEditable && !opinionQuestionsFilled)}
      <Button
        variant="main"
        text={getNextAction().buttonTextPrimaryActions}
        icon="next"
        href={getNextAction().href} />
    {/if}

    <LogoutButton variantIcon={false}></LogoutButton>
  </div>
</BasicPage>
