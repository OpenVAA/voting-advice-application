import { isCanonicalUuid } from '$lib/utils/uuid';

/**
 * SvelteKit param matcher for a URL segment that names a row by its uuid.
 *
 * Accepts exactly the canonical textual form of a uuid, in lower case. An id with an upper-case digit is a 404, never a redirect for an entity the user is not listed with. It checks the form, not that a row with the id exists or that the caller may read it, which the load decides.
 *
 * Invalid values → SvelteKit built-in 404, so a malformed id never reaches a query whose parameter is typed `uuid`.
 *
 * The matcher filename MUST equal the name used in the route brackets (e.g. `[entityId=uuid]`).
 */
export function match(param: string): boolean {
  return isCanonicalUuid(param);
}
