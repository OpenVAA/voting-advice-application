import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext } from 'svelte';
import { dataWriter as dataWriterPromise } from '$lib/api/dataWriter';
import { jobStores } from './jobStores.svelte';
import { getAppContext } from '../app';
import { getAuthContext } from '../auth';
import { inheritContextMembers } from '../utils/inheritContextMembers';
import { prepareDataWriter } from '../utils/prepareDataWriter';
import type { BasicUserData, DataWriter, WithAuth } from '$lib/api/base/dataWriter.type';
import type { AppContext } from '../app';
import type { AdminContext, WithOptionalAuth } from './adminContext.type';

const CONTEXT_KEY = Symbol('admin');

/**
 * The admin context (orchestrator) re-expressed as a Svelte 5 CLASS
 * (`AdminContextProvider`; v2.13 context-as-class migration, CLASS-07).
 * CONVERTED from the object-literal factory that `initAdminContext()` returned.
 * Constructed via `new AdminContextProvider()` inside `initAdminContext()`, at
 * component-init time exactly as the former factory ran.
 *
 * ── Two-base composition (112-PATTERNS §1–2) ─────────────────────────────────
 * adminContext inherits appContext + delegates authContext. The INHERITED
 * appContext members are reproduced via a single `Object.assign(this,
 * this.#appContext)` in the constructor (replacing the former `...appContext`
 * spread) — appContext is own-enumerable since the Phase-109 AppContextProvider.
 * authContext is NOT spread/assigned at all: its members arrive ONLY via the
 * individual forwards below (the v2.11 auth-forwarding fix; see next block).
 *
 * ── v2.11 auth-forwarding fix — PRESERVED VERBATIM (the ONLY sharp edge) ──────
 * `isAuthenticated` is a PROTOTYPE GETTER re-reading the LIVE authContext
 * `$derived` on every access (NOT a spread-captured boolean). The four auth
 * FUNCTIONS are plain non-reactive fns forwarded by reference as arrow fields.
 * See the inline CONS-03 / Pitfall-2 comment on the getter for the why.
 *
 * ── Getter-collision audit (112-PATTERNS §2; Phase-111 landmine absent) ───────
 * AppContext exposes NONE of `isAuthenticated` / `logout` /
 * `requestForgotPasswordEmail` / `resetPassword` / `setPassword` (verified). So
 * `Object.assign(this, this.#appContext)` cannot overwrite any auth member, and
 * the getter-only `isAuthenticated` accessor is never an assign target → the
 * Phase-111 `TypeError: Cannot set property which has only a getter` path is
 * STRUCTURALLY absent. Unlike candidateContext, admin's `logout` is NOT wrapped
 * (no getter-only override): it is a PLAIN arrow field, and nothing assigns over
 * it, so no exclusion-on-assign is needed. Do NOT add any `Object.assign` that
 * carries an `isAuthenticated` (or other auth) key onto the instance.
 *
 * ── D1 field-init order / no $effect ─────────────────────────────────────────
 * The private base fields, `#userData` `$state`, `jobs`, the auth forwards, and
 * the DataWriter wrapper arrow fields are field initializers (run in declaration
 * order BEFORE the constructor body). The ONLY constructor work is the single
 * `Object.assign(this, this.#appContext)`. adminContext has NO `$effect` — do
 * NOT introduce one.
 *
 * @internal — test seam — do not construct directly; use `initAdminContext()`.
 * Calling `new AdminContextProvider()` outside `initAdminContext()` bypasses the
 * `CONTEXT_KEY` double-init guard. (No `$effect` is used, so construction does
 * not itself require an effect context, but the canonical entry point remains
 * `initAdminContext()`.)
 */
export class AdminContextProvider implements AdminContext {
  ////////////////////////////////////////////////////////////
  // Inheritance from other Contexts (field initializers — they run BEFORE the
  // constructor body in declaration order). The appContext members are
  // reproduced via `Object.assign(this, this.#appContext)` in the constructor;
  // the authContext members arrive ONLY via the individual forwards below (NOT
  // spread — the v2.11 auth-forwarding fix).
  ////////////////////////////////////////////////////////////

