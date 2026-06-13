import { browser } from '$app/environment';
import { getUUID } from '$lib/utils/components';
import { logDebugError } from '$lib/utils/logger';
import { purgeNullish } from '../../../utils/purgeNullish';
import { sessionStorageState } from '../../utils/persistedState.svelte';
import type { ReactiveHandle, WritableHandle } from '../reactiveHandle.type';
import type { UserPreferences } from '../userPreferences.type';
import type { TrackingEvent } from './trackingEvent.type';
import type { TrackingHandler, TrackingService } from './trackingService.type';

/**
 * The pure-rune internal shape of the tracking service. The `appContext` seam
 * owns the store conversion of the store-shaped properties (`sendTrackingEvent`,
 * `sessionId`, `shouldTrack`) declared on the exported `TrackingService` type —
 * this producer exposes them as rune handles.
 */
export type RuneTrackingService = Omit<TrackingService, 'sendTrackingEvent' | 'sessionId' | 'shouldTrack'> & {
  sendTrackingEvent: WritableHandle<TrackingHandler | null | undefined>;
  sessionId: ReactiveHandle<string>;
  shouldTrack: ReactiveHandle<boolean>;
};

/**
 * Pure-rune tracking-service producer as a Svelte 5 CLASS (v2.13 context-as-class
 * migration, CLASS-03). CONVERTED from the factory closure that returned a plain
 * object literal. Reads its `appSettings` / `userPreferences` inputs via `.current`
 * getters and exposes its outputs as rune handles — no store bridge over the
 * inputs nor the outputs. The store-shaped exported surface
 * (`sendTrackingEvent`/`sessionId`/`shouldTrack` per `trackingService.type.ts`)
 * is reconstructed by the `appContext` seam.
 *
 * SPREAD-SAFETY (the single most spread-sensitive producer in Phase 108):
 * `trackingService` is the ONLY app-layer producer consumed via `...tracking`
 * spread (`appContext.svelte.ts:299`). Svelte 5 compiles bare `$state`/`$derived`
 * CLASS fields to PRIVATE backing fields + PROTOTYPE accessors, which are NOT
 * own-enumerable and are DROPPED by `{ ...instance }` spread (the Phase 107
 * spread-safety gate). To stay byte-identical at the consumer until the Phase 109
 * spread-of-context fix lands, every spread-consumed member MUST be an
 * OWN-ENUMERABLE instance field:
 *   - `sendTrackingEvent` / `shouldTrack` are OBJECT-LITERAL `{ current, set? }`
 *     handle objects assigned to instance fields (the handle VALUE is copied by
 *     spread). Their getters close over `this` via a `const self = this` capture
 *     in the constructor so they read the private `$state`/`$derived` backing.
 *   - `sessionId` is the own-enumerable `{ current }` handle returned by
 *     `sessionStorageState(...)`, held directly as a field initializer.
 *   - `startPageview`/`startEvent`/`track`/`submitAllEvents`/`resetAllEvents` are
 *     ARROW-FUNCTION FIELDS (§18) so they survive detach after the spread +
 *     consumer destructure (`tracking.startEvent` is called at appContext:249).
 *
 * `#pageviewEvent` / `#unsubmittedEvents` are PRIVATE NON-REACTIVE bookkeeping
 * fields (never read in a tracking scope) — NOT `$state`.
 *
 * There is NO `$effect` (§20): `shouldTrack` is a synchronous `$derived`.
 */
class TrackingServiceImpl implements RuneTrackingService {
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

  // Persistent session id, read as a rune handle (`.current`) so this producer
  // stays store-free. The seam wraps it back to a `Readable<string>` for the
  // exported `sessionId` surface (trackingService.type.ts). The handle object is
  // own-enumerable, so it survives the `...tracking` spread.
  readonly sessionId = sessionStorageState('appContext-sessionId', getUUID());

  // Private $state backing for the settable send handler.
  #sendTrackingEventValue = $state<TrackingHandler | null | undefined>(undefined);

  // Private $derived backing for the consent/browser/trackEvents gate. Declared
  // here for type narrowing; the `$derived` is INSTALLED in the constructor (D1
  // field-init order: class-field initializers run BEFORE the constructor body,
  // so this `$derived` cannot reference the constructor-assigned `#appSettings` /
  // `#userPreferences` at the declaration site).
  #shouldTrackValue!: boolean;

  // Own-enumerable handle-object fields (spread-safe). The actual getters/setters
  // are installed in the constructor so they can close over `this` to reach the
  // private `$state`/`$derived` backing fields.
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

    // Install the consent/browser/trackEvents gate as a `$derived` AFTER the
    // input handles are assigned (D1 field-init order). No `$effect` (§20).
    this.#shouldTrackValue = $derived(
      browser &&
        this.#appSettings.current.analytics.trackEvents &&
        this.#userPreferences.current.dataCollection?.consent === 'granted'
    );

    // Capture `this` so the handle-object getters/setters reach the private
    // backing fields. The handle objects are OWN-ENUMERABLE field VALUES, so the
    // `{ ...instance }` spread copies them intact (the spread-safety gate).
    // eslint-disable-next-line @typescript-eslint/no-this-alias -- handle-object `get current()`/`set()` methods have their own `this`; `self` captures the instance to reach the private backings (spread-safe class-conversion pattern).
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
  // Tracking functions (§18 arrow fields — survive detach after spread)
  ////////////////////////////////////////////////////////////////////

  startPageview = (href: string, from?: string | null) => {
    if (this.#pageviewEvent) logDebugError('Pageview already started');
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
        logDebugError(`No pageviewEvent is available for events: ${JSON.stringify(this.#unsubmittedEvents)}`);
        this.#pageviewEvent = { href: 'UNKNOWN' };
      }
      // Prefix a number to all subevent names
      for (let i = 0; i < this.#unsubmittedEvents.length; i++) {
        // We limit the max events to 50 (umami's limit) minus the ones we're adding by default
        if (i >= 50 - 5) {
          logDebugError(`Too many unsubmitted events: ${this.#unsubmittedEvents.length}`);
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
    logDebugError({ name, data: dataToSend });
    send({ name, data: dataToSend });
  };

  resetAllEvents = () => {
    this.#pageviewEvent = undefined;
    this.#unsubmittedEvents = [];
  };
}

/**
 * Factory wrapper preserving the original `trackingService({...})` call signature
 * + `RuneTrackingService` return type (the test + `appContext.svelte.ts:175` call
 * it). Returns the class instance itself — its spread-consumed members are
 * own-enumerable, so `{ ...tracking }` carries them intact.
 */
export function trackingService({
  appSettings,
  userPreferences
}: {
  appSettings: ReactiveHandle<AppSettings>;
  userPreferences: ReactiveHandle<UserPreferences>;
}): RuneTrackingService {
  return new TrackingServiceImpl({ appSettings, userPreferences });
}
