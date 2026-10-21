import { browser } from '$app/environment';
import { buildBatch } from './batchBuilder';
import { isGlobalPrivacyControlSet, mayFillSessionId, maySendEvents, maySendPageview } from './gates';
import { sendBatch } from './relayTransport';
import { createViewTracker } from './viewTracker';
import { getVisitId } from './visitId';
import type { AnalyticsProjection } from '$lib/analytics/modes';
import type { ReactiveHandle } from '../../utils/reactiveHandle.type';
import type { UserPreferences } from '../userPreferences.type';
import type { BufferedEvent } from './batchBuilder';
import type { GateInput } from './gates';
import type { TrackingEvent, TrackingEventName } from './trackingEvent.type';
import type { TrackingDataArgument, TrackingService } from './trackingService.type';

/**
 * Pure-rune tracking-service producer as a Svelte 5 CLASS: a rune shell over the pure tracking modules.
 * Reads its `appSettings` / `userPreferences` / `projection` inputs via `.current` getters and exposes its outputs as rune handles — no store bridge over the inputs nor the outputs.
 *
 * What it does:
 *   - The view tracker (`viewTracker.ts`) holds the current view and hands out its pageview once.
 *   - The event buffer holds the events started with `startEvent` and `track` until the next flush.
 *   - `submitAllEvents` is the flush: it applies the gates (`gates.ts`), builds one body with `buildBatch` (`batchBuilder.ts`) and hands it to `sendBatch` (`relayTransport.ts`), one keepalive request to the same-origin relay. Events the gates do not allow are discarded, never kept for a later flush.
 *   - The visit id comes from `getVisitId()` (`visitId.ts`), a module variable. Nothing is written to or read from a browser store.
 *
 * ONE TYPE, ONE IMPLEMENTATION: this class implements `TrackingService` (`trackingService.type.ts`) directly.
 *
 * The producer surface is deliberately WIDER than the consumer-facing `TrackingService`: `gate` and `surveySessionId` are own members here (a class may declare more than the type it implements). `appContext` forwards `gate` under the name `analyticsGate`, and reads `surveySessionId` producer to producer to build the survey link, forwarding it to nobody.
 *
 * SPREAD-SAFETY (this is the most spread-sensitive producer in the app layer): the members `appContext` forwards from this producer are carried on through the three downstream `{ ...appContext }` spreads. Svelte 5 compiles bare `$state`/`$derived` CLASS fields to PRIVATE backing fields + PROTOTYPE accessors, which are NOT own-enumerable and are DROPPED by `{ ...instance }` spread. To stay byte-identical at the consumer across that spread, every spread-consumed member MUST be an OWN-ENUMERABLE instance field:
 *   - `gate` / `surveySessionId` are OBJECT-LITERAL `{ current }` handle objects assigned to instance fields (the handle VALUE is copied by spread). Their getters close over `this` via a `const self = this` capture in the constructor so they read the private `$derived` backing.
 *   - `startPageview`/`startEvent`/`track`/`submitAllEvents`/`resetAllEvents`/`setPageVisible` are ARROW-FUNCTION FIELDS so they survive detach after the spread + consumer destructure.
 *
 * `#views` / `#events` are PRIVATE NON-REACTIVE bookkeeping fields (never read in a tracking scope) — NOT `$state`. They are separate, so clearing the events never loses the current view's pageview.
 *
 * There is NO `$effect`: the gate input is a synchronous `$derived`.
 */
export class TrackingServiceImpl implements TrackingService {
  ////////////////////////////////////////////////////////////////////
  // Injected inputs (private readonly rune handles)
  ////////////////////////////////////////////////////////////////////

  readonly #appSettings: ReactiveHandle<AppSettings>;
  readonly #userPreferences: ReactiveHandle<UserPreferences>;
  readonly #projection: ReactiveHandle<AnalyticsProjection>;
  readonly #locale: () => string;

  /** Whether the browser sends the Global Privacy Control signal, read once at construction. */
  readonly #globalPrivacyControl: boolean;

  ////////////////////////////////////////////////////////////////////
  // Internal state variables (private, NON-reactive bookkeeping)
  ////////////////////////////////////////////////////////////////////

  /** The monotonic clock of the view tracker and of the buffered events' ages. */
  readonly #now = (): number => performance.now();

  /** The current view and the single send of its pageview. */
  readonly #views = createViewTracker({ now: this.#now });

  /** The events waiting for the next flush. */
  #events: Array<BufferedEvent> = [];

  ////////////////////////////////////////////////////////////////////
  // Reactive state
  ////////////////////////////////////////////////////////////////////

