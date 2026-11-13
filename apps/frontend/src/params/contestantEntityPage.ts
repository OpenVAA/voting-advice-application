/**
 * The entity pages of the Contestant App that are a single path segment.
 */
const SINGLE_SEGMENT_PAGES: ReadonlyArray<string> = ['profile', 'questions', 'preview', 'nominations'];

/**
 * The path prefix of the page of one question.
 */
const QUESTION_PREFIX = 'questions/';

/**
 * SvelteKit param matcher for an entity sub-path of the Contestant App named without an entity, used on a rest segment.
 *
 * A rest segment's matcher receives the remaining path joined with `/`. Accept-set is exactly the entity sub-paths the app has:
 *   - `profile`
 *   - `questions`
 *   - `questions/<one non-empty segment holding no slash>`
 *   - `preview`
 *   - `nominations`
 *
 * The settings page is not among them: it belongs to the user rather than to an entity and has its own route at the app root.
 *
 * It is `false` for the empty string, which is what a rest segment's matcher receives when the rest is empty, so a route that uses it never competes for the app root.
 *
 * Invalid values → SvelteKit built-in 404, so an unknown path under the app is not turned into a login redirect. Strict allowlist — no glob, no user-supplied predicate.
 *
 * The matcher filename MUST equal the name used in the route brackets (e.g. `[...page=contestantEntityPage]`).
 */
export function match(param: string): boolean {
  if (SINGLE_SEGMENT_PAGES.includes(param)) return true;
  if (!param.startsWith(QUESTION_PREFIX)) return false;
  const questionId = param.slice(QUESTION_PREFIX.length);
  return questionId !== '' && !questionId.includes('/');
}
