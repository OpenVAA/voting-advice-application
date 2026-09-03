import type { Enums } from '@openvaa/supabase-types';

/**
 * Whether any of the claimed roles is in the allowed set.
 *
 * A pure set-membership test: it performs no I/O, reads no module-level state and mutates neither argument, so the caller may hold the allowed set as a shared constant. An empty claims list is `false`, which is what makes the gate deny by default.
 * @param claims - The role claims read out of an access token.
 * @param allowed - The roles that open the entry point being gated.
 * @returns `true` when at least one claimed role is allowed.
 */
export function hasAnyRole(claims: ReadonlyArray<RoleClaim>, allowed: ReadonlyArray<UserRole>): boolean {
  return claims.some((claim) => allowed.includes(claim.role));
}

/**
 * Read the role claims out of an access token's payload.
 *
 * FAILS CLOSED, ALWAYS. A token that is not a JWT, a payload that does not decode, a payload that is not JSON, a payload with no roles key and a roles key that is not an array all yield the empty list rather than an exception — and the empty list fails every role gate. Individual entries that are not objects carrying a `role` string are dropped for the same reason. The payload is unvalidated, attacker-shaped JSON and nothing here narrows it beyond that shape; the annotation below is an assertion, not a check.
 *
 * The decode is deliberately signature-blind, and that is safe only in the position this helper is called from: the token comes from a session that has already been through the verifying round-trip in `safeGetSession`, and every subsequent query is re-checked server side. Do not call this on a token straight off a request.
 * @param accessToken - The access token whose claims to read.
 * @returns The well-formed role claims, or an empty list.
 */
export function readUserRoles(accessToken: string): Array<RoleClaim> {
  const payload = decodeTokenPayload(accessToken);
  const claimed = payload?.user_roles;
  if (!Array.isArray(claimed)) return [];
  return claimed.filter(isRoleClaim);
}

/**
 * The roles that open the Admin App's front door.
 *
 * THE DATABASE IS THE AUTHORITATIVE BOUNDARY, NOT THIS ARRAY. Every admin read and write is re-checked server side by row-level security policies, and those policies decide what an admin may actually touch. This set is an app-entry gate: it stops a principal with no admin role from landing inside the admin shell at all. Widening it grants no data access on its own, and narrowing it hides the app from someone the database would still serve — so a change here is a change to who sees the door, never to who holds the key.
 *
 * Declared exactly once. A second copy is a copy that will drift, and a drifted copy of a role list fails silently in the permissive direction.
 */
export const ADMIN_ROLES = ['project_admin', 'account_admin', 'super_admin'] as const satisfies ReadonlyArray<UserRole>;

/**
 * The roles that open the Candidate App's front door.
 *
 * The same boundary note applies verbatim: the database's policies are authoritative and this set is the app-entry gate.
 *
 * The member names are read from the database's own `user_role_type` enum rather than transcribed from a plan, because a rename lands in the generated types first. `satisfies` below is what makes a stale spelling a compile error instead of a gate that silently admits nobody.
 */
export const CANDIDATE_ROLES = ['candidate', 'organization'] as const satisfies ReadonlyArray<UserRole>;

/**
 * One role assignment, as it appears in an access token's `user_roles` claim.
 */
export type RoleClaim = { role: UserRole };

/**
 * A role name, as the database declares it.
 *
 * Derived from the generated enum rather than restated as a literal union, so adding or renaming a role in a migration is a compile error here rather than a gate that quietly stops matching.
 */
export type UserRole = Enums<'user_role_type'>;

/**
 * Decode a JWT's payload segment without verifying anything about it.
 *
 * Handles the base64url alphabet the token actually uses: `atob` rejects `-` and `_`, and JWT segments carry no padding, so both are normalised before decoding. Returns `undefined` for anything that does not yield a JSON object.
 * @param token - The raw token.
 * @returns The payload object, or `undefined`.
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
 * Whether one entry of a decoded `user_roles` claim has the shape this module reads.
 *
 * The value is attacker-shaped, so `null`, a bare string and an object with no `role` are all rejected here rather than thrown on later. Whether the name is a role the database knows is not decided here; `hasAnyRole` decides that against an explicit allowed set.
 * @param value - One entry of the decoded claim.
 * @returns `true` when the entry carries a `role` string.
 */
function isRoleClaim(value: unknown): value is RoleClaim {
  return typeof value === 'object' && value !== null && typeof (value as { role?: unknown }).role === 'string';
}
