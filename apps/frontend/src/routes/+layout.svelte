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
  import { FeedbackModal } from '$lib/dynamic-components/feedback/modal';
  import { logDebugError } from '$lib/utils/logger';
  import { shouldAnimate, startViewTransition } from '$lib/utils/viewTransition';
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
    appSettings,
    setDataRoot,
    openFeedbackModal,
    popupQueue,
    sendTrackingEvent,
    startPageview,
    submitAllEvents,
    t
  } = initAppContext();
  const layoutCtx = initLayoutContext();
  // TODO: Consider moving the candidate and admin apps to a (auth) folder with the AuthContext initialized there
  initAuthContext();

  // Localized route-announcer title (NAVA11Y-01 / CR-01). Read via property access on the context
  // object (NOT destructured) per the CLAUDE.md Context Destructuring Rule — `routeTitle.current`
  // is a reactive accessor backed by $state, registered by MainContent / SingleCardContent.
  const routeTitle = $derived(layoutCtx.routeTitle.current);

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
  // loads. Ref: 60-RESEARCH §Pattern 1.
  const validity:
    | { error: Error }
    | {
        appSettingsData: DPDataType['appSettings'];
        electionData: DPDataType['elections'];
        constituencyData: DPDataType['constituencies'];
      } = $derived.by(() => {
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

  // Side effect — applies resolved data to `dataRoot`. Reads `$derived` validity;
  // NEVER calls `.then()` or `await`. Runs after the first `$derived` evaluation
  // on mount and re-runs on any `data` prop change (client-side navigation).
  // We don't do anything else with the data if it's valid, because the relevant
  // stores will pick it up from `$page.data`.
  //
  // IMPORTANT: mutate the DataRoot via `setDataRoot(updater)` (the encapsulated
  // non-reactive write path on the rune-native DataContext class) rather than the
  // `dataRoot` reactive form. `dataRoot.update(() => provide*(...))`
  // inside a `$effect` creates an infinite reactive loop in Svelte 5: reading
  // `.current` takes a dependency on the dataContext `version` $state, and
  // `DataRoot.update()` notifies subscribers (bumping `version`) — retriggering the
  // effect. `setDataRoot` runs the mutation inside `untrack`, so this effect takes no
  // dependency on the version counter (see spike 017/022 read/write split — it replaces
  // the former non-reactive producer-read + hand-written `untrack` idiom).
  $effect(() => {
    if ('error' in validity) return;
    // Snapshot validity fields inside the effect's tracked scope (so the effect
    // re-runs when they change); the write itself is untracked inside setDataRoot.
    const snapshot = {
      electionData: validity.electionData,
      constituencyData: validity.constituencyData
    };
    setDataRoot((dr) => {
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

  // Reference to UmamiAnalytics component to access its trackEvent export.
  // `sendTrackingEvent` is the rune handle from AppContext; `.current` is read
  // here in value position only to type `trackEvent`.
  let umamiRef = $state<{ trackEvent?: typeof sendTrackingEvent.current }>();

  $effect(() => {
    if (umamiRef?.trackEvent) sendTrackingEvent.set(umamiRef.trackEvent);
  });

  // Check if the app has been updated and if so, reload the app. The version is checked based on `pollInterval` in frontend/svelte.config.js
  beforeNavigate(({ willUnload, to }) => {
    if (updated.current && !willUnload && to?.url) location.href = to.url.href;
  });
  // MERGE — analytics flush THEN View-Transitions coupling (VT-01). Single merged hook
  // guarantees flush ordering and avoids two-promise ambiguity (resolved Open Question O-2).
  onNavigate((navigation) => {
    submitAllEvents(); // preserve existing analytics flush
    // LANDMINE: read `navigation.to?.url` — NOT `page.url` (which is the SOURCE url during
    // onNavigate per spike-015). `shouldAnimate` also gates reduced-motion (VT-03) +?notr=1.
    if (!shouldAnimate(navigation.to?.url)) return;
    return new Promise<void>((resolve) => {
      startViewTransition(async () => {
        resolve(); // tells SvelteKit to apply the new DOM
        await navigation.complete; // SvelteKit swaps the DOM here
      });
    });
  });
  onDestroy(() => submitAllEvents());
  // MERGE — analytics pageview THEN focus reset (NAVA11Y-02, global half).
  afterNavigate(({ from, to }) => {
    startPageview(to?.url?.href ?? '', from?.url?.href); // preserve existing analytics pageview
    if (typeof document === 'undefined') return;
    requestAnimationFrame(() => {
      const target =
        document.querySelector<HTMLElement>('[data-focus-on-nav]') ?? document.querySelector<HTMLElement>('h1');
      // LANDMINE: `preventScroll: true` is MANDATORY — real `goto({ noScroll })` callsites exist;
      // omitting it fights them.
      target?.focus({ preventScroll: true });
    });
  });

  // Submit any possible event data if the window is closed or refreshed
  $effect(() => {
    if (!appSettings.analytics?.platform) return;
    function handler() {
      if (document.visibilityState === 'hidden') submitAllEvents();
    }
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  });

  ////////////////////////////////////////////////////////////////////
  // Other global effects
  ////////////////////////////////////////////////////////////////////

  let feedbackModalRef = $state<{ openFeedback: () => void }>();

  $effect(() => {
    if (feedbackModalRef) openFeedbackModal.set(() => feedbackModalRef?.openFeedback());
  });

  // popupItem reactivity is handled inline at the template tail via
  // popupQueue.current + {@const Component = item.component}

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

<!-- Route announcer (NAVA11Y-01 / CR-01): always-present aria-live region, placed OUTSIDE the
     error/loading/maintenance branches so screen readers reliably announce route changes.
     Text is the active route's already-localized page title (the value fed to the document
     `<title>`, minus the constant app-name/maintenance suffix), surfaced via the layout-context
     `routeTitle` signal that MainContent / SingleCardContent register their localized `title` into
     (honored — no new i18n strings; the existing localized title is reused on ALL routes). -->
<div aria-live="polite" aria-atomic="true" class="sr-only" id="route-announcer">
  {routeTitle}
</div>

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
  {#if appSettings.analytics?.platform}
    {#if appSettings.analytics?.platform?.name === 'umami'}
      {#await import('$lib/components/analytics/umami/UmamiAnalytics.svelte') then UmamiAnalytics}
        <UmamiAnalytics.default websiteId={appSettings.analytics.platform.code} bind:this={umamiRef} />
      {/await}
    {/if}
  {/if}
{/if}

<!-- Popup service: inline renderer (runes-idiomatic; replaces the v2.1 popup-renderer wrapper per Phase 60) -->
{#if popupQueue.current}
  {@const item = popupQueue.current}
  {@const Component = item.component}
  <Component
    {...item.props ?? {}}
    onClose={() => {
      item.onClose?.();
      popupQueue.shift();
    }} />
{/if}

<style>
  /* Reduced-motion (VT-03 CSS layer): null any escaping ::view-transition animation.
     LANDMINE: the @media query WRAPS the :global selector — never the reverse form (the
     Svelte CSS parser rejects an at-rule nested inside :global with "Expected a valid CSS
     identifier"). */
  @media (prefers-reduced-motion: reduce) {
    :global(::view-transition-group(*)),
    :global(::view-transition-old(*)),
    :global(::view-transition-new(*)) {
      animation: none !important;
    }
  }
</style>
