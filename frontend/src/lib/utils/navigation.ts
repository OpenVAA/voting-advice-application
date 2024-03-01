import {error} from '@sveltejs/kit';
import {get} from 'svelte/store';
import {page} from '$app/stores';

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
  CandAppQuestion = 'candidate/questions',
  CandAppQuestions = 'candidate/questions/summary',
  CandAppReady = 'candidate/questions/done',
  CandAppRegister = 'candidate/register',
  CandAppResetPassword = 'candidate/password-reset',
  CandAppSettings = 'candidate/settings',
  Candidate = 'candidates',
  Candidates = 'candidates',
  Help = 'help',
  Home = '',
  Info = 'info',
  Intro = 'intro',
  Parties = 'parties',
  Party = 'parties',
  Question = 'questions',
  Questions = 'questions',
  Result = 'results',
  Results = 'results',
  _Test = '_test'
}

/**
 * A locale-safe way to build route urls.
 * NB. The urls are built without a trailing slash. They will also a always contain a locale,
 * even if it's the default one.
 * @param route The predefined route to follow
 * @param id The possible id of the object to show, e.g. a candidate
 * @param locale An optional locale to use instead of the current one
 * @param params Optional query params to add to the url
 * @returns The url to navigate to
 *
 * @example `getRoute(Route.Home)`: Go home
 * @example `getRoute({route: Route.Candidate, id: 123})`: Show candidate with id 123
 * @example `getRoute({route: Route.Candidates, locale: 'fi'})`: Show candidates page in Finnish
 * @example `getRoute({route: Route.CandAppRegister, params: {registrationCode: '123}})`: Go to candidate registration page with the code prefilled
 * @example `getRoute({locale: 'fi'})`: Show current page in Finnish
 */
export function getRoute(route: Route): string;
export function getRoute(options: {
  route: Route;
  id?: string;
  locale?: string;
  params?: Record<string, string>;
}): string;
export function getRoute(options: {locale: string}): string;
export function getRoute(
  options:
    | Route
    | {route: Route; id?: string; locale?: string; params?: Record<string, string>}
    | {locale: string; id?: never; route?: never; params?: never}
): string {
  if (typeof options === 'string') options = {route: options};
  let locale = options.locale;
  const {id, route, params} = options;
  if (locale && route == null) {
    const $page = get(page);
    const url = $page.url.pathname;
    const currentLocale = $page.params.lang;
    return url.replace(RegExp(`^/${currentLocale}`), `/${locale}`);
  } else if (route == null) {
    throw error(500, 'Either a route or a locale must be specified');
  }
  locale ??= get(page).params.lang;
  const parts = ['']; // This will add the initial slash
  if (locale) parts.push(locale);
  if (route !== '') parts.push(route);
  if (id) parts.push(id);
  let url = parts.join('/');
  if (params) url += `?${new URLSearchParams(params).toString()}`;
  return url;
}
