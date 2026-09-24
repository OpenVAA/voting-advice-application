import { configureLogger } from '@openvaa/app-shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { passwordLogin } from './passwordLogin';
import { ADMIN_GRANTS, CANDIDATE_GRANTS, hasAnyGrant, readGrants } from './roles';
import type { PasswordLoginContext } from './passwordLogin';
import type { GrantClaim, GrantShape } from './roles';

/**
 * The shared password-login helper and the grant-shape sets it gates on.
 *
 * ## What this spec is a control for
 *
 * The admin and candidate login form actions used to carry byte-identical copies of the sign-in call, the session read-back, the access-token claims decode and the gate, differing only in the predicate, the redirect target and three log messages. Collapsing four duplicated steps onto one helper puts BOTH of the application's authenticated entrances behind a single code path, so a widening mistake in that path widens both at once.
 *
 * The two cross-door cases below are what stands against that. A principal holding only an entity editor grant must still be rejected against the admin set, and a principal holding only admin grants must still be rejected against the candidate set. They are named separately rather than folded into a table because they are the privilege boundary, not a parameterisation of it.
 *
 * ## Why the gate matches a PAIR
 *
 * The claim carries `(scope, target_type, target_id, role)` and the vocabulary has two roles, so the role alone does not say which door. Two cases below are the ones that make the pair load-bearing: an entity-scope grant whose role is `admin` — a shape the database's CHECK constraints admit, the user-type mapping never produces and the permission matrix gives the empty set — must open NEITHER door; and a project-scope `editor`, who holds seventeen permissions, must open the admin door and not the candidate one.
 *
 * The claims fixtures are unsigned by construction. The helper never treats the payload as evidence of anything on its own: the session it reads them from has already been through the verifying `getUser()` round-trip in `safeGetSession`, and every subsequent query is re-checked by the database's row-level policies. What the fixtures exercise is the decode and the shape test, which is all this module owns.
 */

/** A well-formed access token carrying whatever grant claims it is given; standard base64, as `btoa` emits it. Its signature is meaningless — nothing here verifies one. */
function accessTokenFor(grants: Array<GrantClaim>): string {
  return `header.${btoa(JSON.stringify({ grants }))}.signature`;
}

/** The same, for an arbitrary payload — a payload with no grants key at all, or one carrying the claim key this module stopped reading. */
function accessTokenWithClaims(claims: Record<string, unknown>): string {
  return `header.${btoa(JSON.stringify(claims))}.signature`;
}

/** The five grant claims every case below is built from, spelled once and typed against the module's own claim shape. */
const PROJECT_ADMIN: GrantClaim = { scope: 'project', target_type: null, target_id: 'proj-1', role: 'admin' };
const GLOBAL_ADMIN: GrantClaim = { scope: 'global', target_type: null, target_id: null, role: 'admin' };
const ENTITY_EDITOR: GrantClaim = { scope: 'entity', target_type: 'candidate', target_id: 'cand-1', role: 'editor' };
/** Admitted by the table's CHECK constraints, produced by no user type, and given the empty permission set by the matrix. */
const ENTITY_ADMIN: GrantClaim = { scope: 'entity', target_type: 'candidate', target_id: 'cand-1', role: 'admin' };
/** Seventeen permissions, including every app-settings and question right. Its role is `editor` and its door is the admin one. */
const PROJECT_EDITOR: GrantClaim = { scope: 'project', target_type: null, target_id: 'proj-1', role: 'editor' };

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
  session = { access_token: accessTokenFor([ENTITY_EDITOR]) },
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
function login(context: PasswordLoginContext, allowedGrants: ReadonlyArray<GrantShape>) {
  return passwordLogin({
    context,
    email: 'someone@example.com',
    password: 'correct horse battery staple',
    allowedGrants,
    logLabel: 'Test login'
  });
}

