<script lang="ts">
  import { getContext } from 'svelte';
  import { Loading } from '$lib/components/loading';
  import type { CandidateContext } from '$lib/utils/candidateContext';

  const candidateContext = getContext<CandidateContext>('candidate');

  const questionsAndAnswers = Promise.all([
    candidateContext.loadOpinionAnswerData(),
    candidateContext.loadInfoAnswerData(),
    candidateContext.loadOpinionQuestionData(),
    candidateContext.loadInfoQuestionData()
  ]);
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
{#await questionsAndAnswers}
  <Loading showLabel />
{:then}
  <slot />
{/await}
