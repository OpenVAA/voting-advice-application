<!--
  Spike 014a — Outer layout (same shell as 013 for comparison parity)
-->
<script lang="ts">
  import LedgerPanel from '../nav-forensics/LedgerPanel.svelte';
  import { trackMount } from '../nav-forensics/mountLedger.svelte';

  let { children } = $props();
  const ledger = trackMount('PromotedOuter');
</script>

<div class="outer" data-mount-id={ledger.instanceId}>
  <header class="chrome-header">
    <strong>nav-promoted-layout (014a)</strong>
    <nav>
      <a href="/runes-test/nav-promoted-layout/questions/q1">Q1</a>
      <a href="/runes-test/nav-promoted-layout/questions/q2">Q2</a>
      <a href="/runes-test/nav-promoted-layout/questions/q3">Q3</a>
      <a href="/runes-test/nav-promoted-layout">Index</a>
      <a href="/runes-test/nav-forensics/questions/q1">→ Forensics Q1 (compare)</a>
    </nav>
  </header>

  <main>
    {@render children?.()}
  </main>

  <LedgerPanel />
</div>

<style>
  .outer {
    min-height: 100vh;
    padding-right: 23rem;
  }
  .chrome-header {
    background: #ddd6fe;
    padding: 0.6rem 1rem;
    border-bottom: 2px solid #8b5cf6;
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
    color: #5b21b6;
    text-decoration: underline;
  }
  main {
    padding: 1rem;
  }
</style>
