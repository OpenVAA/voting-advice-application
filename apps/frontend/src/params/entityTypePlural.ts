/**
 * SvelteKit param matcher for the plural entity-type segment `entityTab` of `/results/[[electionTab]]/[[entityTab=entityTypePlural]]/[[entity=entityTypeSingular]]/[[id]]`.
 *
 * Accepts `candidates` | `organizations` | `alliances`. For any other value SvelteKit serves its 404 before the page mounts.
 *
 * The filename must equal the matcher name in the route brackets.
 */
export function match(param: string): param is 'candidates' | 'organizations' | 'alliances' {
  return param === 'candidates' || param === 'organizations' || param === 'alliances';
}
