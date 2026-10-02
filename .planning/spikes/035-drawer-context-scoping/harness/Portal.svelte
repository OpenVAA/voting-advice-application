<script lang="ts">
  import type { Snippet } from 'svelte';
  import { log } from './keys.svelte';
  let { target, children }: { target: () => HTMLElement; children: Snippet } = $props();
  /** Move the element into the host slot; on teardown leave it there (dead snapshot) and report. */
  function portal(node: HTMLElement) {
    target().appendChild(node);
    log.push('portal attached');
    return () => { log.push(`portal cleanup: node still in slot=${node.parentElement?.id === 'host-slot'} text="${node.textContent?.trim()}"`); };
  }
</script>
<div hidden><div {@attach portal}>{@render children()}</div></div>
