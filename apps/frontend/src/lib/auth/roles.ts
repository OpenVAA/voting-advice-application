import type { EntityType } from '@openvaa/data';

/**
 * Whether any of the claimed grants has one of the shapes that open an entry point.
 *
 * A pure set-membership test over `(scope, role)` pairs: it performs no I/O and mutates neither argument. An empty claims list is `false`, so the gate denies by default. A shape that names a `target_type` also requires the claim's entity type to match it; a shape without one matches any.
 *
 * Matching on the pair rather than the role alone is what separates the populations: an entity-scope `admin` grant holds no permissions and must open nothing, and a project-scope `editor` belongs in the Admin App, not the Candidate App.
 * @param claims - The grant claims read out of an access token.
 * @param allowed - The shapes that open the entry point being gated.
 * @returns `true` when at least one claimed grant matches an allowed shape.
 */
export function hasAnyGrant(claims: ReadonlyArray<GrantClaim>, allowed: ReadonlyArray<GrantShape>): boolean {
  return claims.some((claim) =>
    allowed.some(
      (shape) =>
        shape.scope === claim.scope &&
        shape.role === claim.role &&
        (shape.target_type === undefined || shape.target_type === claim.target_type)
    )
  );
}

/**
 * Read the grant claims out of an access token's payload.
 *
 * Fails closed: a token that is not a JWT, a payload that does not decode or is not JSON, and a missing or non-array `grants` key all yield the empty list, which fails every gate. Entries that are not objects carrying both a `scope` string and a `role` string are dropped. The payload is unvalidated JSON, and the return type is an assertion about its shape, not a check of its values.
 *
 * The decode does not verify the signature. That is safe only because the token comes from a session `safeGetSession` has already verified, and every query is re-checked server side. Do not call this on a token taken straight off a request.
 * @param accessToken - The access token whose claims to read.
 * @returns The well-formed grant claims, or an empty list.
 */
export function readGrants(accessToken: string): Array<GrantClaim> {
  const payload = decodeTokenPayload(accessToken);
  const claimed = payload?.grants;
  if (!Array.isArray(claimed)) return [];
  return claimed.filter(isGrantClaim);
}

/**
 * The grant shapes that open the Admin App.
 *
 * This is an app-entry gate, not the authorisation boundary: row-level security decides what an admin may read or write. Widening the set grants no data access, and narrowing it hides the app from someone the database would still serve.
 *
 * An `admin` grant at global, account or project scope carries permissions. An `admin` grant at entity scope carries none, so it is not listed and opens nothing.
 */
export const ADMIN_GRANTS = [
  { scope: 'global', role: 'admin' },
  { scope: 'account', role: 'admin' },
  { scope: 'project', role: 'admin' }
] as const satisfies ReadonlyArray<GrantShape>;

/**
 * The grant shapes that open the Candidate App.
 *
 * An app-entry gate like `ADMIN_GRANTS`; the database's policies are authoritative. Only the candidate entity editor is admitted. Organization, faction and alliance editors hold the same `(entity, editor)` pair with a different `target_type`, and the Candidate App cannot load their user data.
 */
export const CANDIDATE_GRANTS = [
  { scope: 'entity', role: 'editor', target_type: 'candidate' }
] as const satisfies ReadonlyArray<GrantShape>;

/**
 * One grant assignment, as it appears in an access token's `grants` claim.
 *
 * The keys are columns of the database's `grants` table. The gates match `scope`, `role` and `target_type`; `target_id` is answered server side.
 */
export type GrantClaim = {
  scope: GrantScope;
  target_type: string | null;
  target_id: string | null;
  role: GrantRole;
};

/**
 * A `(scope, role)` pair an app-entry gate matches on, optionally narrowed to one entity type.
 */
export type GrantShape = { scope: GrantScope; role: GrantRole; target_type?: EntityType };

/**
 * The grant scopes.
 *
 * The database's `grant_scope_type` enum is the source of truth. The frontend keeps its own copy so that it does not depend on the generated database types, and `supabaseTypes.parity.test.ts`, next to the Supabase adapter, fails when the two disagree. The same holds for `GRANT_ROLES` and the entity types.
 */
export const GRANT_SCOPES = ['global', 'account', 'project', 'entity'] as const;

/**
 * A grant scope.
 */
export type GrantScope = (typeof GRANT_SCOPES)[number];

/**
 * The grant role levels, mirroring the database's `grant_role_type` enum.
 */
export const GRANT_ROLES = ['admin', 'editor'] as const;

/**
 * A grant role level.
 */
export type GrantRole = (typeof GRANT_ROLES)[number];

/**
 * Decode a JWT's payload segment without verifying anything about it.
 *
 * JWT segments use the base64url alphabet and carry no padding, and `atob` accepts neither, so both are normalised before decoding.
 * @param token - The raw token.
 * @returns The payload object, or `undefined` for anything that does not yield a JSON object.
 */
function decodeTokenPayload(token: string): Record<string, unknown> | undefined {
  const segment = token.split('.')[1];
  if (!segment) return undefined;
  try {
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const parsed: unknown = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')));
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Whether one entry of a decoded `grants` claim has the shape this module reads.
 *
 * The value is untrusted, so anything but an object with a `scope` string and a `role` string is rejected here rather than thrown on later. Whether the names are known ones is decided by `hasAnyGrant` against an explicit set of shapes.
 * @param value - One entry of the decoded claim.
 * @returns `true` when the entry carries both a `scope` string and a `role` string.
 */
function isGrantClaim(value: unknown): value is GrantClaim {
  if (typeof value !== 'object' || value === null) return false;
  const entry = value as { scope?: unknown; role?: unknown };
  return typeof entry.scope === 'string' && typeof entry.role === 'string';
}
