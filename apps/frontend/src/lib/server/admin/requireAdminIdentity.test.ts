import { configureLogger } from '@openvaa/app-shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ADMIN_ROLES, CANDIDATE_ROLES } from '$lib/auth/roles';
import { requireAdminAction } from './requireAdminAction';
import { requireAdminIdentity } from './requireAdminIdentity';
import { requireVerifiedAdmin } from './requireVerifiedAdmin';

/**
 * The ONE admin-identity decision and its two presentations, plus the two form actions that were the last admin entry points without a gate of their own (D10 criterion 9, OB-5 deliverable 1).
 *
 * ## What this spec is a control for
 *
 * The two admin form actions verified a session and then tested nothing about it. An authenticated NON-admin's POST therefore entered the action body, constructed a privileged data writer, and issued `startJob` — and was stopped only one layer deeper, by the API route's own gate. `158-SWALLOWED-ERROR-MEASUREMENT.md` records what that looked like live: the refusal reached the caller as a `fail(500)` carrying an adapter-internal message that named an internal API route, not as an authorization status. The form-action cases below are that defect, expressed at the layer where it is observable, and each asserts the refusal AND that no privileged call was made — because a gate that refuses after doing the work is not a gate.
 *
 * ## Why the fixtures name no role
 *
 * The token claims below are built from `ADMIN_ROLES` and `CANDIDATE_ROLES` imported from `$lib/auth/roles`, the phase's single declaration, rather than from role-name literals. A transcribed literal would keep passing after a rename in the migration that the declaration follows, which is the drift the declaration exists to prevent — and it would make this file a further copy of the very list criterion 9 counts.
 *
 * ## Why `safeGetSession` is transcribed rather than imported
 *
 * `hooks.server.ts` builds it inside a `Handle` that cannot be invoked from a unit test. It is transcribed here BYTE FOR BYTE, exactly as `routes/api/admin/jobs/adminJobsAuthorization.test.ts` transcribes it, so the forged-cookie case — a session `getSession()` accepts and `getUser()` rejects — is expressible at all.
 */

const featureMocks = vi.hoisted(() => ({
  condenseArguments: vi.fn(async () => true),
  generateQuestionInfo: vi.fn(async () => true)
}));
vi.mock('$lib/server/admin/features/condenseArguments', () => ({
  condenseArguments: featureMocks.condenseArguments
}));
vi.mock('$lib/server/admin/features/generateQuestionInfo', () => ({
  generateQuestionInfo: featureMocks.generateQuestionInfo
}));

/** A well-formed, unexpired access token carrying whatever roles it is given. Its signature is meaningless — that is the whole point. */
function accessTokenFor(roles: ReadonlyArray<string>): string {
  return `header.${btoa(
    JSON.stringify({
      user_roles: roles.map((role) => ({ role, scope_type: 'project', scope_id: 'proj-1' }))
    })
  )}.signature`;
}

/**
 * Build the `locals` a server entry point receives, over a client stub whose two auth calls are set independently.
 *
 * Separating them is what lets the forged case be expressed: a forged cookie is precisely a session `getSession()` accepts and `getUser()` does not.
 * @param options.session - What `getSession()` returns; `null` for a request carrying no auth cookie at all.
 * @param options.verifiedUser - What `getUser()` returns; `null` means the token failed verification.
 * @returns A `locals` object shaped as `App.Locals`.
 */
function localsWith({
  session,
  verifiedUser
}: {
  session: { user: Record<string, unknown>; access_token: string; expires_at: number } | null;
  verifiedUser: Record<string, unknown> | null;
}): App.Locals {
  // Only `auth` is stubbed: that is all the decision reaches, and the adapter-boundary guard bans naming the client's own type outside `src/lib/api/adapters/**`, so the object stays structural and is cast once, at the `App.Locals` boundary below.
  const supabase = {
    auth: {
      getSession: vi.fn(async () => ({ data: { session }, error: null })),
      getUser: vi.fn(async () =>
        verifiedUser
          ? { data: { user: verifiedUser }, error: null }
          : { data: { user: null }, error: { message: 'invalid JWT: unable to parse or verify signature' } }
      )
    }
  };

  return {
    supabase,
    // Transcribed from `hooks.server.ts`: `getSession()` first, then the verifying `getUser()` round-trip, and BOTH values discarded when it errors.
    safeGetSession: async () => {
      const {
        data: { session: current }
      } = await supabase.auth.getSession();
      if (!current) return { session: null, user: null };
      const {
        data: { user },
        error
      } = await supabase.auth.getUser();
      if (error) return { session: null, user: null };
      return { session: current, user };
    },
    currentLocale: 'en'
  } as unknown as App.Locals;
}

