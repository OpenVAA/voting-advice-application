/**
 * SvelteKit param matcher for the singular entity-type URL segment in `/results`.
 *
 * Accepts only the American-spelled singulars that correspond to the
 * `ENTITY_TYPE` enum (`candidate`, `organization`, `alliance`) in `@openvaa/data`:
 *   - `candidate`    → drawer-entity type = candidate
 *   - `organization` → drawer-entity type = organization
 *   - `alliance`     → drawer-entity type = alliance (Phase 69 ALLIANCE-01)
 *
 * Explicitly does NOT accept the legacy value `party` — Phase 62 Open
 * Question 2 RESOLVED: no runtime consumer of `entityType=party` in the URL
 * remains, so the old `entityType.ts` matcher (which accepted `party`) is
 * dead legacy and is being deleted alongside this file's introduction.
 *
 * Invalid values → SvelteKit built-in 404 (threats T-62-04 / T-69-01).
 * Strict boolean-OR allowlist — no regex, no glob, no user-supplied predicate.
 *
 * The matcher filename MUST equal the folder-bracket name used in routes
 * (e.g. `[[entityTypeSingular=entityTypeSingular]]`) — see Phase 62
 * RESEARCH §Pitfall 7.
 */
export function match(param: string): param is 'candidate' | 'organization' | 'alliance' {
  return param === 'candidate' || param === 'organization' || param === 'alliance';
}
