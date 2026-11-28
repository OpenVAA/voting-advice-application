/**
 * SvelteKit param matcher for the singular entity-type segment `entity` of `/results/[[electionTab]]/[[entityTab=entityTypePlural]]/[[entity=entityTypeSingular]]/[[id]]`.
 *
 * Accepts `candidate` | `organization` | `alliance`. For any other value SvelteKit serves its 404 before the page mounts.
 *
 * The filename must equal the matcher name in the route brackets.
 */
export function match(param: string): param is 'candidate' | 'organization' | 'alliance' {
  return param === 'candidate' || param === 'organization' || param === 'alliance';
}
