/**
 * SvelteKit param matcher for the singular entity-type URL segment in `/results`.
 *
 * Accepts only the American-spelled singulars that correspond to the
 * `ENTITY_TYPE` enum (`candidate`, `organization`) in `@openvaa/data`:
 *   - `candidate`    → drawer-entity type = candidate
 *   - `organization` → drawer-entity type = organization
 *
 * Explicitly does NOT accept the legacy value `party` — Phase 62 Open
 * Question 2 RESOLVED: no runtime consumer of `entityType=party` in the URL
 * remains, so the old `entityType.ts` matcher (which accepted `party`) is
 * dead legacy and is being deleted alongside this file's introduction.
 *
 * Invalid values → SvelteKit built-in 404 (threat T-62-04).
 *
 * The matcher filename MUST equal the folder-bracket name used in routes
 * (e.g. `[[entityTypeSingular=entityTypeSingular]]`) — see Phase 62
 * RESEARCH §Pitfall 7.
 */
export function match(param: string): param is 'candidate' | 'organization' {
  return param === 'candidate' || param === 'organization';
}
