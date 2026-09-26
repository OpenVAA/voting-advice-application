<script lang="ts">
  import { getAllContexts, getContext, setContext } from 'svelte';
  import Consumer from './Consumer.svelte';
  import { FILTER_KEY, VOTER_KEY, getTyped, host, log, setTyped } from './keys.svelte';
  let { mode }: { mode: 'none' | 'all' | 'named' | 'typed' } = $props();
  const all = getAllContexts();
  log.push(`opener getAllContexts size=${all.size} keys=${[...all.keys()].map(String).join(',')}`);
  // "named" carriers: the opener captures ONLY the contexts it knows its content needs.
  const voter = getContext(VOTER_KEY);
  const filter = getContext(FILTER_KEY);
  // svelte-ignore state_referenced_locally
  const m = mode;
  const carriers =
    m === 'named' ? [() => setContext(VOTER_KEY, voter), () => setContext(FILTER_KEY, filter)]
    : m === 'typed' ? (() => { const t = getTyped(); return [() => setTyped(t)]; })()
    : undefined;
  host.payload = { content, contexts: m === 'all' ? all : undefined, carriers };
</script>
{#snippet content()}<Consumer label="hosted" typed={m === 'typed'} />{/snippet}
