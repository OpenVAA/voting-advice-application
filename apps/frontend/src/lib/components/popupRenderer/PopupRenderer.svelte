<svelte:options runes />

<!--@component
Renders the first popup from the popup queue store.

Uses runes mode with `onMount` + store subscription to ensure reactive rendering
when the popup queue updates. This is needed because the root layout (Svelte 5
legacy mode) does not re-render template blocks when store-derived values change
asynchronously (e.g., from setTimeout callbacks).

### Usage
```svelte
<PopupRenderer {popupQueue} />
```
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import type { PopupStore } from '$lib/contexts/app/popup/popupStore.type';
  import type { PopupQueueItem } from '$lib/contexts/app/popup/popupComponent.type';

  let { popupQueue }: { popupQueue: PopupStore } = $props();

  let currentItem = $state<PopupQueueItem | undefined>(undefined);
  let version = $state(0);

  onMount(() => {
    return popupQueue.subscribe((value) => {
      currentItem = value;
      version++;
    });
  });
</script>

<!-- Reactive anchor: forces Svelte 5 to track $state changes from store subscription callbacks -->
<span hidden aria-hidden="true">{version}</span>
{#if currentItem}
  <svelte:component this={currentItem.component} onClose={() => popupQueue.shift()} {...(currentItem.props ?? {})} />
{/if}
