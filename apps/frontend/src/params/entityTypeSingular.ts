/**
 * SvelteKit param matcher for the singular entity-type segment `entity` of `/results/[[electionTab]]/[[entityTab=entityTypePlural]]/[[entity=entityTypeSingular]]/[[id]]`.
 *
 * Accepts `candidate` | `organization` | `alliance`. A value that fails the matcher leaves this optional segment empty and moves on to the next optional segment; the results leaf's +page.ts answers the resulting matcher fallthrough with a 404.
 *
 * The filename must equal the matcher name in the route brackets.
 */
export function match(param: string): param is 'candidate' | 'organization' | 'alliance' {
  return param === 'candidate' || param === 'organization' || param === 'alliance';
}
