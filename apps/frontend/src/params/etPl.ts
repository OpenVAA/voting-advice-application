/**
 * SvelteKit param matcher for the plural entity-type URL segment in `/results`
 * (short-name alias of `entityTypePlural`, introduced by Phase 88 Plan 88-02
 * to make the new 4-segment results route shape
 * `/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]`
 * readable in directory listings).
 *
 * Accept-set is identical to `entityTypePlural`:
 *   - `candidates`    → list-view scope = candidate
 *   - `organizations` → list-view scope = organization
 *   - `alliances`     → list-view scope = alliance (Phase 69 ALLIANCE-01)
 *
 * American spelling per Phase 62 Open Question 1 RESOLVED.
 *
 * All other values return `false` and SvelteKit serves its built-in 404
 * before the page component mounts (threats T-62-04 / T-69-01). Strict
 * boolean-OR allowlist — no regex, no glob, no user-supplied predicate.
 *
 * The matcher filename MUST equal the folder-bracket name used in routes
 * (e.g. `[[entityTab=etPl]]`) — see Phase 62 RESEARCH §Pitfall 7.
 */
export function match(param: string): param is 'candidates' | 'organizations' | 'alliances' {
  return param === 'candidates' || param === 'organizations' || param === 'alliances';
}
