import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext } from 'svelte';
import { jobStates } from './jobStates.svelte';
import { getAppContext } from '../app';
import { getAuthContext } from '../auth';
import { inheritContextMembers } from '../utils/inheritContextMembers';
import { prepareAdminWriter } from '../utils/prepareAdminWriter';
import { prepareDataWriter } from '../utils/prepareDataWriter';
import type { BasicUserData, DataWriter } from '$lib/api/base/dataWriter.type';
import type { AppContext } from '../app';
import type { AdminContext } from './adminContext.type';

const CONTEXT_KEY = Symbol('admin');

/**
 * The admin context (orchestrator) as a Svelte 5 CLASS (`AdminContextProvider`).
 * Constructed via `new AdminContextProvider()` inside `initAdminContext()`, at component-init time.
 *
 * ── Two-base composition ────────────────────────────────────────────────────
 * adminContext inherits appContext + delegates authContext. The INHERITED appContext members are reproduced by forwarding from `this.#appContext` in the constructor rather than by an `{ ...appContext }` spread — appContext's members are own-enumerable, which is what makes the forward possible.
 * authContext is NOT spread/assigned at all: its members arrive ONLY via the individual forwards below (see next block).
 *
 * ── Auth forwarding — the ONLY sharp edge ────────────────────────────────────
 * `isAuthenticated` is a PROTOTYPE GETTER re-reading the LIVE authContext `$derived` on every access (NOT a spread-captured boolean). The four auth FUNCTIONS are plain non-reactive fns forwarded by reference as arrow fields.
 * See the inline comment on the getter for the why.
 *
 * ── Getter-collision audit ──────────────────────────────────────────────────
 * AppContext exposes NONE of `isAuthenticated` / `logout` / `requestForgotPasswordEmail` / `resetPassword` / `setPassword` (verified). So forwarding appContext onto `this` cannot overwrite any auth member, and the getter-only `isAuthenticated` accessor is never an assign target → the `TypeError: Cannot set property which has only a getter` path is STRUCTURALLY absent. Unlike candidateContext, admin's `logout` is NOT wrapped (no getter-only override): it is a PLAIN arrow field, and nothing assigns over it, so no exclusion-on-assign is needed. Do NOT add any `Object.assign` that carries an `isAuthenticated` (or other auth) key onto the instance.
 *
 * ── Field-init order / no $effect ────────────────────────────────────────────
 * The private base fields, `#userData` `$state`, `jobs`, the auth forwards, and the DataWriter wrapper arrow fields are field initializers (run in declaration order BEFORE the constructor body). The ONLY constructor work is the single `Object.assign(this, this.#appContext)`. adminContext has NO `$effect` — do NOT introduce one.
 *
 * @internal — test seam — do not construct directly; use `initAdminContext()`.
 * Calling `new AdminContextProvider()` outside `initAdminContext()` bypasses the `CONTEXT_KEY` double-init guard. (No `$effect` is used, so construction does not itself require an effect context, but the canonical entry point remains `initAdminContext()`.)
 */
export class AdminContextProvider implements AdminContext {
  ////////////////////////////////////////////////////////////
  // Inheritance from other Contexts (field initializers — they run BEFORE the constructor body in declaration order). The appContext members are reproduced via `Object.assign(this, this.#appContext)` in the constructor; the authContext members arrive ONLY via the individual forwards below (NOT spread — see the auth-forwarding block in the class JSDoc).
  ////////////////////////////////////////////////////////////

  #appContext = getAppContext();
  #authContext = getAuthContext();

  ////////////////////////////////////////////////////////////
  // Inherited appContext members (declared for `implements AdminContext`; INSTALLED via `Object.assign(this, this.#appContext)` in the constructor from the own-enumerable AppContextProvider instance). Definite-assignment `!`.
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

  // Do NOT spread the auth context. Object spread (or Object.assign) invokes the source's isAuthenticated $derived getter exactly once at init time and captures the boolean by value, de-reactivating admin auth gating (the nav would show authenticated links to a logged-out user until a hard refresh). This prototype getter re-reads the live $derived on every access instead.
  get isAuthenticated() {
    return this.#authContext.isAuthenticated;
  }

  // The four auth functions are plain (non-reactive) fns — forwarding by reference as arrow fields is correct. (No authContext spread/assign exists, so these are never clobbered — see the class JSDoc getter-collision audit.)
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

  jobs = jobStates();

  ////////////////////////////////////////////////////////////////////
  // Wrappers for writer methods NB. Authentication is carried by the Supabase session cookie, not by these wrappers. They are arrow fields so they survive detach from the instance.
  // `updateQuestion` and `insertJobResult` build an admin writer for the single call they make; the rest build a DataWriter the same way, and neither kind outlives the call it was built for.
  ////////////////////////////////////////////////////////////////////

  updateQuestion = (
    opts: Parameters<AdminContext['updateQuestion']>[0]
  ): ReturnType<AdminContext['updateQuestion']> => {
    return prepareAdminWriter().updateQuestion(opts);
  };

  getActiveJobs = (opts: Parameters<DataWriter['getActiveJobs']>[0]): ReturnType<DataWriter['getActiveJobs']> => {
    return prepareDataWriter().getActiveJobs(opts);
  };

  getPastJobs = (opts: Parameters<DataWriter['getPastJobs']>[0]): ReturnType<DataWriter['getPastJobs']> => {
    return prepareDataWriter().getPastJobs(opts);
  };

  startJob = (opts: Parameters<DataWriter['startJob']>[0]): ReturnType<DataWriter['startJob']> => {
    return prepareDataWriter().startJob(opts);
  };

  getJobProgress = (opts: Parameters<DataWriter['getJobProgress']>[0]): ReturnType<DataWriter['getJobProgress']> => {
    return prepareDataWriter().getJobProgress(opts);
  };

  abortJob = (opts: Parameters<DataWriter['abortJob']>[0]): ReturnType<DataWriter['abortJob']> => {
    return prepareDataWriter().abortJob(opts);
  };

  abortAllJobs = (): ReturnType<DataWriter['abortAllJobs']> => {
    return prepareDataWriter().abortAllJobs();
  };

  insertJobResult = (
    opts: Parameters<AdminContext['insertJobResult']>[0]
  ): ReturnType<AdminContext['insertJobResult']> => {
    return prepareAdminWriter().insertJobResult(opts);
  };

  constructor() {
    ////////////////////////////////////////////////////////////
    // Inheritance from other Contexts
    ////////////////////////////////////////////////////////////
    //
    // Forward appContext INSTEAD of spreading it: appContext is an own-enumerable class instance, so every member can be copied onto this instance.
    // authContext is NOT assigned — its members are forwarded individually above. appContext carries NO auth key, so this forward cannot overwrite isAuthenticated (a getter-only accessor) or the auth arrow fields — no exclusion needed.
    //
    // Use inheritContextMembers (NOT Object.assign) so the bare reactive accessors (appSettings / dataRoot / locale) are forwarded as LIVE accessors; Object.assign would snapshot and freeze their reactivity for consumers.
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
