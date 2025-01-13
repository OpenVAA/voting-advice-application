<script lang="ts">
  import { getContext, onDestroy } from 'svelte';
  import { afterNavigate, goto } from '$app/navigation';
  import { Icon } from '$lib/components/icon';
  import { EntityDetails } from '$lib/components/legacy/entityDetails';
  import { Loading } from '$lib/components/loading';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { locale, t } from '$lib/i18n';
  import { dataProvider } from '$lib/legacy-api/getData';
  import { getRoute, ROUTE } from '$lib/utils/legacy-navigation';
  import Layout from '../../../Layout.svelte';
  import type { CandidateContext } from '$lib/utils/legacy-candidateContext';

  const { pageStyles, topBarSettings } = getLayoutContext(onDestroy);

  pageStyles.push({ drawer: { background: 'bg-base-300' } });
  topBarSettings.push({
    actions: {
      return: 'show',
      returnButtonLabel: $t('candidateApp.preview.close'),
      returnButtonCallback: () => (useBack ? history.back() : goto($getRoute(ROUTE.CandAppHome)))
    }
  });

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

<Layout title={$t('candidateApp.preview.title')}>
  <div class="mt-xl text-center text-secondary" role="note" slot="note">
    <Icon name="info" />
    {$t('candidateApp.preview.tip')}
  </div>
  <!-- The card -->
  <div
    class="-mx-lg -mb-safelgb -mt-lg flex w-screen max-w-xl flex-grow self-center rounded-t-lg bg-base-100 pb-[3.5rem] match-w-xl:shadow-xl">
    {#await loadData}
      <Loading showLabel />
    {:then}
      {#if candidate}
        <EntityDetails content={candidate} {opinionQuestions} {infoQuestions} />
      {:else}
        <div class="w-full text-center text-warning">{$t('candidateApp.preview.notFound')}</div>
      {/if}
    {/await}
  </div>
</Layout>
