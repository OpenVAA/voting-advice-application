import {error} from '@sveltejs/kit';
import {get, derived} from 'svelte/store';
import {page} from '$app/stores';
import {settings} from '$lib/utils/stores';

/**
 * The allowed routes
 */
export enum Route {
  About = 'about',
  CandAppFAQ = 'candidate/faq',
  CandAppFeedback = 'candidate/feedback',
  CandAppForgotPassword = 'candidate/forgot-password',
  CandAppHelp = 'candidate/help',
  CandAppHome = 'candidate',
  CandAppInfo = 'candidate/info',
  CandAppPreview = 'candidate/preview',
  CandAppProfile = 'candidate/profile',
  CandAppQuestions = 'candidate/questions',
  CandAppSummary = 'candidate/questions/summary',
  CandAppReady = 'candidate/questions/done',
  CandAppRegister = 'candidate/register',
  CandAppResetPassword = 'candidate/password-reset',
  CandAppSettings = 'candidate/settings',
  Candidate = 'candidates',
  Candidates = 'candidates',
  /** The Help route is currently redirected to About */
  Help = 'about',
  Home = '',
  Info = 'info',
  Intro = 'intro',
  Parties = 'parties',
  Party = 'parties',
  Question = 'questions',
  Questions = 'questions',
  ResultCandidate = 'results/candidate',
  ResultParty = 'results/party',
  Results = 'results',
  _Test = '_test'
}

/**
 * A special id used to mark the question to start from before question ids are available
 */
export const FIRST_QUESTION_ID = '__first__';

/**
 * A route containing a locale-safe function to build route urls. A store is used because the links depend on changes to the `$page` store and would not be updated upon, e.g., locale changes otherwise.
 * NB. The urls are built without a trailing slash. They will also a always contain a locale unless locale is `'none'`.
 * @param route The predefined route to follow
 * @param id The possible id of the object to show, e.g. a candidate
 * @param locale An optional locale to use instead of the current one or `'none'` to get the route without a locale for sharing
 * @param params Optional query params to add to the url
 * @returns The url to navigate to
 *
 * @example `$getRoute(Route.Home)`: Go home
 * @example `$getRoute({route: Route.Candidate, id: 123})`: Show candidate with id 123
 * @example `$getRoute({route: Route.Candidates, locale: 'fi'})`: Show candidates page in Finnish
 * @example `$getRoute({route: Route.CandAppRegister, params: {registrationCode: '123}})`: Go to candidate registration page with the code prefilled
 * @example `$getRoute({locale: 'fi'})`: Show current page in Finnish
 */
export const getRoute = derived(page, () => _getRoute);

function _getRoute(route: Route): string;
function _getRoute(options: {
  route: Route;
  id?: string;
  locale?: string | 'none';
  params?: Record<string, string>;
}): string;
function _getRoute(options: {locale: string}): string;
function _getRoute(
  options:
    | Route
    | {route: Route; id?: string; locale?: string; params?: Record<string, string>}
    | {locale: string; id?: never; route?: never; params?: never}
): string {
  if (typeof options === 'string') options = {route: options};
  let locale = options.locale;
  const {route, params} = options;
  let {id} = options;
  if (locale && route == null) {
    const $page = get(page);
    const url = $page.url.pathname;
    const currentLocale = $page.params.lang;
    return url.replace(RegExp(`^/${currentLocale}`), locale === 'none' ? '' : `/${locale}`);
  } else if (route == null) {
    throw error(500, 'Either a route or a locale must be specified');
  }
  locale ??= get(page).params.lang;
  if (locale === 'none') locale = '';
  const parts = ['']; // This will add the initial slash
  if (locale) parts.push(locale);
  // If the questions.showIntroPage setting is false, we bypass the intro page
  if (route === Route.Questions && !get(settings).questions?.showIntroPage) {
    parts.push(Route.Question);
    id = FIRST_QUESTION_ID;
  } else if (route !== '') {
    parts.push(route);
  }
  if (id) parts.push(id);
  let url = parts.join('/');
  if (params) url += `?${new URLSearchParams(params).toString()}`;
  return url;
}
