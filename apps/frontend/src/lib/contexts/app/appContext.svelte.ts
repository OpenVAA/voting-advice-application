import { dynamicSettings, staticSettings } from '@openvaa/app-shared';
import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext } from 'svelte';
import { browser } from '$app/environment';
import { page } from '$app/state';
import { feedbackWriter as feedbackWriterPromise } from '$lib/api/feedbackWriter';
import { FeedbackPopup } from '$lib/dynamic-components/feedback/popup';
import { SurveyPopup } from '$lib/dynamic-components/survey/popup';
import { mergeAppSettings, mergeInitialAppSettings } from '$lib/utils/settings';
import { createGetRoute } from './getRoute.svelte';
import { popupStore } from './popup';
import { surveyLink } from './survey.svelte';
import { trackingService } from './tracking';
import { getComponentContext } from '../component';
import { getDataContext } from '../data';
import { localStorageState } from '../utils/persistedState.svelte';
import type { DynamicSettings } from '@openvaa/app-shared';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';
import type { FeedbackData } from '$lib/api/base/feedbackWriter.type';
import type { AppContext, AppType } from './appContext.type';
import type { AppCustomization } from './appCustomization.type';
import type { RouteBuilder } from './getRoute.svelte';
import type { PopupStore } from './popup';
import type { UserPreferences } from './userPreferences.type';

const CONTEXT_KEY = Symbol();

/**
 * The app context (orchestrator) re-expressed as a Svelte 5 CLASS
 * (`AppContextProvider`; v2.13 context-as-class migration, CLASS-04). CONVERTED
 * from the 368-line object-literal factory that `initAppContext()` returned.
 * Constructed via `new AppContextProvider()` inside `initAppContext()`, at
 * component-init time exactly as the former factory ran.
 *
 * ── Spread-of-context fix (success criterion 1) ──────────────────────────────
 * The former factory built its return object by spreading the three upstream
 * contexts (the componentCtx / dataCtx / tracking instance-spreads) and then
 * overriding a handful of members. Those THREE internal instance-spreads are
 * GONE. Every forwarded member is now an EXPLICIT OWN-ENUMERABLE instance
 * property assigned in the constructor (CONVENTIONS §17 "explicit getter
 * forwarding, never instance spread") — the canonical
 * `Object.assign(this, getX())` composing-leaf copy for the stable members and
 * `Object.defineProperty(this, …)` / handle-object fields for the reactive ones.
 *
 * ── The DECISIVE downstream-spread constraint ────────────────────────────────
 * `candidateContext.svelte.ts:366`, `adminContext.svelte.ts:98`, and
 * `voterContext.svelte.ts:488` ALL do `{ ...appContext }` and are NOT touched in
 * Phase 109. `{ ...instance }` copies only OWN-ENUMERABLE properties; Svelte 5
 * compiles bare `$state`/`$derived` class fields AND prototype `get` accessors to
 * PRIVATE backing + PROTOTYPE accessors, which object spread silently drops
 * (Phase 107/108 spread-safety gate, headlessly verified). Therefore EVERY member
 * this context exposes is installed as an OWN-ENUMERABLE instance property — never
 * a bare `$state`/`$derived` field, never a prototype getter. This is the
 * load-bearing discipline of the whole phase: a prototype getter here would
 * silently drop the member from the three downstream spreads.
 *
 * ── SSR-correct appSettings / appCustomization merge (success criterion 3) ───
 * The v2.11 DB-override merge stays a SYNCHRONOUS FIELD INITIALIZER
 * (`#appSettingsValue = $state(mergeInitialAppSettings(...))`) — it runs on the
 * server AND the client, so the server-rendered HTML already carries the DB
 * override (no post-hydration default→override flash; spike 008). It is NEVER an
 * `$effect` for the INITIAL value (§20 — `$effect` does not run on the server).
 * The prev-ref-guarded RE-MERGE `$effect`s (the Phase-64 over-fire fix) live in
 * the CONSTRUCTOR — legal because the class is constructed during component init,
 * an effect context (filterContext precedent, 109-PATTERNS finding 4).
 *
 * Detachable methods (`sendFeedback`, `setDataConsent`, `setFeedbackStatus`,
 * `setSurveyStatus`, `startFeedbackPopupCountdown`, `startSurveyPopupCountdown`)
 * are ARROW-FUNCTION FIELDS (§18) so they survive detach after the downstream
 * spread + consumer destructure, with their bodies preserved verbatim.
 */
