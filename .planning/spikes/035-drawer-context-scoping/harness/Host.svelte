<script lang="ts">
  import Bridge from './Bridge.svelte';
  import { host } from './keys.svelte';
  let { bridge }: { bridge: boolean } = $props();
</script>
<div id="host">
  <div id="host-slot"></div>
  {#if host.payload}
    {#if bridge}
      {#key host.payload}
        <Bridge contexts={host.payload.contexts} carriers={host.payload.carriers}>{@render host.payload.content()}</Bridge>
      {/key}
    {:else}
      {@render host.payload.content()}
    {/if}
  {/if}
</div>
