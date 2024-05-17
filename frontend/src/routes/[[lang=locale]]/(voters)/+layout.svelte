<script lang="ts">
  import {onDestroy} from 'svelte';
  import {afterNavigate, onNavigate} from '$app/navigation';
  import {settings, showFeedbackPopup, userPreferences} from '$lib/stores';
  import {DataConsentPopup} from '$lib/components/dataConsent/popup';
  import {FeedbackPopup} from '$lib/components/feedback/popup';
  import {startPageview, submitAllEvents} from '$lib/utils/analytics/track';

  let doShowFeedbackPopup = false;

  onNavigate(() => submitAllEvents());
  onDestroy(() => submitAllEvents());
  afterNavigate(({from, to}) => {
    startPageview(to?.url?.href ?? '', from?.url?.href);
    if ($showFeedbackPopup) {
      setTimeout(() => (doShowFeedbackPopup = true), 225);
      $showFeedbackPopup = false;
    } else {
      doShowFeedbackPopup = false;
    }
  });
</script>

<slot />

{#if doShowFeedbackPopup}
  <FeedbackPopup />
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
{#if $settings.analytics.platform && $settings.analytics.trackEvents}
  {#if !$userPreferences.dataCollection?.consent || $userPreferences.dataCollection?.consent === 'indetermined'}
    <DataConsentPopup />
  {/if}
{/if}