/**
 * Exported as a test seam (109-03): the own-enumerability spread regression guard
 * (`appContext.spread.svelte.test.ts`) constructs `new AppContextProvider()`
 * headlessly to assert every member survives the downstream `{ ...appContext }`
 * spreads as an own-enumerable property. Production code MUST keep using the
 * `initAppContext()` / `getAppContext()` factory wrappers — never construct the
 * class directly outside the factory.
 */
export class AppContextProvider implements AppContext {
  ////////////////////////////////////////////////////////////////////
  // Private helper contexts (the upstream contexts being forwarded)
  ////////////////////////////////////////////////////////////////////

  #componentCtx = getComponentContext();
  #dataCtx = getDataContext();

  // `getRoute` is a rune-native `{ readonly current: RouteBuilder }` handle
  // (CTX-08). It must be created here (not at module load) because
  // `createGetRoute` uses `$derived.by`, which requires component-init context.
  // The class is constructed during initAppContext at component init, so this is
  // exactly the same call site as before. See `getRoute.svelte.ts` header.
  #getRoute = createGetRoute();

  ////////////////////////////////////////////////////////////////////
  // Private $state backings + persisted handles
  ////////////////////////////////////////////////////////////////////

  #appTypeValue = $state<AppType>(undefined);

  /**
   * NB! Settings are overwritten by root key.
   * TODO: Handle merging so that empty objects do not overwrite defaults
   *
   * D-04 (CTX-01): the DB override is folded into the INITIAL `$state` value,
   * read synchronously from `page.data.appSettingsData`. This SYNCHRONOUS FIELD
   * INITIALIZER runs both server-side AND client-side, so the server-rendered
   * HTML already carries the DB override — no post-hydration default→override
   * flash (the real production bug spike 008 surfaced; `$effect` does not run on
   * the server). The constructor `$effect` below handles only post-navigation
   * `page.data` changes. NEVER move this initial derivation into an `$effect`.
   */
  // Kept on one line (prettier-ignore) so the SSR field-initializer gate
  // `mergeInitialAppSettings(staticSettings, dynamicSettings, …)` matches the
  // single-line shape and the synchronous-init semantics are visually obvious.
  // prettier-ignore
  #appSettingsValue = $state<AppSettings>(mergeInitialAppSettings(staticSettings, dynamicSettings, page.data?.appSettingsData as DynamicSettings | Error | undefined));

