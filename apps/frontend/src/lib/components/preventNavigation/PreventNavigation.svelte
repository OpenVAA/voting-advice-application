<!--
@component Functional component used to block user navigation with a native question. Something that ends the page's state without navigating first, the logout modal, finds the same guard through `navigationGuards` and asks nothing. While `holdNavigationWhile` holds navigations, during a sign-out, the guard asks nothing and does not stop the tab from closing.

### Properties

- `active`: Whether the navigation should be prevented or not. This can also be callback to cater for changes that would required re-rendering the component.
- `onCancel`: A callback function that is called when the navigation is about to be cancelled, or when the user chose to stay in the logout modal.
- `onConfirm`: A callback function that is called when the navigation is about to be confirmed, or after the sign-out that an answer to the logout modal led to.

### Usage
```tsx
<PreventNavigation active={() => hasUnsaved} onConfirm={resetAnswers} />
```
-->

<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { beforeNavigate } from '$app/navigation';
  import { getComponentContext } from '$lib/contexts/component';
  import type { PreventNavigationProps } from './PreventNavigation.type';

  let { active, onCancel, onConfirm }: PreventNavigationProps = $props();

  const { t } = getComponentContext();

  function handleBeforeUnload(e: BeforeUnloadEvent) {
    if (active === true || (typeof active === 'function' && active())) e.preventDefault();
  }

  beforeNavigate((e) => {
    if (!(active === true || (typeof active === 'function' && active()))) return;
    if (window.confirm(t('components.preventNavigation.unsavedChanges'))) {
      onConfirm?.();
    } else {
      onCancel?.();
      e.cancel();
    }
  });

  // prevent navigation on mount (browser-only; onMount itself doesn't fire on the server)
  onMount(() => {
    addEventListener('beforeunload', handleBeforeUnload);
  });

  // remove event handler on unmount (onDestroy fires on both server and client; guard the browser-only API so SSR teardown of this component doesn't throw ReferenceError)
  onDestroy(() => {
    if (browser) removeEventListener('beforeunload', handleBeforeUnload);
  });
</script>
