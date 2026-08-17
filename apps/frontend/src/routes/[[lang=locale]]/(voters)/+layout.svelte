<!--@component

# Voter app main layout

- Inits VoterContext
- Sets top bar settings
- Render the `Layout` component for the Voter App
- Queues the possible Voter App notification
- Queues the data consent popup if necessary
- Shows a maintenance page if the Voter App is not accessible yet

### Settings

- `access.voterApp`: Whether to show the Voter App.
- `analytics.trackEvents`: Affects whether the data consent popup is shown.
- `header.showHelp`: Whether the help button is shown in the header.
- `header.showFeedback`: Whether the feedback button is shown in the header.
- `notifications.voterApp`: The possible notification popup to show.
-->

<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { Notification } from '$lib/components/notification';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { initVoterContext } from '$lib/contexts/voter';
  import { DataConsentPopup } from '$lib/dynamic-components/dataConsent/popup';
  import { VoterNav } from '$lib/dynamic-components/navigation/voter/';
  import Layout from '../Layout.svelte';
  import MaintenancePage from '../MaintenancePage.svelte';
  import type { PopupComponent } from '$lib/contexts/app/popup';

  ////////////////////////////////////////////////////////////////////
  // Init Voter Context
  ////////////////////////////////////////////////////////////////////

  const { appSettings, appType, popupQueue, userPreferences, t } = initVoterContext();
  $appType = 'voter';

  ////////////////////////////////////////////////////////////////////
  // Popup management
  ////////////////////////////////////////////////////////////////////

  onMount(() => {
    if (!$appSettings.access.voterApp) return;
    // Show possible notification
    if ($appSettings.notifications.voterApp?.show)
      popupQueue.push({
        component: Notification as unknown as PopupComponent,
        props: { data: $appSettings.notifications.voterApp }
      });
    // Ask for event tracking consent if we have no explicit answer
    if (
      $appSettings.analytics?.platform &&
      $appSettings.analytics?.trackEvents &&
      (!$userPreferences.dataCollection?.consent || $userPreferences.dataCollection?.consent === 'indetermined')
    )
      popupQueue.push({ component: DataConsentPopup });
  });

  ////////////////////////////////////////////////////////////////////
  // Layout
  ////////////////////////////////////////////////////////////////////

  const { navigation, topBarSettings } = getLayoutContext(onDestroy);
  topBarSettings.push({
    actions: {
      feedback: $appSettings.header.showFeedback ? 'show' : 'hide',
      help: $appSettings.header.showHelp ? 'show' : 'hide'
    }
  });

  const menuId = 'voter-app-menu';
  let isDrawerOpen: boolean;
</script>

{#if $appSettings.access.voterApp}
  <Layout {menuId} bind:isDrawerOpen>
    <VoterNav on:keyboardFocusOut={navigation.close} id={menuId} hidden={!isDrawerOpen} slot="menu" />
    <slot />
  </Layout>
{:else}
  <MaintenancePage
    title={$t('dynamic.voterAppNotAccessible.title')}
    content={$t('dynamic.voterAppNotAccessible.content')} />
{/if}
