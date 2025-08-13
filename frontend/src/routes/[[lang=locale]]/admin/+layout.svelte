<!--@component
# Admin app main layout

- Inits AdminContext
- Sets top bar settings
- Renders the `Layout` component for the Admin App
-->

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { getAdminContext, initAdminContext } from '$lib/contexts/admin';
  import { getAppContext } from '$lib/contexts/app';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { AdminNav } from '$lib/dynamic-components/navigation/admin';
  import Layout from '../Layout.svelte';
  import MaintenancePage from '../MaintenancePage.svelte';

  ////////////////////////////////////////////////////////////////////
  // Init Admin Context
  ////////////////////////////////////////////////////////////////////

  const { appSettings, appType, t } = initAdminContext();
  $appType = 'admin';

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
  let isDrawerOpen: boolean;
</script>

{#if !$appSettings.dataAdapter.supportsAdminApp}
  <MaintenancePage
    title={$t('adminApp.notSupported.title')}
    content={$t('adminApp.notSupported.content')}
    emoji={$t('adminApp.notSupported.heroEmoji')} />
{:else if !$appSettings.access.adminApp}
  <MaintenancePage
    title={$t('adminApp.common.notAccessible.title')}
    content={$t('adminApp.common.notAccessible.content')} />
{:else}
  <Layout {menuId} bind:isDrawerOpen>
    <AdminNav on:keyboardFocusOut={navigation.close} id={menuId} hidden={!isDrawerOpen} slot="menu" />
    <slot />
  </Layout>
{/if}
