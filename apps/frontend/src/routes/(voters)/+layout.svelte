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

  // WR-04 (Phase 86.3 review): popupQueue is a stable instance reference per
  // CLAUDE.md "Context Destructuring Rule §1" — popupStore() returns an object
  // literal `{ push, shift, subscribe }` (popupStore.svelte.ts:23) attached as
  // a plain context property (appContext.svelte.ts:226), NOT a $state/$derived
  // getter. The `push`/`shift`/`subscribe` methods are bound function
  // references; destructuring captures the instance once at component init
  // and subsequent `popupQueue.push(...)` calls correctly mutate the live
  // queue. DO NOT swap popupQueue for a $derived/$state-based collection (or
  // a getter on the context object) without migrating consumers to
  // `ctx.popupQueue.push(...)` per the destructuring rule.
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
  //
  // WR-02 (Phase 86.3 review): child-layout / +page.svelte interleave assumption.
  // The fixed `topBarBaseIdx` captured at component init means this $effect's
  // re-runs will `revert(topBarBaseIdx); push(next)` — DROPPING any overlays
  // child consumers may have pushed ABOVE topBarBaseIdx. Safety relies on the
  // SvelteKit lifecycle guarantee that child layouts / +page.svelte consumers
  // register their `onDestroy(() => topBarSettings.revert(indexTopBar))` via
  // `getLayoutContext` (see layoutContext.svelte.ts:169-181), so their overlays
  // are torn down BEFORE navigation triggers an $appSettings change (the only
  // current re-run trigger for this $effect). Future child consumers MUST NOT
  // push inside an $effect that responds to the same $appSettings change unless
  // they order themselves AFTER this $effect; otherwise their overlay will be
  // silently erased on the next parent re-run. See 86.3-REVIEW.md WR-02 for
  // the full analysis + a reactive-baseline alternative if the constraint
  // becomes load-bearing.
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
  //
  // WR-03 (Phase 86.3 review): TRADE-OFF — "fire-once per page load" semantic.
  // The flag is never reset, so operator-side changes to
  // $appSettings.notifications.voterApp content/title (or show=false→true
  // cycles) within a live voter session are NOT re-queued. To re-queue, the
  // voter must reload the page. This matches the pre-86.3 onMount semantic
  // (queue once at mount) and is the intentional contract. If "newest
  // notification wins" is needed, gate the flag on a content-identity key
  // (title + content hash) — see 86.3-REVIEW.md WR-03 for a code sketch.
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
