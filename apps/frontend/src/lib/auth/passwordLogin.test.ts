import { configureLogger } from '@openvaa/app-shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { passwordLogin } from './passwordLogin';
import { ADMIN_ROLES, CANDIDATE_ROLES, hasAnyRole, readUserRoles } from './roles';
import type { PasswordLoginContext } from './passwordLogin';

/**
 * The shared password-login helper and the role sets it gates on.
 *
 * ## What this spec is a control for
 *
 * The admin and candidate login form actions used to carry byte-identical copies of the sign-in call, the session read-back, the access-token claims decode and the role gate, differing only in the role predicate, the redirect target and three log messages. Collapsing four duplicated steps onto one helper puts BOTH of the application's authenticated entrances behind a single code path, so a widening mistake in that path widens both at once.
 *
 * The two cross-role cases below are what stands against that. A principal holding only candidate-side roles must still be rejected against the admin set, and a principal holding only admin-side roles must still be rejected against the candidate set. They are named separately rather than folded into a table because they are the privilege boundary, not a parameterisation of it.
 *
 * The claims fixtures are unsigned by construction. The helper never treats the payload as evidence of anything on its own: the session it reads them from has already been through the verifying `getUser()` round-trip in `safeGetSession`, and every subsequent query is re-checked by the database's row-level policies. What the fixtures exercise is the decode and the membership test, which is all this module owns.
 */

/** A well-formed access token carrying whatever role claims it is given; standard base64, as `btoa` emits it. Its signature is meaningless — nothing here verifies one. */
function accessTokenFor(userRoles: Array<{ role: string }>): string {
  return `header.${btoa(JSON.stringify({ user_roles: userRoles }))}.signature`;
}

/** The same, for a payload with no `user_roles` key at all. */
function accessTokenWithClaims(claims: Record<string, unknown>): string {
  return `header.${btoa(JSON.stringify(claims))}.signature`;
}

/**
 * Build the request-context stub the helper acts through, plus the spies needed to observe it.
 *
 * The context is described structurally rather than imported: the adapter-boundary guard bans naming the auth vendor's own types outside `src/lib/api/adapters/**`, and the helper has no business naming it either. Keeping the stub structural also keeps this spec's module graph to two files.
 * @param options.signInError - What the backend returns from the sign-in call; `null` for a successful sign-in.
 * @param options.session - What the session read-back yields; `null` for a sign-in that established nothing.
 * @param options.user - What the session read-back yields as the user; `null` for the same.
 * @returns The context plus the two spies the assertions read.
 */
function contextWith({
  signInError = null,
  session = { access_token: accessTokenFor([{ role: 'candidate' }]) },
  user = { id: 'user-1' }
}: {
  signInError?: { message: string } | null;
  session?: { access_token: string } | null;
  user?: { id: string } | null;
} = {}): {
  context: PasswordLoginContext;
  signInWithPassword: ReturnType<typeof vi.fn>;
  signOut: ReturnType<typeof vi.fn>;
} {
  const signInWithPassword = vi.fn(async () => ({ error: signInError }));
  const signOut = vi.fn(async () => ({ error: null }));
  return {
    context: {
      auth: { signInWithPassword, signOut },
      getSession: async () => ({ session, user })
    },
    signInWithPassword,
    signOut
  };
}

/** The helper call every case makes, with only the parts a case cares about spelled out. */
function login(
  context: PasswordLoginContext,
  allowedRoles: ReadonlyArray<(typeof ADMIN_ROLES)[number] | (typeof CANDIDATE_ROLES)[number]>
) {
  return passwordLogin({
    context,
    email: 'someone@example.com',
    password: 'correct horse battery staple',
    allowedRoles,
    logLabel: 'Test login'
  });
}

