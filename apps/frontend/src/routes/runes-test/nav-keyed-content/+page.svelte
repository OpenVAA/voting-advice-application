<script lang="ts">
  import { trackMount } from '../nav-forensics/mountLedger.svelte';

  const ledger = trackMount('KeyedIndex');
</script>

<article data-mount-id={ledger.instanceId}>
  <h1>Spike 014b — single-page-url-keyed</h1>
  <p>Layout owns the entire render (mirrors production /results/[[electionTab]]/+layout.svelte pattern).
    Per-question body is wrapped in <code>&#123;#key questionId&#125;</code> so it forces remount on URL param change.
    Compare with the "no key" links (same URL minus the keying behavior) to see what changes.</p>
  <p>Open Q1 → Q2 → Q3 and watch the ledger.</p>
</article>

<style>
  article { max-width: 50rem; line-height: 1.5; }
</style>
