<!--
  SPIKE 006 — Mock route component. Simulates a SvelteKit route/layout that
  declaratively pushes layout overlays. When this component mounts, its
  overlays are added to the registries; when it destroys, they're auto-removed
  via $effect cleanup.

  No `onDestroy` import. No index bookkeeping. The component reads/writes
  layout settings the same way it would in production after the migration.
-->
<script lang="ts">
  import { getLayoutSettingsRune } from './layoutSettingsRune.svelte';
  import type { DeepPartial } from '@openvaa/app-shared';
  import type {
    NavigationSettings,
    PageStyles,
    TopBarSettings
  } from './layoutSettingsRune.svelte';

  let {
    label,
    topBar,
    pageStyles,
    navigation
  }: {
    label: string;
    topBar?: DeepPartial<TopBarSettings>;
    pageStyles?: DeepPartial<PageStyles>;
    navigation?: DeepPartial<NavigationSettings>;
  } = $props();

  const layout = getLayoutSettingsRune();

  // The whole point of the spike: ONE declarative call per overlay. No
  // onDestroy, no token to manage. Auto-cleans on component destroy.
  if (topBar) layout.useTopBar(topBar);
  if (pageStyles) layout.usePageStyles(pageStyles);
  if (navigation) layout.useNavigation(navigation);
</script>

<div class="border-l-4 border-blue-300 pl-3 py-1 my-1 text-xs">
  <strong>{label}</strong> pushed:
  {#if topBar}<code class="mx-1">topBar={JSON.stringify(topBar)}</code>{/if}
  {#if pageStyles}<code class="mx-1">pageStyles={JSON.stringify(pageStyles)}</code>{/if}
  {#if navigation}<code class="mx-1">navigation={JSON.stringify(navigation)}</code>{/if}
</div>
