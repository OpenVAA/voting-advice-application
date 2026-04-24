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
  import { onDestroy, untrack } from 'svelte';
  import { fromStore, get } from 'svelte/store';
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
  //
  // Validation is a pure `$derived` over the already-resolved loader data
  // (`+layout.ts` awaits every data field before returning — see the policy
  // comment at `+layout.ts` lines 7-12). No `Promise.all`, no `.then()`, no
  // microtask boundary between `$effect` and `$state` writes. This shape
  // removes the Svelte 5 SSR+hydration reactivity race that stuck the
  // previous `$effect` + promise-chain pattern at <Loading /> on full page
  // loads. Ref: 60-RESEARCH §Pattern 1, D-01 + D-03 + D-05.
  const validity: { error: Error } | { appSettingsData: DPDataType['appSettings']; electionData: DPDataType['elections']; constituencyData: DPDataType['constituencies'] } = $derived.by(() => {
    if (!isValidResult(data.appSettingsData, { allowEmpty: true }))
      return { error: new Error('Error loading app settings data') };
    if (!isValidResult(data.appCustomizationData, { allowEmpty: true }))
      return { error: new Error('Error loading app customization data') };
    if (!isValidResult(data.electionData)) return { error: new Error('Error loading election data') };
    if (!isValidResult(data.constituencyData)) return { error: new Error('Error loading constituency data') };
    return {
      appSettingsData: data.appSettingsData as DPDataType['appSettings'],
      electionData: data.electionData as DPDataType['elections'],
      constituencyData: data.constituencyData as DPDataType['constituencies']
    };
  });

  const error = $derived('error' in validity ? validity.error : undefined);
  const ready = $derived(!('error' in validity));
  const underMaintenance = $derived(
    !('error' in validity) && (validity.appSettingsData.access?.underMaintenance ?? false)
  );

  // Side effect — applies resolved data to `$dataRoot`. Reads `$derived` validity;
  // NEVER calls `.then()` or `await`. Runs after the first `$derived` evaluation
  // on mount and re-runs on any `data` prop change (client-side navigation).
  // We don't do anything else with the data if it's valid, because the relevant
  // stores will pick it up from `$page.data`.
  //
  // IMPORTANT: access the DataRoot instance via `get(dataRootStore)` rather than
  // the `dataRoot.current` auto-subscription form. `dataRoot.current.update(() => provide*(...))`
  // inside a `$effect` creates an infinite reactive loop in Svelte 5: the
  // `fromStore()` bridge tracks `dataRoot.current` as a dependency, and
  // `DataRoot.update()` notifies subscribers (via the dataContext `version++`
  // $state) — retriggering the effect. `get()` reads the store without
  // establishing a reactive dependency. This mirrors the fix applied in Plan
  // 60-03 to the candidate `(protected)/+layout.svelte`.
  $effect(() => {
    if ('error' in validity) return;
    // Snapshot validity fields inside the effect's tracked scope, then apply
    // side-effects inside `untrack` to prevent the DataRoot subscriber
    // `version++` from retriggering this effect (Svelte 5
    // `effect_update_depth_exceeded`).
    const snapshot = {
      electionData: validity.electionData,
      constituencyData: validity.constituencyData
    };
    untrack(() => {
      const dr = get(dataRootStore);
      dr.update(() => {
        dr.provideElectionData(snapshot.electionData);
        dr.provideConstituencyData(snapshot.constituencyData);
      });
    });
  });

  // Error logging side-effect — fires once when `error` transitions from absent to present.
  $effect(() => {
    if (error) logDebugError(error.message);
  });

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
