<script lang="ts">
  import {getContext} from 'svelte';
  import {afterNavigate, goto} from '$app/navigation';
  import {locale, t} from '$lib/i18n';
  import {dataProvider} from '$lib/api/getData';
  import type {CandidateContext} from '$lib/utils/candidateStore';
  import {Route, getRoute} from '$lib/utils/navigation';
  import {Button} from '$lib/components/button';
  import {EntityDetails} from '$lib/components/entityDetails';
  import {Icon} from '$lib/components/icon';
  import {Loading} from '$lib/components/loading';
  import {LogoutButton} from '$lib/candidate/components/logoutButton';
  import {SingleCardPage} from '$lib/templates/singleCardPage';

  const {userStore} = getContext<CandidateContext>('candidate');

  let infoQuestions: QuestionProps[];
  let opinionQuestions: QuestionProps[];
  let candidate: CandidateProps | undefined;
  let loadData: Promise<void>;

  const fetchData = async () => {
    const {getInfoQuestions, getOpinionQuestions, getNominatedCandidates} = await dataProvider;
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

  /**
   * We determine if we arrived via an external link or from within the app, so we can use `history.back()`. However, if we changed the locale, we shouldn't use back() either.
   */
  let useBack = false;
  let initialLocale = $locale;
  afterNavigate((n) => (useBack = n.from?.route != null && initialLocale === $locale));
</script>

<SingleCardPage title={$t('candidateApp.preview.title')}>
  <svelte:fragment slot="note">
    <Icon name="info" />
    {$t('candidateApp.preview.tip')}
  </svelte:fragment>
  <svelte:fragment slot="banner">
    <LogoutButton variant="icon" />
    <Button
      slot="banner"
      class="!text-neutral"
      variant="icon"
      icon="close"
      on:click={() => (useBack ? history.back() : goto($getRoute(Route.CandAppHome)))}
      text={$t('candidateApp.preview.close')} />
  </svelte:fragment>

  {#await loadData}
    <Loading showLabel />
  {:then}
    {#if candidate}
      <EntityDetails content={candidate} {opinionQuestions} {infoQuestions} />
    {:else}
      <div class="w-full text-center text-warning">{$t('candidateApp.preview.notFound')}</div>
    {/if}
  {/await}
</SingleCardPage>
