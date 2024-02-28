<script lang="ts">
  import {answerContext} from '$lib/utils/answerStore';
  import {onMount, setContext} from 'svelte';

  setContext('answers', answerContext);

  onMount(() => {
    answerContext.loadAnswerData();
    answerContext.loadQuestionData();
  });
</script>

<!--
@component
Answer provider provides the answer context to all its children.

### Contexts

- answers: The answer context

### Slots

- default: The children of the component

### Usage

```tsx
<AnswerProvider>
  <p>Example content</p>
</AnswerProvider>
```
-->

<slot />
