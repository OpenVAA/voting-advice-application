/**
 * SvelteKit param matcher for the plural entity-type URL segment in `/results`.
 *
 * Accepts the American-spelled plurals that correspond to the `ENTITY_TYPE`
 * enum (`candidate`, `organization`, `alliance`) in `@openvaa/data`:
 *   - `candidates`    → list-view scope = candidate
 *   - `organizations` → list-view scope = organization
 *   - `alliances`     → list-view scope = alliance (Phase 69 ALLIANCE-01)
 *
 * All other values return `false` and SvelteKit serves its built-in 404
 * before the page component mounts (threats T-62-04 / T-69-01). Strict
 * boolean-OR allowlist — no regex, no glob, no user-supplied predicate.
 *
 * The matcher filename MUST equal the folder-bracket name used in routes
 * (e.g. `[[entityTypePlural=entityTypePlural]]`) — see Phase 62 RESEARCH
 * §Pitfall 7.
 */
export function match(param: string): param is 'candidates' | 'organizations' | 'alliances' {
  return param === 'candidates' || param === 'organizations' || param === 'alliances';
}