  #appContext = getAppContext();
  #authContext = getAuthContext();

  ////////////////////////////////////////////////////////////
  // Inherited appContext members (declared for `implements AdminContext`;
  // INSTALLED via `Object.assign(this, this.#appContext)` in the constructor from
  // the own-enumerable Phase-109 AppContextProvider instance). Definite-assignment `!`.
  ////////////////////////////////////////////////////////////

  readonly appType!: AppContext['appType'];
  readonly appSettings!: AppContext['appSettings'];
  readonly appCustomization!: AppContext['appCustomization'];
  readonly openFeedbackModal!: AppContext['openFeedbackModal'];
  readonly locale!: AppContext['locale'];
  readonly locales!: AppContext['locales'];
  readonly darkMode!: AppContext['darkMode'];
  readonly getRoute!: AppContext['getRoute'];
  readonly surveyLink!: AppContext['surveyLink'];
  readonly userPreferences!: AppContext['userPreferences'];
  readonly t!: AppContext['t'];
  readonly translate!: AppContext['translate'];
  readonly dataRoot!: AppContext['dataRoot'];
  readonly setDataRoot!: AppContext['setDataRoot'];
  readonly sendTrackingEvent!: AppContext['sendTrackingEvent'];
  readonly sessionId!: AppContext['sessionId'];
  readonly shouldTrack!: AppContext['shouldTrack'];
  readonly startPageview!: AppContext['startPageview'];
  readonly startEvent!: AppContext['startEvent'];
  readonly track!: AppContext['track'];
  readonly submitAllEvents!: AppContext['submitAllEvents'];
  readonly resetAllEvents!: AppContext['resetAllEvents'];
  readonly sendFeedback!: AppContext['sendFeedback'];
  readonly setDataConsent!: AppContext['setDataConsent'];
  readonly setFeedbackStatus!: AppContext['setFeedbackStatus'];
  readonly setSurveyStatus!: AppContext['setSurveyStatus'];
  readonly startFeedbackPopupCountdown!: AppContext['startFeedbackPopupCountdown'];
  readonly startSurveyPopupCountdown!: AppContext['startSurveyPopupCountdown'];
  readonly popupQueue!: AppContext['popupQueue'];

  ////////////////////////////////////////////////////////////////////
  // User data and authentication
  ////////////////////////////////////////////////////////////////////

  #userData = $state<BasicUserData | undefined>(undefined);

  // CONS-03 / Pitfall 2: do NOT spread the auth context. Object spread (or
  // Object.assign) invokes the source's isAuthenticated $derived getter exactly
  // once at init time and captures the boolean by value, de-reactivating admin
  // auth gating (the nav would show authenticated links to a logged-out user
  // until a hard refresh). This prototype getter re-reads the live $derived on
  // every access instead.
  get isAuthenticated() {
    return this.#authContext.isAuthenticated;
  }

  // The four auth functions are plain (non-reactive) fns — forwarding by
  // reference as arrow fields is correct. (No authContext spread/assign exists,
  // so these are never clobbered — see the class JSDoc getter-collision audit.)
  logout = this.#authContext.logout;
  requestForgotPasswordEmail = this.#authContext.requestForgotPasswordEmail;
  resetPassword = this.#authContext.resetPassword;
  setPassword = this.#authContext.setPassword;

  get userData() {
    return this.#userData;
  }
  set userData(v) {
    this.#userData = v;
  }

  ////////////////////////////////////////////////////////////////////
  // Admin functions
  ////////////////////////////////////////////////////////////////////

  jobs = jobStores();

  ////////////////////////////////////////////////////////////////////
  // Wrappers for DataWriter methods
  // NB. These automatically handle authentication. They are arrow fields
  // (CONVENTIONS §18) so they survive detach from the instance.
  ////////////////////////////////////////////////////////////////////

