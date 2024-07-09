<script lang="ts">
  import type {CandidateContext} from '$lib/utils/candidateStore';
  import {getContext} from 'svelte';
  import {goto} from '$app/navigation';
  import {t} from '$lib/i18n';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {LoadingSpinner} from '$candidate/components/loadingSpinner';

  const {basicInfoFilledStore, opinionQuestionsStore} = getContext<CandidateContext>('candidate');

  $: if (!$basicInfoFilledStore) {
    goto($getRoute(Route.CandAppProfile));
  }

  $: questions = $opinionQuestionsStore;
</script>

<svelte:head>
  <title>{$t('questions.title')}</title>
</svelte:head>

{#if !$basicInfoFilledStore}
  <LoadingSpinner />
{:else if !questions || !Object.values(questions).length}
  <p>{$t('error.noQuestions')}</p>
{:else}
  <slot />
{/if}
