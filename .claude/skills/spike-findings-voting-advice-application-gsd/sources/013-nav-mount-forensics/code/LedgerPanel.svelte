<!--
  Spike 013 — Mount Ledger Panel

  Fixed-position panel showing live mount/destroy events. Sticky to the
  viewport so it stays visible across navigation inside the spike route tree.
-->
<script lang="ts">
  import { clearLedger, exportLedger, getLedger, summarizeLedger } from './mountLedger.svelte';

  const ledger = getLedger();
  const summary = $derived(summarizeLedger());

  let copyStatus = $state<'idle' | 'copied'>('idle');

  async function handleCopy(): Promise<void> {
    const json = JSON.stringify(exportLedger(), null, 2);
    await navigator.clipboard.writeText(json);
    copyStatus = 'copied';
    setTimeout(() => (copyStatus = 'idle'), 1500);
  }

  function fmt(ts: string): string {
    return ts.slice(11, 23);
  }
</script>

<div
  class="ledger-panel"
  data-testid="ledger-panel">
  <header>
    <strong>Mount Ledger</strong>
    <span class="muted">{summary.totalEvents} events</span>
    <button onclick={clearLedger}>Clear</button>
    <button onclick={handleCopy}>{copyStatus === 'copied' ? 'Copied!' : 'Copy JSON'}</button>
  </header>

  <section class="summary">
    <strong>Live instances</strong>
    {#each Object.entries(summary.liveByName) as [name, n] (name)}
      <div class="row">
        <code>{name}</code>
        <span class:warn={n !== 1}>{n}</span>
      </div>
    {/each}
  </section>

  <section class="events" data-testid="ledger-events">
    {#each ledger.events as e (e.instanceId + ':' + e.ts + ':' + e.event)}
      <div class="event {e.event}">
        <span class="ts">{fmt(e.ts)}</span>
        <span class="op">{e.event === 'mount' ? '▲ mount  ' : '▽ destroy'}</span>
        <code>{e.name}</code>
        <span class="iid">{e.instanceId}</span>
      </div>
    {/each}
  </section>
</div>

<style>
  .ledger-panel {
    position: fixed;
    right: 0.5rem;
    top: 0.5rem;
    bottom: 0.5rem;
    width: 22rem;
    background: rgba(20, 22, 24, 0.95);
    color: #e8e8e8;
    font: 11px/1.35 ui-monospace, monospace;
    border-radius: 6px;
    padding: 0.5rem;
    z-index: 9999;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  header {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding-bottom: 0.4rem;
    border-bottom: 1px solid #333;
  }
  header strong {
    flex: 1;
  }
  header button {
    background: #2a2d31;
    color: #e8e8e8;
    border: 1px solid #444;
    border-radius: 3px;
    padding: 2px 6px;
    cursor: pointer;
    font: inherit;
  }
  header button:hover {
    background: #3a3d41;
  }
  .muted {
    color: #888;
  }
  .summary {
    background: #1a1c1e;
    padding: 0.4rem;
    border-radius: 4px;
    max-height: 8rem;
    overflow-y: auto;
  }
  .summary strong {
    display: block;
    color: #9ad;
    margin-bottom: 0.2rem;
  }
  .row {
    display: flex;
    justify-content: space-between;
  }
  .row .warn {
    color: #fa6;
    font-weight: bold;
  }
  .events {
    overflow-y: auto;
    flex: 1;
    background: #1a1c1e;
    padding: 0.3rem;
    border-radius: 4px;
  }
  .event {
    display: grid;
    grid-template-columns: 5.5rem 4.8rem 1fr auto;
    gap: 0.3rem;
    padding: 1px 0;
  }
  .event.mount .op {
    color: #6f9;
  }
  .event.destroy .op {
    color: #f96;
  }
  .ts {
    color: #788;
  }
  .iid {
    color: #557;
  }
  code {
    color: #cfe;
  }
</style>
