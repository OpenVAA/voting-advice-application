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
  import type { Snippet } from 'svelte';

  ////////////////////////////////////////////////////////////////////
  // Init Voter Context
  ////////////////////////////////////////////////////////////////////

  const { appSettings, appType, popupQueue, userPreferences, t } = initVoterContext();
  $appType = 'voter';

  ////////////////////////////////////////////////////////////////////
  // Layout
  ////////////////////////////////////////////////////////////////////

  const { navigation, topBarSettings } = getLayoutContext(onDestroy);

  // Phase 86.3-01 SETTINGS-01 wave A fix (cells #1 + #2): topBarSettings.push must
  // be reactive on $appSettings so runtime overrides via
  // mergeAppSettings(page.data.appSettingsData) (appContext.svelte.ts:93-100)
  // propagate to the header Banner. Mirrors the canonical $effect pattern at
  // appContext.svelte.ts:93-100. Pitfall 1 guard: each $effect re-run reverts
  // to a captured baseline before pushing — prevents infinite stack growth
  // (StackedState.push/revert API at StackedState.svelte.ts:40-56).
  const topBarBaseIdx = topBarSettings.getLength() - 1;
  $effect(() => {
    const next = {
      actions: {
        feedback: $appSettings.header.showFeedback ? ('show' as const) : ('hide' as const),
        help: $appSettings.header.showHelp ? ('show' as const) : ('hide' as const)
      }
    };
    topBarSettings.revert(topBarBaseIdx);
    topBarSettings.push(next);
  });

  ////////////////////////////////////////////////////////////////////
  // Popup management
  ////////////////////////////////////////////////////////////////////

  // Phase 86.3-01 SETTINGS-01 wave A fix (cell #3): the Voter App notification
  // queueing must be reactive on $appSettings so the post-overlay runtime
  // value of $appSettings.notifications.voterApp is observed AFTER the
  // appContext $effect (appContext.svelte.ts:93-100) merges
  // page.data.appSettingsData. Pitfall 2 guard: notificationQueued is a
  // fire-once flag so the popup is queued exactly ONCE when the setting
  // first reads truthy (would otherwise re-queue on every $appSettings
  // change). The dataConsent popup branch stays in onMount per Plan 86.3-01
  // small-fix constraint (CONTEXT D-10).
  let notificationQueued = $state(false);
  $effect(() => {
    if (!$appSettings.access.voterApp) return;
    if (!notificationQueued && $appSettings.notifications.voterApp?.show) {
      popupQueue.push({
        component: Notification,
        props: { data: $appSettings.notifications.voterApp }
      });
      notificationQueued = true;
    }
  });

  onMount(() => {
    if (!$appSettings.access.voterApp) return;
    // Ask for event tracking consent if we have no explicit answer
    if (
      $appSettings.analytics?.platform &&
      $appSettings.analytics?.trackEvents &&
      (!$userPreferences.dataCollection?.consent || $userPreferences.dataCollection?.consent === 'indetermined')
    )
      popupQueue.push({ component: DataConsentPopup });
  });

  const menuId = 'voter-app-menu';
  let { children }: { children: Snippet } = $props();
  let isDrawerOpen = $state(false);
</script>

{#if $appSettings.access.voterApp}
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
