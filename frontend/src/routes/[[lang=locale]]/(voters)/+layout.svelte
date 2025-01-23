<!--@component

# Voter app main layout

- Defines the outer layout for the voter app, including the header, navigation menu, and main content area.
- Provides the data used by the whole voter app to the `dataRoot`, which are loaded by `+layout.ts`, and handles other global definitions.
- Handles opening popups.
- Loads the analytics service.

### Settings

- `header.showHelp`: Whether the help button is shown in the header.
- `header.showFeedback`: Whether the feedback button is shown in the header.
- `analytics.platform`: Affects whether the analytics service is loaded.
- `analytics.trackEvents`: Affects whether the data consent popup is shown.
-->

<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { afterNavigate, onNavigate } from '$app/navigation';
  import { isValidResult } from '$lib/api/utils/isValidResult';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { Loading } from '$lib/components/loading';
  import { initAppContext } from '$lib/contexts/app';
  import { initDataContext } from '$lib/contexts/data/dataContext';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { initVoterContext } from '$lib/contexts/voter';
  import { DataConsentPopup } from '$lib/dynamic-components/dataConsent/popup';
  import { FeedbackModal } from '$lib/dynamic-components/feedback/modal';
  import { NavItem } from '$lib/dynamic-components/navigation';
  import { VoterNav } from '$lib/templates/page/parts';
  import { logDebugError } from '$lib/utils/logger';
  import Header from './Header.svelte';
  import type { DPDataType } from '$lib/api/base/dataTypes';

  export let data;

  ////////////////////////////////////////////////////////////////////
  // Constants
  ////////////////////////////////////////////////////////////////////

  const drawerToggleId = 'pageDrawerToggle';
  const mainId = 'mainContent';
  const navId = 'pageNav';

  ////////////////////////////////////////////////////////////////////
  // Initialize globally used contexts
  ////////////////////////////////////////////////////////////////////

  // TODO: Move these to the parent layout when Cand App is refactored
  initDataContext();
  const {
    appSettings,
    appType,
    dataRoot,
    openFeedbackModal,
    popupQueue,
    modalStack,
    sendTrackingEvent,
    startPageview,
    startEvent,
    submitAllEvents,
    t,
    userPreferences
  } = initAppContext();

  ////////////////////////////////////////////////////////////////////
  // Init Voter Context – NB! This should not be moved outside /(voter)
  ////////////////////////////////////////////////////////////////////

  initVoterContext();
  $appType = 'voter';

  ////////////////////////////////////////////////////////////////////
  // Provide globally used data and check all loaded data
  ////////////////////////////////////////////////////////////////////

  // TODO[Svelte 5]: See if this and others like it can be handled in a centralized manner in the DataContext. I.e. by subscribing to individual parts of $page.data.
  let error: Error | undefined;
  let ready: boolean;
  $: {
    // If data is updated, we want to prevent loading the slot until the promises resolve
    error = undefined;
    ready = false;
    Promise.all([data.electionData, data.constituencyData]).then((data) => {
      error = update(data);
    });
  }
  $: if (error) logDebugError(error.message);

  /**
   * Handle the update inside a function so that we don't track $dataRoot, which would result in an infinite loop.
   * @returns `Error` if the data is invalid, `undefined` otherwise.
   */
  function update([electionData, constituencyData]: [
    DPDataType['elections'] | Error,
    DPDataType['constituencies'] | Error
  ]): Error | undefined {
    if (!isValidResult(electionData)) return new Error('Error loading constituency data');
    if (!isValidResult(constituencyData)) return new Error('Error loading constituency data');
    $dataRoot.provideElectionData(electionData);
    $dataRoot.provideConstituencyData(constituencyData);
    ready = true;
  }

  ////////////////////////////////////////////////////////////////////
  // Layout and navigation menu management
  ////////////////////////////////////////////////////////////////////

  let drawerOpen = false;
  let drawerOpenElement: HTMLButtonElement | undefined;

  /**
   * Open the drawer. We also focus on the relevant element to make it easy
   * to toggle it back when using keyboard navigation.
   */
  function openDrawer() {
    drawerOpen = true;
    // We need a small timeout for drawerCloseButton to be focusable
    setTimeout(() => document.getElementById('drawerCloseButton')?.focus(), 50);
    startEvent('menu_open');
  }

  /**
   * Close the drawer. We also focus on the relevant element to make it easy
   * to toggle it back when using keyboard navigation.
   */
  function closeDrawer() {
    drawerOpen = false;
    drawerOpenElement?.focus();
  }

  /**
   * Init the context for layout changes.
   */
  const { pageStyles, topBarSettings, navigation } = getLayoutContext(onDestroy);
  topBarSettings.push({
    actions: {
      feedback: $appSettings.header.showFeedback ? 'show' : 'hide',
      help: $appSettings.header.showHelp ? 'show' : 'hide'
    }
  });
  navigation.close = closeDrawer;

  ////////////////////////////////////////////////////////////////////
  // Tracking
  ////////////////////////////////////////////////////////////////////

  onNavigate(() => submitAllEvents());
  onDestroy(() => submitAllEvents());
  afterNavigate(({ from, to }) => {
    startPageview(to?.url?.href ?? '', from?.url?.href);
  });

  ////////////////////////////////////////////////////////////////////
  // Popup management
  ////////////////////////////////////////////////////////////////////

  // Ask for event tracking consent if we have no explicit answer
  onMount(() => {
    if (
      $appSettings.analytics?.platform &&
      $appSettings.analytics?.trackEvents &&
      (!$userPreferences.dataCollection?.consent || $userPreferences.dataCollection?.consent === 'indetermined')
    ) {
      popupQueue.push(DataConsentPopup);
    }
  });

  // Stashed for use with [video]
  // let screenWidth = 0;
  // <svelte:window bind:innerWidth={screenWidth} />
