<script lang="ts">
  import { browser } from '$app/environment';
  import type { TrackingEvent } from '$lib/contexts/app/tracking';
  import type { UmamiAnalyticsProps } from './UmamiAnalytics.type';

  type $$Props = UmamiAnalyticsProps;

  export let websiteId: $$Props['websiteId'];
  export let scriptSrc: $$Props['scriptSrc'] = 'https://cloud.umami.is/script.js';
  export const trackEvent: $$Props['trackEvent'] = sendUmamiEvent;

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
  <script
    defer
    src={scriptSrc}
    data-website-id={websiteId}
    data-auto-track="true"></script>
</svelte:head>
