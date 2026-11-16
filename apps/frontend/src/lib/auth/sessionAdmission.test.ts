import { configureLogger, log } from '@openvaa/app-shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ADMIN_GRANTS, CONTESTANT_GRANTS } from './roles';
import { admitSession, claimAndRefresh } from './sessionAdmission';
import type { InvitationClaimResult } from '$lib/api/base/dataWriter.type';
import type { GrantClaim, GrantShape } from './roles';
import type { SessionAdmissionContext } from './sessionAdmission';

/**
 * The admission of a session that was just established: claim, refresh when a grant was written, read the session, gate.
 *
 * ## What this spec is a control for
 *
 * A grant the claim writes is in no access token until the session is refreshed. The fake context below models exactly that: the token it hands out changes only when `refreshSession` is called. A helper that read the session before the refresh, or skipped the refresh after a claim, refuses the first-time invitee here.
 *
 * The claims fixtures are unsigned by construction, as in the password-login spec: this module owns the order and the shape test, and the session it reads has been verified by the caller's `getSession`.
 */

/** A well-formed access token carrying the given grant claims. Its signature is meaningless: nothing here verifies one. */
function accessTokenFor(grants: Array<GrantClaim>): string {
  return `header.${btoa(JSON.stringify({ grants }))}.signature`;
}

const ENTITY_EDITOR: GrantClaim = { scope: 'entity', target_type: 'candidate', target_id: 'cand-1', role: 'editor' };
const PROJECT_ADMIN: GrantClaim = { scope: 'project', target_type: null, target_id: 'proj-1', role: 'admin' };

/** A claim that found nothing to claim, for a user who has a password. */
const NOTHING_CLAIMED: InvitationClaimResult = { claimed: [], skipped: [], passwordSet: true };

/**
 * Build the request-context fake an admission acts through. Every member records its call, in order.
 * @param options.grantsBefore - The grants the token carries until a refresh succeeds.
 * @param options.grantsAfterRefresh - The grants the token carries once a refresh has succeeded.
 * @param options.claim - What the claim resolves to, or the error it rejects with.
 * @param options.refresh - What the refresh does: succeed, return an error, or throw.
 * @param options.hasSession - Whether the session read yields a session.
 * @param options.user - What the session read yields as the user.
 * @returns The context, the ordered call names, and the arguments each sign-out was given.
 */
function contextWith({
  grantsBefore = [],
  grantsAfterRefresh = grantsBefore,
  claim = NOTHING_CLAIMED,
  refresh = 'succeeds',
  hasSession = true,
  user = { id: 'user-1' }
}: {
  grantsBefore?: Array<GrantClaim>;
  grantsAfterRefresh?: Array<GrantClaim>;
  claim?: InvitationClaimResult | Error;
  refresh?: 'succeeds' | 'returns an error' | 'throws';
  hasSession?: boolean;
  user?: { id: string } | null;
} = {}): { context: SessionAdmissionContext; calls: Array<string>; signOutArguments: Array<unknown> } {
  const calls = new Array<string>();
  const signOutArguments = new Array<unknown>();
  let accessToken = accessTokenFor(grantsBefore);
  return {
    calls,
    signOutArguments,
    context: {
      auth: {
        refreshSession: async () => {
          calls.push('refreshSession');
          if (refresh === 'throws') throw new Error('refresh endpoint unreachable');
          if (refresh === 'returns an error') return { error: { message: 'refresh token revoked' } };
          accessToken = accessTokenFor(grantsAfterRefresh);
          return { error: null };
        },
        signOut: async (options) => {
          calls.push('signOut');
          signOutArguments.push(options);
          return { error: null };
        }
      },
      getSession: async () => {
        calls.push('getSession');
        return { session: hasSession ? { access_token: accessToken } : null, user };
      },
      claimInvitations: async () => {
        calls.push('claimInvitations');
        if (claim instanceof Error) throw claim;
        return claim;
      }
    }
  };
}

/** The helper call every case makes. */
function admit(context: SessionAdmissionContext, allowedGrants: ReadonlyArray<GrantShape>) {
  return admitSession({ context, allowedGrants, logLabel: 'Test admission' });
}