/** A verified session carrying the given roles. `roles` empty is a genuine identity with no role rows at all. */
function verifiedLocals({ roles, userId = 'user-1' }: { roles: ReadonlyArray<string>; userId?: string }): App.Locals {
  const user = { id: userId, email: `${userId}@example.com`, user_metadata: {} };
  return localsWith({
    session: { user, access_token: accessTokenFor(roles), expires_at: Math.floor(Date.now() / 1000) + 3600 },
    verifiedUser: user
  });
}

/** A verified session whose access token cannot be decoded, so the identity read throws and `getUserData` swallows it into `undefined`. */
function verifiedLocalsWithUnreadableIdentity(): App.Locals {
  const user = { id: 'user-x', email: 'user-x@example.com', user_metadata: {} };
  return localsWith({
    session: { user, access_token: 'not.a.jwt', expires_at: Math.floor(Date.now() / 1000) + 3600 },
    verifiedUser: user
  });
}

/** A `fetch` that answers any request with a 200 job record, and records every call it receives. */
function jobStartFetchSpy(): ReturnType<typeof vi.fn> {
  return vi.fn(
    async () =>
      new Response(JSON.stringify({ id: 'job-1', jobType: 'ArgumentCondensation', status: 'running' }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
  );
}

beforeEach(() => {
  // `getUserData` swallows the adapter's throw into a structured `error` record; keep the suite's stdout clean without silencing the assertions.
  configureLogger({ level: 'silent' });
  featureMocks.condenseArguments.mockClear();
  featureMocks.generateQuestionInfo.mockClear();
});

describe('requireAdminIdentity — the one decision, in its three shapes', () => {
  it('yields the unauthenticated verdict for a request carrying no session at all', async () => {
    const verdict = await requireAdminIdentity({
      fetch: globalThis.fetch,
      locals: localsWith({ session: null, verifiedUser: null })
    });

    expect(verdict).toEqual({ outcome: 'unauthenticated' });
  });

  it('yields the unauthenticated verdict for a forged, unexpired cookie claiming an admin role', async () => {
    const verdict = await requireAdminIdentity({
      fetch: globalThis.fetch,
      locals: localsWith({
        session: {
          user: { id: 'attacker', email: 'attacker@example.com', user_metadata: {} },
          access_token: accessTokenFor([ADMIN_ROLES[2]]),
          expires_at: Math.floor(Date.now() / 1000) + 3600
        },
        verifiedUser: null
      })
    });

    // The claim said `super_admin` and the verdict is not `forbidden` but `unauthenticated`: the token never survived the verifying round-trip, so its claims were never read.
    expect(verdict).toEqual({ outcome: 'unauthenticated' });
  });

  it('yields the forbidden verdict for a verified identity holding a non-admin role', async () => {
    const verdict = await requireAdminIdentity({
      fetch: globalThis.fetch,
      locals: verifiedLocals({ roles: [CANDIDATE_ROLES[0]] })
    });

    expect(verdict).toEqual({ outcome: 'forbidden' });
  });

  it('yields the forbidden verdict for a verified identity holding NO role rows at all', async () => {
    const verdict = await requireAdminIdentity({
      fetch: globalThis.fetch,
      locals: verifiedLocals({ roles: [] })
    });

    expect(verdict).toEqual({ outcome: 'forbidden' });
  });

  it('yields the forbidden verdict when the identity read yields nothing, rather than reading a property of a missing value', async () => {
    const verdict = await requireAdminIdentity({
      fetch: globalThis.fetch,
      locals: verifiedLocalsWithUnreadableIdentity()
    });

    expect(verdict).toEqual({ outcome: 'forbidden' });
  });

  it('yields the allowed verdict for a verified admin — the control that makes the four rejections discriminating', async () => {
    const verdict = await requireAdminIdentity({
      fetch: globalThis.fetch,
      locals: verifiedLocals({ roles: [ADMIN_ROLES[0]] })
    });

    expect(verdict).toEqual({ outcome: 'allowed' });
  });

  it('gives two CONCURRENT callers carrying different sessions their own verdicts', async () => {
    // Both promises are created before either is awaited, so the two calls are genuinely interleaved rather than sequential.
    const admin = requireAdminIdentity({
      fetch: globalThis.fetch,
      locals: verifiedLocals({ roles: [ADMIN_ROLES[0]], userId: 'admin-1' })
    });
    const candidate = requireAdminIdentity({
      fetch: globalThis.fetch,
      locals: verifiedLocals({ roles: [CANDIDATE_ROLES[0]], userId: 'cand-1' })
    });

    expect(await Promise.all([admin, candidate])).toEqual([{ outcome: 'allowed' }, { outcome: 'forbidden' }]);
  });
});

describe('requireVerifiedAdmin — the endpoint presentation, unchanged in name, parameters and both statuses', () => {
  it('still answers a request with no session with 401 { error: Unauthorized }', async () => {
    const denied = await requireVerifiedAdmin({
      fetch: globalThis.fetch,
      locals: localsWith({ session: null, verifiedUser: null })
    });

    expect(denied?.status).toBe(401);
    await expect(denied?.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('still answers a verified non-admin with 403 { error: Forbidden }', async () => {
    const denied = await requireVerifiedAdmin({
      fetch: globalThis.fetch,
      locals: verifiedLocals({ roles: [CANDIDATE_ROLES[0]] })
    });

    expect(denied?.status).toBe(403);
    await expect(denied?.json()).resolves.toEqual({ error: 'Forbidden' });
  });

  it('still returns undefined for a verified admin, so the endpoint proceeds', async () => {
    const denied = await requireVerifiedAdmin({
      fetch: globalThis.fetch,
      locals: verifiedLocals({ roles: [ADMIN_ROLES[0]] })
    });

    expect(denied).toBeUndefined();
  });
});

describe('requireAdminAction — the form-action presentation, differing from its sibling ONLY in the rejection shape', () => {
  it('refuses a request with no session with a 401 action failure', async () => {
    const denied = await requireAdminAction({
      fetch: globalThis.fetch,
      locals: localsWith({ session: null, verifiedUser: null })
    });

    expect(denied?.status).toBe(401);
    expect(denied?.data).toEqual({ type: 'error', error: 'Authentication required' });
  });

  it('refuses a verified non-admin with a 403 action failure naming AUTHORIZATION', async () => {
    const denied = await requireAdminAction({
      fetch: globalThis.fetch,
      locals: verifiedLocals({ roles: [CANDIDATE_ROLES[0]] })
    });

    expect(denied?.status).toBe(403);
    expect(denied?.data).toEqual({ type: 'error', error: 'Administrator access required' });
  });

  it('returns undefined for a verified admin, so the action proceeds', async () => {
    const denied = await requireAdminAction({
      fetch: globalThis.fetch,
      locals: verifiedLocals({ roles: [ADMIN_ROLES[0]] })
    });

    expect(denied).toBeUndefined();
  });
});

/**
 * THE ROUND TRIP. These four cases are the RED half of this plan's negative control: run against the ungated actions they fail, because an authenticated non-admin's POST reached `startJob` and the action answered 500 with an adapter-internal message. The assertions are byte-identical before and after the gate landed.
 */
describe('the two admin form actions refuse an authenticated non-admin THEMSELVES, before any privileged work', () => {
  /**
   * POST a form to an action, with a `fetch` that records every request the action's writer would make.
   * @param action - The action under test.
   * @param locals - The request's locals.
   * @param fields - The form fields to submit.
   * @returns The action's return value and the `fetch` spy it was given.
   */
  async function post(
    action: (event: never) => unknown,
    locals: App.Locals,
    fields: Record<string, string>
  ): Promise<{ result: unknown; fetch: ReturnType<typeof vi.fn> }> {
    // URL-encoded rather than `FormData`: jsdom's `Request` does not derive a `Content-Type` boundary header from a `FormData` body, so `request.formData()` rejects it before the action reaches its own first line — which would make the red half below a property of the harness instead of a property of the gate.
    // reason: serialised with `.toString()` because undici's `Request` validates `init.body` with `instanceof URLSearchParams` against its own realm, which vitest's global does not satisfy on node 22.22.1 (the version CI pins); the serialised form is byte-identical on the wire and the content-type is set explicitly just below, so nothing about this request changes.
    const body = new URLSearchParams(Object.entries(fields)).toString();
    const fetchSpy = jobStartFetchSpy();
    const result = await action({
      fetch: fetchSpy,
      locals,
      request: new Request('http://localhost/admin/x', {
        method: 'POST',
        body,
        headers: { 'content-type': 'application/x-www-form-urlencoded' }
      })
      // reason: the actions destructure exactly these three members of the event; the parameter type is read off the handler itself so a route-generated `RequestEvent` shape cannot drift from this call.
    } as unknown as never);
    return { result, fetch: fetchSpy };
  }

  it('argument-condensation refuses a verified non-admin with 403 and never reaches the job-start endpoint', async () => {
    const { actions } = await import('../../../routes/admin/(protected)/argument-condensation/+page.server');
    const { result, fetch } = await post(actions.default, verifiedLocals({ roles: [CANDIDATE_ROLES[0]] }), {
      electionId: 'election-1',
      questionIds: 'q1'
    });

    expect((result as { status: number }).status).toBe(403);
    expect((result as { data: unknown }).data).toEqual({ type: 'error', error: 'Administrator access required' });
    expect(fetch).not.toHaveBeenCalled();
    expect(featureMocks.condenseArguments).not.toHaveBeenCalled();
  });

  it('question-info refuses a verified non-admin with 403 and never reaches the job-start endpoint', async () => {
    const { actions } = await import('../../../routes/admin/(protected)/question-info/+page.server');
    const { result, fetch } = await post(actions.default, verifiedLocals({ roles: [CANDIDATE_ROLES[0]] }), {
      electionId: 'election-1',
      questionIds: 'q1',
      operations: 'terms'
    });

    expect((result as { status: number }).status).toBe(403);
    expect((result as { data: unknown }).data).toEqual({ type: 'error', error: 'Administrator access required' });
    expect(fetch).not.toHaveBeenCalled();
    expect(featureMocks.generateQuestionInfo).not.toHaveBeenCalled();
  });

  it('argument-condensation ADMITS a verified admin — the control that makes the refusal discriminating', async () => {
    const { actions } = await import('../../../routes/admin/(protected)/argument-condensation/+page.server');
    const { result, fetch } = await post(actions.default, verifiedLocals({ roles: [ADMIN_ROLES[0]] }), {
      electionId: 'election-1',
      questionIds: 'q1'
    });

    expect(result).toEqual({ type: 'success' });
    expect(fetch).toHaveBeenCalled();
    expect(featureMocks.condenseArguments).toHaveBeenCalled();
  });

  it('question-info ADMITS a verified admin — the control that makes the refusal discriminating', async () => {
    const { actions } = await import('../../../routes/admin/(protected)/question-info/+page.server');
    const { result, fetch } = await post(actions.default, verifiedLocals({ roles: [ADMIN_ROLES[0]] }), {
      electionId: 'election-1',
      questionIds: 'q1',
      operations: 'terms'
    });

    expect(result).toEqual({ type: 'success' });
    expect(fetch).toHaveBeenCalled();
    expect(featureMocks.generateQuestionInfo).toHaveBeenCalled();
  });
});

/**
 * THE FAILURE-SHAPE HARMONISATION (the operator ruling's deliverable 3, measured by `158-12` Task 1 rather than carried in OB-5).
 *
 * The gate above closes the AUTHORIZATION instance of the internal leak by construction: a non-admin no longer reaches the writer at all. It leaves the leak reachable for every OTHER upstream failure — a 409 from an already-running job, a 500, a network error — and it leaves the two siblings disagreeing about what to say. Measured live: `argument-condensation` returned `fail(500)` carrying `Error with UniversalAdapter.fetch when parsing response from '/api/admin/jobs/start': 403 • …`, naming an internal API route and an internal class, while `question-info` returned a generic `'Internal server error'`. One of the two leaked; neither reported anything a caller could act on.
 *
 * These cases run the SAME drive against both actions, as a verified ADMIN, so what is under test is the failure shape and not the gate.
 */
describe('the two admin form actions answer an upstream failure with ONE shape, carrying no internal detail', () => {
  /** Anything that would identify the internal transport to a caller: the adapter class, or an internal API route path. */
  const INTERNAL_DETAIL = /UniversalAdapter|\/api\/admin\//;

  /**
   * A `fetch` that refuses every request with the given status, the way the job-start endpoint refuses a duplicate job or fails outright.
   * @param status - The status to refuse with.
   * @returns The refusing fetch spy.
   */
  function refusingFetch(status: number): ReturnType<typeof vi.fn> {
    return vi.fn(
      async () =>
        new Response(JSON.stringify({ message: 'An active job for this feature is already running' }), {
          status,
          headers: { 'content-type': 'application/json' }
        })
    );
  }

  /**
   * Drive one action as a verified admin against a refusing job-start endpoint.
   * @param which - Which of the two sibling actions to drive.
   * @param status - The status the endpoint refuses with.
   * @returns The action's return value.
   */
  async function driveAgainstRefusal(
    which: 'argument-condensation' | 'question-info',
    status: number
  ): Promise<unknown> {
    const fields =
      which === 'argument-condensation'
        ? { electionId: 'election-1', questionIds: 'q1' }
        : { electionId: 'election-1', questionIds: 'q1', operations: 'terms' };
    const { actions } =
      which === 'argument-condensation'
        ? await import('../../../routes/admin/(protected)/argument-condensation/+page.server')
        : await import('../../../routes/admin/(protected)/question-info/+page.server');
    // reason: serialised with `.toString()` because undici's `Request` validates `init.body` with `instanceof URLSearchParams` against its own realm and vitest's global comes from a different one, so the object form throws on node 22.22.1 (the version CI pins) while passing on 22.4.0 and 24.x; the wire form is identical and the content-type is set explicitly below rather than inferred from the body type.
    const body = new URLSearchParams(Object.entries(fields)).toString();
    return actions.default({
      fetch: refusingFetch(status),
      locals: verifiedLocals({ roles: [ADMIN_ROLES[0]] }),
      request: new Request('http://localhost/admin/x', {
        method: 'POST',
        body,
        headers: { 'content-type': 'application/x-www-form-urlencoded' }
      })
      // reason: the actions destructure exactly these three members of the event; the parameter type is read off the handler itself so a route-generated `RequestEvent` shape cannot drift from this call.
    } as unknown as never);
  }

  it('the pattern that stands for "internal detail" DOES match the message the adapter actually produces', () => {
    // The self-test for the two cases below: a non-match there is the action withholding the detail, not a pattern that could never have seen it.
    expect(
      "Error with UniversalAdapter.fetch when parsing response from '/api/admin/jobs/start': 409 • An active job for this feature is already running"
    ).toMatch(INTERNAL_DETAIL);
  });

  it.each([409, 500])('both actions return the identical failure shape when job-start answers %i', async (status) => {
    const condensation = (await driveAgainstRefusal('argument-condensation', status)) as {
      status: number;
      data: unknown;
    };
    const questionInfo = (await driveAgainstRefusal('question-info', status)) as { status: number; data: unknown };

    expect(condensation.status).toBe(500);
    expect(questionInfo.status).toBe(500);
    // Not "both are 500" — the same status can carry two different bodies, which is exactly what was measured. The bodies themselves must agree.
    expect(condensation.data).toEqual(questionInfo.data);
    expect(condensation.data).toEqual({ type: 'error', error: 'Internal server error' });
  });

  it.each([409, 500])('neither action lets the adapter-internal detail reach the caller on a %i', async (status) => {
    for (const which of ['argument-condensation', 'question-info'] as const) {
      const result = (await driveAgainstRefusal(which, status)) as { data: unknown };
      expect(JSON.stringify(result.data)).not.toMatch(INTERNAL_DETAIL);
    }
  });
});
