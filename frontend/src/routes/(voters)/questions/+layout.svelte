<script lang="ts">
  import {_} from 'svelte-i18n';
  import type {LayoutServerData} from './$types';

  export let data: LayoutServerData;
</script>

<svelte:head>
  <title>{$_('questions.questionsTitle')}</title>
</svelte:head>

<div class="flex h-full flex-col items-center justify-center">
  <div class="max-w-xl">
    {#if !data.questions.length}
      <p>{$_('error.noQuestions')}</p>
    {:else}
      <slot />
    {/if}
  </div>
</div>
