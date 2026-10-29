import { log } from '@openvaa/app-shared';
import { hasAnyGrant, readGrants } from './roles';
import type { InvitationClaimResult } from '$lib/api/base/dataWriter.type';
import type { GrantShape } from './roles';

/**
 * Admit a session that was just established: claim the user's invitations, refresh the session when a grant was written, and only then gate the session on a set of grant shapes.
 *
 * ## The order, and why the gate comes last
 *
 * 1. `claimInvitations()` turns the user's open invitations into grants.
 * 2. `refreshSession()` runs when the claim wrote at least one grant.
 * 3. `getSession()` reads the session.
 * 4. The grant-shape gate reads that session's access token.
 *
 * An access token lists the grants its user held when it was issued. A grant the claim writes is therefore in no token until the session is refreshed, and a gate that read the session before the refresh would refuse a first-time invitee whose only grant is the one just claimed. The refresh is skipped when nothing was claimed: the token was issued by this same request and already lists every grant the user holds.
 *
 * ## A claim that fails admits on what the token already carries
 *
 * A claim that throws is logged and treated as a claim of nothing, so one failing claim locks nobody out of a sign-in that would otherwise be admitted. A refresh that fails is logged in the same way, and the gate reads the session as it is.
 *
 * ## What it deliberately does not take
 *
 * A grant shape, a user or an invitation named by the request. The allowed set is chosen by the entry point, in code, and the claim takes no argument at all here: whose invitations are claimed is decided by the backend from the session.
 *
 * Holds no module-level mutable state: two concurrent invocations carrying different contexts cannot observe each other.
 * @param options.context - This request's own auth surface and its claim. Required, for the reason `passwordLogin` gives.
 * @param options.allowedGrants - The `(scope, role)` grant shapes that open this entry point. No default, deliberately.
 * @param options.logLabel - Names the entry point in this helper's log lines.
 * @returns A discriminated outcome. Never throws for an expected failure.
 */
export async function admitSession({
  context,
  allowedGrants,
  logLabel
}: {
  context: SessionAdmissionContext;
  allowedGrants: ReadonlyArray<GrantShape>;
  logLabel: string;
}): Promise<SessionAdmissionOutcome> {
  const claim = await claimAndRefresh({ context, logLabel });

  const { session, user } = await context.getSession();
  if (!session || !user) {
    log.error(`${logLabel}: session not established after signIn`);
    return { ok: false, status: 500, reason: 'noSession' };
  }

  if (!hasAnyGrant(readGrants(session.access_token), allowedGrants)) {
    await context.auth.signOut({ scope: 'local' });
    log.debug(`${logLabel}: unauthorized user rejected at the app entry gate`);
    return { ok: false, status: 403, reason: 'grantNotAllowed' };
  }

  return claim ? { ok: true, session, user, claim } : { ok: true, session, user };
}

/**
 * Claim the signed-in user's invitations, and refresh the session when a grant was written.
 *
 * The one place the pair is written. Every entry point that establishes a session passes through it: `admitSession` for a sign-in, and the auth callback for a mailed link, which lands its user without a grant gate.
 *
 * A claim that throws is logged and answered with nothing, and nothing is refreshed. A refresh that fails is logged and the claim's answer is still returned: the grants are written, and the session's token lists them the next time it is reissued.
 * @param options.context - This request's own claim and the refresh of its session.
 * @param options.logLabel - Names the entry point in the log line of a failure.
 * @returns The claim's answer, or `undefined` when the claim threw.
 */
export async function claimAndRefresh({
  context,
  logLabel
}: {
  context: SessionClaimContext;
  logLabel: string;
}): Promise<InvitationClaimResult | undefined> {
  const claim = await claimOf({ context, logLabel });
  if (claim && claim.claimed.length > 0) await refresh({ context, logLabel });
  return claim;
}

/**
 * The slice of the caller's request context an admission acts through.
 *
 * Described structurally rather than imported, as `PasswordLoginContext` is: the backend client's own types are banned outside the adapter directory. The claim's result is the data writer's backend-neutral contract type.
 */
export type SessionAdmissionContext = {
  auth: {
    /**
     * Reissue this request's session, so its access token lists the grants the user holds now.
     * @returns The backend's error, or an object carrying `null`.
     */
    refreshSession(): Promise<{ error: { message: string } | null }>;
    /**
     * Drop the session this request just established, locally only.
     * @param options - Scope of the sign-out.
     * @returns Whatever the backend returns; the result is not read.
     */
    signOut(options: { scope: 'local' }): Promise<unknown>;
  };
  /**
   * Read the session this request holds, verified server side. Called after the claim and the refresh.
   * @returns The session and user, either of which may be `null`.
   */
  getSession(): Promise<{ session: { access_token: string } | null; user: { id: string } | null }>;
  /**
   * Turn the signed-in user's open invitations into grants, on this request's own client.
   * @returns What was claimed and skipped, and whether the user has a password. May throw.
   */
  claimInvitations(): Promise<InvitationClaimResult>;
};

/**
 * The slice of a request context the claim and the refresh after it act through: the part of `SessionAdmissionContext` that reads no session and signs nobody out.
 */
export type SessionClaimContext = Pick<SessionAdmissionContext, 'claimInvitations'> & {
  auth: Pick<SessionAdmissionContext['auth'], 'refreshSession'>;
};

/**
 * What an admission came to.
 *
 * Statuses are the ones the login actions return for these cases. `reason` is for the caller and the logs; it is never surfaced to the browser as a message. A success carries the claim's result when the claim answered, and none when it threw.
 */
export type SessionAdmissionOutcome =
  | { ok: true; session: { access_token: string }; user: { id: string }; claim?: InvitationClaimResult }
  | { ok: false; status: 500; reason: 'noSession' }
  | { ok: false; status: 403; reason: 'grantNotAllowed' };

/**
 * Claim the user's invitations, answering a failure with nothing.
 * @param options.context - This request's own claim.
 * @param options.logLabel - Names the entry point in the log line of a failure.
 * @returns The claim's result, or `undefined` when the claim threw.
 */
async function claimOf({
  context,
  logLabel
}: {
  context: SessionClaimContext;
  logLabel: string;
}): Promise<InvitationClaimResult | undefined> {
  try {
    return await context.claimInvitations();
  } catch (e) {
    log.error(`${logLabel}: claiming invitations failed: ${messageOf(e)}`);
    return undefined;
  }
}

/**
 * Refresh the session, logging a failure and never throwing one.
 * @param options.context - This request's own auth surface.
 * @param options.logLabel - Names the entry point in the log line of a failure.
 */
async function refresh({ context, logLabel }: { context: SessionClaimContext; logLabel: string }): Promise<void> {
  try {
    const { error } = await context.auth.refreshSession();
    if (error) log.error(`${logLabel}: session refresh after the claim failed: ${error.message}`);
  } catch (e) {
    log.error(`${logLabel}: session refresh after the claim failed: ${messageOf(e)}`);
  }
}

/**
 * The message of a caught value.
 * @param thrown - Whatever was thrown.
 * @returns The error's message, or the value as a string.
 */
function messageOf(thrown: unknown): string {
  return thrown instanceof Error ? thrown.message : String(thrown);
}
