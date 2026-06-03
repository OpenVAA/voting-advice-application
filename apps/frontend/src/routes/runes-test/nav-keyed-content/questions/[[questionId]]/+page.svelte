<!--
  Spike 014b — Empty +page.svelte (required by SvelteKit's leaf-route contract)
  All rendering lives in the parent +layout.svelte.
-->
<script lang="ts">
  import { trackMount } from '../../../nav-forensics/mountLedger.svelte';

  const ledger = trackMount('KeyedQuestionsLeafPage');
</script>

<span data-mount-id={ledger.instanceId} style="display:none"></span>
