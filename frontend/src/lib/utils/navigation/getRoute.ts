import { error } from '@sveltejs/kit';
import { derived, get } from 'svelte/store';
import { page } from '$app/stores';
import { settings } from '$lib/stores';
import { ROUTE } from './route';
import type { Route } from './route';

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
 * @example `$getRoute(ROUTE.Home)`: Go home
 * @example `$getRoute({route: ROUTE.Candidate, id: 123})`: Show candidate with id 123
 * @example `$getRoute({route: ROUTE.Candidates, locale: 'fi'})`: Show candidates page in Finnish
 * @example `$getRoute({route: ROUTE.CandAppRegister, params: {registrationCode: '123}})`: Go to candidate registration page with the code prefilled
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
  // Shorthand function call
  if (typeof options === 'string') options = {route: options};

  let locale = options.locale;
  const {route, params} = options;
  let {id} = options;

  // Not route defined, so we just swap the locale
  if (locale && route == null) {
    const $page = get(page);
    const url = $page.url.pathname;
    const currentLocale = $page.params.lang;
    return (
      url.replace(RegExp(`^/${currentLocale}`), locale === 'none' ? '' : `/${locale}`) +
      $page.url.search
    );
  } else if (route == null) {
    throw error(500, 'Either a route or a locale must be specified');
  }

  // Build a new route
  locale ??= get(page).params.lang;
  if (locale === 'none') locale = '';
  const parts = ['']; // This will add the initial slash
  if (locale) parts.push(locale);

  // If the `questions.questionsIntro.show` setting is false, we bypass the intro page
  if (route === ROUTE.Questions && id == null && !get(settings).questions?.questionsIntro?.show) {
    parts.push(ROUTE.Question);
    id = FIRST_QUESTION_ID;
  } else if (route) {
    parts.push(route);
  }

  if (id) parts.push(id);
  let url = parts.join('/');
  if (params) url += `?${new URLSearchParams(params).toString()}`;
  return url;
}
