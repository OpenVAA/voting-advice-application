<!--
  Spike 013 — Questions index page
  Mirrors the questions intro page. A peer of [questionId], so navigating
  from /questions → /questions/q1 destroys this page + mounts [questionId].
-->
<script lang="ts">
  import { trackMount } from '../mountLedger.svelte';

  const ledger = trackMount('QuestionsIndex');
</script>

<div class="page" data-mount-id={ledger.instanceId}>
  <h2>Questions intro</h2>
  <p>Pick a question from the nav above. The page-level instance for this
    index gets destroyed when you click Q1.</p>
</div>

<style>
  .page {
    border: 2px dashed #16a34a;
    padding: 0.8rem;
  }
  .page h2 {
    margin-top: 0;
  }
</style>
