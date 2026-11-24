<!--
  Spike 013 — Category intro page (sibling of [questionId])
  Mirrors apps/frontend/src/routes/(voters)/(located)/questions/category/[categoryId]/+page.svelte
-->
<script lang="ts">
  import { page } from '$app/state';
  import { trackMount } from '../../../mountLedger.svelte';

  const categoryId = $derived(page.params.categoryId);
  const ledger = trackMount('CategoryPage');
</script>

<div class="page" data-mount-id={ledger.instanceId}>
  <h2>Category: {categoryId}</h2>
  <p>This sits at a sibling path under <code>questions/</code>, so the
    <code>QuestionsLayout</code> stays mounted when navigating between
    <code>[questionId]</code> and <code>category/[categoryId]</code>.</p>
</div>

<style>
  .page {
    border: 2px dashed #ec4899;
    padding: 0.8rem;
  }
  .page h2 {
    margin-top: 0;
  }
</style>