</script>

{#if error}
  <ErrorMessage class="h-screen bg-base-300" />
{:else if !ready}
  <Loading class="h-screen bg-base-300" />
{:else}
  <!-- Skip links for screen readers and keyboard users. We use tabindex="1" so that's it's available before any alerts injected by layouts. -->
  <!-- svelte-ignore a11y-positive-tabindex -->
  <a href="#{mainId}" tabindex="1" class="sr-only focus:not-sr-only">{$t('common.skipToMain')}</a>

  <!-- Drawer container -->
  <div class="drawer {$pageStyles.drawer.background}">
    <!-- NB. The Wave ARIA checker will show an error for this, but the use of both the 
      non-hidden labels in aria-labelledby should be okay for screen readers. -->
    <input
      id={drawerToggleId}
      bind:checked={drawerOpen}
      type="checkbox"
      class="drawer-toggle"
      tabindex="-1"
      aria-hidden="true"
      aria-label={$t('common.openCloseMenu')} />

    <!-- Drawer content -->
    <div class="drawer-content flex flex-col">
      <Header {navId} {openDrawer} {drawerOpen} {drawerOpenElement} />
      <main id={mainId} class="flex flex-grow flex-col items-center gap-y-lg pb-safelgb pl-safelgl pr-safelgr pt-lg">
        <slot />
      </main>
    </div>

    <!-- Drawer side menu -->
    <div class="drawer-side z-10">
      <div on:click={closeDrawer} aria-hidden="true" class="drawer-overlay cursor-pointer" />
      <!-- Navigation contents -->
      <!-- this={$appType === 'candidate' ? CandidateNav : VoterNav} -->
      <svelte:component
        this={VoterNav}
        on:keyboardFocusOut={closeDrawer}
        class="min-h-full w-4/5 max-w-sm bg-base-100 {drawerOpen ? '' : 'hidden'}"
        id={navId}>
        <NavItem
          on:click={closeDrawer}
          icon="close"
          text={$t('common.closeMenu')}
          class="pt-16"
          id="drawerCloseButton" />
      </svelte:component>
    </div>
  </div>

  <!-- Feedback modal -->
  <FeedbackModal bind:openFeedback={$openFeedbackModal} />

  <!-- Popup service -->
  {#if $popupQueue}
    {#key $popupQueue}
      <svelte:component this={$popupQueue} onClose={popupQueue.shift} />
    {/key}
  {/if}

  <!-- Modal service -->
  {#if $modalStack}
    {#key $modalStack}
      <svelte:component this={$modalStack.component} onClose={modalStack.pop} {...$modalStack.props} />
    {/key}
  {/if}

  <!-- Handle analytics loading -->
  {#if $appSettings.analytics?.platform}
    {#if $appSettings.analytics?.platform?.name === 'umami'}
      {#await import('$lib/components/analytics/umami/UmamiAnalytics.svelte') then UmamiAnalytics}
        <svelte:component
          this={UmamiAnalytics.default}
          websiteId={$appSettings.analytics.platform.code}
          bind:trackEvent={$sendTrackingEvent} />
      {/await}
    {/if}
    {#await import('svelte-visibility-change') then VisibilityChange}
      <!-- Submit any possible event data if the window is closed or refreshed -->
      <svelte:component this={VisibilityChange.default} on:hidden={() => submitAllEvents()} />
    {/await}
  {/if}
{/if}
