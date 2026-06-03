<!--
  Spike 013 — Results entityTab page
  Same +page.svelte the user lands on when clicking an entityTab. In
  production this is empty; here we instrument it.
-->
<script lang="ts">
  import { page } from '$app/state';
  import { trackMount } from '../../../mountLedger.svelte';

  const ledger = trackMount('ResultsEntityTabPage');
  const entityTab = $derived(page.params.entityTab);
</script>

<div class="page" data-mount-id={ledger.instanceId}>
  Entity tab page for: <strong>{entityTab}</strong>
</div>

<style>
  .page {
    background: #f3f4f6;
    padding: 0.5rem;
    border-radius: 4px;
    color: #6b7280;
    font-size: 0.85rem;
    margin-top: 0.5rem;
  }
</style>
