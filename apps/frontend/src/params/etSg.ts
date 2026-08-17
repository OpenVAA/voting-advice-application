/**
 * SvelteKit param matcher for the singular entity-type URL segment in
 * `/results` (short-name alias of `entityTypeSingular`, introduced by Phase
 * 88 to make the new 4-segment results route shape
 * `/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]`
 * readable in directory listings).
 *
 * Accept-set is identical to `entityTypeSingular`:
 *   - `candidate`    → drawer-entity type = candidate
 *   - `organization` → drawer-entity type = organization
 *   - `alliance`     → drawer-entity type = alliance (see phase 69)
 *
 * American spelling (see phase 62).
 *
 * Explicitly does NOT accept the legacy value `party` — no runtime consumer
 * of `entityType=party` in the URL remains.
 *
 * Invalid values → SvelteKit built-in 404 (threats T-62-04 / T-69-01).
 * Strict boolean-OR allowlist — no regex, no glob, no user-supplied predicate.
 *
 * The matcher filename MUST equal the folder-bracket name used in routes
 * (e.g. `[[entity=etSg]]`) — see phase 62.
 */
export function match(param: string): param is 'candidate' | 'organization' | 'alliance' {
  return param === 'candidate' || param === 'organization' || param === 'alliance';
}
