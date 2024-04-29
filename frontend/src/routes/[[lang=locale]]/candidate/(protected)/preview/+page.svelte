<script lang="ts">
  import {getContext} from 'svelte';
  import { goto } from '$app/navigation';
  import {locale, t} from '$lib/i18n';
  import {getInfoQuestions, getOpinionQuestions, getNominatedCandidates} from '$lib/api/getData';
  import type {CandidateContext} from '$lib/utils/candidateStore';
  import { Route, getRoute, referredByUs } from '$lib/utils/navigation';
  import { Button } from '$lib/components/button';
  import {EntityDetails} from '$lib/components/entityDetails';
  import {Icon} from '$lib/components/icon';
  import { Loading } from '$lib/components/loading';
  import {LogoutButton} from '$lib/candidate/components/logoutButton';
  import {SingleCardPage} from '$lib/templates/singleCardPage';

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
  <Loading/>
{:then}
  {#if !candidate}
    <span>{$t('candidateApp.preview.notFound')}</span>
  {:else}
    <SingleCardPage title={$t('candidateApp.preview.title')}>
      <svelte:fragment slot="note">
        <Icon name="info" />
        {$t('candidateApp.preview.tip')}
      </svelte:fragment>
      <svelte:fragment slot="banner">
        <LogoutButton />
        <Button
          slot="banner"
          class="!text-neutral"
          variant="icon"
          icon="close"
          on:click={() => (referredByUs() ? history.back() : goto($getRoute(Route.CandAppHome)))}
          text={$t('candidateApp.preview.close')} />
      </svelte:fragment>
      <EntityDetails content={candidate} {opinionQuestions} {infoQuestions} />
    </SingleCardPage>
  {/if}
{/await}