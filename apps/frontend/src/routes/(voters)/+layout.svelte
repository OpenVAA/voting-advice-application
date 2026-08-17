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

  // WR-04 (see phase 86.3 review): popupQueue is a stable instance reference per
  // CLAUDE.md "Context Destructuring Rule " — popupStore returns an object
  // literal `{ push, shift, subscribe }` (popupStore.svelte.ts:23) attached as
  // a plain context property (appContext.svelte.ts:226), NOT a $state/$derived
  // getter. The `push`/`shift`/`subscribe` methods are bound function
  // references; destructuring captures the instance once at component init
  // and subsequent `popupQueue.push(...)` calls correctly mutate the live
  // queue. DO NOT swap popupQueue for a $derived/$state-based collection (or
  // a getter on the context object) without migrating consumers to
  // `ctx.popupQueue.push(...)` per the destructuring rule.
  // appSettings is a reactive accessor (see phase 113 flatten) — read via
  // `ctx.appSettings`, never destructure (the alias below tracks it).
  const ctx = initVoterContext();
  const { appType, popupQueue, userPreferences, t } = ctx;
  const appSettings = $derived(ctx.appSettings);
  appType.set('voter');

  ////////////////////////////////////////////////////////////////////
  // Layout
  ////////////////////////////////////////////////////////////////////

  const { navigation, useTopBar } = getLayoutContext();

  // see phase 86.3-01 wave A fix (cells #1 + #2): the top-bar overlay must
  // be reactive on appSettings so runtime overrides via
  // mergeAppSettings(page.data.appSettingsData) (appContext.svelte.ts:93-100)
  // propagate to the header Banner. Mirrors the canonical $effect pattern at
  // appContext.svelte.ts:93-100.
  //
  // (see phase 95): migrated off the StackedState revert/push-baseline
  // pattern to the token-keyed settingsOverlay registry. `useTopBar(...)` is
  // `$effect(() => topBar.push(overlay))` — a NESTED effect. When this OUTER
  // $effect re-runs on an appSettings change, Svelte tears down the nested
  // `use()` effect first (its cleanup reverts the prior overlay) and then
  // re-creates it (pushing the fresh overlay). This is structurally robust to
  // out-of-order child mount/unmount: each overlay is token-keyed, so a child
  // consumer's overlay is never silently erased by this parent re-run (the
  // WR-02 interleave hazard the index-based stack carried is gone). No
  // `untrack` is required here — the push/revert write-after-read is already
  // untrack-guarded inside settingsOverlay (SettingsOverlay.svelte.ts).
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

  // see phase 86.3-01 cell #3 (notifications.voterApp) REVERTED 2026-05-20 to the
  // pre-86.3 onMount-only queueing semantic. The reactive `$effect` rewrite
  // surfaced an unintended interaction with test-infrastructure conventions:
  // multiple e2e specs leave `notifications.voterApp.show: true` in their
  // afterAll (e.g. voter-popup-hydration.spec.ts:70 defaultPopupSettings),
  // which the prior onMount-only queue-then-dismiss flow tolerated but a
  // reactive $effect re-queues on every page mount — blocking the
  // answeredVoterPage fixture from advancing past the intro page in any
  // downstream voter spec. Cells #1 + #2 (header.showFeedback / showHelp via
  // reactive topBar $effect above) remain reactive — those changed in app
  // settings UI and the topBar reactivity is the user-visible value.
  //
  // Cell #3 disposition is now REVERT-TO-ONMOUNT (downgraded from FIX-PASS),
  // matching the Phase 77 baseline. The DataConsentPopup branch (below) stays
  // in the same onMount per -01 small-fix constraint (CONTEXT).
  onMount(() => {
    if (!appSettings.access.voterApp) return;
    // Queue the voter-app notification popup (cell #3 — onMount one-shot).
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
