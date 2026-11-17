<!--
  Spike 013 — Outer layout
  Mimics the production "voters" + "located" layer chain — single layout
  here, but instruments the chrome that the production root + voters
  layouts produce (Header + nav placeholder + popup queue placeholder).
-->
<script lang="ts">
  import { trackMount } from './mountLedger.svelte';
  import LedgerPanel from './LedgerPanel.svelte';
  let { children } = $props();

  const ledger = trackMount('NavForensicsOuterLayout');
</script>

<div class="outer" data-mount-id={ledger.instanceId}>
  <header class="chrome-header">
    <strong>nav-forensics</strong>
    <nav>
      <a href="/runes-test/nav-forensics/questions">Questions</a>
      <a href="/runes-test/nav-forensics/questions/q1">Q1</a>
      <a href="/runes-test/nav-forensics/questions/q2">Q2</a>
      <a href="/runes-test/nav-forensics/questions/q3">Q3</a>
      <a href="/runes-test/nav-forensics/questions/category/civic">Cat: civic</a>
      <a href="/runes-test/nav-forensics/results">Results</a>
      <a href="/runes-test/nav-forensics/results/eu/candidates">Results eu/candidates</a>
      <a href="/runes-test/nav-forensics/results/eu/organizations">Results eu/organizations</a>
      <a href="/runes-test/nav-forensics/results/local/candidates">Results local/candidates</a>
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
    background: #fef3c7;
    padding: 0.6rem 1rem;
    border-bottom: 2px solid #f59e0b;
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
    color: #1e40af;
    text-decoration: underline;
  }
  main {
    padding: 1rem;
  }
</style>
