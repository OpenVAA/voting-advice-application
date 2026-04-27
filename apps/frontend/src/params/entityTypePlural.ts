/**
 * SvelteKit param matcher for the plural entity-type URL segment in `/results`.
 *
 * Accepts the American-spelled plurals that correspond to the `ENTITY_TYPE`
 * enum (`candidate`, `organization`) in `@openvaa/data`:
 *   - `candidates`    → list-view scope = candidate
 *   - `organizations` → list-view scope = organization
 *
 * All other values return `false` and SvelteKit serves its built-in 404
 * before the page component mounts (threat T-62-04).
 *
 * The matcher filename MUST equal the folder-bracket name used in routes
 * (e.g. `[[entityTypePlural=entityTypePlural]]`) — see Phase 62 RESEARCH
 * §Pitfall 7.
 */
export function match(param: string): param is 'candidates' | 'organizations' {
  return param === 'candidates' || param === 'organizations';
}
