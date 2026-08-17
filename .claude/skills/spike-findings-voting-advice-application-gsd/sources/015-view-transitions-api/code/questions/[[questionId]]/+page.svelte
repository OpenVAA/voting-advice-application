<script lang="ts">
  import { trackMount } from '../../../nav-forensics/mountLedger.svelte';
  const ledger = trackMount('TransitionsLeaf');
</script>

<span data-mount-id={ledger.instanceId} style="display:none"></span>
