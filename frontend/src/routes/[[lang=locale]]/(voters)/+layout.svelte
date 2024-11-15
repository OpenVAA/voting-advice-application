<script lang="ts">
  import { onDestroy } from 'svelte';
  import { afterNavigate, onNavigate } from '$app/navigation';
  import { DataConsentPopup } from '$lib/components/dataConsent/popup';
  import { FeedbackPopup } from '$lib/components/feedback/popup';
  import { NavItem } from '$lib/components/navigation';
  import { SurveyPopup } from '$lib/components/survey/popup';
  import { getLayoutContext } from '$lib/contexts/layout';
  import { t } from '$lib/i18n';
  import { settings, showFeedbackPopup, showSurveyPopup, userPreferences } from '$lib/legacy-stores';
  import { VoterNav } from '$lib/templates/page/parts';
  import { startPageview, submitAllEvents } from '$lib/utils/legacy-analytics/track';
  import { startEvent } from '$lib/utils/legacy-analytics/track';
  import Header from './Header.svelte';
  import type { BasicPageProps } from '$lib/templates/basicPage';

  export let drawerToggleId: BasicPageProps['drawerToggleId'] = 'pageDrawerToggle';
  export let mainId: BasicPageProps['mainId'] = 'mainContent';
  export let navId: BasicPageProps['navId'] = 'pageNav';
  export let drawerContentClass: BasicPageProps['drawerContentClass'] = undefined;

  let doShowFeedbackPopup = false;
  let doShowSurveyPopup = false;
  let screenWidth = 0;

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
      feedback: $settings.header.showFeedback ? 'show' : 'hide',
      help: $settings.header.showHelp ? 'show' : 'hide'
    }
  });
  navigation.close = closeDrawer;

  onNavigate(() => submitAllEvents());
  onDestroy(() => submitAllEvents());
  afterNavigate(({ from, to }) => {
    startPageview(to?.url?.href ?? '', from?.url?.href);
    if ($showFeedbackPopup) {
      setTimeout(() => (doShowFeedbackPopup = true), 225);
      $showFeedbackPopup = false;
    } else {
      doShowFeedbackPopup = false;
    }
    if ($showSurveyPopup) {
      setTimeout(() => (doShowSurveyPopup = true), 225);
      $showSurveyPopup = false;
    } else {
      doShowSurveyPopup = false;
    }
  });
</script>

<svelte:window bind:innerWidth={screenWidth} />

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
  <div class="drawer-content flex flex-col {drawerContentClass ?? ''}">
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
      class="h-full w-4/5 max-w-sm bg-base-100 {drawerOpen ? '' : 'hidden'}"
      id={navId}>
      <NavItem on:click={closeDrawer} icon="close" text={$t('common.closeMenu')} class="pt-16" id="drawerCloseButton" />
    </svelte:component>
  </div>
</div>

{#if doShowFeedbackPopup}
  <FeedbackPopup />
{/if}

{#if doShowSurveyPopup}
  <SurveyPopup />
{/if}

<!-- Handle analytics loading -->
{#if $settings.analytics?.platform}
  {#if $settings.analytics?.platform?.name === 'umami'}
    {#await import('$lib/components/analytics/umami/UmamiAnalytics.svelte') then UmamiAnalytics}
      <svelte:component this={UmamiAnalytics.default} />
    {/await}
  {/if}
  {#await import('svelte-visibility-change') then VisibilityChange}
    <!-- Submit any possible event data if the window is closed or refreshed -->
    <svelte:component this={VisibilityChange.default} on:hidden={() => submitAllEvents()} />
  {/await}
{/if}

<!-- Ask for event tracking consent if we have no explicit answer -->
{#if $settings.analytics?.platform && $settings.analytics?.trackEvents}
  {#if !$userPreferences.dataCollection?.consent || $userPreferences.dataCollection?.consent === 'indetermined'}
    <DataConsentPopup />
  {/if}
{/if}
