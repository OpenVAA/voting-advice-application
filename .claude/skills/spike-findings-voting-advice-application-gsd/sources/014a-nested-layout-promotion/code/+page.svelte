<!--
  Spike 014a — Index
-->
<script lang="ts">
  import { trackMount } from '../nav-forensics/mountLedger.svelte';
  const ledger = trackMount('PromotedIndex');
</script>

<article data-mount-id={ledger.instanceId}>
  <h1>Spike 014a — nested-layout-promotion</h1>
  <p>Pattern B: questions layout owns <code>MainContent</code> + hero + heading + actions; child page provides only the question body. Click Q1 → Q2 → Q3 and watch the ledger.</p>
  <p>For head-to-head comparison with spike 013, click "→ Forensics Q1" first (clear ledger), navigate Q1→Q2→Q3 there, then come back and run the same sequence here. Expectation: 014a captures MUCH less destroy/mount churn.</p>
</article>

<style>
  article { max-width: 50rem; line-height: 1.5; }
</style>
