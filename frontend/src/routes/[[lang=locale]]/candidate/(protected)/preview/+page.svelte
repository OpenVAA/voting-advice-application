<script lang="ts">
  import type {CandidateContext} from '$lib/utils/candidateStore';
  import {getContext} from 'svelte';
  import {LogoutButton} from '$lib/candidate/components/logoutButton';
  import {CandidateDetailsCard} from '$lib/components/candidates';
  import {SingleCardPage} from '$lib/templates/singleCardPage';
  import {locale, t} from '$lib/i18n';
  import {Icon} from '$lib/components/icon';
  import {LoadingSpinner} from '$candidate/components/loadingSpinner';
  import {getInfoQuestions, getOpinionQuestions, getNominatedCandidates} from '$lib/api/getData';
  import {Button} from '$lib/components/button';
  import {getRoute, Route} from '$lib/utils/navigation';

  const {userStore} = getContext<CandidateContext>('candidate');

  let infoQuestions: QuestionProps[];
  let opinionQuestions: QuestionProps[];
  let candidate: CandidateProps | undefined;
  let loadData: Promise<void>;

  const fetchData = async () => {
    const [infoRes, opinionRes, candidateRes] = await Promise.all([
      getInfoQuestions({locale: $locale}),
      getOpinionQuestions({locale: $locale}),
      getNominatedCandidates({
        loadAnswers: true,
        locale: $locale,
        id: $userStore?.candidate?.id.toString()
      })
    ]);

    infoQuestions = infoRes;
    opinionQuestions = opinionRes;
    candidate = candidateRes[0];
  };

  $: {
    loadData = fetchData();
    $locale;
  }
</script>

{#await loadData}
  <LoadingSpinner />
{:then}
  {#if !candidate}
    <span>{$t('candidateApp.preview.notFound')}</span>
  {:else}
    <SingleCardPage title={$t('candidateApp.preview.title')}>
      <svelte:fragment slot="note">
        <Icon name="info" />
        {$t('candidateApp.preview.tip')}
        <div class="flex justify-center">
          <Button
            class="w-1/2"
            href={$getRoute(Route.CandAppHome)}
            variant="normal"
            text={$t('candidateApp.preview.close')}
            icon="previous"
            iconPos="left" />
        </div>
      </svelte:fragment>
      <LogoutButton buttonVariant="icon" slot="banner" />
      <CandidateDetailsCard {candidate} {opinionQuestions} {infoQuestions} candidateView />
    </SingleCardPage>
  {/if}
{/await}
