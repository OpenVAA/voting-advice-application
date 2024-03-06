<script lang="ts">
  import {getContext} from 'svelte';
  import type {AnswerContext} from '$lib/utils/answerStore';

  const answerContext = getContext<AnswerContext>('answers');
  const answers = answerContext.answers;
  const questions = answerContext.questions;

  const getQuestionsAndAnswers = async () => {
    await Promise.all([answerContext.loadAnswerData(), answerContext.loadQuestionData()]);
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
