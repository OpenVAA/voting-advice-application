<script lang="ts">
  import {beforeNavigate} from '$app/navigation';
  import {t} from '$lib/i18n';
  import {onDestroy, onMount} from 'svelte';

  export let active: boolean = false;

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
