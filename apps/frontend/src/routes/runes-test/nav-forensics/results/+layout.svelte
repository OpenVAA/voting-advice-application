<!--
  Spike 013 — Results parent layout
  Sits ABOVE [[electionTab]] so we can compare: results crosses into
  /questions/* via a SHARED outer layout but does NOT share the questions
  layout. So the questions layout SHOULD destroy on Q→Results.
-->
<script lang="ts">
  import { trackMount } from '../mountLedger.svelte';
  let { children } = $props();
  const ledger = trackMount('ResultsParentLayout');
</script>

<div class="results-parent" data-mount-id={ledger.instanceId}>
  <div class="results-chrome">Results parent layout (would carry results-specific chrome)</div>
  {@render children?.()}
</div>

<style>
  .results-parent {
    border: 2px dashed #f97316;
    padding: 0.8rem;
  }
  .results-chrome {
    background: #ffedd5;
    padding: 0.4rem;
    margin-bottom: 0.8rem;
    border-radius: 4px;
    color: #9a3412;
    font-size: 0.85rem;
  }
</style>
