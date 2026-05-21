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

  // Spike 001
  initAppSettingsRuneContext();
  // Spike 002
  initDataRootRuneContext();
  // Spikes 003 + 004 + 005 don't require a context (their stores are
  // constructed at consumer scope in +page.svelte). They use the rune-native
  // localStorage helper directly, which is the whole point — eliminating the
  // store/context indirection where it isn't structurally needed.
</script>

{@render children()}
