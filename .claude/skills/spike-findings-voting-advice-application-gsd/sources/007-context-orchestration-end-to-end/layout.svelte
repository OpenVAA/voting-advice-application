<!--
  SPIKE 007 — Sub-route layout.
  Re-uses the parent /runes-test layout (which initializes appSettings + dataRoot
  rune contexts) and adds the voterRuneContext orchestrator on top. This mirrors
  the production cascade `appContext → dataContext → voterContext`.
-->
<script lang="ts">
  import { initVoterRuneContext } from './voterRuneContext.svelte';

  let { children } = $props();

  initVoterRuneContext();
</script>

{@render children()}
