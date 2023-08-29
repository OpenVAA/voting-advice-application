<script lang="ts">
  import {_} from 'svelte-i18n';
  import type {LayoutData} from './$types';
  import {allQuestions} from '$lib/utils/stores';

  export let data: LayoutData;

  if (data?.questions) {
    $allQuestions = data.questions;
  } else {
    throw new Error('Could not load data!');
  }
</script>

<svelte:head>
  <title>{$_('questions.questionsTitle')}</title>
</svelte:head>

<section class="flex h-screen flex-col">
  <main class="grid flex-1 content-center px-3">
    <slot />
  </main>
</section>
