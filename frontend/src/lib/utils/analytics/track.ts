import { get, writable } from 'svelte/store';
import { browser } from '$app/environment';
import { page } from '$app/stores';
import { settings, userPreferences } from '$lib/stores';
import { getUUID } from '$lib/utils/components';
import { logDebugError } from '$lib/utils/logger';
import { sessionStorageWritable } from '$lib/utils/storage';

/**
 * Contains the current pageview event, which will be automatically submitted containing any other submitted events when the user leaves the page or hides or closes the window.
 */
let pageviewEvent:
  | {
      href: string;
      from?: string;
      start?: number;
    }
  | undefined = undefined;

/**
 * Contains any unsubmitted compound events. These will be automatically submitted when the user leaves the app.
 */
let unsubmittedEvents: Array<TrackingEvent> = [];

/**
 * Whether we should track events.
 * @returns true if we should track events
 */
export function shouldTrack() {
  return (
    browser &&
    get(settings).analytics.trackEvents &&
    get(userPreferences).dataCollection?.consent === 'granted'
  );
}

/**
 * In order for tracking to do anything, set the value of this store to a function that will send the events.
 */
export const sendTrackingEvent =
  writable<(e: TrackingEvent<Record<string, JSONData>>) => void | undefined>(undefined);

/**
 * Track an analytics event and send it immediately. For most purposes, it's better to use the `startEvent` function instead, which will collect the events by page and only submit them when the page is unloaded.
 */
export function track(name: TrackingEvent['name'], data: TrackingEvent['data'] = {}) {
  if (!shouldTrack()) return;
  const send = get(sendTrackingEvent);
  if (!send) return;
  const dataToSend = purgeNullish({ vaaSessionId: get(sessionId), ...data });
  logDebugError({ name, data: dataToSend });
  send({ name, data: dataToSend });
}

/**
 * Call at the start of a page view to create an event that will be automatically submitted when the user leaves the page or hides or closes the window.
 * @param route The route of the page
 * @param from Optional route from which the page was loaded
 */
export function startPageview(href: string, from?: string | null) {
  if (pageviewEvent) logDebugError('Pageview already started');
  pageviewEvent = {
    href,
    from: from ?? undefined,
    start: Date.now()
  };
}

/**
 * Start an analytics event into which you want to add data to later, and which will be automatically submitted as part of the `pageview` event when the user leaves the page or hides or closes the window.
 * @param name Event name
 * @param data Initial event data
 * @returns The event object that can be used to add data to.
 */
export function startEvent(name: TrackingEvent['name'], data: TrackingEvent['data'] = {}) {
  const event = { name, data };
  unsubmittedEvents.push(event);
  return event;
}

/**
 * Submit all unsubmitted compound events started with `startEvent` and the `pageview` event.
 */
export function submitAllEvents() {
  if (shouldTrack() && (pageviewEvent || unsubmittedEvents?.length)) {
    const events: Record<string, TrackingEvent['data']> = {};
    // This shouldn't happen
    if (!pageviewEvent) pageviewEvent = { href: get(page)?.url?.href ?? '' };
    // Prefix a number to all subevent names
    for (let i = 0; i < unsubmittedEvents.length; i++) {
      // We limit the max events to 50 (umami's limit) minus the ones we're adding by default
      if (i >= 50 - 5) {
        logDebugError(`Too many unsubmitted events: ${unsubmittedEvents.length}`);
        break;
      }
      const { name, data } = unsubmittedEvents[i];
      events[`${i < 10 ? '0' : ''}${i}__${name}`] = data;
    }
    const { href, from, start } = pageviewEvent;
    const duration = start ? Date.now() - start : undefined;
    track('pageview', { href, from, start, duration, ...events });
  }
  resetAllEvents();
}

/**
 * Reset all unsubmitted events, including the `pageview` event.
 */
export function resetAllEvents() {
  pageviewEvent = undefined;
  unsubmittedEvents = [];
}

/**
 * Gets the vaaSessionId value from sessionStorage or generates a new one if it doesn't exist.
 */
export const sessionId = sessionStorageWritable('vaaSessionId', getUUID());

/**
 * A helper to remove any nullish properties from an object so that it can be sent as JSON.
 */
function purgeNullish(data: TrackingEvent['data']) {
  const out: Record<string, JSONData> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value == null) continue;
    if (typeof value === 'object' && !Array.isArray(value)) {
      out[key] = purgeNullish(value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

/**
 * The interface for an analytics event.
 */
export interface TrackingEvent<
  TData extends Record<string, JSONData | undefined> = Record<string, JSONData | undefined>
> {
  name: TrackingEventName;
  data: TData;
}

export type TrackingEventName =
  | 'answer_delete' // $lib/stores.ts
  | 'answer_resetAll' // $lib/stores.ts
  | 'answer' // $lib/stores.ts
  | 'dataConsent_granted' // $lib/stores.ts
  | 'entityCard_expandSubcards' // <EntityCard>
  | 'entityDetails_changeTab' // <EntityDetails>
  | 'feedback_error' // <FeedbackModal>
  | 'feedback_sent' // <FeedbackModal>
  | 'filters_active' // <EntityListControls>
  | 'filters_reset' // <EntityListControls>
  | 'maintenance_shown' // <MaintenancePage>
  | 'menu_open' // <Page>
  | 'pageview' // $lib/utils/analytics/track.ts
  | 'question_next' // /(voter)/questions/[questionId]/+page.svelte
  | 'question_previous' // /(voter)/questions/[questionId]/+page.svelte
  | 'question_skip' // /(voter)/questions/[questionId]/+page.svelte
  | 'question_startFrom' // /(voter)/questions/[questionId]/+page.svelte
  | 'questionInfo_collapse' // <QuestionInfo>
  | 'questionInfo_expand' // <QuestionInfo>
  | 'results_browse_candidate' // /(voter)/results/[entityType]/[entityId]/+page.svelte
  | 'results_browse_party' // /(voter)/results/[entityType]/[entityId]/+page.svelte
  | 'results_browse' // /(voter)/results/+page.svelte
  | 'results_changeTab' // /(voter)/results/+page.svelte
  | 'results_ranked_candidate' // /(voter)/results/[entityType]/[entityId]/+page.svelte
  | 'results_ranked_party' // /(voter)/results/[entityType]/[entityId]/+page.svelte
  | 'results_ranked' // /(voter)/results/+page.svelte
  | 'survey_opened' // <SurveyBanner>
  | 'video'; // <Video>
