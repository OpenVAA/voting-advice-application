import type { Enums } from '@openvaa/supabase-types';

/**
 * Whether any of the claimed grants has one of the shapes that open an entry point.
 *
 * A pure set-membership test over PAIRS: it performs no I/O, reads no module-level state and mutates neither argument, so the caller may hold the allowed set as a shared constant. An empty claims list is `false`, which is what makes the gate deny by default.
 *
 * A shape may also name a `target_type`, and then the claim's entity type must match it too; a shape without one matches any.
 *
 * The pair is what carries the meaning, and matching on the role alone would be wrong in both directions. A grant of scope `entity` with role `admin` is a shape the database's CHECK constraints admit and the user-type mapping does not produce; the permission matrix gives it the empty set, so it must open nothing — yet its role is `admin`. And a project-scope `editor` holds seventeen permissions including every app-settings and question right, so it belongs inside the Admin App and not the Candidate App — yet its role is `editor`. The scope is not decoration here; it is what distinguishes the two populations.
 * @param claims - The grant claims read out of an access token.
 * @param allowed - The `(scope, role)` shapes that open the entry point being gated.
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
 * FAILS CLOSED, ALWAYS. A token that is not a JWT, a payload that does not decode, a payload that is not JSON, a payload with no grants key and a grants key that is not an array all yield the empty list rather than an exception — and the empty list fails every gate. Individual entries that are not objects carrying both a `scope` string and a `role` string are dropped for the same reason. The payload is unvalidated, attacker-shaped JSON and nothing here narrows it beyond that shape; the annotation below is an assertion, not a check.
 *
 * A token carrying the claim key this module used to read — one minted before the access-token hook changed, and not yet refreshed — yields the empty list here and is denied. There is deliberately no fallback to it: a claim outliving its table is a second authority model with no expiry date, and the database stopped honouring that one in the same commit that changed the hook.
 *
 * The decode is deliberately signature-blind, and that is safe only in the position this helper is called from: the token comes from a session that has already been through the verifying round-trip in `safeGetSession`, and every subsequent query is re-checked server side. Do not call this on a token straight off a request.
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
 * The grant shapes that open the Admin App's front door.
 *
 * THE DATABASE IS THE AUTHORITATIVE BOUNDARY, NOT THIS ARRAY. Every admin read and write is re-checked server side by row-level security policies, and those policies decide what an admin may actually touch. This set is an app-entry gate: it stops a principal with no admin grant from landing inside the admin shell at all. Widening it grants no data access on its own, and narrowing it hides the app from someone the database would still serve — so a change here is a change to who sees the door, never to who holds the key.
 *
 * Declared exactly once. A second copy is a copy that will drift, and a drifted copy of an authorisation set fails silently in the permissive direction.
 *
 * The three members are the three admin rows of the user-type-to-grant mapping, split at the line the permission matrix already draws: an `admin` grant at global, account or project scope carries a non-empty permission set, and an `admin` grant at entity scope carries none. That fourth shape therefore opens nothing here, by construction rather than by a comment.
 */
export const ADMIN_GRANTS = [
  { scope: 'global', role: 'admin' },
  { scope: 'account', role: 'admin' },
  { scope: 'project', role: 'admin' }
] as const satisfies ReadonlyArray<GrantShape>;

/**
 * The grant shapes that open the Candidate App's front door.
 *
 * The same boundary note applies verbatim: the database's policies are authoritative and this set is the app-entry gate.
 *
 * One member: the CANDIDATE entity editor, and only it (162-REVIEW IN-05). The mapping gives a candidate, an organization editor, a faction editor and an alliance editor the same `(entity, editor)` shape and separates them by `target_type` -- and the Candidate App loads its user through `get_candidate_user_data('candidate')`, which answers nothing for the other three. Admitting them produced a generic "Failed to load candidate data" error after login instead of a clear refusal at the door. When the organization, faction and alliance apps exist, their doors are shapes of their own.
 *
 * The scope and role names are read from the database's own `grant_scope_type` and `grant_role_type` enums rather than transcribed from a plan, because a rename lands in the generated types first. `satisfies` below is what makes a stale spelling a compile error instead of a gate that silently admits nobody.
 */
export const CANDIDATE_GRANTS = [
  { scope: 'entity', role: 'editor', target_type: 'candidate' }
] as const satisfies ReadonlyArray<GrantShape>;

/**
 * One grant assignment, as it appears in an access token's `grants` claim.
 *
 * The four keys are the column names of the database's `grants` table, minus the ones a claim has no use for. The gates read two of them; `target_type` and `target_id` say which object the grant reaches and are answered server side, never here.
 */
export type GrantClaim = {
  scope: GrantScope;
  target_type: string | null;
  target_id: string | null;
  role: GrantRole;
};

/**
 * A `(scope, role)` pair, which is what an app-entry gate matches on -- optionally narrowed to one entity `target_type`.
 */
export type GrantShape = { scope: GrantScope; role: GrantRole; target_type?: Enums<'entity_type'> };

/**
 * A grant scope, as the database declares it.
 *
 * Derived from the generated enum rather than restated as a literal union, so adding or renaming a scope in a migration is a compile error here rather than a gate that quietly stops matching.
 */
export type GrantScope = Enums<'grant_scope_type'>;

/**
 * A grant role level, as the database declares it. There are two, and the same note applies.
 */
export type GrantRole = Enums<'grant_role_type'>;

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
 * Whether one entry of a decoded `grants` claim has the shape this module reads.
 *
 * The value is attacker-shaped, so `null`, a bare string, an object with no `scope` and an object with no `role` are all rejected here rather than thrown on later. Whether the names are ones the database knows is not decided here; `hasAnyGrant` decides that against an explicit allowed set of pairs.
 * @param value - One entry of the decoded claim.
 * @returns `true` when the entry carries both a `scope` string and a `role` string.
 */
function isGrantClaim(value: unknown): value is GrantClaim {
  if (typeof value !== 'object' || value === null) return false;
  const entry = value as { scope?: unknown; role?: unknown };
  return typeof entry.scope === 'string' && typeof entry.role === 'string';
}