  // Same D-04 synchronous-init treatment for appCustomization: fold the DB
  // override into the initial `$state` value (SSR-correct, no flash).
  #appCustomizationValue = $state<AppCustomization>(
    page.data?.appCustomizationData && !((page.data?.appCustomizationData as AppCustomization | Error) instanceof Error)
      ? (page.data.appCustomizationData as AppCustomization)
      : {}
  );

  // TODO: Refactor when Cand App is refactored
  #openFeedbackModalValue = $state<(() => void) | undefined>(undefined);

  // See also the utility methods below. `localStorageState` is a rune-native
  // `{ current, set, update }` persisted handle (no store-bridge wrapper needed).
  #userPreferences = localStorageState('appContext-userPreferences', {} as UserPreferences);

  ////////////////////////////////////////////////////////////////////
  // Producer instances (installed in the constructor — D1 field-init order)
  // The producers read their inputs via `.current`; the input handles
  // (`appSettings`, `userPreferences`) must exist first, so the producers are
  // created in the constructor AFTER the handle objects are installed.
  ////////////////////////////////////////////////////////////////////

  #tracking!: ReturnType<typeof trackingService>;
  #survey!: ReturnType<typeof surveyLink>;
  #popupQueue: PopupStore = popupStore();

  // Track the previous `data` reference to skip merges when SvelteKit hands us
  // the same loader result on a URL change (the Phase-64 over-fire fix).
  // Initialized to the init-time DB value (D-04) so the first post-init run does
  // not re-merge the identical payload already folded into `$state` above.
  #prevAppSettingsData: DynamicSettings | Error | undefined = page.data?.appSettingsData as
    | DynamicSettings
    | Error
    | undefined;
  #prevAppCustomizationData: AppCustomization | Error | undefined = page.data?.appCustomizationData as
    | AppCustomization
    | Error
    | undefined;

  // Module-local timeouts become private fields.
  #feedbackTimeout: NodeJS.Timeout | undefined;
  #surveyTimeout: NodeJS.Timeout | undefined;

  ////////////////////////////////////////////////////////////////////
  // OWN-ENUMERABLE members (declared here for typing; INSTALLED in the
  // constructor so the spreads downstream copy them). Definite-assignment `!`.
  ////////////////////////////////////////////////////////////////////

  // Reactive `{ current, set?, update? }` handles installed via `const self = this`.
  readonly appType!: AppContext['appType'];
  // appSettings/locale are BARE own-enumerable reactive accessors (Phase 113
  // FLATTEN-02), installed via Object.defineProperty(this, …, { enumerable: true })
  // so they survive the downstream `{ ...appContext }` spreads.
  readonly appSettings!: AppContext['appSettings'];
  readonly appCustomization!: AppContext['appCustomization'];
  readonly openFeedbackModal!: AppContext['openFeedbackModal'];
  readonly locale!: AppContext['locale'];
  readonly locales!: AppContext['locales'];
  readonly darkMode!: AppContext['darkMode'];
  readonly getRoute!: { readonly current: RouteBuilder };
  readonly surveyLink!: AppContext['surveyLink'];
  readonly userPreferences!: AppContext['userPreferences'];
  readonly popupQueue!: PopupStore;

  // Forwarded STABLE componentCtx members (own props copied via Object.assign).
  readonly t!: AppContext['t'];
  readonly translate!: AppContext['translate'];

  // Forwarded dataCtx members. `dataRoot` is a BARE own-enumerable reactive accessor
  // (Phase 113 FLATTEN-02) installed via Object.defineProperty so it survives the
  // downstream spreads; `setDataRoot` is an arrow field — reference copied.
  readonly dataRoot!: AppContext['dataRoot'];
  readonly setDataRoot!: AppContext['setDataRoot'];

  // Forwarded tracking members (own-prop handles + arrow fields — references copied).
  readonly sendTrackingEvent!: AppContext['sendTrackingEvent'];
  readonly sessionId!: AppContext['sessionId'];
  readonly shouldTrack!: AppContext['shouldTrack'];
  readonly startPageview!: AppContext['startPageview'];
  readonly startEvent!: AppContext['startEvent'];
  readonly track!: AppContext['track'];
  readonly submitAllEvents!: AppContext['submitAllEvents'];
  readonly resetAllEvents!: AppContext['resetAllEvents'];

  constructor() {
    const self = this;

    ////////////////////////////////////////////////////////////////////
    // Install the OWN-ENUMERABLE reactive handle objects (spread-safe). Their
    // getters/setters close over `this` to reach the private `$state` backings.
    ////////////////////////////////////////////////////////////////////

    this.appType = {
      get current() {
        return self.#appTypeValue;
      },
      set(v: AppType) {
        self.#appTypeValue = v;
      },
      update(fn: (v: AppType) => AppType) {
        self.#appTypeValue = fn(self.#appTypeValue);
      }
    };

    // BARE own-enumerable reactive accessor (Phase 113 FLATTEN-02). The former
    // writable `{ current, set, update }` handle had NO external writer (internal
    // writes go through `#appSettingsValue` directly — the re-merge `$effect`s
    // below + the field initializer), so the public surface is read-only bare.
    // Installed via Object.defineProperty(enumerable:true) so it survives the three
    // downstream `{ ...appContext }` spreads (a prototype getter would be dropped).
    Object.defineProperty(this, 'appSettings', {
      get() {
        return self.#appSettingsValue;
      },
      enumerable: true,
      configurable: true
    });

    this.appCustomization = {
      get current() {
        return self.#appCustomizationValue;
      },
      set(v: AppCustomization) {
        self.#appCustomizationValue = v;
      },
      update(fn: (v: AppCustomization) => AppCustomization) {
        self.#appCustomizationValue = fn(self.#appCustomizationValue);
      }
    };

    this.openFeedbackModal = {
      get current() {
        return self.#openFeedbackModalValue;
      },
      set(v: (() => void) | undefined) {
        self.#openFeedbackModalValue = v;
      }
    };

    // Read-only `{ current }` rune handles over the SAME ComponentContext value
    // (single source of truth). Each handle is a STABLE own-enumerable VALUE field
    // assigned once here (same approach as the writable handles above and the held
    // handles `getRoute` / `userPreferences` / `popupQueue`), so the handle reference
    // is reference-equal across reads (`ctx.locale === ctx.locale`) AND identical to
    // the spread copy (`{ ...appContext }.locale === appContext.locale`). The inner
    // `get current()` re-reads the backing `$derived`/`$state` per access, so reads
    // stay live and reactive in the tracking scope. The `{ ...appContext }` downstream
    // spreads copy these own-enumerable values intact. (Phase 113 FLATTEN-01 deleted
    // the redundant read-only app-settings / locale mirrors that read these same
    // backings — internal consumers now read the canonical handles directly.)
    // BARE own-enumerable reactive accessor (Phase 113 FLATTEN-02): read `ctx.locale`
    // directly. Installed via Object.defineProperty(enumerable:true) so it survives
    // the downstream spreads. `locales`/`darkMode` stay `{ current }` (out of scope).
    Object.defineProperty(this, 'locale', {
      get() {
        return self.#componentCtx.locale;
      },
      enumerable: true,
      configurable: true
    });
    this.locales = {
      get current() {
        return self.#componentCtx.locales;
      }
    };
    this.darkMode = {
      get current() {
        return self.#componentCtx.darkMode;
      }
    };

    // The route-builder + userPreferences + popupQueue handles are held directly.
    this.getRoute = this.#getRoute;
    this.userPreferences = this.#userPreferences;
    this.popupQueue = this.#popupQueue;

    ////////////////////////////////////////////////////////////////////
    // Producers (D1 field-init order): create AFTER the input handles exist.
    // They read `appSettings` / `userPreferences` via `.current`.
    ////////////////////////////////////////////////////////////////////

    // The trackingService + surveyLink producers consume `appSettings` as a
    // `ReactiveHandle<AppSettings>` and read `.current`. The consumer-facing
    // `this.appSettings` surface is now BARE (Phase 113 FLATTEN-02), so we wrap
    // `#appSettingsValue` back into a `{ get current() }` handle for the producer
    // INPUTS only — keeping the producers' `ReactiveHandle` input contract unchanged
    // (research Open Question #2: keep blast radius minimal; only the consumer-facing
    // surface goes bare). The getter re-reads `#appSettingsValue` so the producers
    // stay reactive.
    const appSettingsHandle = {
      get current() {
        return self.#appSettingsValue;
      }
    };
    this.#tracking = trackingService({
      appSettings: appSettingsHandle,
      userPreferences: this.#userPreferences
    });
    this.#survey = surveyLink({ appSettings: appSettingsHandle, sessionId: this.#tracking.sessionId });
    this.surveyLink = this.#survey;

    ////////////////////////////////////////////////////////////////////
    // EXPLICIT FORWARDING of the upstream contexts as OWN properties — this
    // REPLACES the former componentCtx / dataCtx / tracking instance-spreads
    // (success criterion 1). Stable plain members are copied by reference;
    // reactive members are the own-enumerable handle objects exposed by the
    // producers/contexts.
    ////////////////////////////////////////////////////////////////////

    // Forward dataCtx.dataRoot as a BARE own-enumerable reactive accessor (Phase 113
    // FLATTEN-02): read the now-bare `dataContext.dataRoot` accessor each access so the
    // `#version` reactive re-read inside it stays live, and install via
    // Object.defineProperty(enumerable:true) so it survives the downstream
    // `{ ...appContext }` spreads. (Cannot go through the plain `Object.assign` value
    // copy below — that would snapshot the DataRoot once, losing reactivity.)
    Object.defineProperty(this, 'dataRoot', {
      get() {
        return self.#dataCtx.dataRoot;
      },
      enumerable: true,
      configurable: true
    });

    Object.assign(this, {
      // componentCtx — only the STABLE members not overridden above
      // (`locale`/`locales`/`darkMode` are replaced by the `{ current }` handles).
      t: this.#componentCtx.t,
      translate: this.#componentCtx.translate,
      // dataCtx — arrow-field writer (reference copied); `dataRoot` is installed
      // above as a bare own-enumerable accessor.
      setDataRoot: this.#dataCtx.setDataRoot,
      // tracking — own-enumerable handle objects + arrow-field methods.
      sendTrackingEvent: this.#tracking.sendTrackingEvent,
      sessionId: this.#tracking.sessionId,
      shouldTrack: this.#tracking.shouldTrack,
      startPageview: this.#tracking.startPageview,
      startEvent: this.#tracking.startEvent,
      track: this.#tracking.track,
      submitAllEvents: this.#tracking.submitAllEvents,
      resetAllEvents: this.#tracking.resetAllEvents
    });

    ////////////////////////////////////////////////////////////////////
    // Prev-ref-guarded $effect RE-MERGE (success criterion 3). Legal in the
    // constructor — the class is constructed during component init, an effect
    // context (filterContext precedent). The INITIAL merge stays a field
    // initializer above; these effects handle only post-navigation page.data
    // changes. Bodies preserved verbatim from the former factory.
    ////////////////////////////////////////////////////////////////////

    // Read appSettingsData directly from page.data (replaces pageDatumStore per
    // D-02). Track the previous `data` reference to skip merges when SvelteKit
    // hands us the same loader result on a URL change (e.g., drawer open/close —
    // root layout loader has no URL deps so its data is cached). Without this
    // guard `mergeAppSettings` always produces a new AppSettings object, which
    // Svelte 5 propagates as a state change, cascading through `entityTypes` →
    // `nominationAndQuestionStore` → `filterStore` and recreating every
    // `FilterGroup` on every navigation. Surfaced during Phase 64 manual smoke
    // as "filter badge disappears on drawer open / portraits reload on close".
    // Svelte 4 stores absorbed this via `safe_not_equal`; raw `$state =` doesn't.
    $effect(() => {
      const data = page.data?.appSettingsData as DynamicSettings | Error | undefined;
      if (data === this.#prevAppSettingsData) return;
      this.#prevAppSettingsData = data;
      if (!data || data instanceof Error) return;
      this.#appSettingsValue = mergeAppSettings(this.#appSettingsValue, data);
    });

    // Same reference-equality guard as appSettingsData above.
    $effect(() => {
      const data = page.data?.appCustomizationData as AppCustomization | Error | undefined;
      if (data === this.#prevAppCustomizationData) return;
      this.#prevAppCustomizationData = data;
      if (!data || data instanceof Error) return;
      this.#appCustomizationValue = data;
    });
  }

  ////////////////////////////////////////////////////////////////////
  // Sending feedback (§18 arrow field — survives detach)
  ////////////////////////////////////////////////////////////////////

  sendFeedback = async (feedback: FeedbackData): Promise<DataApiActionResult> => {
    if (!browser) error(500, 'sendFeedback() called in a non-browser environment');
    const feedbackWriter = await feedbackWriterPromise;
    feedbackWriter.init({ fetch });
    return feedbackWriter.postFeedback(feedback);
  };

  ////////////////////////////////////////////////////////////////////
  // Utility methods for popups and setting user preferences
  // (§18 arrow fields — survive detach after the downstream spread)
  ////////////////////////////////////////////////////////////////////

  startFeedbackPopupCountdown = (delay = 3 * 60): void => {
    if (this.#feedbackTimeout) clearTimeout(this.#feedbackTimeout);
    if (delay <= 0) return;
    this.#feedbackTimeout = setTimeout(() => {
      const feedbackStatus = this.#userPreferences.current.feedback?.status;
      if (feedbackStatus !== 'received' && feedbackStatus !== 'dismissed')
        this.#popupQueue.push({
          component: FeedbackPopup,
          onClose: () => {
            // Persist dismissal so the popup doesn't reappear after reload
            if (this.#userPreferences.current.feedback?.status !== 'received') this.setFeedbackStatus('dismissed');
          }
        });
    }, delay * 1000);
  };

  startSurveyPopupCountdown = (delay = 5 * 60): void => {
    if (this.#surveyTimeout) clearTimeout(this.#surveyTimeout);
    if (delay <= 0) return;
    this.#surveyTimeout = setTimeout(() => {
      if (this.#userPreferences.current.survey?.status !== 'received')
        this.#popupQueue.push({ component: SurveyPopup });
    }, delay * 1000);
  };

  setDataConsent = (consent: UserDataCollectionConsent): void => {
    this.#userPreferences.update((d) => ({
      ...d,
      dataCollection: { consent, date: new Date().toISOString() }
    }));
    if (consent === 'granted') {
      this.#tracking.startEvent('dataConsent_granted');
    }
  };

  setFeedbackStatus = (status: UserFeedbackStatus): void => {
    this.#userPreferences.update((d) => ({
      ...d,
      feedback: { status, date: new Date().toISOString() }
    }));
  };

  setSurveyStatus = (status: UserFeedbackStatus): void => {
    this.#userPreferences.update((d) => ({
      ...d,
      survey: { status, date: new Date().toISOString() }
    }));
  };
}

export function getAppContext() {
  if (!hasContext(CONTEXT_KEY)) error(500, 'GetAppContext() called before initAppContext()');
  return getContext<AppContext>(CONTEXT_KEY);
}

/**
 * Initialize and return the context. This must be called before `getAppContext()` and cannot be called twice.
 * @returns The context object
 */
export function initAppContext(): AppContext {
  if (hasContext(CONTEXT_KEY)) error(500, 'InitAppContext() called for a second time');

  return setContext<AppContext>(CONTEXT_KEY, new AppContextProvider());
}
