<script lang="ts">
  import {goto} from '$app/navigation';
  import {getTopBarProgressContext} from '../../topBarProgress.context.js';
  import {opinionQuestions} from '$lib/stores';
  import {t} from '$lib/i18n';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {LoadingSpinner} from '$candidate/components/loadingSpinner';

  export let data;

  $: data.opinionQuestions.then((qs) => {
    if (!qs.length) {
      goto($getRoute(Route.QuestionError));
    } else {
      setProgressBarMax(qs.length + 1);
    }
  });

  const topBarProgress = getTopBarProgressContext();

  function setProgressBarMax(max: number) {
    topBarProgress.max.set(max);
  }
</script>

<svelte:head>
  <title>{$t('questions.title')} – {$t('dynamic.appName')}</title>
</svelte:head>

{#await $opinionQuestions}
  <LoadingSpinner />
{:then}
  <slot />
{/await}
