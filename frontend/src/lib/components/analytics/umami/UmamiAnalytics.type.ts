import type { TrackingHandler } from '$lib/contexts/app/tracking';

export type UmamiAnalyticsProps = {
  /**
   * The ID of the website for Umami.
   */
  websiteId: string;
  /**
   * The function to be called to send events to Umami. Use to set the value of the `sendTrackingEvent` store of `TrackingService`.
   */
  readonly trackEvent?: TrackingHandler | null;
  /**
   * The URL of the Umami script. @default 'https://cloud.umami.is/script.js'
   */
  scriptSrc?: string;
};
