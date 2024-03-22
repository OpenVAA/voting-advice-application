<script lang="ts">
  import {goto} from '$app/navigation';
  import {t} from '$lib/i18n';
  import type {CandidateContext} from '$lib/utils/candidateStore';
  import type {LayoutServerData} from '$types';
  import {getContext} from 'svelte';
  import {get} from 'svelte/store';
  export let data: LayoutServerData;

  const {basicInfoFilledStore} = getContext<CandidateContext>('candidate');
  if (!get(basicInfoFilledStore)) {
    goto('/candidate/profile');
  }
</script>

<svelte:head>
  <title>{$t('questions.questionsTitle')}</title>
</svelte:head>

{#if !data.questions.length}
  <p>{$t('error.noQuestions')}</p>
{:else}
  <slot />
{/if}
