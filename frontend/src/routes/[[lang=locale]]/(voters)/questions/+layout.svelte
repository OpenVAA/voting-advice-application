<script lang="ts">
  import {t} from '$lib/i18n';
  import type {LayoutServerData} from './$types';

  export let data: LayoutServerData;

  let questions: QuestionProps[];
  $: questions = data.questions;
</script>

<svelte:head>
  <title>{$t('questions.questionsTitle')}</title>
</svelte:head>

{#if !questions?.length}
  <p>{$t('error.noQuestions')}</p>
{:else}
  <slot />
{/if}
