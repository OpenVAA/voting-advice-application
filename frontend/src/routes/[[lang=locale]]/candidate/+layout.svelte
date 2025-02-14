<!--@component

# Candidate app main layout

- Inits CandidateContext
- Sets top bar settings
- Render the `Layout` component for the Candidate App
- Queues the possible Candidate App notification
- Shows a maintenance page if the Candidate App is not accessible yet or not supported

### Settings

- `access.candidateApp`: Whether to show the Candidate App.
-->

<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { Notification } from '$lib/components/notification';
  import { getAppContext } from '$lib/contexts/app';
  import { initCandidateContext } from '$lib/contexts/candidate';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { CandidateNav } from '$lib/dynamic-components/navigation/candidate';
  import Layout from '../Layout.svelte';
  import MaintenancePage from '../MaintenancePage.svelte';
  import type { PopupComponent } from '$lib/contexts/app/popup';

  ////////////////////////////////////////////////////////////////////
  // Get app context
  ////////////////////////////////////////////////////////////////////

  const { appSettings, appType, popupQueue, t } = getAppContext();

  ////////////////////////////////////////////////////////////////////
  // Init Candidate Context
  ////////////////////////////////////////////////////////////////////

  initCandidateContext();
  $appType = 'candidate';

 ////////////////////////////////////////////////////////////////////
  // Popup management
  ////////////////////////////////////////////////////////////////////

  onMount(() => {
    if (!$appSettings.access.candidateApp || !$appSettings.dataAdapter.supportsCandidateApp) return;
    // Show possible notification
    if ($appSettings.notifications.candidateApp?.show)
      popupQueue.push({ 
        component: Notification as unknown as PopupComponent, 
        props: { data: $appSettings.notifications.candidateApp }
      });
  });
  
  ////////////////////////////////////////////////////////////////////
  // Layout and top bar
  ////////////////////////////////////////////////////////////////////

  const { navigation, topBarSettings } = getLayoutContext(onDestroy);
  topBarSettings.push({
    actions: {
      logout: 'show'
    }
  });

  const menuId = 'candidate-app-menu';
  let isDrawerOpen: boolean;
</script>

{#if !$appSettings.dataAdapter.supportsCandidateApp}
  <MaintenancePage
    title={$t('candidateApp.notSupported.title')}
    content={$t('candidateApp.notSupported.content')}
    emoji={$t('candidateApp.notSupported.heroEmoji')} />
{:else if !$appSettings.access.candidateApp}
  <MaintenancePage
    title={$t('dynamic.candidateAppNotAccessible.title')}
    content={$t('dynamic.candidateAppNotAccessible.content')} />
{:else}
  <Layout {menuId} bind:isDrawerOpen>
    <CandidateNav on:keyboardFocusOut={navigation.close} id={menuId} hidden={!isDrawerOpen} slot="menu" />
    <slot />
  </Layout>
{/if}

