import { log } from '@openvaa/app-shared';
import { browser } from '$app/environment';
import { getUUID } from '$lib/utils/components';
import { purgeNullish } from '../../../utils/purgeNullish';
import { sessionStorageState } from '../../utils/persistedState.svelte';
import type { ReactiveHandle, WritableHandle } from '../../utils/reactiveHandle.type';
import type { UserPreferences } from '../userPreferences.type';
import type { TrackingEvent } from './trackingEvent.type';
import type { TrackingHandler, TrackingService } from './trackingService.type';

/**
 * Pure-rune tracking-service producer as a Svelte 5 CLASS.
 * Reads its `appSettings` / `userPreferences` inputs via `.current` getters and exposes its outputs as rune handles — no store bridge over the inputs nor the outputs.
 *
 * ONE TYPE, ONE IMPLEMENTATION: this class implements `TrackingService` (`trackingService.type.ts`) directly. The second, rune-shaped type layer this file used to declare — it subtracted three members from `TrackingService` only to re-declare the same three as rune handles — is gone: it existed only while the `appContext` seam converted those members to stores, and the two handle shapes have since converged.
 *
 * The producer surface is deliberately WIDER than the consumer-facing `TrackingService`: `sessionId` and `shouldTrack` are own members here (a class may declare more than the type it implements) but are declared on neither `TrackingService` nor any context, and `appContext` forwards them to nobody. Their only reads are producer-to-producer — `track()` below stamps `vaaSessionId` onto every event, and `appContext.svelte.ts` passes `sessionId` into `surveyLink(...)`.
 *
 * SPREAD-SAFETY (this is the most spread-sensitive producer in the app layer): the members `appContext` forwards from this producer are carried on through the three downstream `{ ...appContext }` spreads. Svelte 5 compiles bare `$state`/`$derived` CLASS fields to PRIVATE backing fields + PROTOTYPE accessors, which are NOT own-enumerable and are DROPPED by `{ ...instance }` spread. To stay byte-identical at the consumer across that spread, every spread-consumed member MUST be an OWN-ENUMERABLE instance field:
 *   - `sendTrackingEvent` / `shouldTrack` are OBJECT-LITERAL `{ current, set? }` handle objects assigned to instance fields (the handle VALUE is copied by spread). Their getters close over `this` via a `const self = this` capture in the constructor so they read the private `$state`/`$derived` backing.
 *   - `sessionId` is the own-enumerable `{ current }` handle returned by `sessionStorageState(...)`, held directly as a field initializer.
 *   - `startPageview`/`startEvent`/`track`/`submitAllEvents`/`resetAllEvents` are ARROW-FUNCTION FIELDS so they survive detach after the spread + consumer destructure (`tracking.startEvent` is called at appContext:249).
 *
 * `#pageviewEvent` / `#unsubmittedEvents` are PRIVATE NON-REACTIVE bookkeeping fields (never read in a tracking scope) — NOT `$state`.
 *
 * There is NO `$effect`: `shouldTrack` is a synchronous `$derived`.
 */
export class TrackingServiceImpl implements TrackingService {
  ////////////////////////////////////////////////////////////////////
  // Injected inputs (private readonly rune handles)
  ////////////////////////////////////////////////////////////////////

  readonly #appSettings: ReactiveHandle<AppSettings>;
  readonly #userPreferences: ReactiveHandle<UserPreferences>;

  ////////////////////////////////////////////////////////////////////
  // Internal state variables (private, NON-reactive bookkeeping)
  ////////////////////////////////////////////////////////////////////

  /**
   * Contains the current pageview event, which will be automatically submitted containing any other submitted events when the user leaves the page or hides or closes the window.
   */
  #pageviewEvent:
    | {
        href: string;
        from?: string;
        start?: number;
      }
    | undefined = undefined;

  /**
   * Contains any unsubmitted compound events. These will be automatically submitted when the user leaves the app.
   */
  #unsubmittedEvents: Array<TrackingEvent> = [];

  ////////////////////////////////////////////////////////////////////
  // Reactive state
  ////////////////////////////////////////////////////////////////////

  // Persistent session id, read as a rune handle (`.current`) so this producer stays store-free. PRODUCER-ONLY: it is not declared on `TrackingService` and `appContext` does not forward it — `track()` stamps it onto every event and `appContext.svelte.ts` passes this very handle into `surveyLink(...)`. The storage key is load-bearing: renaming it would orphan every browser's stored id.
  readonly sessionId = sessionStorageState('appContext-sessionId', getUUID());

  // Private $state backing for the settable send handler.
  #sendTrackingEventValue = $state<TrackingHandler | null | undefined>(undefined);

  // Private $derived backing for the consent/browser/trackEvents gate. Declared here for type narrowing; the `$derived` is INSTALLED in the constructor (field-init order: class-field initializers run BEFORE the constructor body, so this `$derived` cannot reference the constructor-assigned `#appSettings` / `#userPreferences` at the declaration site).
  #shouldTrackValue!: boolean;

