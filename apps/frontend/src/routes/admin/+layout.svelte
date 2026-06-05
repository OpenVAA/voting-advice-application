<!--@component
# Admin app main layout

- Inits AdminContext
- Sets top bar settings
- Renders the `Layout` component for the Admin App
-->

<script lang="ts">
  import { initAdminContext } from '$lib/contexts/admin';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { AdminNav } from '$lib/dynamic-components/navigation/admin';
  import Layout from '../Layout.svelte';
  import MaintenancePage from '../MaintenancePage.svelte';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();

  ////////////////////////////////////////////////////////////////////
  // Init Admin Context
  ////////////////////////////////////////////////////////////////////

  // `appSettings` / `appType` are rune handles from AdminContext (inherited from
  // AppContext); read `.current` directly (no store bridge). `appType.set(...)`
  // is unchanged — the handle exposes `.set`.
  const { appSettings, appType, t } = initAdminContext();
  appType.set('admin');

  ////////////////////////////////////////////////////////////////////
  // Layout and top bar
  ////////////////////////////////////////////////////////////////////

  const { navigation, topBarSettings } = getLayoutContext();
  topBarSettings.use({
    actions: {
      logout: 'show'
    }
  });

  const menuId = 'admin-app-menu';
  let isDrawerOpen = $state(false);
</script>

{#if !appSettings.current.dataAdapter.supportsAdminApp}
  <MaintenancePage
    title={t('adminApp.notSupported.title')}
    content={t('adminApp.notSupported.content')}
    emoji={t('adminApp.notSupported.heroEmoji')} />
{:else if !appSettings.current.access.adminApp}
  <MaintenancePage
    title={t('adminApp.common.notAccessible.title')}
    content={t('adminApp.common.notAccessible.content')} />
{:else}
  <Layout {menuId} bind:isDrawerOpen>
    {#snippet menu()}
      <AdminNav onKeyboardFocusOut={() => navigation.close?.()} id={menuId} hidden={!isDrawerOpen} />
    {/snippet}
    {@render children?.()}
  </Layout>
{/if}
