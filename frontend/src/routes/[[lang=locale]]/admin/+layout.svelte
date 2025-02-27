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
</script>

{#if !$appSettings.dataAdapter.supportsAdminApp}
  <MaintenancePage
    title={$t('adminApp.notSupported.title')}
    content={$t('adminApp.notSupported.content')}
    emoji={$t('adminApp.notSupported.heroEmoji')} />
{:else}
  <Layout {menuId} bind:isDrawerOpen>
    <nav
      class="flex flex-col gap-4 p-4"
      on:keyboardFocusOut={navigation.close}
      id={menuId}
      hidden={!isDrawerOpen}
      slot="menu">
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
