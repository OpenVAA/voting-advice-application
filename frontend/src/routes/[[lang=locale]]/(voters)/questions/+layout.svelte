<script lang="ts">
  import {goto} from '$app/navigation';
  import {opinionQuestions, settings} from '$lib/stores';
  import {t} from '$lib/i18n';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {LoadingSpinner} from '$candidate/components/loadingSpinner';
  import {onDestroy} from 'svelte';
  import {getLayoutContext} from '$lib/contexts/layout';
  import {getQuestionsContext} from './questions.context.js';

  const {topBarSettings, progress} = getLayoutContext(onDestroy);
  const {numSelectedQuestions} = getQuestionsContext();

  topBarSettings.push({
    progress: 'show',
    actions: {
      results: $settings.questions.showResultsLink ? 'show' : 'hide'
    }
  });

  $: progress.max.set($numSelectedQuestions + 1);

  export let data;

  $: data.opinionQuestions.then((qs) => {
    if (!qs.length) {
      goto($getRoute(Route.QuestionError));
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
