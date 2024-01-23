<script lang="ts">
  import {_} from 'svelte-i18n';
  import type {LayoutServerData} from '../../../$types';
  import AnswerProvider from '$candidate/components/answers/AnswerProvider.svelte';
  export let data: LayoutServerData;
</script>

<svelte:head>
  <title>{$_('questions.questionsTitle')}</title>
</svelte:head>

<AnswerProvider>
  {#if !data.questions.length}
    <p>{$_('error.noQuestions')}</p>
  {:else}
    <slot />
  {/if}
</AnswerProvider>
