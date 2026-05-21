<!--
  SPIKE 001+002 — temporary route.
  Initializes parallel rune-only contexts (appSettings, dataRoot) for the
  /runes-test demo page. Does NOT interfere with the production appContext /
  dataContext initialized by the root layout — different Symbol keys.
  Delete this entire directory tree when the spike concludes.
-->
<script lang="ts">
  import { initAppSettingsRuneContext } from './contexts/appSettingsRuneContext.svelte';
  import { initDataRootRuneContext } from './contexts/dataRootRuneContext.svelte';

  let { children } = $props();

  initAppSettingsRuneContext();
  initDataRootRuneContext();
</script>

{@render children()}
