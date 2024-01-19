<script lang="ts">
  import {answerContext} from '$lib/utils/answerStore';
  import {onMount, setContext} from 'svelte';

  setContext('answers', answerContext);
  const answers = answerContext.answers;

  onMount(() => {
    $answers && answerContext.loadAnswerData();
  });
</script>

{#if $answers}
  <slot />
{:else if $answers === undefined}
  <div class="mt-100 flex h-screen flex-col items-center">
    <span class="loading loading-spinner loading-lg" />
  </div>
{:else}
  <slot name="custom-content" />
  <h1>bänger2</h1>
{/if}
