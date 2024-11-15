<script lang="ts">
  import { onMount, setContext } from 'svelte';
  import { candidateContext } from '$lib/utils/legacy-candidateContext';

  setContext('candidate', candidateContext);
  const token = candidateContext.token;

  onMount(() => {
    candidateContext.loadLocalStorage();
    if ($token) candidateContext.loadUserData();
  });
</script>

<!--
@component
Candidate context provider provides the candidate context to all its children.

### Contexts

- candidate: The candidate context

### Slots

- default: The children of the component

### Usage

```tsx
<CandidateContextProvider>
  <p>Example content</p>
</CandidateContextProvider>
```
-->

<slot />