  // Private $derived backing for the gate input. Declared here for type narrowing; the `$derived` is INSTALLED in the constructor (field-init order: class-field initializers run BEFORE the constructor body, so this `$derived` cannot reference the constructor-assigned inputs at the declaration site).
  #gateValue!: GateInput;

  // Own-enumerable handle-object fields (spread-safe). The actual getters are installed in the constructor so they can close over `this` to reach the private `$derived` backing field.
  readonly gate!: ReactiveHandle<GateInput>;
  readonly surveySessionId!: ReactiveHandle<string | undefined>;

  constructor({
    appSettings,
    userPreferences,
    projection,
    locale
  }: {
    appSettings: ReactiveHandle<AppSettings>;
    userPreferences: ReactiveHandle<UserPreferences>;
    projection: ReactiveHandle<AnalyticsProjection>;
    locale: () => string;
  }) {
    this.#appSettings = appSettings;
    this.#userPreferences = userPreferences;
    this.#projection = projection;
    this.#locale = locale;
    this.#globalPrivacyControl = browser ? isGlobalPrivacyControlSet(navigator) : false;

    // Install the gate input as a `$derived` AFTER the input handles are assigned (field-init order). No `$effect`.
    this.#gateValue = $derived({
      projection: this.#projection.current,
      globalPrivacyControl: this.#globalPrivacyControl,
      trackEvents: this.#appSettings.current.analytics.trackEvents,
      consent: this.#userPreferences.current.dataCollection?.consent
    });

    // Capture `this` so the handle-object getters reach the private backing field. The handle objects are OWN-ENUMERABLE field VALUES, so the `{ ...instance }` spread copies them intact.
    // eslint-disable-next-line @typescript-eslint/no-this-alias -- handle-object `get current()` methods have their own `this`; `self` captures the instance to reach the private backing (the spread-safe class pattern).
    const self = this;
    this.gate = {
      get current() {
        return self.#gateValue;
      }
    };
    this.surveySessionId = {
      get current() {
        return mayFillSessionId(self.#gateValue) ? getVisitId() : undefined;
      }
    };
  }

  ////////////////////////////////////////////////////////////////////
  // Tracking functions (arrow fields — survive detach after spread)
  ////////////////////////////////////////////////////////////////////

  startPageview = (routeId: string | null, params: Readonly<Record<string, string | undefined>> | null) => {
    const visible = typeof document === 'undefined' || document.visibilityState === 'visible';
    this.#views.start({ routeId, locale: this.#locale(), params }, visible);
  };

  startEvent = <TName extends TrackingEventName>(
    name: TName,
    ...[data]: TrackingDataArgument<TName>
  ): TrackingEvent => {
    const event: TrackingEvent = { name, data: data ?? {} };
    this.#events.push({ name, attributes: event.data, at: this.#now() });
    return event;
  };

  track = <TName extends TrackingEventName>(name: TName, ...data: TrackingDataArgument<TName>): void => {
    this.startEvent(name, ...data);
  };

  setPageVisible = (visible: boolean) => {
    this.#views.setVisible(visible);
  };

  submitAllEvents = () => {
    const view = this.#views.currentView();
    const buffered = this.#events;
    this.#events = [];
    if (!view) return;
    const input = this.#gateValue;
    const pageview = maySendPageview(input) ? this.#views.takePageview() : undefined;
    const sendEvents = maySendEvents(input);
    const body = buildBatch({
      view,
      pageview,
      events: sendEvents ? buffered : [],
      visitId: sendEvents && input.projection.visitIdMode === 'memory' ? getVisitId() : undefined,
      projection: input.projection,
      now: this.#now()
    });
    if (body !== undefined) sendBatch(body);
  };

  resetAllEvents = () => {
    this.#events = [];
  };
}

/**
 * Factory wrapper preserving the `trackingService({...})` call signature. Returns the class instance itself — its forwarded members are own-enumerable, so `appContext`'s member forward and the downstream `{ ...appContext }` spreads carry them intact.
 *
 * The return type is the IMPLEMENTATION type, not the narrower consumer-facing `TrackingService`: `appContext` holds this producer privately (`#tracking`), forwards its `gate` and reads its `surveySessionId` to build the survey link, and this module's own test asserts the producer's exact own-key surface. Consumers never see this type — they see whatever `appContext` chooses to forward.
 */
export function trackingService({
  appSettings,
  userPreferences,
  projection,
  locale
}: {
  appSettings: ReactiveHandle<AppSettings>;
  userPreferences: ReactiveHandle<UserPreferences>;
  projection: ReactiveHandle<AnalyticsProjection>;
  locale: () => string;
}): TrackingServiceImpl {
  return new TrackingServiceImpl({ appSettings, userPreferences, projection, locale });
}
