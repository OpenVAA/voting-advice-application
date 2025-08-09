<!--@component

# App main layout

- Defines the outer layout for the voter and candidate apps, including the header and main content area.
- Provides the data used by both apps to the `dataRoot`, which are loaded by `+layout.ts`, and handles other global definitions.
- Handles opening popups.
- Loads the analytics service.

### Settings

- `access.underMaintanance`: If `true`, the app will display a maintenance page instead of any content.
- `analytics.platform`: Affects whether the analytics service is loaded.
-->

<script lang="ts">
  import '../../app.css';
  import { staticSettings } from '@openvaa/app-shared';
  import { onDestroy } from 'svelte';
  import { afterNavigate, beforeNavigate, onNavigate } from '$app/navigation';
  import { updated } from '$app/stores';
  import { isValidResult } from '$lib/api/utils/isValidResult';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { Loading } from '$lib/components/loading';
  import { initAppContext } from '$lib/contexts/app';
  import { initComponentContext } from '$lib/contexts/component';
  import { initDataContext } from '$lib/contexts/data';
  import { initI18nContext } from '$lib/contexts/i18n';
  import { initLayoutContext } from '$lib/contexts/layout';
  import { FeedbackModal } from '$lib/dynamic-components/feedback/modal';
  import { logDebugError } from '$lib/utils/logger';
  import MaintenancePage from './MaintenancePage.svelte';
  import type { DPDataType } from '$lib/api/base/dataTypes';
  import type { LayoutData } from './$types';

  export let data: LayoutData;

  ////////////////////////////////////////////////////////////////////
  // Initialize globally used contexts
  ////////////////////////////////////////////////////////////////////

  initI18nContext();
  initComponentContext();
  initDataContext();
  const {
    appSettings,
    dataRoot,
    modalStack,
    openFeedbackModal,
    popupQueue,
    sendTrackingEvent,
    startPageview,
    submitAllEvents,
    t
  } = initAppContext();
  initLayoutContext();

  ////////////////////////////////////////////////////////////////////
  // Provide globally used data and check all loaded data
  ////////////////////////////////////////////////////////////////////

  // TODO[Svelte 5]: See if this and others like it can be handled in a centralized manner in the DataContext. I.e. by subscribing to individual parts of $page.data.
  let error: Error | undefined;
  let ready: boolean;
  let underMaintenance: boolean;
  $: {
    // If data is updated, we want to prevent loading the slot until the promises resolve
    error = undefined;
    ready = false;
    underMaintenance = false;
    Promise.all([data.appSettingsData, data.appCustomizationData, data.electionData, data.constituencyData]).then(
      (data) => {
        error = update(data);
      }
    );
  }
  $: if (error) logDebugError(error.message);

  /**
   * Handle the update inside a function.
   * @returns `Error` if the data is invalid, `undefined` otherwise.
   */
  function update([appSettingsData, appCustomizationData, electionData, constituencyData]: [
    DPDataType['appSettings'] | Error,
    DPDataType['appCustomization'] | Error,
    DPDataType['elections'] | Error,
    DPDataType['constituencies'] | Error
  ]): Error | undefined {
    if (!isValidResult(appSettingsData, { allowEmpty: true })) return new Error('Error loading app settings data');
    if (!isValidResult(appCustomizationData, { allowEmpty: true })) return new Error('Error app customization data');
    if (!isValidResult(electionData)) return new Error('Error loading constituency data');
    if (!isValidResult(constituencyData)) return new Error('Error loading constituency data');
    underMaintenance = appSettingsData.access?.underMaintenance ?? false;
    $dataRoot.update(() => {
      $dataRoot.provideElectionData(electionData);
      $dataRoot.provideConstituencyData(constituencyData);
    });
    // We don't do anything else with the data if they're okay, because the relevant stores will pick them up from $page.data
    ready = true;
  }

  ////////////////////////////////////////////////////////////////////
  // Tracking
  ////////////////////////////////////////////////////////////////////

  // Check if the app has been updated and if so, reload the app. The version is checked based on `pollInterval` in frontend/svelte.config.js
  beforeNavigate(({ willUnload, to }) => {
    if ($updated && !willUnload && to?.url) location.href = to.url.href;
  });
  onNavigate(() => submitAllEvents());
  onDestroy(() => submitAllEvents());
  afterNavigate(({ from, to }) => {
    startPageview(to?.url?.href ?? '', from?.url?.href);
  });

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
  <slot />

  <!-- Feedback modal -->
  <FeedbackModal bind:openFeedback={$openFeedbackModal} />

  <!-- Popup service -->
  {#if $popupQueue}
    {#key $popupQueue}
      <svelte:component this={$popupQueue.component} onClose={popupQueue.shift} {...$popupQueue.props} />
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
