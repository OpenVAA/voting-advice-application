<script lang="ts">
  import {getContext} from 'svelte';
  import type {AnswerContext} from '$lib/utils/answerStore';

  const answerContext = getContext<AnswerContext>('answers');
  const answers = answerContext.answers;

  const getAnswers = async () => {
    await answerContext.loadAnswerData();
  };
</script>

{#if $answers}
  <slot />
{:else}
  {#await getAnswers()}
    <span class="loading loading-spinner loading-lg" />
  {:then}
    <slot />
  {/await}
{/if}
