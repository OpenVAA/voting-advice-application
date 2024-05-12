<script lang="ts">
  import {onDestroy} from 'svelte';
  import {afterNavigate, onNavigate} from '$app/navigation';
  import {settings, userPreferences} from '$lib/utils/stores';
  import {DataConsentPopup} from '$lib/components/dataConsent/popup';
  import {startPageview, submitAllEvents} from '$lib/utils/analytics/track';

  onNavigate(() => submitAllEvents());
  onDestroy(() => submitAllEvents());
  afterNavigate(({from, to}) => startPageview(to?.url?.href ?? '', from?.url?.href));
</script>

<slot />

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