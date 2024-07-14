<script lang="ts">
  import { getContext } from 'svelte';
  import { goto } from '$app/navigation';
  import { LoadingSpinner } from '$candidate/components/loadingSpinner';
  import { t } from '$lib/i18n';
  import type { CandidateContext } from '$lib/utils/candidateStore';
  import { getRoute, Route } from '$lib/utils/navigation';

  const { basicInfoFilledStore, questionsStore } = getContext<CandidateContext>('candidate');

  $: if (!$basicInfoFilledStore) {
    goto($getRoute(Route.CandAppProfile));
  }

  $: questions = $questionsStore;
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
