import { narrowEntityPlural } from '$lib/routes/resultsRoutes';
import type { EntityPlural } from '$lib/routes/resultsRoutes';

/**
 * SvelteKit param matcher for the plural entity-type segment `entityTab` of `/results/[[electionTab]]/[[entityTab=entityTypePlural]]/[[entity=entityTypeSingular]]/[[id]]`.
 *
 * Accepts `candidates` | `organizations` | `alliances`. For any other value SvelteKit serves its 404 before the page mounts.
 *
 * The filename must equal the matcher name in the route brackets.
 */
export function match(param: string): param is EntityPlural {
  return narrowEntityPlural(param) !== undefined;
}
