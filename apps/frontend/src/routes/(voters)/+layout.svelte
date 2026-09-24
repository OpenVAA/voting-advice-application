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
  import { onMount } from 'svelte';
  import { Layout, MaintenancePage } from '$layouts/main';
  import { Notification } from '$lib/components/notification';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { initVoterContext } from '$lib/contexts/voter';
  import { DataConsentPopup } from '$lib/dynamic-components/dataConsent/popup';
  import { VoterNav } from '$lib/dynamic-components/navigation/voter/';
  import type { Snippet } from 'svelte';

  ////////////////////////////////////////////////////////////////////
  // Init Voter Context
  ////////////////////////////////////////////////////////////////////

  // appSettings is a reactive accessor — read via `ctx.appSettings`; destructuring it captures one value at init and stops updating.
  const ctx = initVoterContext();
  const { appType, popupQueue, userPreferences, t } = ctx;
  const appSettings = $derived(ctx.appSettings);
  appType.set('voter');

  ////////////////////////////////////////////////////////////////////
  // Layout
  ////////////////////////////////////////////////////////////////////

  const { navigation, useTopBar } = getLayoutContext();

  $effect(() => {
    // Reactive reads — these register the OUTER $effect's dependencies.
    const feedback = appSettings.header.showFeedback;
    const help = appSettings.header.showHelp;
    useTopBar({
      actions: {
        feedback: feedback ? ('show' as const) : ('hide' as const),
        help: help ? ('show' as const) : ('hide' as const)
      }
    });
  });

  ////////////////////////////////////////////////////////////////////
  // Popup management
  ////////////////////////////////////////////////////////////////////

  // Queued once on mount rather than reactively: a reactive queue re-pushes on every settings change, re-showing a dismissed popup.
  onMount(() => {
    if (!appSettings.access.voterApp) return;
    if (appSettings.notifications.voterApp?.show) {
      popupQueue.push({
        component: Notification,
        props: { data: appSettings.notifications.voterApp }
      });
    }
    // Ask for event tracking consent if we have no explicit answer
    if (
      appSettings.analytics?.platform &&
      appSettings.analytics?.trackEvents &&
      (!userPreferences.current.dataCollection?.consent ||
        userPreferences.current.dataCollection?.consent === 'indetermined')
    )
      popupQueue.push({ component: DataConsentPopup });
  });

  const menuId = 'voter-app-menu';
  let { children }: { children: Snippet } = $props();
  let isDrawerOpen = $state(false);
</script>

{#if appSettings.access.voterApp}
  <Layout {menuId} bind:isDrawerOpen>
    {#snippet menu()}
      <VoterNav onKeyboardFocusOut={() => navigation.close?.()} id={menuId} hidden={!isDrawerOpen} />
    {/snippet}
    {@render children?.()}
  </Layout>
{:else}
  <MaintenancePage
    title={t('dynamic.voterAppNotAccessible.title')}
    content={t('dynamic.voterAppNotAccessible.content')} />
{/if}
