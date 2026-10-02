<script lang="ts">
  import { setContext, type Snippet } from 'svelte';
  let { entries, children }: { entries: Array<[unknown, unknown]>; children: Snippet } = $props();
  // svelte-ignore state_referenced_locally
  for (const [k, v] of entries) setContext(k, v);
</script>
{@render children()}
