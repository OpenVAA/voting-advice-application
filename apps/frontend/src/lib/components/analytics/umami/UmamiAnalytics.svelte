<svelte:options runes />

<script lang="ts">
  import { browser } from '$app/environment';
  import type { TrackingEvent } from '$lib/contexts/app/tracking';
  import type { UmamiAnalyticsProps } from './UmamiAnalytics.type';

  let { websiteId, scriptSrc = 'https://cloud.umami.is/script.js' }: UmamiAnalyticsProps = $props();
  export const trackEvent: UmamiAnalyticsProps['trackEvent'] = sendUmamiEvent;

  function sendUmamiEvent({ name, data }: TrackingEvent<Record<string, JSONData>>) {
    if (!browser || !('umami' in window)) return;
    (window.umami as { track: UmamiTrack }).track(name, data);
  }

  /**
   * The basic tracking properties, such as url, referrer, etc. are automatically added.
   */
  type UmamiTrack = (event_name: string, event_data?: { [key: string]: JSONData }) => void;
</script>

<svelte:head>
  <script defer src={scriptSrc} data-website-id={websiteId} data-auto-track="true"></script>
</svelte:head>
