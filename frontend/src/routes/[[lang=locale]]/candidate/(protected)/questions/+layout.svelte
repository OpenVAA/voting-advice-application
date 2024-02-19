<script lang="ts">
  import {t} from '$lib/i18n';
  import type {LayoutServerData} from '$types';
  import {AnswerProvider} from '$candidate/components/answers';
  export let data: LayoutServerData;
</script>

<svelte:head>
  <title>{$t('questions.questionsTitle')}</title>
</svelte:head>

<!-- Load answers for all routes under /candidate/questions -->
<AnswerProvider>
  {#if !data.questions.length}
    <p>{$t('error.noQuestions')}</p>
  {:else}
    <slot />
  {/if}
</AnswerProvider>
