<script lang="ts">
  import {goto} from '$app/navigation';
  import {t} from '$lib/i18n';
  import type {CandidateContext} from '$lib/utils/candidateStore';
  import {getContext} from 'svelte';
  import {get} from 'svelte/store';
  import {getRoute, Route} from '$lib/utils/navigation';

  const {basicInfoFilledStore, questionsStore} = getContext<CandidateContext>('candidate');
  if (!get(basicInfoFilledStore)) {
    goto($getRoute(Route.CandAppProfile));
  }

  $: questions = $questionsStore;
</script>

<svelte:head>
  <title>{$t('questions.questionsTitle')}</title>
</svelte:head>

{#if !questions || !Object.values(questions).length}
  <p>{$t('error.noQuestions')}</p>
{:else}
  <slot />
{/if}
