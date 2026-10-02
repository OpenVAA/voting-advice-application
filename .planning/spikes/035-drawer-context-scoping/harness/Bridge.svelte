<script lang="ts">
  import { setContext, type Snippet } from 'svelte';
  let { contexts, carriers, children }: { contexts?: Map<unknown, unknown>; carriers?: Array<() => void>; children: Snippet } = $props();
  // svelte-ignore state_referenced_locally
  if (contexts) for (const [k, v] of contexts) setContext(k, v);
  // svelte-ignore state_referenced_locally
  if (carriers) for (const provide of carriers) provide();
</script>
{@render children()}
