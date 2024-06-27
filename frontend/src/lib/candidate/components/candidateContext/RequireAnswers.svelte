<script lang="ts">
  import {getContext} from 'svelte';
  import type {CandidateContext} from '$lib/utils/candidateStore';
  import {Loading} from '$lib/components/loading';

  const candidateContext = getContext<CandidateContext>('candidate');
  const {opinionAnswerStore, likertQuestionsStore, allQuestionsStore, infoAnswerStore} =
    candidateContext;

  const getQuestionsAndAnswers = async () => {
    await Promise.all([
      candidateContext.loadOpinionAnswerData(),
      candidateContext.loadInfoAnswerData(),
      candidateContext.loadLikertQuestionData(),
      candidateContext.loadAllQuestionData()
    ]);
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

{#if $opinionAnswerStore && $likertQuestionsStore && $allQuestionsStore && $infoAnswerStore}
  <slot />
{:else}
  {#await getQuestionsAndAnswers()}
    <Loading showLabel />
  {:then}
    <slot />
  {/await}
{/if}
