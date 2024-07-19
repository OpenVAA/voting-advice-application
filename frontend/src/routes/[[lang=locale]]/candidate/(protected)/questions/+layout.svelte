<script lang="ts">
  import type {CandidateContext} from '$lib/utils/candidateStore';
  import {getContext} from 'svelte';
  import {goto} from '$app/navigation';
  import {t} from '$lib/i18n';
  import {getRoute, Route} from '$lib/utils/navigation';
  import {LoadingSpinner} from '$candidate/components/loadingSpinner';

  const {opinionQuestions, unansweredRequiredInfoQuestions} =
    getContext<CandidateContext>('candidate');

  $: if ($unansweredRequiredInfoQuestions?.length !== 0) {
    goto($getRoute(Route.CandAppProfile));
  }
</script>

<svelte:head>
  <title>{$t('questions.title')}</title>
</svelte:head>

{#if $unansweredRequiredInfoQuestions?.length !== 0}
  <LoadingSpinner />
{:else if !$opinionQuestions || !Object.values($opinionQuestions).length}
  <p>{$t('error.noQuestions')}</p>
{:else}
  <slot />
{/if}
