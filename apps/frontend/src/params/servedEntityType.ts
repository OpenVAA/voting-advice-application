import { SERVED_ENTITY_TYPES } from '@openvaa/app-shared';
import type { ServedEntityType } from '@openvaa/app-shared';

/**
 * SvelteKit param matcher for the entity-type URL segment of the Contestant App.
 *
 * Accept-set is exactly `SERVED_ENTITY_TYPES`, the vocabulary of entity types the app can serve:
 *   - `candidate`
 *   - `organization`
 *
 * It checks the vocabulary, not what this project serves: a matcher has no access to settings, so whether the project serves the type is decided by the load. `alliance` and `faction` are entity types the app never serves and are rejected here.
 *
 * Invalid values → SvelteKit built-in 404, which is what keeps an attacker-supplied segment from reaching the load. Strict allowlist over a constant — no regex, no glob, no user-supplied predicate.
 *
 * The matcher filename MUST equal the name used in the route brackets (e.g. `[entityType=servedEntityType]`).
 */
export function match(param: string): param is ServedEntityType {
  return (SERVED_ENTITY_TYPES as ReadonlyArray<string>).includes(param);
}