  // Own-enumerable handle-object fields (spread-safe). The actual getters/setters are installed in the constructor so they can close over `this` to reach the private `$state`/`$derived` backing fields.
  readonly sendTrackingEvent!: WritableHandle<TrackingHandler | null | undefined>;
  readonly shouldTrack!: ReactiveHandle<boolean>;

  constructor({
    appSettings,
    userPreferences
  }: {
    appSettings: ReactiveHandle<AppSettings>;
    userPreferences: ReactiveHandle<UserPreferences>;
  }) {
    this.#appSettings = appSettings;
    this.#userPreferences = userPreferences;

    // Install the consent/browser/trackEvents gate as a `$derived` AFTER the input handles are assigned (field-init order). No `$effect`.
    this.#shouldTrackValue = $derived(
      browser &&
        this.#appSettings.current.analytics.trackEvents &&
        this.#userPreferences.current.dataCollection?.consent === 'granted'
    );

    // Capture `this` so the handle-object getters/setters reach the private backing fields. The handle objects are OWN-ENUMERABLE field VALUES, so the `{ ...instance }` spread copies them intact.
    // eslint-disable-next-line @typescript-eslint/no-this-alias -- handle-object `get current()`/`set()` methods have their own `this`; `self` captures the instance to reach the private backings (the spread-safe class pattern).
    const self = this;
    this.sendTrackingEvent = {
      get current() {
        return self.#sendTrackingEventValue;
      },
      set(v) {
        self.#sendTrackingEventValue = v;
      }
    };
    this.shouldTrack = {
      get current() {
        return self.#shouldTrackValue;
      }
    };
  }

  ////////////////////////////////////////////////////////////////////
  // Tracking functions (arrow fields — survive detach after spread)
  ////////////////////////////////////////////////////////////////////

  startPageview = (href: string, from?: string | null) => {
    if (this.#pageviewEvent) log.debug('Pageview already started');
    this.#pageviewEvent = {
      href,
      from: from ?? undefined,
      start: Date.now()
    };
  };

  startEvent = (name: TrackingEvent['name'], data: TrackingEvent['data'] = {}) => {
    const event = { name, data };
    this.#unsubmittedEvents.push(event);
    return event;
  };

  submitAllEvents = () => {
    if (this.#shouldTrackValue && (this.#pageviewEvent || this.#unsubmittedEvents.length)) {
      const events: Record<string, TrackingEvent['data']> = {};
      // This shouldn't happen
      if (!this.#pageviewEvent) {
        log.debug(`No pageviewEvent is available for events: ${JSON.stringify(this.#unsubmittedEvents)}`);
        this.#pageviewEvent = { href: 'UNKNOWN' };
      }
      // Prefix a number to all subevent names
      for (let i = 0; i < this.#unsubmittedEvents.length; i++) {
        // We limit the max events to 50 (umami's limit) minus the ones we're adding by default
        if (i >= 50 - 5) {
          log.debug(`Too many unsubmitted events: ${this.#unsubmittedEvents.length}`);
          break;
        }
        const { name, data } = this.#unsubmittedEvents[i];
        events[`${i < 10 ? '0' : ''}${i}__${name}`] = data;
      }
      const { href, from, start } = this.#pageviewEvent;
      const duration = start ? Date.now() - start : undefined;
      this.track('pageview', { href, from, start, duration, ...events });
    }
    this.resetAllEvents();
  };

  track = (name: TrackingEvent['name'], data: TrackingEvent['data'] = {}) => {
    if (!this.#shouldTrackValue) return;
    const send = this.#sendTrackingEventValue;
    if (!send) return;
    const dataToSend = purgeNullish({ vaaSessionId: this.sessionId.current, ...data });
    log.debug('Tracking event dispatched', { name, data: dataToSend });
    send({ name, data: dataToSend });
  };

  resetAllEvents = () => {
    this.#pageviewEvent = undefined;
    this.#unsubmittedEvents = [];
  };
}

/**
 * Factory wrapper preserving the original `trackingService({...})` call signature. Returns the class instance itself — its forwarded members are own-enumerable, so `appContext`'s member forward and the downstream `{ ...appContext }` spreads carry them intact.
 *
 * The return type is the IMPLEMENTATION type, not the narrower consumer-facing `TrackingService`: `appContext` holds this producer privately (`#tracking`) and reads `sessionId` off it to build the survey link, and this module's own test asserts the producer's exact own-key surface. Consumers never see this type — they see whatever `appContext` chooses to forward.
 */
export function trackingService({
  appSettings,
  userPreferences
}: {
  appSettings: ReactiveHandle<AppSettings>;
  userPreferences: ReactiveHandle<UserPreferences>;
}): TrackingServiceImpl {
  return new TrackingServiceImpl({ appSettings, userPreferences });
}
