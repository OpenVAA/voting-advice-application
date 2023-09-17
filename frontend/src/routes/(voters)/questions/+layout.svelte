<script lang="ts">
  import {_} from 'svelte-i18n';
  import type {LayoutServerData} from './$types';

  export let data: LayoutServerData;

  if (!data?.questions) {
    throw new Error('Could not load data!');
  }
</script>

<svelte:head>
  <title>{$_('questions.questionsTitle')}</title>
</svelte:head>

<div class="flex h-full flex-col items-center justify-center">
  <div class="max-w-xl">
    <slot />
  </div>
</div>
