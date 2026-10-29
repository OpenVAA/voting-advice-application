<script lang="ts">
  import { trackMount } from '../../../nav-forensics/mountLedger.svelte';
  const ledger = trackMount('A11yLeaf');
</script>

<span data-mount-id={ledger.instanceId} style="display:none"></span>
