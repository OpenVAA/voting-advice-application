import {get, writable} from 'svelte/store';
import {browser} from '$app/environment';
import {logDebugError} from '$lib/utils/logger';
import {settings, userPreferences} from '$lib/utils/stores';

/**
 * In order for tracking to do anything, set the value of this store to a function that will send the events.
 */
export const sendTrackingEvent = writable<(e: TrimmedTrackingEvent) => void | undefined>(undefined);

/**
 * Track an analytics event.
 */
export function track(name: TrackingEvent['name'], data: TrackingEvent['data'] = {}) {
  if (
    !browser ||
    !get(settings).analytics.trackEvents ||
    get(userPreferences).dataCollection?.consent !== 'granted'
  )
    return;
  const send = get(sendTrackingEvent);
  if (!send) return;
  const trimmedData: TrimmedTrackingEvent['data'] = {};
  for (const [key, value] of Object.entries(data)) {
    if (value == null) continue;
    if (typeof value === 'boolean') {
      trimmedData[key] = value ? 'true' : 'false';
      continue;
    }
    trimmedData[key] = value;
  }
  logDebugError({name, data: trimmedData});
  send({name, data: trimmedData});
}

/**
 * Contains any unsubmitted compound events. These will be automatically submitted when the user leaves the app.
 */
let unsubmittedEvents: {
  event: TrackingEvent;
  onSubmit?: (event: TrackingEvent) => TrackingEvent;
}[] = [];

/**
 * Use this function to start an analytics event into which you want to add data to later.
 * @param name Event name
 * @param data Initial event data
 * @param onSubmit A callback that will be called before the event is submitted and which you can use to modify the event.
 * @returns The event object that can be used to add data to.
 */
export function startEvent(
  name: TrackingEvent['name'],
  data: TrackingEvent['data'] = {},
  onSubmit?: (event: TrackingEvent) => TrackingEvent
) {
  const event = {name, data};
  unsubmittedEvents.push({event, onSubmit});
  return event;
}

/**
 * Submit a specific compound event you started with `startEvent`.
 * @param event The event object returned by `startEvent`.
 */
export function submitEvent(event: TrackingEvent) {
  submitAllEvents(event);
}

/**
 * Submit all unsubmitted compound events started with `startEvent`.
 * @param onlyEvent If specified, will only submit that event, in which case it's equal to calling `submitEvent(event)`.
 * @returns
 */
export function submitAllEvents(onlyEvent?: TrackingEvent) {
  for (const eventObj of unsubmittedEvents) {
    const {onSubmit, event} = eventObj;
    // Only submit the event if it's the one we're looking for
    if (onlyEvent && onlyEvent !== event) continue;
    const {name, data} = onSubmit ? onSubmit(event) : event;
    track(name, data);
    // If we were looking for a specific event, delete it and return
    if (onlyEvent) {
      unsubmittedEvents.splice(unsubmittedEvents.indexOf(eventObj), 1);
      return;
    }
  }
  unsubmittedEvents = [];
}

/**
 * The interface for an analytics event.
 */
export interface TrackingEvent<
  Data extends Record<string, string | number | boolean | undefined | null> = Record<
    string,
    string | number | boolean | undefined | null
  >
> {
  name: TrackingEventName;
  data: Data;
}

/**
 * A simple format for an analytics event into which `TrackingEvent`s are converted before submitting to the `sendTrackingEvent` function.
 */
export interface TrimmedTrackingEvent {
  name: TrackingEventName;
  data: Record<string, string | number>;
}

export type TrackingEventName =
  | 'answer_delete' // $lib/utils/stores.ts
  | 'answer_resetAll' // $lib/utils/stores.ts
  | 'answer' // $lib/utils/stores.ts
  | 'dataConsent_granted' // $lib/utils/stores.ts
  | 'entityCard_expandSubcards' // <EntityCard>
  | 'entityDetails_changeTab' // <EntityDetails>
  | 'feedback_error' // <FeedbackModal>
  | 'feedback_sent' // <FeedbackModal>
  | 'filters_active' // <EntityListControls>
  | 'filters_reset' // <EntityListControls>
  | 'maintenance_shown' // <MaintenancePage>
  | 'menu_open' // <Page>
  | 'question_next' // /(voter)/questions/[questionId]/+page.svelte
  | 'question_previous' // /(voter)/questions/[questionId]/+page.svelte
  | 'question_skip' // /(voter)/questions/[questionId]/+page.svelte
  | 'questionInfo_collapse' // <QuestionInfo>
  | 'questionInfo_expand' // <QuestionInfo>
  | 'results_browse_candidate' // /(voter)/results/[entityType]/[entityId]/+page.svelte
  | 'results_browse_party' // /(voter)/results/[entityType]/[entityId]/+page.svelte
  | 'results_browse' // /(voter)/results/+page.svelte
  | 'results_changeTab' // /(voter)/results/+page.svelte
  | 'results_ranked_candidate' // /(voter)/results/[entityType]/[entityId]/+page.svelte
  | 'results_ranked_party' // /(voter)/results/[entityType]/[entityId]/+page.svelte
  | 'results_ranked' // /(voter)/results/+page.svelte
  | 'video'; // <Video>
