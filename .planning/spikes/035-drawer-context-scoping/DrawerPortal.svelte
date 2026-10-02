<!--
@component Renders its children in the opener's own component tree and moves the resulting element into the app-wide drawer host's content slot. The content therefore keeps the opener's contexts natively — nothing is re-provided.

Render it only while the drawer shows this opener's payload. On teardown the moved element is deliberately left in the slot: its effects are gone, but the DOM survives as a static snapshot for the host's out-animation, and the host empties the slot when the close finishes or when the next portal attaches.

### Usage

```tsx
{#if open}
  <DrawerPortal><EntityDetails {entity} /></DrawerPortal>
{/if}
```
-->

<script lang="ts">
  import { browser } from '$app/environment';
  import { drawerHost } from './drawerHostState.svelte';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();

  function portal(node: HTMLElement): void {
    // Tracked read: if the host's slot mounts after this opener, the attachment reruns and moves the node then.
    drawerHost.slot?.replaceChildren(node);
  }
</script>

{#if browser}
  <div hidden>
    <div class="min-h-full" {@attach portal}>
      {@render children()}
    </div>
  </div>
{/if}
