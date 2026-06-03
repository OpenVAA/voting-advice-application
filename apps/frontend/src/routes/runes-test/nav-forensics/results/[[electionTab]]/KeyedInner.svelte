<!--
  Spike 013 — Keyed inner block stand-in for EntityListWithControls.
  Used inside {#key `${electionTab}:${entityTab}`} so it remounts on every
  tuple change.
-->
<script lang="ts">
  import { trackMount } from '../../mountLedger.svelte';

  let { electionTab, entityTab }: { electionTab: string; entityTab: string } = $props();

  // Counter to demonstrate state loss across remounts. Note this is INSIDE
  // the {#key} block, so it resets on every (electionTab, entityTab) change.
  let counter = $state(0);
  const ledger = trackMount('KeyedEntityList');
</script>

<div class="keyed" data-mount-id={ledger.instanceId}>
  <div class="title">Keyed: {electionTab}:{entityTab}</div>
  <div>Counter: <strong>{counter}</strong></div>
  <button onclick={() => counter++}>Increment</button>
  <div class="muted">Switching tab resets this counter — proves the <code>{'{#key}'}</code> block remounts.</div>
</div>

<style>
  .keyed {
    background: #fce7f3;
    padding: 0.5rem;
    border-radius: 4px;
    color: #9d174d;
  }
  .title {
    font-weight: bold;
    margin-bottom: 0.3rem;
  }
  button {
    background: #ec4899;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0.2rem 0.6rem;
    margin-top: 0.3rem;
    cursor: pointer;
  }
  .muted {
    color: #6b7280;
    font-size: 0.75rem;
    margin-top: 0.3rem;
  }
</style>