describe('admitSession', () => {
  beforeEach(() => {
    configureLogger({ level: 'silent' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('claims, then refreshes, then reads the session, and gates on the session it read', async () => {
    const claim: InvitationClaimResult = { claimed: [ENTITY_EDITOR], skipped: [], passwordSet: true };
    const { context, calls } = contextWith({ grantsAfterRefresh: [ENTITY_EDITOR], claim });

    const outcome = await admit(context, CONTESTANT_GRANTS);

    expect(calls).toEqual(['claimInvitations', 'refreshSession', 'getSession']);
    expect(outcome.ok).toBe(true);
  });

  it('admits a first-time invitee whose token carries no grant until the refresh', async () => {
    const claim: InvitationClaimResult = { claimed: [ENTITY_EDITOR], skipped: [], passwordSet: false };
    const { context, signOutArguments } = contextWith({ grantsBefore: [], grantsAfterRefresh: [ENTITY_EDITOR], claim });

    const outcome = await admit(context, CONTESTANT_GRANTS);

    expect(outcome).toEqual({
      ok: true,
      session: { access_token: accessTokenFor([ENTITY_EDITOR]) },
      user: { id: 'user-1' },
      claim
    });
    expect(signOutArguments).toEqual([]);
  });

  // The control of the case above: the same user and the same gate, with a claim that wrote nothing.
  it('does not refresh and refuses that user when nothing was claimed, signing the local session out', async () => {
    const { context, calls, signOutArguments } = contextWith({ grantsBefore: [], grantsAfterRefresh: [ENTITY_EDITOR] });

    const outcome = await admit(context, CONTESTANT_GRANTS);

    expect(outcome).toEqual({ ok: false, status: 403, reason: 'grantNotAllowed' });
    expect(calls).toEqual(['claimInvitations', 'getSession', 'signOut']);
    expect(signOutArguments).toEqual([{ scope: 'local' }]);
  });

  it('does not refresh when every invitation was skipped', async () => {
    const claim: InvitationClaimResult = {
      claimed: [],
      skipped: [{ ...ENTITY_EDITOR, reason: 'candidate_has_editor' }],
      passwordSet: true
    };
    const { context, calls } = contextWith({ claim });

    expect(await admit(context, CONTESTANT_GRANTS)).toEqual({ ok: false, status: 403, reason: 'grantNotAllowed' });
    expect(calls).not.toContain('refreshSession');
  });

  it('admits a returning user on the grants the token already carries when the claim throws, without a refresh', async () => {
    const error = vi.spyOn(log, 'error').mockImplementation(() => undefined);
    const { context, calls } = contextWith({
      grantsBefore: [ENTITY_EDITOR],
      claim: new Error('claimInvitations: the database is unreachable')
    });

    const outcome = await admit(context, CONTESTANT_GRANTS);

    expect(outcome).toEqual({
      ok: true,
      session: { access_token: accessTokenFor([ENTITY_EDITOR]) },
      user: { id: 'user-1' }
    });
    expect(calls).toEqual(['claimInvitations', 'getSession']);
    expect(error).toHaveBeenCalledTimes(1);
    expect(String(error.mock.calls[0][0])).toContain('Test admission');
    expect(String(error.mock.calls[0][0])).toContain('the database is unreachable');
  });

  it('logs a refresh that returns an error and gates on the session as it is', async () => {
    const error = vi.spyOn(log, 'error').mockImplementation(() => undefined);
    const claim: InvitationClaimResult = { claimed: [ENTITY_EDITOR], skipped: [], passwordSet: true };
    const invitee = contextWith({ grantsAfterRefresh: [ENTITY_EDITOR], claim, refresh: 'returns an error' });
    const returning = contextWith({ grantsBefore: [ENTITY_EDITOR], claim, refresh: 'returns an error' });

    expect(await admit(invitee.context, CONTESTANT_GRANTS)).toEqual({
      ok: false,
      status: 403,
      reason: 'grantNotAllowed'
    });
    expect((await admit(returning.context, CONTESTANT_GRANTS)).ok).toBe(true);

    expect(invitee.calls).toEqual(['claimInvitations', 'refreshSession', 'getSession', 'signOut']);
    expect(error).toHaveBeenCalledTimes(2);
    expect(String(error.mock.calls[0][0])).toContain('refresh token revoked');
  });

  it('logs a refresh that throws and gates on the session as it is', async () => {
    const error = vi.spyOn(log, 'error').mockImplementation(() => undefined);
    const claim: InvitationClaimResult = { claimed: [ENTITY_EDITOR], skipped: [], passwordSet: true };
    const { context, calls } = contextWith({ grantsBefore: [ENTITY_EDITOR], claim, refresh: 'throws' });

    expect((await admit(context, CONTESTANT_GRANTS)).ok).toBe(true);
    expect(calls).toEqual(['claimInvitations', 'refreshSession', 'getSession']);
    expect(String(error.mock.calls[0][0])).toContain('refresh endpoint unreachable');
  });

  // The entry point still chooses the door. A claimed project-admin grant opens the Admin App's shapes and not the Contestant App's.
  it('admits a claimed project-admin grant against the admin shapes and refuses it against the contestant shapes', async () => {
    const claim: InvitationClaimResult = { claimed: [PROJECT_ADMIN], skipped: [], passwordSet: true };
    const admin = contextWith({ grantsAfterRefresh: [PROJECT_ADMIN], claim });
    const contestant = contextWith({ grantsAfterRefresh: [PROJECT_ADMIN], claim });

    expect((await admit(admin.context, ADMIN_GRANTS)).ok).toBe(true);
    expect(await admit(contestant.context, CONTESTANT_GRANTS)).toEqual({
      ok: false,
      status: 403,
      reason: 'grantNotAllowed'
    });
    expect(contestant.signOutArguments).toEqual([{ scope: 'local' }]);
  });

  it('returns a 500-class failure when no session comes back, after the claim', async () => {
    const withoutSession = contextWith({ hasSession: false });
    const withoutUser = contextWith({ user: null });

    expect(await admit(withoutSession.context, CONTESTANT_GRANTS)).toEqual({
      ok: false,
      status: 500,
      reason: 'noSession'
    });
    expect(await admit(withoutUser.context, CONTESTANT_GRANTS)).toEqual({
      ok: false,
      status: 500,
      reason: 'noSession'
    });
    expect(withoutSession.calls).toEqual(['claimInvitations', 'getSession']);
  });

  it('keeps two concurrent invocations with different contexts from observing each other', async () => {
    const claim: InvitationClaimResult = { claimed: [ENTITY_EDITOR], skipped: [], passwordSet: true };
    const invitee = contextWith({ grantsAfterRefresh: [ENTITY_EDITOR], claim });
    const stranger = contextWith();

    const [inviteeOutcome, strangerOutcome] = await Promise.all([
      admit(invitee.context, CONTESTANT_GRANTS),
      admit(stranger.context, CONTESTANT_GRANTS)
    ]);

    expect(inviteeOutcome.ok).toBe(true);
    expect(strangerOutcome).toEqual({ ok: false, status: 403, reason: 'grantNotAllowed' });
    expect(stranger.calls).not.toContain('refreshSession');
  });
});

describe('claimAndRefresh', () => {
  /** The call every case makes. */
  function claimFor(context: SessionAdmissionContext) {
    return claimAndRefresh({ context, logLabel: 'Test entry' });
  }

  beforeEach(() => {
    configureLogger({ level: 'silent' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('claims, refreshes when a grant was written, and answers with the claim', async () => {
    const claim: InvitationClaimResult = { claimed: [ENTITY_EDITOR], skipped: [], passwordSet: false };
    const { context, calls } = contextWith({ claim });

    expect(await claimFor(context)).toBe(claim);
    expect(calls).toEqual(['claimInvitations', 'refreshSession']);
  });

  it('does not refresh when nothing was claimed, and answers with the claim', async () => {
    const skippedAll: InvitationClaimResult = {
      claimed: [],
      skipped: [{ ...ENTITY_EDITOR, reason: 'candidate_has_editor' }],
      passwordSet: true
    };
    const nothing = contextWith();
    const skipped = contextWith({ claim: skippedAll });

    expect(await claimFor(nothing.context)).toBe(NOTHING_CLAIMED);
    expect(await claimFor(skipped.context)).toBe(skippedAll);
    expect(nothing.calls).toEqual(['claimInvitations']);
    expect(skipped.calls).toEqual(['claimInvitations']);
  });

  it('answers a claim that throws with nothing, logs it under the entry point and does not refresh', async () => {
    const error = vi.spyOn(log, 'error').mockImplementation(() => undefined);
    const { context, calls } = contextWith({ claim: new Error('claimInvitations: the database is unreachable') });

    expect(await claimFor(context)).toBeUndefined();
    expect(calls).toEqual(['claimInvitations']);
    expect(error).toHaveBeenCalledTimes(1);
    expect(String(error.mock.calls[0][0])).toBe(
      'Test entry: claiming invitations failed: claimInvitations: the database is unreachable'
    );
  });

  it.each([
    ['returns an error', 'refresh token revoked'],
    ['throws', 'refresh endpoint unreachable']
  ] as const)('logs a refresh that %s and still answers with the claim', async (refresh, message) => {
    const error = vi.spyOn(log, 'error').mockImplementation(() => undefined);
    const claim: InvitationClaimResult = { claimed: [ENTITY_EDITOR], skipped: [], passwordSet: true };
    const { context, calls } = contextWith({ claim, refresh });

    expect(await claimFor(context)).toBe(claim);
    expect(calls).toEqual(['claimInvitations', 'refreshSession']);
    expect(error).toHaveBeenCalledTimes(1);
    expect(String(error.mock.calls[0][0])).toBe(`Test entry: session refresh after the claim failed: ${message}`);
  });

  it('reads no session and signs nobody out', async () => {
    const claim: InvitationClaimResult = { claimed: [ENTITY_EDITOR], skipped: [], passwordSet: true };
    const { context, calls } = contextWith({ grantsBefore: [], grantsAfterRefresh: [], claim });

    await claimFor(context);

    expect(calls).not.toContain('getSession');
    expect(calls).not.toContain('signOut');
  });

  it('acts through a context that holds the claim and the refresh alone', async () => {
    const claim: InvitationClaimResult = { claimed: [ENTITY_EDITOR], skipped: [], passwordSet: true };
    const calls = new Array<string>();

    const answer = await claimAndRefresh({
      context: {
        auth: {
          refreshSession: async () => {
            calls.push('refreshSession');
            return { error: null };
          }
        },
        claimInvitations: async () => {
          calls.push('claimInvitations');
          return claim;
        }
      },
      logLabel: 'Test entry'
    });

    expect(answer).toBe(claim);
    expect(calls).toEqual(['claimInvitations', 'refreshSession']);
  });
});
