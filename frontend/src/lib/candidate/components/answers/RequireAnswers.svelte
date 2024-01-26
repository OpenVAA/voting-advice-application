<script lang="ts">
  import {getContext} from 'svelte';
  import type {AnswerContext} from '$lib/utils/answerStore';

  const answerContext = getContext<AnswerContext>('answers');
  const answers = answerContext.answers;

  const getAnswers = async () => {
    await answerContext.loadAnswerData();
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

{#if $answers}
  <slot />
{:else}
  {#await getAnswers()}
    <span class="loading loading-spinner loading-lg" />
  {:then}
    <slot />
  {/await}
{/if}
