<!--
  Spike 013 — Questions layout
  Mirrors apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte.
-->
<script lang="ts">
  import { trackMount } from '../mountLedger.svelte';
  let { children } = $props();
  const ledger = trackMount('QuestionsLayout');
</script>

<div class="questions-layout" data-mount-id={ledger.instanceId}>
  <div class="progress">Progress bar (layout-owned — would persist across Q→Q)</div>
  {@render children?.()}
</div>

<style>
  .questions-layout {
    border: 2px dashed #6366f1;
    padding: 0.8rem;
    margin-bottom: 1rem;
  }
  .progress {
    background: #e0e7ff;
    padding: 0.4rem 0.6rem;
    margin-bottom: 0.8rem;
    border-radius: 4px;
    color: #4338ca;
    font-size: 0.85rem;
  }
</style>
