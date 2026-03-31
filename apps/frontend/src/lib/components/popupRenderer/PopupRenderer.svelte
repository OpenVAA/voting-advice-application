<!--@component
Renders the first popup from the popup queue store.

### Usage
```svelte
<PopupRenderer {popupQueue} />
```
-->

<script lang="ts">
  import { fromStore } from 'svelte/store';
  import type { PopupStore } from '$lib/contexts/app/popup/popupStore.type';

  let { popupQueue }: { popupQueue: PopupStore } = $props();

  const queueState = fromStore(popupQueue);
  let currentItem = $derived(queueState.current);
</script>

{#if currentItem}
  {@const item = currentItem}
  <svelte:component this={item.component} {...item.props ?? {}} onClose={() => { item.onClose?.(); popupQueue.shift(); }} />
{/if}
