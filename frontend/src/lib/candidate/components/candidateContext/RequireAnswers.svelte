<script lang="ts">
  import {getContext} from 'svelte';
  import type {CandidateContext} from '$lib/utils/candidateContext';
  import {Loading} from '$lib/components/loading';

  const candidateContext = getContext<CandidateContext>('candidate');

  const data = Promise.all([
    candidateContext.loadOpinionAnswerData(),
    candidateContext.loadInfoAnswerData(),
    candidateContext.loadOpinionQuestionData(),
    candidateContext.loadInfoQuestionData(),
    candidateContext.loadPartyData()
  ]);
</script>

<!--
@component
Require candidate answers and other necessary data to be loaded to view the children of this component.

### Slots

- default: The content to show when the data are loaded.

### Usage

```tsx
<RequireAnswers>
  <p>Example content</p>
</RequiredAnswers>
```
-->
{#await data}
  <Loading showLabel />
{:then}
  <slot />
{/await}
