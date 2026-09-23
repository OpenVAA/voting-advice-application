/**
 * SvelteKit param matcher for the plural entity-type URL segment in `/results` (short-name alias of `entityTypePlural`). The short name keeps the 4-segment results route shape `/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]` readable in directory listings.
 *
 * Accept-set is identical to `entityTypePlural`:
 *   - `candidates`    → list-view scope = candidate
 *   - `organizations` → list-view scope = organization
 *   - `alliances`     → list-view scope = alliance
 *
 * American spelling.
 *
 * All other values return `false` and SvelteKit serves its built-in 404 before the page component mounts, which is what keeps an attacker-supplied segment from reaching the page. Strict boolean-OR allowlist — no regex, no glob, no user-supplied predicate.
 *
 * The matcher filename MUST equal the folder-bracket name used in routes (e.g. `[[entityTab=etPl]]`).
 */
export function match(param: string): param is 'candidates' | 'organizations' | 'alliances' {
  return param === 'candidates' || param === 'organizations' || param === 'alliances';
}
