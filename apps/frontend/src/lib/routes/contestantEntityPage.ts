import type { Route } from './route';

/** The route of each entity page of the Contestant App that is a single path segment. */
const SINGLE_SEGMENT_ROUTES: ReadonlyMap<string, Route> = new Map([
  ['profile', 'ContestantAppProfile'],
  ['questions', 'ContestantAppQuestions'],
  ['preview', 'ContestantAppPreview'],
  ['nominations', 'ContestantAppNominations']
]);

/** The path prefix of the page of one question. */
const QUESTION_PREFIX = 'questions/';

/** The characters an id is made of. A segment holding anything else, a separator included, names no page. */
const PLAIN_ID = /^[A-Za-z0-9_-]+$/;

/**
 * The route and the params of the entity page of the Contestant App that a sub-path names without an entity, such as `profile` or `questions/<questionId>`.
 *
 * The sub-paths that name a page are exactly:
 *   - `profile`
 *   - `questions`
 *   - `questions/<a plain id>`
 *   - `preview`
 *   - `nominations`
 *
 * The settings page is not among them: it belongs to the user rather than to an entity and has its own route at the app root.
 *
 * @param page - The sub-path, relative to the app root.
 * @returns What to build the page's route from, or `undefined` when the sub-path names no page.
 */
export function entityPageOf(page: string): { route: Route; questionId?: string } | undefined {
  const route = SINGLE_SEGMENT_ROUTES.get(page);
  if (route) return { route };
  if (!page.startsWith(QUESTION_PREFIX)) return undefined;
  const questionId = page.slice(QUESTION_PREFIX.length);
  return PLAIN_ID.test(questionId) ? { route: 'ContestantAppQuestion', questionId } : undefined;
}
