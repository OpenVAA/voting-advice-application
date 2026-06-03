<!--
  Spike 014b — Outer layout
-->
<script lang="ts">
  import LedgerPanel from '../nav-forensics/LedgerPanel.svelte';
  import { trackMount } from '../nav-forensics/mountLedger.svelte';

  let { children } = $props();
  const ledger = trackMount('KeyedOuter');
</script>

<div class="outer" data-mount-id={ledger.instanceId}>
  <header class="chrome-header">
    <strong>nav-keyed-content (014b)</strong>
    <nav>
      <a href="/runes-test/nav-keyed-content/questions/q1">Q1</a>
      <a href="/runes-test/nav-keyed-content/questions/q2">Q2</a>
      <a href="/runes-test/nav-keyed-content/questions/q3">Q3</a>
      <a href="/runes-test/nav-keyed-content/questions/q1?nokey=1">Q1 (no key)</a>
      <a href="/runes-test/nav-keyed-content/questions/q2?nokey=1">Q2 (no key)</a>
      <a href="/runes-test/nav-keyed-content/questions">Index</a>
    </nav>
  </header>
  <main>{@render children?.()}</main>
  <LedgerPanel />
</div>

<style>
  .outer {
    min-height: 100vh;
    padding-right: 23rem;
  }
  .chrome-header {
    background: #d1fae5;
    padding: 0.6rem 1rem;
    border-bottom: 2px solid #10b981;
  }
  .chrome-header strong {
    margin-right: 1rem;
  }
  .chrome-header nav {
    display: inline-flex;
    gap: 0.6rem;
    flex-wrap: wrap;
  }
  .chrome-header a {
    color: #065f46;
    text-decoration: underline;
  }
  main {
    padding: 1rem;
  }
</style>
