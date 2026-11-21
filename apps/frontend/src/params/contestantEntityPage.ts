import { entityPageOf } from '$lib/routes';

/**
 * SvelteKit param matcher for an entity sub-path of the Contestant App named without an entity, used on a rest segment.
 *
 * A rest segment's matcher receives the remaining path joined with `/`. Accept-set is exactly the sub-paths `entityPageOf` resolves to a page, so a question segment that is not a plain id is rejected here.
 *
 * It is `false` for the empty string, which is what a rest segment's matcher receives when the rest is empty, so a route that uses it never competes for the app root.
 *
 * Invalid values → SvelteKit built-in 404, so an unknown path under the app is not turned into a login redirect. Strict allowlist — no glob, no user-supplied predicate.
 *
 * The matcher filename MUST equal the name used in the route brackets (e.g. `[...page=contestantEntityPage]`).
 */
export function match(param: string): boolean {
  return entityPageOf(param) !== undefined;
}
