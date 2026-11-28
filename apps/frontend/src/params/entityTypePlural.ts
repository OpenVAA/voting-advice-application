import { narrowEntityPlural } from '$lib/routes/resultsRoutes';
import type { EntityPlural } from '$lib/routes/resultsRoutes';

/**
 * SvelteKit param matcher for the plural entity-type segment `entityTab` of `/results/[[electionTab]]/[[entityTab=entityTypePlural]]/[[entity=entityTypeSingular]]/[[id]]`.
 *
 * Accepts `candidates` | `organizations` | `alliances`. A value that fails the matcher leaves this optional segment empty and moves on to the next optional segment; the results leaf's +page.ts answers the resulting matcher fallthrough with a 404.
 *
 * The filename must equal the matcher name in the route brackets.
 */
export function match(param: string): param is EntityPlural {
  return narrowEntityPlural(param) !== undefined;
}
