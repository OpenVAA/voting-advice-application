<!--
  Spike 014a — Question page (slim)

  Only renders the question-specific BODY. MainContent, hero, heading, and
  actions are all owned by the parent layout. The body is what would
  legitimately vary per question (e.g. extended info, comments, custom
  embeds for specific questions).
-->
<script lang="ts">
  import { page } from '$app/state';
  import { trackMount } from '../../../nav-forensics/mountLedger.svelte';

  const ledger = trackMount('PromotedQuestionPage');
  const questionId = $derived(page.params.questionId);

  // Local state — gets recreated on every Q→Q because the page IS still
  // remounted (only its rendered surface area shrank).
  let pageScopedCounter = $state(0);
</script>

<div class="body" data-mount-id={ledger.instanceId}>
  <p>Body slot for question <code>{questionId}</code>.</p>
  <p>This is what the page-level component now owns: just the per-question body.
    Everything else (chrome, title, actions) is in the layout and survives Q→Q.</p>
  <p>Page-local counter: <strong>{pageScopedCounter}</strong>
    <button onclick={() => pageScopedCounter++}>Increment</button></p>
  <p class="note">Increment, then navigate Q→Q. Counter resets — because the
    page IS remounted. But MainContent + hero + actions stay alive (see ledger).</p>
</div>

<style>
  .body {
    padding: 0.6rem;
    background: #fff;
    border: 1px dashed #16a34a;
  }
  button {
    background: #16a34a;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 0.2rem 0.6rem;
    cursor: pointer;
  }
  .note {
    color: #6b7280;
    font-size: 0.85rem;
  }
</style>
