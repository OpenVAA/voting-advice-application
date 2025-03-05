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
{:else if $appSettings.dataAdapter.supportsAdminApp}
  <MaintenancePage
    title={$t('info.adminApp.notSupported.title')}
    content={$t('info.adminApp.notSupported.content')}
    emoji={$t('info.adminApp.notSupported.heroEmoji')} />
{:else if !$appSettings.access.adminApp}
  <MaintenancePage title={$t('maintenance.title')} content={$t('info.adminApp.notSupported.content')} />
{:else}
  <Layout {menuId} bind:isDrawerOpen>
    <nav class="flex flex-col gap-4 p-4" on:blur={navigation.close} id={menuId} hidden={!isDrawerOpen} slot="menu">
      <a href="/admin" class="hover:text-primary-600 flex items-center gap-2 text-gray-700">
        <span class="material-icons">home</span>
        <span>Start</span>
      </a>
      <a href="/admin/factor-analysis" class="hover:text-primary-600 flex items-center gap-2 text-gray-700">
        <span class="material-icons">analytics</span>
        <span>Factor analysis</span>
      </a>
    </nav>
    <slot />
  </Layout>
{/if}
