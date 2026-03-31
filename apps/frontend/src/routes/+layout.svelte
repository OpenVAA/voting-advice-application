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
  import '../app.css';
  import { staticSettings } from '@openvaa/app-shared';
  import { onDestroy } from 'svelte';
  import { fromStore } from 'svelte/store';
  import { afterNavigate, beforeNavigate, onNavigate } from '$app/navigation';
  import { updated } from '$app/state';
  import { isValidResult } from '$lib/api/utils/isValidResult';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import { Loading } from '$lib/components/loading';
  import { initAppContext } from '$lib/contexts/app';
  import { initAuthContext } from '$lib/contexts/auth';
  import { initComponentContext } from '$lib/contexts/component';
  import { initDataContext } from '$lib/contexts/data';
  import { initI18nContext } from '$lib/contexts/i18n';
  import { initLayoutContext } from '$lib/contexts/layout';
  import { PopupRenderer } from '$lib/components/popupRenderer';
  import { FeedbackModal } from '$lib/dynamic-components/feedback/modal';
  import { logDebugError } from '$lib/utils/logger';
  import MaintenancePage from './MaintenancePage.svelte';
  import type { Snippet } from 'svelte';
  import type { DPDataType } from '$lib/api/base/dataTypes';
  import type { LayoutData } from './$types';

  let { data, children }: { data: LayoutData; children: Snippet } = $props();

  ////////////////////////////////////////////////////////////////////
  // Initialize globally used contexts
  ////////////////////////////////////////////////////////////////////

  initI18nContext();
  initComponentContext();
  initDataContext();
  const {
    appSettings: appSettingsStore,
    dataRoot: dataRootStore,
    openFeedbackModal: openFeedbackModalStore,
    popupQueue,
    sendTrackingEvent: sendTrackingEventStore,
    startPageview,
    submitAllEvents,
    t
  } = initAppContext();
  initLayoutContext();
  // TODO: Consider moving the candidate and admin apps to a (auth) folder with the AuthContext initialized there
  initAuthContext();

  // Bridge stores to runes reactivity
  const appSettings = fromStore(appSettingsStore);
  const dataRoot = fromStore(dataRootStore);
  const openFeedbackModal = fromStore(openFeedbackModalStore);
  const sendTrackingEvent = fromStore(sendTrackingEventStore);

  ////////////////////////////////////////////////////////////////////
  // Provide globally used data and check all loaded data
  ////////////////////////////////////////////////////////////////////

  // TODO[Svelte 5]: See if this and others like it can be handled in a centralized manner in the DataContext. I.e. by subscribing to individual parts of $page.data.
  let error = $state<Error | undefined>();
  let ready = $state(false);
  let underMaintenance = $state(false);

  $effect(() => {
    // Read data prop fields to establish dependency tracking
    const settingsP = data.appSettingsData;
    const customP = data.appCustomizationData;
    const electionP = data.electionData;
    const constituencyP = data.constituencyData;

    // Reset state before async work
    error = undefined;
    ready = false;
    underMaintenance = false;

    Promise.all([settingsP, customP, electionP, constituencyP]).then((results) => {
      error = update(results);
    });
  });

  $effect(() => {
    if (error) logDebugError(error.message);
  });

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
    dataRoot.current.update(() => {
      dataRoot.current.provideElectionData(electionData);
      dataRoot.current.provideConstituencyData(constituencyData);
    });
    // We don't do anything else with the data if they're okay, because the relevant stores will pick them up from $page.data
    ready = true;
  }

  ////////////////////////////////////////////////////////////////////
  // Tracking
  ////////////////////////////////////////////////////////////////////

  // Reference to UmamiAnalytics component to access its trackEvent export
  let umamiRef = $state<{ trackEvent?: typeof sendTrackingEvent.current }>();

  $effect(() => {
    if (umamiRef?.trackEvent) sendTrackingEventStore.set(umamiRef.trackEvent);
  });

  // Check if the app has been updated and if so, reload the app. The version is checked based on `pollInterval` in frontend/svelte.config.js
  beforeNavigate(({ willUnload, to }) => {
    if (updated.current && !willUnload && to?.url) location.href = to.url.href;
  });
  onNavigate(() => submitAllEvents());
  onDestroy(() => submitAllEvents());
  afterNavigate(({ from, to }) => {
    startPageview(to?.url?.href ?? '', from?.url?.href);
  });

  // Submit any possible event data if the window is closed or refreshed
  $effect(() => {
    if (!appSettings.current.analytics?.platform) return;
    const handler = () => {
      if (document.visibilityState === 'hidden') submitAllEvents();
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  });

  ////////////////////////////////////////////////////////////////////
  // Other global effects
  ////////////////////////////////////////////////////////////////////

  let feedbackModalRef = $state<{ openFeedback: () => void }>();

  $effect(() => {
    if (feedbackModalRef) openFeedbackModalStore.set(() => feedbackModalRef?.openFeedback());
  });

  // popupItem reactivity is handled by the PopupRenderer runes-mode component

  const fontUrl =
    staticSettings.font?.url ?? 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap';
</script>

<svelte:head>
  <title>{underMaintenance ? t('maintenance.title') : t('dynamic.appName')}</title>
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
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
  {/if}
  <link href={fontUrl} rel="stylesheet" />
</svelte:head>

{#if error}
  <ErrorMessage class="bg-base-300 h-dvh" />
{:else if !ready}
  <Loading class="bg-base-300 h-dvh" />
{:else if underMaintenance}
  <MaintenancePage />
{:else}
  {@render children?.()}

  <!-- Feedback modal -->
  <FeedbackModal bind:this={feedbackModalRef} />

  <!-- Handle analytics loading -->
  {#if appSettings.current.analytics?.platform}
    {#if appSettings.current.analytics?.platform?.name === 'umami'}
      {#await import('$lib/components/analytics/umami/UmamiAnalytics.svelte') then UmamiAnalytics}
        <UmamiAnalytics.default websiteId={appSettings.current.analytics.platform.code} bind:this={umamiRef} />
      {/await}
    {/if}
  {/if}
{/if}

<!-- Popup service: rendered by runes-mode component for Svelte 5 reactivity -->
<PopupRenderer {popupQueue} />
