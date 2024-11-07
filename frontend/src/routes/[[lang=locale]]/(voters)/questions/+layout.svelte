<script lang="ts">
  import { onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { LoadingSpinner } from '$candidate/components/loadingSpinner';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { t } from '$lib/i18n';
  import { opinionQuestions, settings } from '$lib/stores';
  import { getRoute, ROUTE } from '$lib/utils/navigation';
  import { getQuestionsContext } from './questions.context.js';

  export let data;

  const { topBarSettings, progress } = getLayoutContext(onDestroy);
  const { numSelectedQuestions } = getQuestionsContext();

  topBarSettings.push({
    progress: 'show',
    actions: {
      results: $settings.questions.showResultsLink ? 'show' : 'hide'
    }
  });

  $: progress.max.set($numSelectedQuestions + 1);

  $: data.opinionQuestions.then((qs) => {
    if (!qs.length) {
      goto($getRoute(ROUTE.QuestionError));
    }
  });
</script>

<svelte:head>
  <title>{$t('questions.title')} – {$t('dynamic.appName')}</title>
</svelte:head>

{#await $opinionQuestions}
  <LoadingSpinner />
{:then}
  <slot />
{/await}
