<script lang="ts">
  import {onDestroy, onMount} from 'svelte';

  export let active: boolean = false;

  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (active) {
      e.preventDefault();
    }
  };

  // prevent navigation on mount
  onMount(() => {
    addEventListener('beforeunload', handleBeforeUnload);
  });

  // remove event handler on unmount
  onDestroy(() => {
    removeEventListener('beforeunload', handleBeforeUnload);
  });
</script>

<!--
@component
PreventNavigation is used to block user nagivation.

### Properties
- `active` (optional): Whether to block navigation or not. False by default.

### Usage
```tsx
<PreventNavigation active={true} />
```
-->
