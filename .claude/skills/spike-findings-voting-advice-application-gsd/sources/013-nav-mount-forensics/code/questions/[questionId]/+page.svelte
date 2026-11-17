<!--
  Spike 013 — Single question page
  Mirrors apps/frontend/src/routes/(voters)/(located)/questions/[questionId]/+page.svelte
  Each question id triggers a fresh +page.svelte instance — the symptom.
-->
<script lang="ts">
  import { page } from '$app/state';
  import { trackMount } from '../../mountLedger.svelte';

  const questionId = $derived(page.params.questionId);
  const ledger = trackMount(`QuestionPage`);

  // Local $state to demonstrate state loss across Q→Q nav.
  let localCounter = $state(0);
</script>

<div class="page" data-mount-id={ledger.instanceId}>
  <h2>Question: {questionId}</h2>
  <p>Page-level <code>$state</code> counter: <strong>{localCounter}</strong></p>
  <button onclick={() => localCounter++}>Increment</button>
  <p class="muted">
    Click increment, then navigate to another Q. The counter resets — because
    the entire <code>+page.svelte</code> instance was destroyed and a new one
    was instantiated. Look at the ledger panel.
  </p>
  <p>Mount id: <code>{ledger.instanceId}</code></p>
</div>

<style>
  .page {
    border: 2px dashed #16a34a;
    padding: 0.8rem;
  }
  .page h2 {
    margin-top: 0;
  }
  button {
    background: #16a34a;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0.3rem 0.8rem;
    cursor: pointer;
  }
  .muted {
    color: #666;
    font-size: 0.85rem;
  }
</style>
