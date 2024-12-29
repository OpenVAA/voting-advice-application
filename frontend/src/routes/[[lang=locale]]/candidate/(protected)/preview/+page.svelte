<script lang="ts">
  import { getContext } from 'svelte';
  import { afterNavigate, goto } from '$app/navigation';
  import { LogoutButton } from '$lib/candidate/components/logoutButton';
  import { Button } from '$lib/components/button';
  import { Icon } from '$lib/components/icon';
  import { EntityDetails } from '$lib/components/legacy/entityDetails';
  import { Loading } from '$lib/components/loading';
  import { locale, t } from '$lib/i18n';
  import { dataProvider } from '$lib/legacy-api/getData';
  import { SingleCardPage } from '$lib/templates/singleCardPage';
  import { getRoute, ROUTE } from '$lib/utils/legacy-navigation';
  import type { CandidateContext } from '$lib/utils/legacy-candidateContext';

  const { user } = getContext<CandidateContext>('candidate');

  let infoQuestions: Array<LegacyQuestionProps>;
  let opinionQuestions: Array<LegacyQuestionProps>;
  let candidate: LegacyCandidateProps | undefined;
  let loadData: Promise<void>;

  async function fetchData() {
    const { getInfoQuestions, getOpinionQuestions, getNominatedCandidates } = await dataProvider;
    const [infoRes, opinionRes, candidateRes] = await Promise.all([
      getInfoQuestions({ locale: $locale }),
      getOpinionQuestions({ locale: $locale }),
      getNominatedCandidates({
        loadAnswers: true,
        locale: $locale,
        id: `${$user?.candidate?.id}`
      })
    ]);

    infoQuestions = infoRes;
    opinionQuestions = opinionRes;
    candidate = candidateRes[0];
  }

  $: {
    loadData = fetchData();
    $locale; // eslint-disable-line @typescript-eslint/no-unused-expressions
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
      on:click={() => (useBack ? history.back() : goto($getRoute(ROUTE.CandAppHome)))}
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
