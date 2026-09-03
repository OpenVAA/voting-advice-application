import { configureLogger } from '@openvaa/app-shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './active/+server';

/**
 * The `/api/admin/jobs/**` authorization gate, exercised END TO END through a real endpoint (CR-01).
 *
 * ## What this spec is a control for
 *
 * The endpoints used to gate on `getUserData(...)?.role !== 'admin'` alone. That role is decoded from the access token in the request's `sb-*` cookies, and `supabase.auth.getSession()` returns that token WITHOUT checking its signature — it validates only the session's self-reported `expires_at`. An unauthenticated caller could therefore mint their own JWT carrying `{"user_roles":[{"role":"super_admin"}]}`, park it in an `sb-*` cookie with a future expiry, and pass the check: starting LLM jobs, aborting running ones and reading the in-memory job store (author e-mail addresses, inputs, pipeline messages).
 *
 * The forged-cookie case below is that attack, expressed at the only layer where it is observable: `locals.safeGetSession` is implemented here BYTE FOR BYTE as `hooks.server.ts` implements it, over a client stub that behaves as the real one does against a forged token — `getSession()` hands the blob back happily, `getUser()` rejects it. The rest of the spec is the discrimination that makes the rejection meaningful: a genuine admin still gets 200, and a genuine NON-admin still gets the unchanged 403.
 *
 * `active` is the endpoint under test because it is a plain GET with no body and no path parameters, so nothing but the gate stands between the request and the job store. All six endpoints route through the same `requireVerifiedAdmin`, which is why one endpoint is enough to hold the property and why the helper exists rather than six transcriptions.
 */

const jobStoreMocks = vi.hoisted(() => ({ getActiveJobs: vi.fn(() => []) }));
vi.mock('$lib/server/admin/jobs/jobStore', () => ({
  getActiveJobs: jobStoreMocks.getActiveJobs
}));

/** A well-formed, unexpired access token carrying whatever roles it is given. Its signature is meaningless — that is the whole point. */
function accessTokenFor(userRoles: Array<{ role: string; scope_type: string; scope_id: string }>): string {
  return `header.${btoa(JSON.stringify({ user_roles: userRoles }))}.signature`;
}

/**
 * Build the `locals` an endpoint receives, over a client stub whose two auth calls are set independently.
 *
 * Separating them is what lets the forged case be expressed at all: a forged cookie is precisely a session `getSession()` accepts and `getUser()` does not. `safeGetSession` below is the production implementation, transcribed rather than imported because `hooks.server.ts` builds it inside a `Handle` that cannot be invoked from a unit test.
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
  // Only `auth` is stubbed: that is all the gate reaches, and the adapter-boundary guard bans naming the client's own type outside `src/lib/api/adapters/**`, so the object stays structural and is cast once, at the `App.Locals` boundary below.
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

/**
 * Invoke the `active` endpoint with the given `locals`.
 * @param locals - The request's locals.
 * @returns The endpoint's response.
 */
function callActive(locals: App.Locals): Promise<Response> {
  return GET({
    url: new URL('http://localhost/api/admin/jobs/active'),
    fetch: globalThis.fetch,
    locals
    // reason: the endpoint destructures exactly these three members of the event; the parameter type is read off the handler itself so a route-generated `RequestEvent` shape cannot drift from this call.
  } as unknown as Parameters<typeof GET>[0]) as Promise<Response>;
}

describe('/api/admin/jobs authorization — a VERIFIED identity, then the role (CR-01)', () => {
  beforeEach(() => {
    // `getUserData` swallows the adapter's throw into a structured `error` record; keep the suite's stdout clean without silencing the assertions.
    configureLogger({ level: 'silent' });
    jobStoreMocks.getActiveJobs.mockClear();
    jobStoreMocks.getActiveJobs.mockReturnValue([]);
  });

  it('rejects a forged, unexpired session cookie claiming super_admin — and never reaches the job store', async () => {
    const response = await callActive(
      localsWith({
        session: {
          user: { id: 'attacker', email: 'attacker@example.com', user_metadata: {} },
          access_token: accessTokenFor([{ role: 'super_admin', scope_type: 'project', scope_id: 'proj-1' }]),
          expires_at: Math.floor(Date.now() / 1000) + 3600
        },
        verifiedUser: null
      })
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
    // The disclosure half of the defect: the job store carries author e-mail addresses, job inputs and pipeline messages.
    expect(jobStoreMocks.getActiveJobs).not.toHaveBeenCalled();
  });

  it('rejects a request carrying no session at all', async () => {
    const response = await callActive(localsWith({ session: null, verifiedUser: null }));

    expect(response.status).toBe(401);
    expect(jobStoreMocks.getActiveJobs).not.toHaveBeenCalled();
  });

  it('still answers a verified NON-admin with the unchanged 403', async () => {
    const user = { id: 'cand-1', email: 'candidate@example.com', user_metadata: {} };
    const response = await callActive(
      localsWith({
        session: {
          user,
          access_token: accessTokenFor([{ role: 'candidate', scope_type: 'candidate', scope_id: 'cand-1' }]),
          expires_at: Math.floor(Date.now() / 1000) + 3600
        },
        verifiedUser: user
      })
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: 'Forbidden' });
    expect(jobStoreMocks.getActiveJobs).not.toHaveBeenCalled();
  });

  it('admits a verified admin — the control that makes the rejections discriminating', async () => {
    const user = { id: 'admin-1', email: 'admin@example.com', user_metadata: {} };
    jobStoreMocks.getActiveJobs.mockReturnValue([]);
    const response = await callActive(
      localsWith({
        session: {
          user,
          access_token: accessTokenFor([{ role: 'project_admin', scope_type: 'project', scope_id: 'proj-1' }]),
          expires_at: Math.floor(Date.now() / 1000) + 3600
        },
        verifiedUser: user
      })
    );

    expect(response.status).toBe(200);
    expect(jobStoreMocks.getActiveJobs).toHaveBeenCalled();
  });
});
