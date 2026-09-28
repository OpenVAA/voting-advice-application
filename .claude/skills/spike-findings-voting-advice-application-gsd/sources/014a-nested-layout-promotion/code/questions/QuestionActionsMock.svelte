<!--
  Spike 014a — QuestionActions stand-in
  In the production tree this is rendered as the primaryActions snippet of
  MainContent (inside [questionId]/+page.svelte) — meaning it destroys + remounts
  on every Q. In this spike, we hoist it into the LAYOUT so it stays mounted.
-->
<script lang="ts">
  import { trackMount } from '../../nav-forensics/mountLedger.svelte';

  let {
    onPrevious,
    onNext,
    answered = false
  }: {
    onPrevious: () => void;
    onNext: () => void;
    answered?: boolean;
  } = $props();

  const ledger = trackMount('PromotedQuestionActions');

  // Local $state to demonstrate state preservation across Q→Q nav.
  // If the layout-owned actions persist, this counter survives nav.
  let clickCount = $state(0);
</script>

<div class="actions" data-mount-id={ledger.instanceId}>
  <button onclick={onPrevious}>← Previous</button>
  <span class="counter">Clicks survived this session: <strong>{clickCount}</strong></span>
  <button class="primary" disabled={!answered} onclick={() => { clickCount++; onNext(); }}>
    Next →
  </button>
</div>

<style>
  .actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  button {
    background: #fff;
    border: 1px solid #b45309;
    border-radius: 4px;
    padding: 0.3rem 0.8rem;
    cursor: pointer;
  }
  button.primary {
    background: #f59e0b;
    color: white;
    border-color: #f59e0b;
  }
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .counter {
    color: #92400e;
    font-size: 0.85rem;
    margin: 0 0.6rem;
  }
</style>
