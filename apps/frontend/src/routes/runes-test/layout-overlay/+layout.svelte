<!--
  SPIKE 006 — sub-route layout. Initializes the layoutSettingsRune context
  that descendant mock-route components will push overlays onto.
-->
<script lang="ts">
  import { initLayoutSettingsRune } from './layoutSettingsRune.svelte';

  let { children } = $props();
  initLayoutSettingsRune();
</script>

{@render children()}
