<!--
  SPIKE 008 — Sub-route layout: initialize BOTH appSettings variants
  side-by-side. Each variant uses its own Symbol-keyed context so they
  coexist without interference.
-->
<script lang="ts">
  import { initAppSettingsVariantA } from './appSettingsVariantA.svelte';
  import { initAppSettingsVariantB } from './appSettingsVariantB.svelte';

  let { children } = $props();

  initAppSettingsVariantA();
  initAppSettingsVariantB();
</script>

{@render children()}
