<script lang="ts">
  import type {CandidateContext} from '$lib/utils/candidateStore';
  import {getContext} from 'svelte';

  const candidateContext = getContext<CandidateContext>('candidate');
  const answers = candidateContext.answersStore;
  const questions = candidateContext.questionsStore;

  const getQuestionsAndAnswers = async () => {
    await Promise.all([candidateContext.loadAnswerData(), candidateContext.loadQuestionData()]);
  };
</script>

<!--
@component
Require candidate answers to be loaded to view the children of this component.

### Slots

- default: The content to show when the answers are loaded.

### Usage

```tsx
<RequireAnswers>
  <p>Example content</p>
</RequiredAnswers>
```
-->

{#if $answers && $questions}
  <slot />
{:else}
  {#await getQuestionsAndAnswers()}
    <span class="loading loading-spinner loading-lg" />
  {:then}
    <slot />
  {/await}
{/if}
