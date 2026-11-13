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
 * `isAuthenticated` is a PROTOTYPE GETTER re-reading the LIVE authContext `$derived` on every access (NOT a spread-captured boolean). `setPassword` is a plain non-reactive fn forwarded by reference as an arrow field. `logout` is an arrow field of this class: it clears `#logoutFailed` as it starts and awaits the authContext's `logout`, and on a rejection it sets the flag and rethrows. After a sign-out that worked it removes the Contestant App's drafts from the browser; one that failed leaves them.
 * See the inline comment on the getter for the why.
 *
 * ── The entry flow ───────────────────────────────────────────────────────────
 * The forgot-password and "email sent" pages keep their one link request in the private `EntryFlowHolder` `#entryFlow`, as the contestant context does. Its request function asks a request from the forgot-password page with an address for a recovery link made for the Admin App, in the context's locale at the call, and asks nothing for any other request. `sendEntryLink`, `resendEntryLink` and `clearEntryFlow` are arrow fields forwarding to the holder; `entryFlow` is a prototype getter, a reactive accessor. A Log out that worked lets the flow go; one that failed keeps it.
 *
 * ── Getter-collision audit ──────────────────────────────────────────────────
 * AppContext exposes NONE of `isAuthenticated` / `logout` / `setPassword` / `logoutFailed` / `clearLogoutFailure` / `entryFlow` / `sendEntryLink` / `resendEntryLink` / `clearEntryFlow` (verified). So forwarding appContext onto `this` cannot overwrite any of them, and the getter-only `isAuthenticated` and `logoutFailed` accessors are never an assign target → the `TypeError: Cannot set property which has only a getter` path is STRUCTURALLY absent. Admin's `logout` and `clearLogoutFailure` are PLAIN arrow fields, and nothing assigns over them, so no exclusion-on-assign is needed. Do NOT add any `Object.assign` that carries an `isAuthenticated` (or other auth) key onto the instance.
 *
 * ── Field-init order / no $effect ────────────────────────────────────────────
 * The private base fields, the `#userData` and `#logoutFailed` `$state`, `jobs`, the auth members, and the DataWriter wrapper arrow fields are field initializers (run in declaration order BEFORE the constructor body). The constructor forwards the appContext members and registers two `onMount`s, each stopped when the layout that built the context is destroyed. One subscribes to the sign-outs the tab's client reports: after a sign-out this document did not start, the Contestant App's drafts are removed from the browser, and a page that reads as signed in goes to the login page. The other listens for the Log out announcements of the browser's other tabs, so that the login page says the user was logged out in another tab or window only when, at the client's `SIGNED_OUT` report, this document had heard another tab announce the `start` of its Log out with no `end` since, no more than `LOGOUT_IN_FLIGHT_CAP_MS` before, or its `end` no more than `LOGOUT_ANNOUNCEMENT_WINDOW_MS` before; any other such sign-out, such as one the auth client makes by itself when it finds the session gone or a refresh refused, goes to the login page with no reason. adminContext has NO `$effect` — do NOT introduce one. What must follow the session, such as withdrawing the message of a failed sign-out, lives in a component: `routes/admin/+layout.svelte`.
 *
 * @internal — test seam — do not construct directly; use `initAdminContext()`.
 * Calling `new AdminContextProvider()` outside `initAdminContext()` bypasses the `CONTEXT_KEY` double-init guard. Construction calls `onMount`, so it must run during a component's initialisation; the canonical entry point remains `initAdminContext()`.
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
