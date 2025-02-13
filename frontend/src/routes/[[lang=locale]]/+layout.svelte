<!--@component

# App main layout

- Defines the outer layout for the voter and candidate apps, including the header and main content area.
- Provides the data used by both apps to the `dataRoot`, which are loaded by `+layout.ts`, and handles other global definitions.
- Handles opening popups.
- Loads the analytics service.

### Settings

- `analytics.platform`: Affects whether the analytics service is loaded.
- `analytics.trackEvents`: Affects whether the data consent popup is shown.
-->

<script lang="ts">
  import '../../app.css';
  import { staticSettings } from '@openvaa/app-shared';
  import { onDestroy, onMount } from 'svelte';
  import { afterNavigate, onNavigate } from '$app/navigation';
  import { isValidResult } from '$lib/api/utils/isValidResult';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { Loading } from '$lib/components/loading';
  import { initAppContext } from '$lib/contexts/app';
  import { initComponentContext } from '$lib/contexts/component';
  import { initDataContext } from '$lib/contexts/data/dataContext';
  import { initI18nContext } from '$lib/contexts/i18n';
  import { initLayoutContext } from '$lib/contexts/layout';
  import { DataConsentPopup } from '$lib/dynamic-components/dataConsent/popup';
  import { FeedbackModal } from '$lib/dynamic-components/feedback/modal';
  import { MaintenancePage } from '$lib/templates/maintenance';
  import { logDebugError } from '$lib/utils/logger';
  import type { DPDataType } from '$lib/api/base/dataTypes';
  import type { LayoutData } from './$types';

  export let data: LayoutData;

  ////////////////////////////////////////////////////////////////////
  // Constants
  ////////////////////////////////////////////////////////////////////

  const mainId = 'mainContent';

  ////////////////////////////////////////////////////////////////////
  // Initialize globally used contexts
  ////////////////////////////////////////////////////////////////////

  initI18nContext();
  initComponentContext();
  initDataContext();
  const {
    appSettings,
    openFeedbackModal,
    popupQueue,
    sendTrackingEvent,
    startPageview,
    submitAllEvents,
    t,
    userPreferences
  } = initAppContext();
  initLayoutContext();

  ////////////////////////////////////////////////////////////////////
  // Check appSettings and appCustomization
  ////////////////////////////////////////////////////////////////////

  let error: Error | undefined;
  let ready: boolean;
  let underMaintenance: boolean;
  $: {
    // If data is updated, we want to prevent loading the slot until the promises resolve
    error = undefined;
    ready = false;
    underMaintenance = false;
    Promise.all([data.appSettingsData, data.appCustomizationData]).then((data) => {
      error = update(data);
    });
  }
  $: if (error) logDebugError(error.message);

  /**
   * Handle the update inside a function.
   * @returns `Error` if the data is invalid, `undefined` otherwise.
   */
  function update([appSettingsData, appCustomizationData]: [
    DPDataType['appSettings'] | Error,
    DPDataType['appCustomization'] | Error
  ]): Error | undefined {
    if (!isValidResult(appSettingsData, { allowEmpty: true })) return new Error('Error loading app settings data');
    if (!isValidResult(appCustomizationData, { allowEmpty: true })) return new Error('Error app customization data');
    underMaintenance = appSettingsData.underMaintenance ?? false;

    ready = true;
  }

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

  ////////////////////////////////////////////////////////////////////
  // Other global effects
  ////////////////////////////////////////////////////////////////////

  const fontUrl =
    staticSettings.font?.url ?? 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap';
</script>

<svelte:head>
  <title>{underMaintenance ? $t('maintenance.title') : $t('dynamic.appName')}</title>
  <meta
    name="theme-color"
    content={staticSettings?.colors?.light?.['base-300'] ?? '#d1ebee'}
    media="(prefers-color-scheme: light)" />
  <meta
    name="theme-color"
    content={staticSettings?.colors?.dark?.['base-300'] ?? '#1f2324'}
    media="(prefers-color-scheme: dark)" />
  {#if fontUrl.indexOf('fonts.googleapis') !== -1}
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="true" />
  {/if}
  <link href={fontUrl} rel="stylesheet" />
</svelte:head>

{#if error}
  <ErrorMessage class="h-screen bg-base-300" />
{:else if !ready}
  <Loading class="h-screen bg-base-300" />
{:else if underMaintenance}
  <MaintenancePage />
{:else}
  <!-- Skip links for screen readers and keyboard users. We use tabindex="1" so that's it's available before any alerts injected by layouts. -->
  <!-- svelte-ignore a11y-positive-tabindex -->
  <a href="#{mainId}" tabindex="1" class="sr-only focus:not-sr-only">{$t('common.skipToMain')}</a>

  <slot />

  <!-- Feedback modal -->
  <FeedbackModal bind:openFeedback={$openFeedbackModal} />

  <!-- Popup service -->
  {#if $popupQueue}
    {#key $popupQueue}
      <svelte:component this={$popupQueue} onClose={popupQueue.shift} />
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