  /**
   * Inject authToken into requests. With Supabase, auth is cookie-based so
   * authToken is passed as '' to satisfy the WithAuth type constraint.
   */
  #injectAuthToken = <TParams extends { authToken?: string }>(opts: TParams): TParams & WithAuth => {
    return { authToken: '', ...opts };
  };

  updateQuestion = (
    opts: WithOptionalAuth<Parameters<DataWriter['updateQuestion']>[0]>
  ): ReturnType<DataWriter['updateQuestion']> => {
    return prepareDataWriter(dataWriterPromise).then((dw) => dw.updateQuestion(this.#injectAuthToken(opts)));
  };

  getActiveJobs = (
    opts: WithOptionalAuth<Parameters<DataWriter['getActiveJobs']>[0]>
  ): ReturnType<DataWriter['getActiveJobs']> => {
    return prepareDataWriter(dataWriterPromise).then((dw) => dw.getActiveJobs(this.#injectAuthToken(opts)));
  };

  getPastJobs = (
    opts: WithOptionalAuth<Parameters<DataWriter['getPastJobs']>[0]>
  ): ReturnType<DataWriter['getPastJobs']> => {
    return prepareDataWriter(dataWriterPromise).then((dw) => dw.getPastJobs(this.#injectAuthToken(opts)));
  };

  startJob = (
    opts: WithOptionalAuth<Parameters<DataWriter['startJob']>[0]>
  ): ReturnType<DataWriter['startJob']> => {
    return prepareDataWriter(dataWriterPromise).then((dw) => dw.startJob(this.#injectAuthToken(opts)));
  };

  getJobProgress = (
    opts: WithOptionalAuth<Parameters<DataWriter['getJobProgress']>[0]>
  ): ReturnType<DataWriter['getJobProgress']> => {
    return prepareDataWriter(dataWriterPromise).then((dw) => dw.getJobProgress(this.#injectAuthToken(opts)));
  };

  abortJob = (
    opts: WithOptionalAuth<Parameters<DataWriter['abortJob']>[0]>
  ): ReturnType<DataWriter['abortJob']> => {
    return prepareDataWriter(dataWriterPromise).then((dw) => dw.abortJob(this.#injectAuthToken(opts)));
  };

  abortAllJobs = (
    opts: WithOptionalAuth<Parameters<DataWriter['abortAllJobs']>[0]>
  ): ReturnType<DataWriter['abortAllJobs']> => {
    return prepareDataWriter(dataWriterPromise).then((dw) => dw.abortAllJobs(this.#injectAuthToken(opts)));
  };

  insertJobResult = (
    opts: WithOptionalAuth<Parameters<DataWriter['insertJobResult']>[0]>
  ): ReturnType<DataWriter['insertJobResult']> => {
    return prepareDataWriter(dataWriterPromise).then((dw) => dw.insertJobResult(this.#injectAuthToken(opts)));
  };

  constructor() {
    ////////////////////////////////////////////////////////////
    // Inheritance from other Contexts
    ////////////////////////////////////////////////////////////
    //
    // Reproduce the former `...appContext` spread: appContext is an own-enumerable
    // class instance (Phase-109 AppContextProvider), so Object.assign copies its
    // members onto this instance. authContext is NOT assigned — its members are
    // forwarded individually above (the v2.11 auth-forwarding fix). appContext
    // carries NO auth key, so this assign cannot overwrite isAuthenticated (a
    // getter-only accessor) or the auth arrow fields — no exclusion needed.
    //
    // Phase 113 CR-01: inheritContextMembers (NOT Object.assign) forwards the bare
    // reactive accessors (appSettings / dataRoot / locale) as LIVE accessors;
    // Object.assign would snapshot and freeze their reactivity for consumers.
    inheritContextMembers(this, this.#appContext);
  }
}

export function getAdminContext(): AdminContext {
  if (!hasContext(CONTEXT_KEY)) error(500, 'getAdminContext() called before initAdminContext()');
  return getContext<AdminContext>(CONTEXT_KEY);
}

export function initAdminContext(): AdminContext {
  if (hasContext(CONTEXT_KEY)) error(500, 'initAdminContext() called for a second time');
  return setContext<AdminContext>(CONTEXT_KEY, new AdminContextProvider());
}
