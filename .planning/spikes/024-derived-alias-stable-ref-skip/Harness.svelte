<script lang="ts">
  import type { SpikeCtx } from './ctx.svelte';

  let { ctx }: { ctx: SpikeCtx } = $props();

  // ── Case 1: stable-ref + #version (models dataRoot) ──────────────────────
  // Consumer A — INTERMEDIATE ALIAS: `const X = $derived(ctx.X)`, then a
  // downstream $derived reads through the alias (the OLD elections-page shape).
  const dataRootAlias = $derived(ctx.dataRoot);
  const case1Alias = $derived.by(() => dataRootAlias.elections.join(','));
  // Consumer B — DIRECT read inside the thunk (the operator's fix shape).
  const case1Direct = $derived.by(() => ctx.dataRoot.elections.join(','));

  // ── Case 2: reference-replaced object (models appSettings) ───────────────
  const settingsAlias = $derived(ctx.appSettings);
  const case2Alias = $derived.by(() => settingsAlias.name);
  const case2Direct = $derived.by(() => ctx.appSettings.name);

  // ── Case 3: scalar (models locale) ───────────────────────────────────────
  const localeAlias = $derived(ctx.locale);
  const case3Alias = $derived.by(() => localeAlias);
  const case3Direct = $derived.by(() => ctx.locale);

  // ── Case 4: value-replacing array (models selectedElections) ─────────────
  const selectedAlias = $derived(ctx.selectedElections);
  const case4Alias = $derived.by(() => selectedAlias.join(','));
  const case4Direct = $derived.by(() => ctx.selectedElections.join(','));
</script>

<span data-testid="case1-alias">{case1Alias}</span>
<span data-testid="case1-direct">{case1Direct}</span>
<span data-testid="case2-alias">{case2Alias}</span>
<span data-testid="case2-direct">{case2Direct}</span>
<span data-testid="case3-alias">{case3Alias}</span>
<span data-testid="case3-direct">{case3Direct}</span>
<span data-testid="case4-alias">{case4Alias}</span>
<span data-testid="case4-direct">{case4Direct}</span>
