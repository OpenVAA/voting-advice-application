<script lang="ts">
  import { browser } from '$app/environment';
  import { settings } from '$lib/stores';
  import { sendTrackingEvent, type TrackingEvent } from '$lib/utils/analytics/track';

  if ($settings.analytics?.trackEvents) {
    $sendTrackingEvent = trackEvent;
  }

  function trackEvent({ name, data }: TrackingEvent<Record<string, JSONData>>) {
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
    src="https://analytics.eu.umami.is/script.js"
    data-website-id={$settings.analytics?.platform?.code}
    data-auto-track="true"></script>
</svelte:head>
