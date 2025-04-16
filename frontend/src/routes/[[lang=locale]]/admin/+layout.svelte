<!--@component
# Admin app main layout

- Inits AdminContext
- Sets top bar settings
- Renders the `Layout` component for the Admin App
-->

<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { getAppContext } from '$lib/contexts/app';
  import { getLayoutContext } from '$lib/contexts/layout';
  import Layout from '../Layout.svelte';
  import MaintenancePage from '../MaintenancePage.svelte';
  import { initAdminContext } from '$lib/contexts/admin';
  import { Loading } from '$lib/components/loading';
  import { AdminNav } from '$lib/dynamic-components/navigation/admin';

  ////////////////////////////////////////////////////////////////////
  // Get app context
  ////////////////////////////////////////////////////////////////////

  const { appSettings, appType, t } = getAppContext();

  ////////////////////////////////////////////////////////////////////
  // Init Admin Context
  ////////////////////////////////////////////////////////////////////

  initAdminContext();
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

  ////////////////////////////////////////////////////////////////////
  // Data loading
  ////////////////////////////////////////////////////////////////////

  let ready = false;
  onMount(() => {
    // Wait for the next tick to ensure all data is loaded
    setTimeout(() => {
      ready = true;
    }, 0);
  });
</script>

{#if !ready}
  <Loading />
{:else if !$appSettings.dataAdapter.supportsAdminApp}
  <MaintenancePage
    title={$t('adminApp.notSupported.title')}
    content={$t('adminApp.notSupported.content')}
    emoji={$t('adminApp.notSupported.heroEmoji')} />
{:else if !$appSettings.access.adminApp}
  <MaintenancePage title={$t('maintenance.title')} content={$t('adminApp.notSupported.content')} />
{:else}
  <Layout {menuId} bind:isDrawerOpen>
    <AdminNav on:keyboardFocusOut={navigation.close} id={menuId} hidden={!isDrawerOpen} slot="menu" />
    <slot />
  </Layout>
{/if}