describe('passwordLogin', () => {
  beforeEach(() => {
    configureLogger({ level: 'silent' });
  });

  it('returns a 400-class failure when the backend rejects the credentials, without throwing or redirecting', async () => {
    const { context, signOut } = contextWith({ signInError: { message: 'Invalid login credentials' } });

    const outcome = await login(context, CANDIDATE_GRANTS);

    expect(outcome).toEqual({ ok: false, status: 400, reason: 'invalidCredentials' });
    expect(signOut).not.toHaveBeenCalled();
  });

  it('returns a 500-class failure when the sign-in succeeds but no session comes back', async () => {
    const { context } = contextWith({ session: null });

    expect(await login(context, CANDIDATE_GRANTS)).toEqual({ ok: false, status: 500, reason: 'noSession' });
  });

  it('returns a 500-class failure when the sign-in succeeds but no user comes back', async () => {
    const { context } = contextWith({ user: null });

    expect(await login(context, CANDIDATE_GRANTS)).toEqual({ ok: false, status: 500, reason: 'noSession' });
  });

  it('returns a success outcome carrying the session and the user when a grant shape is allowed', async () => {
    const session = { access_token: accessTokenFor([ENTITY_EDITOR]) };
    const { context, signOut } = contextWith({ session });

    expect(await login(context, CANDIDATE_GRANTS)).toEqual({ ok: true, session, user: { id: 'user-1' } });
    expect(signOut).not.toHaveBeenCalled();
  });

  it('signs the local session out before returning the 403-class failure, so a rejected principal keeps no session', async () => {
    const { context, signOut } = contextWith({ session: { access_token: accessTokenFor([ENTITY_EDITOR]) } });

    expect(await login(context, ADMIN_GRANTS)).toEqual({ ok: false, status: 403, reason: 'grantNotAllowed' });
    expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  // The privilege boundary, asserted in both directions. Either one alone would pass against a helper that had quietly merged the two shape sets into their union.
  it('rejects an entity-editor-only principal against the admin shape set', async () => {
    const { context, signOut } = contextWith({
      session: { access_token: accessTokenFor([ENTITY_EDITOR]) }
    });

    expect(await login(context, ADMIN_GRANTS)).toEqual({ ok: false, status: 403, reason: 'grantNotAllowed' });
    expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it('rejects an admin-only principal against the candidate shape set', async () => {
    const { context, signOut } = contextWith({
      session: { access_token: accessTokenFor([PROJECT_ADMIN, GLOBAL_ADMIN]) }
    });

    expect(await login(context, CANDIDATE_GRANTS)).toEqual({ ok: false, status: 403, reason: 'grantNotAllowed' });
    expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it('admits an admin principal against the admin shape set, so the rejections above discriminate on the shape set', async () => {
    const { context } = contextWith({ session: { access_token: accessTokenFor([PROJECT_ADMIN]) } });

    expect((await login(context, ADMIN_GRANTS)).ok).toBe(true);
  });

  // THE FAIL-OPEN CASE the pair exists to close. Its role is `admin`; a gate matching on the role alone would let it inside the admin shell, and the permission matrix gives it nothing at all.
  it('denies the admin door to a token whose only grant is entity-scope with role admin', async () => {
    const { context, signOut } = contextWith({ session: { access_token: accessTokenFor([ENTITY_ADMIN]) } });

    expect(await login(context, ADMIN_GRANTS)).toEqual({ ok: false, status: 403, reason: 'grantNotAllowed' });
    expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it('denies the candidate door to that same shape, so it opens neither', async () => {
    const { context } = contextWith({ session: { access_token: accessTokenFor([ENTITY_ADMIN]) } });

    expect(await login(context, CANDIDATE_GRANTS)).toEqual({ ok: false, status: 403, reason: 'grantNotAllowed' });
  });

  // THE WRONG-DOOR CASE, the other half of what a role-only gate would get wrong: a project editor is an administrator of a project, and its role literal is `editor`.
  it('denies the candidate door to a project-scope editor', async () => {
    const { context } = contextWith({ session: { access_token: accessTokenFor([PROJECT_EDITOR]) } });

    expect(await login(context, CANDIDATE_GRANTS)).toEqual({ ok: false, status: 403, reason: 'grantNotAllowed' });
  });

  // A session minted before the access-token hook changed carries the retired claim key until its token refreshes. It opens nothing, here or in the database, and there is deliberately no fallback that would let it.
  it('opens neither door for a token carrying only the retired claim shape', async () => {
    const retired = {
      access_token: accessTokenWithClaims({
        user_roles: [
          { role: 'super_admin', scope_type: 'global', scope_id: null },
          { role: 'candidate', scope_type: 'candidate', scope_id: 'cand-1' }
        ]
      })
    };

    expect(await login(contextWith({ session: retired }).context, ADMIN_GRANTS)).toEqual({
      ok: false,
      status: 403,
      reason: 'grantNotAllowed'
    });
    expect(await login(contextWith({ session: retired }).context, CANDIDATE_GRANTS)).toEqual({
      ok: false,
      status: 403,
      reason: 'grantNotAllowed'
    });
  });

  it('issues exactly one backend sign-in call per invocation', async () => {
    const { context, signInWithPassword } = contextWith();

    await login(context, CANDIDATE_GRANTS);

    expect(signInWithPassword).toHaveBeenCalledTimes(1);
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'someone@example.com',
      password: 'correct horse battery staple'
    });
  });

  // Two invocations carrying different contexts must not observe each other. A module-level cache of the session, the claims or the last outcome would fail here and pass every case above.
  it('keeps two concurrent invocations with different contexts from observing each other', async () => {
    const admin = contextWith({ session: { access_token: accessTokenFor([GLOBAL_ADMIN]) } });
    const candidate = contextWith({ session: { access_token: accessTokenFor([ENTITY_EDITOR]) } });

    const [adminOutcome, candidateOutcome] = await Promise.all([
      login(admin.context, ADMIN_GRANTS),
      login(candidate.context, ADMIN_GRANTS)
    ]);

    expect(adminOutcome.ok).toBe(true);
    expect(candidateOutcome).toEqual({ ok: false, status: 403, reason: 'grantNotAllowed' });
  });
});

describe('readGrants', () => {
  it('returns the grant entries of a token that carries them', () => {
    expect(readGrants(accessTokenFor([PROJECT_ADMIN, ENTITY_EDITOR]))).toEqual([PROJECT_ADMIN, ENTITY_EDITOR]);
  });

  it('returns an empty list when the payload carries no grants key', () => {
    expect(readGrants(accessTokenWithClaims({ sub: 'user-1' }))).toEqual([]);
  });

  // The retired claim key is not a fallback and never becomes one: a payload carrying it and nothing else reads as no authority at all.
  it('returns an empty list for a payload carrying only the retired claim key', () => {
    expect(readGrants(accessTokenWithClaims({ user_roles: [{ role: 'super_admin' }] }))).toEqual([]);
  });

  it('returns an empty list rather than throwing on a token that is not a JWT at all', () => {
    expect(readGrants('not-a-token')).toEqual([]);
    expect(readGrants('')).toEqual([]);
  });

  it('returns an empty list rather than throwing when the payload is not decodable JSON', () => {
    expect(readGrants('header.!!!not-base64!!!.signature')).toEqual([]);
  });

  it('drops malformed entries rather than throwing on them, so a hostile claims array fails closed', () => {
    expect(readGrants(accessTokenWithClaims({ grants: [null, 'admin', { role: 'admin' }, ENTITY_EDITOR] }))).toEqual([
      ENTITY_EDITOR
    ]);
    expect(readGrants(accessTokenWithClaims({ grants: [{ scope: 'project' }] }))).toEqual([]);
    expect(readGrants(accessTokenWithClaims({ grants: 'project' }))).toEqual([]);
  });

  it('decodes a base64url payload, whose alphabet and padding differ from standard base64', () => {
    // Chosen so the two encodings actually differ: the standard form here carries a `+` and two `=` of padding, both of which are invalid input to `atob`. The inequality is asserted so the case cannot pass vacuously against a fixture that happened to be alphabet-neutral.
    const json = JSON.stringify({ grants: [ENTITY_EDITOR], sub: 'ÿþý' });
    const standard = Buffer.from(json).toString('base64');
    const urlSafe = Buffer.from(json).toString('base64url');
    expect(standard).not.toEqual(urlSafe);

    expect(readGrants(`header.${urlSafe}.signature`)).toEqual([ENTITY_EDITOR]);
  });
});

describe('hasAnyGrant', () => {
  it('is a pure membership test over the claims list, matching on the scope and the role together', () => {
    expect(hasAnyGrant([ENTITY_EDITOR], CANDIDATE_GRANTS)).toBe(true);
    expect(hasAnyGrant([ENTITY_EDITOR], ADMIN_GRANTS)).toBe(false);
    expect(hasAnyGrant([], ADMIN_GRANTS)).toBe(false);
    expect(hasAnyGrant([GLOBAL_ADMIN], ADMIN_GRANTS)).toBe(true);
    // Neither half alone is enough: the entity-scope admin matches the admin set's role and the candidate set's scope, and is admitted by neither.
    expect(hasAnyGrant([ENTITY_ADMIN], ADMIN_GRANTS)).toBe(false);
    expect(hasAnyGrant([ENTITY_ADMIN], CANDIDATE_GRANTS)).toBe(false);
  });

  it('admits only the CANDIDATE entity editor to the Candidate App, not an organization, faction or alliance editor (162-REVIEW IN-05)', () => {
    for (const target_type of ['organization', 'faction', 'alliance']) {
      expect(hasAnyGrant([{ ...ENTITY_EDITOR, target_type }], CANDIDATE_GRANTS)).toBe(false);
    }
    expect(hasAnyGrant([ENTITY_EDITOR], CANDIDATE_GRANTS)).toBe(true);
    // A shape that names no target_type still matches any, so the admin shapes are unaffected.
    expect(hasAnyGrant([PROJECT_EDITOR], [{ scope: 'project', role: 'editor' }])).toBe(true);
  });

  it('mutates neither argument, so a caller may hold the shape sets as shared constants', () => {
    const claims = [ENTITY_EDITOR];
    hasAnyGrant(claims, ADMIN_GRANTS);

    expect(claims).toEqual([ENTITY_EDITOR]);
    expect([...ADMIN_GRANTS]).toEqual([
      { scope: 'global', role: 'admin' },
      { scope: 'account', role: 'admin' },
      { scope: 'project', role: 'admin' }
    ]);
    expect([...CANDIDATE_GRANTS]).toEqual([{ scope: 'entity', role: 'editor', target_type: 'candidate' }]);
  });
});
