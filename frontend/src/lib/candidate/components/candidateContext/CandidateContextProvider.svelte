<script lang="ts">
  import {candidateContext} from '$lib/utils/candidateStore';
  import {onMount, setContext} from 'svelte';

  setContext('candidate', candidateContext);
  const token = candidateContext.token;

  onMount(() => {
    candidateContext.loadLocalStorage();
    $token && candidateContext.loadUserData();
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
