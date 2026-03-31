<!--@component
# Admin app main layout

- Inits AdminContext
- Sets top bar settings
- Renders the `Layout` component for the Admin App
-->

<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { Snippet } from 'svelte';
  import { fromStore } from 'svelte/store';
  import { initAdminContext } from '$lib/contexts/admin';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { AdminNav } from '$lib/dynamic-components/navigation/admin';
  import Layout from '../Layout.svelte';
  import MaintenancePage from '../MaintenancePage.svelte';

  let { children }: { children: Snippet } = $props();

  ////////////////////////////////////////////////////////////////////
  // Init Admin Context
  ////////////////////////////////////////////////////////////////////

  const { appSettings, appType, t } = initAdminContext();
  const appSettingsState = fromStore(appSettings);
  appType.set('admin');

  ////////////////////////////////////////////////////////////////////
  // Layout and top bar
  ////////////////////////////////////////////////////////////////////

  const { navigation, topBarSettings } = getLayoutContext(onDestroy);
  topBarSettings.push({
    actions: {
      logout: 'show'
    }
  });

  const menuId = 'admin-app-menu';
  let isDrawerOpen = $state(false);
</script>

{#if !appSettingsState.current.dataAdapter.supportsAdminApp}
  <MaintenancePage
    title={t('adminApp.notSupported.title')}
    content={t('adminApp.notSupported.content')}
    emoji={t('adminApp.notSupported.heroEmoji')} />
{:else if !appSettingsState.current.access.adminApp}
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
