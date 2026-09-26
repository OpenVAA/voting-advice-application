<script lang="ts">
  import { getContext, hasContext, onDestroy } from 'svelte';
  import { FILTER_KEY, VOTER_KEY, getTyped, log } from './keys.svelte';
  let { label = 'consumer', typed = false }: { label?: string; typed?: boolean } = $props();
  const voter = hasContext(VOTER_KEY) ? getContext<{ name: string }>(VOTER_KEY).name : 'MISSING';
  const filter = hasContext(FILTER_KEY) ? getContext<{ name: string }>(FILTER_KEY).name : 'MISSING';
  function readTyped(): string {
    try { return getTyped().label; } catch { return 'THREW'; }
  }
  // svelte-ignore state_referenced_locally
  const typedLabel = typed ? readTyped() : 'n/a';
  onDestroy(() => log.push(`${label} destroyed`));
</script>
<p data-testid={label}>voter={voter} filter={filter} typed={typedLabel}</p>
