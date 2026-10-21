/**
 * SvelteKit param matcher for the singular entity-type URL segment in `/results` (short-name alias of `entityTypeSingular`). The short name keeps the 4-segment results route shape `/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]` readable in directory listings.
 *
 * Accept-set is identical to `entityTypeSingular`:
 *   - `candidate`    → drawer-entity type = candidate
 *   - `organization` → drawer-entity type = organization
 *   - `alliance`     → drawer-entity type = alliance
 *
 * American spelling.
 *
 * Explicitly does NOT accept the legacy value `party` — no runtime consumer of `entityType=party` in the URL remains.
 *
 * Invalid values → SvelteKit built-in 404, which is what keeps an attacker-supplied segment from reaching the page. Strict boolean-OR allowlist — no regex, no glob, no user-supplied predicate.
 *
 * The matcher filename MUST equal the folder-bracket name used in routes (e.g. `[[entity=etSg]]`).
 */
export function match(param: string): param is 'candidate' | 'organization' | 'alliance' {
  return param === 'candidate' || param === 'organization' || param === 'alliance';
}
