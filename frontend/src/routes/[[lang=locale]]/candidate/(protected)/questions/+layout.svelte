<script lang="ts">
  import type {CandidateContext} from '$lib/utils/candidateStore';
  import {getContext} from 'svelte';
  import {goto} from '$app/navigation';
  import {t} from '$lib/i18n';
  import {get} from 'svelte/store';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {LoadingSpinner} from '$candidate/components/loadingSpinner';

  const {basicInfoFilledStore, questionsStore} = getContext<CandidateContext>('candidate');

  $: if (!get(basicInfoFilledStore)) {
    goto($getRoute(Route.CandAppProfile));
  }

  $: questions = $questionsStore;
</script>

<svelte:head>
  <title>{$t('questions.questionsTitle')}</title>
</svelte:head>

{#if !get(basicInfoFilledStore)}
  <LoadingSpinner />
{:else if !questions || !Object.values(questions).length}
  <p>{$t('error.noQuestions')}</p>
{:else}
  <slot />
{/if}
