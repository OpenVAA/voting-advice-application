import { configureLogger, log } from '@openvaa/app-shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { invitationCodeLogin } from './invitationCodeLogin';
import { CONTESTANT_GRANTS } from './roles';
import type { InvitationClaimResult } from '$lib/api/base/dataWriter.type';
import type { InvitationCodeLoginContext } from './invitationCodeLogin';
import type { GrantClaim } from './roles';

/**
 * The code-login helper: a code sign-in on the caller's context, then the admission every sign-in goes through.
 *
 * The context is a structural fake, as in the password-login spec. Its token changes only when `refreshSession` is called.
 */

const CODE = 'ABCD-EFGH-JKLM';
const PASSWORD = 'correct horse battery staple';

const ENTITY_EDITOR: GrantClaim = { scope: 'entity', target_type: 'candidate', target_id: 'cand-1', role: 'editor' };

/** A well-formed access token carrying the given grant claims. Its signature is meaningless: nothing here verifies one. */
function accessTokenFor(grants: Array<GrantClaim>): string {
  return `header.${btoa(JSON.stringify({ grants }))}.signature`;
}

/**
 * Build the request-context fake the helper acts through. Every member records its call, in order.
 * @param options.signIn - What the code sign-in does: establish a session, refuse, or throw.
 * @param options.grantsBefore - The grants the token carries until a refresh.
 * @param options.grantsAfterRefresh - The grants the token carries after a refresh.
 * @param options.claim - What the claim resolves to.
 * @returns The context, the ordered call names, and the arguments the sign-in was given.
 */
function contextWith({
  signIn = 'establishes a session',
  grantsBefore = [ENTITY_EDITOR],
  grantsAfterRefresh = grantsBefore,
  claim = { claimed: [], skipped: [], passwordSet: true }
}: {
  signIn?: 'establishes a session' | 'refuses' | 'throws';
  grantsBefore?: Array<GrantClaim>;
  grantsAfterRefresh?: Array<GrantClaim>;
  claim?: InvitationClaimResult;
} = {}): { context: InvitationCodeLoginContext; calls: Array<string>; signInArguments: Array<unknown> } {
  const calls = new Array<string>();
  const signInArguments = new Array<unknown>();
  let accessToken = accessTokenFor(grantsBefore);
  return {
    calls,
    signInArguments,
    context: {
      signInWithInvitationCode: async (credentials) => {
        calls.push('signInWithInvitationCode');
        signInArguments.push(credentials);
        if (signIn === 'throws') throw new Error('account-access code-sign-in: Failed to send a request');
        return signIn === 'establishes a session';
      },
      auth: {
        refreshSession: async () => {
          calls.push('refreshSession');
          accessToken = accessTokenFor(grantsAfterRefresh);
          return { error: null };
        },
        signOut: async () => {
          calls.push('signOut');
          return { error: null };
        }
      },
      getSession: async () => {
        calls.push('getSession');
        return { session: { access_token: accessToken }, user: { id: 'user-1' } };
      },
      claimInvitations: async () => {
        calls.push('claimInvitations');
        return claim;
      }
    }
  };
}

/** The helper call every case makes. */
function login(context: InvitationCodeLoginContext) {
  return invitationCodeLogin({
    context,
    code: CODE,
    password: PASSWORD,
    allowedGrants: CONTESTANT_GRANTS,
    logLabel: 'Test code login'
  });
}

describe('invitationCodeLogin', () => {
  beforeEach(() => {
    configureLogger({ level: 'silent' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('signs in with the code and the password, once, and then runs the admission', async () => {
    const claim: InvitationClaimResult = { claimed: [], skipped: [], passwordSet: true };
    const { context, calls, signInArguments } = contextWith({ claim });

    const outcome = await login(context);

    expect(signInArguments).toEqual([{ code: CODE, password: PASSWORD }]);
    expect(calls).toEqual(['signInWithInvitationCode', 'claimInvitations', 'getSession']);
    expect(outcome).toEqual({
      ok: true,
      session: { access_token: accessTokenFor([ENTITY_EDITOR]) },
      user: { id: 'user-1' },
      claim
    });
  });

  it('admits a user whose grant reaches the token only through the refresh after the claim', async () => {
    const claim: InvitationClaimResult = { claimed: [ENTITY_EDITOR], skipped: [], passwordSet: true };
    const { context, calls } = contextWith({ grantsBefore: [], grantsAfterRefresh: [ENTITY_EDITOR], claim });

    expect((await login(context)).ok).toBe(true);
    expect(calls).toEqual(['signInWithInvitationCode', 'claimInvitations', 'refreshSession', 'getSession']);
  });

  it('refuses a signed-in user whose token opens none of the allowed shapes', async () => {
    const { context, calls } = contextWith({ grantsBefore: [] });

    expect(await login(context)).toEqual({ ok: false, status: 403, reason: 'grantNotAllowed' });
    expect(calls).toEqual(['signInWithInvitationCode', 'claimInvitations', 'getSession', 'signOut']);
  });

  it('answers a refused sign-in with the invalid-credentials outcome and never reaches the claim', async () => {
    const { context, calls } = contextWith({ signIn: 'refuses' });

    expect(await login(context)).toEqual({ ok: false, status: 400, reason: 'invalidCredentials' });
    expect(calls).toEqual(['signInWithInvitationCode']);
  });

  it('answers a sign-in that throws with the same outcome, never reaches the claim, and logs neither credential', async () => {
    const error = vi.spyOn(log, 'error').mockImplementation(() => undefined);
    const debug = vi.spyOn(log, 'debug').mockImplementation(() => undefined);
    const { context, calls } = contextWith({ signIn: 'throws' });

    expect(await login(context)).toEqual({ ok: false, status: 400, reason: 'invalidCredentials' });
    expect(calls).toEqual(['signInWithInvitationCode']);

    const logged = JSON.stringify([...error.mock.calls, ...debug.mock.calls]);
    expect(error).toHaveBeenCalledTimes(1);
    expect(logged).toContain('Test code login');
    expect(logged).not.toContain(CODE);
    expect(logged).not.toContain(PASSWORD);
  });

  it('logs neither credential for a refused sign-in', async () => {
    const error = vi.spyOn(log, 'error').mockImplementation(() => undefined);
    const debug = vi.spyOn(log, 'debug').mockImplementation(() => undefined);
    const { context } = contextWith({ signIn: 'refuses' });

    await login(context);

    const logged = JSON.stringify([...error.mock.calls, ...debug.mock.calls]);
    expect(logged).not.toContain(CODE);
    expect(logged).not.toContain(PASSWORD);
  });
});