describe('passwordLogin', () => {
  beforeEach(() => {
    configureLogger({ level: 'silent' });
  });

  it('returns a 400-class failure when the backend rejects the credentials, without throwing or redirecting', async () => {
    const { context, signOut } = contextWith({ signInError: { message: 'Invalid login credentials' } });

    const outcome = await login(context, CANDIDATE_ROLES);

    expect(outcome).toEqual({ ok: false, status: 400, reason: 'invalidCredentials' });
    expect(signOut).not.toHaveBeenCalled();
  });

  it('returns a 500-class failure when the sign-in succeeds but no session comes back', async () => {
    const { context } = contextWith({ session: null });

    expect(await login(context, CANDIDATE_ROLES)).toEqual({ ok: false, status: 500, reason: 'noSession' });
  });

  it('returns a 500-class failure when the sign-in succeeds but no user comes back', async () => {
    const { context } = contextWith({ user: null });

    expect(await login(context, CANDIDATE_ROLES)).toEqual({ ok: false, status: 500, reason: 'noSession' });
  });

  it('returns a success outcome carrying the session and the user when a role is allowed', async () => {
    const session = { access_token: accessTokenFor([{ role: 'candidate' }]) };
    const { context, signOut } = contextWith({ session });

    expect(await login(context, CANDIDATE_ROLES)).toEqual({ ok: true, session, user: { id: 'user-1' } });
    expect(signOut).not.toHaveBeenCalled();
  });

  it('signs the local session out before returning the 403-class failure, so a rejected principal keeps no session', async () => {
    const { context, signOut } = contextWith({ session: { access_token: accessTokenFor([{ role: 'organization' }]) } });

    expect(await login(context, ADMIN_ROLES)).toEqual({ ok: false, status: 403, reason: 'roleNotAllowed' });
    expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  // The privilege boundary, asserted in both directions. Either one alone would pass against a helper that had quietly merged the two role sets into their union.
  it('rejects a candidate-only principal against the admin role set', async () => {
    const { context, signOut } = contextWith({
      session: { access_token: accessTokenFor([{ role: 'candidate' }, { role: 'organization' }]) }
    });

    expect(await login(context, ADMIN_ROLES)).toEqual({ ok: false, status: 403, reason: 'roleNotAllowed' });
    expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it('rejects an admin-only principal against the candidate role set', async () => {
    const { context, signOut } = contextWith({
      session: {
        access_token: accessTokenFor([{ role: 'project_admin' }, { role: 'account_admin' }, { role: 'super_admin' }])
      }
    });

    expect(await login(context, CANDIDATE_ROLES)).toEqual({ ok: false, status: 403, reason: 'roleNotAllowed' });
    expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it('admits an admin principal against the admin role set, so the rejections above discriminate on the role set', async () => {
    const { context } = contextWith({ session: { access_token: accessTokenFor([{ role: 'project_admin' }]) } });

    expect((await login(context, ADMIN_ROLES)).ok).toBe(true);
  });

  it('issues exactly one backend sign-in call per invocation', async () => {
    const { context, signInWithPassword } = contextWith();

    await login(context, CANDIDATE_ROLES);

    expect(signInWithPassword).toHaveBeenCalledTimes(1);
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'someone@example.com',
      password: 'correct horse battery staple'
    });
  });

  // Two invocations carrying different contexts must not observe each other. A module-level cache of the session, the claims or the last outcome would fail here and pass every case above.
  it('keeps two concurrent invocations with different contexts from observing each other', async () => {
    const admin = contextWith({ session: { access_token: accessTokenFor([{ role: 'super_admin' }]) } });
    const candidate = contextWith({ session: { access_token: accessTokenFor([{ role: 'candidate' }]) } });

    const [adminOutcome, candidateOutcome] = await Promise.all([
      login(admin.context, ADMIN_ROLES),
      login(candidate.context, ADMIN_ROLES)
    ]);

    expect(adminOutcome.ok).toBe(true);
    expect(candidateOutcome).toEqual({ ok: false, status: 403, reason: 'roleNotAllowed' });
  });
});

describe('readUserRoles', () => {
  it('returns an empty list when the payload carries no roles key', () => {
    expect(readUserRoles(accessTokenWithClaims({ sub: 'user-1' }))).toEqual([]);
  });

  it('returns an empty list rather than throwing on a token that is not a JWT at all', () => {
    expect(readUserRoles('not-a-token')).toEqual([]);
    expect(readUserRoles('')).toEqual([]);
  });

  it('returns an empty list rather than throwing when the payload is not decodable JSON', () => {
    expect(readUserRoles('header.!!!not-base64!!!.signature')).toEqual([]);
  });

  it('drops malformed entries rather than throwing on them, so a hostile claims array fails closed', () => {
    expect(readUserRoles(accessTokenWithClaims({ user_roles: [null, 'candidate', { role: 'candidate' }] }))).toEqual([
      { role: 'candidate' }
    ]);
    expect(readUserRoles(accessTokenWithClaims({ user_roles: 'candidate' }))).toEqual([]);
  });

  it('decodes a base64url payload, whose alphabet and padding differ from standard base64', () => {
    // Chosen so the two encodings actually differ: the standard form here carries a `+` and two `=` of padding, both of which are invalid input to `atob`. The inequality is asserted so the case cannot pass vacuously against a fixture that happened to be alphabet-neutral.
    const json = JSON.stringify({ user_roles: [{ role: 'candidate' }], sub: 'ÿþý' });
    const standard = Buffer.from(json).toString('base64');
    const urlSafe = Buffer.from(json).toString('base64url');
    expect(standard).not.toEqual(urlSafe);

    expect(readUserRoles(`header.${urlSafe}.signature`)).toEqual([{ role: 'candidate' }]);
  });
});

describe('hasAnyRole', () => {
  it('is a pure membership test over the claims list', () => {
    expect(hasAnyRole([{ role: 'candidate' }], CANDIDATE_ROLES)).toBe(true);
    expect(hasAnyRole([{ role: 'candidate' }], ADMIN_ROLES)).toBe(false);
    expect(hasAnyRole([], ADMIN_ROLES)).toBe(false);
    expect(hasAnyRole([{ role: 'super_admin' }], ADMIN_ROLES)).toBe(true);
  });

  it('mutates neither argument, so a caller may hold the role sets as shared constants', () => {
    const claims = [{ role: 'candidate' } as const];
    hasAnyRole(claims, ADMIN_ROLES);

    expect(claims).toEqual([{ role: 'candidate' }]);
    expect([...ADMIN_ROLES]).toEqual(['project_admin', 'account_admin', 'super_admin']);
    expect([...CANDIDATE_ROLES]).toEqual(['candidate', 'organization']);
  });
});
