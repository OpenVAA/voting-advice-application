<!--
  Spike 014b — Per-question body component
  Used both inside a {#key} block (forces remount) and outside (reactive
  update only) to demonstrate the trade-off.
-->
<script lang="ts">
  import { trackMount } from '../../nav-forensics/mountLedger.svelte';

  let { questionId, text }: { questionId: string; text: string } = $props();

  const ledger = trackMount('KeyedQuestionBody');

  // Page-scope $state to reveal remount-vs-update behavior.
  let scratchpad = $state('');
</script>

<div class="body" data-mount-id={ledger.instanceId}>
  <h2>Q: {text}</h2>
  <p>questionId: <code>{questionId}</code> • mount-id: <code>{ledger.instanceId}</code></p>
  <label>
    Scratchpad (write something, then nav to next Q):
    <input bind:value={scratchpad} placeholder="type here…" />
  </label>
  <p class="note">If this body is inside <code>&#123;#key&#125;</code>, scratchpad clears on nav.
    Otherwise it persists.</p>
</div>

<style>
  .body {
    border: 2px dashed #10b981;
    padding: 0.8rem;
    background: #ecfdf5;
  }
  h2 { margin: 0 0 0.4rem 0; color: #065f46; }
  input {
    padding: 0.3rem 0.5rem;
    border: 1px solid #10b981;
    border-radius: 4px;
    margin-left: 0.4rem;
    width: 15rem;
  }
  .note {
    color: #047857;
    font-size: 0.85rem;
    margin-top: 0.5rem;
  }
</style>
