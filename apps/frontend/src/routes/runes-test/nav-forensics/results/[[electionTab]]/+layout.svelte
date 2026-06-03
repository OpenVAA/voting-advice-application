<!--
  Spike 013 — Results electionTab layout
  Mirrors apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte
  — production renders entity tabs + list HERE and uses
  {#key activeElectionId:activeEntityType} to force-remount the inner block.
-->
<script lang="ts">
  import { page } from '$app/state';
  import KeyedInner from './KeyedInner.svelte';
  import { trackMount } from '../../mountLedger.svelte';

  let { children } = $props();
  const ledger = trackMount('ResultsElectionLayout');

  const electionTab = $derived(page.params.electionTab ?? '(none)');
  const entityTab = $derived(page.params.entityTab ?? '(none)');
</script>

<div class="results-election" data-mount-id={ledger.instanceId}>
  <div class="info">
    electionTab=<strong>{electionTab}</strong>, entityTab=<strong>{entityTab}</strong>
  </div>

  <div class="tabs">
    <a href="/runes-test/nav-forensics/results/{electionTab}/candidates">candidates</a>
    <a href="/runes-test/nav-forensics/results/{electionTab}/organizations">organizations</a>
    <a href="/runes-test/nav-forensics/results/{electionTab}/alliances">alliances</a>
  </div>

  {#key `${electionTab}:${entityTab}`}
    <KeyedInner {electionTab} {entityTab} />
  {/key}

  {@render children?.()}
</div>

<style>
  .results-election {
    border: 2px dashed #2563eb;
    padding: 0.8rem;
    margin-top: 0.8rem;
  }
  .info {
    background: #dbeafe;
    padding: 0.3rem 0.6rem;
    margin-bottom: 0.6rem;
    border-radius: 4px;
    color: #1e3a8a;
    font-size: 0.85rem;
  }
  .tabs {
    margin-bottom: 0.6rem;
  }
  .tabs a {
    margin-right: 0.6rem;
    color: #1d4ed8;
    text-decoration: underline;
  }
</style>
