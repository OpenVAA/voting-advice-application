/**
 * Resolve a request for an entity page of the Contestant App that names no entity, such as `/contestant/profile` or `/contestant/questions/<questionId>` (server-side). The route's matcher admits exactly the entity sub-paths the app has, so any other path under the app is not served here.
 *
 * 1. **The parent.** The user-level load's `gate` and `entities`, awaited before anything else. While a gate is pending the load returns an empty object and redirects nowhere, so the gate's view is shown at the URL the user asked for.
 * 2. **Exactly one entity.** The user is redirected to the same page under that entity.
 * 3. **Any other number of entities.** The user is redirected to the app root, which decides what such a user sees.
 *
 * The load never signs anyone out. Every target is built with `buildRoute` from a route key, and a question id that is not a plain id leads to the app root, so nothing of the requested path reaches the target unchecked.
 *
 * The load takes `params` and `parent` from the request event and nothing else. It reads the `page` param alone, and no `url` property and no `route`, so the query string of the request is not carried over.
 */

import { redirect } from '@sveltejs/kit';
import { getLocale } from '$lib/paraglide/runtime';
import { buildRoute } from '$lib/routes';
import type { Route } from '$lib/routes';

/** The route of each entity page that is a single path segment. */
const SINGLE_SEGMENT_ROUTES: ReadonlyMap<string, Route> = new Map([
  ['profile', 'ContestantAppProfile'],
  ['questions', 'ContestantAppQuestions'],
  ['preview', 'ContestantAppPreview'],
  ['nominations', 'ContestantAppNominations'],
  ['settings', 'ContestantAppSettings']
]);

/** The path prefix of the page of one question. */
const QUESTION_PREFIX = 'questions/';

/** The characters an id is made of. A decoded segment holding anything else, a separator included, is not passed into a redirect target. */
const PLAIN_ID = /^[A-Za-z0-9_-]+$/;

/**
 * The route and the params of the entity page a sub-path names.
 * @param page - The sub-path, as the `contestantEntityPage` matcher admits it and SvelteKit decodes it.
 * @returns What to build the page's route from, or `undefined` when the sub-path names no page.
 */
function entityPageOf(page: string): { route: Route; questionId?: string } | undefined {
  const route = SINGLE_SEGMENT_ROUTES.get(page);
  if (route) return { route };
  if (!page.startsWith(QUESTION_PREFIX)) return undefined;
  const questionId = page.slice(QUESTION_PREFIX.length);
  return PLAIN_ID.test(questionId) ? { route: 'ContestantAppQuestion', questionId } : undefined;
}

export async function load({ params, parent }) {
  const parentData = await parent();
  if (parentData.gate !== null) return {};
  const { entities } = parentData;

  const lang = getLocale();
  const appRoot = buildRoute({ route: 'ContestantAppHome', locale: lang });

  if (entities.length !== 1) redirect(307, appRoot);
  const [{ type, id }] = entities;

  const entityPage = entityPageOf(params.page);
  if (!entityPage) redirect(307, appRoot);

  redirect(
    307,
    buildRoute({
      ...entityPage,
      locale: lang,
      entityType: type,
      entityId: id
    })
  );
}
