<!--
@component
Functional component used to block user nagivation.

### Properties
- `active` (optional): Whether to block navigation or not. False by default.

### Usage
```tsx
<PreventNavigation active={true} />
```
-->

<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { beforeNavigate } from '$app/navigation';
  import { getComponentContext } from '$lib/contexts/component';

  export let active: boolean = false;

  const { t } = getComponentContext();

  function handleBeforeUnload(e: BeforeUnloadEvent) {
    if (active) {
      e.preventDefault();
    }
  }

  beforeNavigate((e) => {
    if (active && !window.confirm($t('components.preventNavigation.unsavedChanges'))) {
      e.cancel();
    }
  });

  // prevent navigation on mount
  onMount(() => {
    addEventListener('beforeunload', handleBeforeUnload);
  });

  // remove event handler on unmount
  onDestroy(() => {
    removeEventListener('beforeunload', handleBeforeUnload);
  });
</script>
