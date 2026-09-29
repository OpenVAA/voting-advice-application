import { configureLogger } from '@openvaa/app-shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './+server';

/**
 * `/api/candidate/preregister` forwards the `identity-callback` Edge Function's OWN status.
 *
 * ## What this spec is a control for
 *
 * The route used to answer `error(500, …)` for every `fnError`, whatever the function returned. That mattered because `functions.invoke` collapses all failures into a `FunctionsHttpError` whose message is the fixed string `'Edge Function returned a non-2xx status code'`, so the browser saw `500 • Edge Function returned a non-2xx status code` whether the token had been rejected or the deployment was unconfigured. Those are opposite problems:
 *
 *   - **401** — the token failed decryption, signature or claim verification. Re-authenticating may fix it; nothing is wrong with the deployment.
 *   - **500** — `ERR_ENV_UNCONFIGURED`, an unknown provider type, or a failed admin API call. The function's body is a fixed `'Internal server error'` literal that names nothing (deliberately: the endpoint is served `--no-verify-jwt`), so the variable name exists ONLY in the container log, and retrying forever will not help.
 *
 * Collapsing them cost a real debug session: an unset `IDENTITY_PROVIDER_TYPE` presented as a generic 500 and sent the operator through the entire token pipeline before the edge runtime log was read (`.planning/debug/idura-bank-auth-empty-client.md`, finding 4).
 *
 * ## Why the 418 case is the load-bearing one
 *
 * Asserting that an upstream 500 produces a 500 would pass against the very bug this spec exists to prevent — the old code returned 500 unconditionally. The `418` case cannot: no hardcoded status produces it. It is the assertion that proves the status is DERIVED from the upstream response rather than chosen by this route, and it is why the suite would have reddened on the old code.
 */

const invoke = vi.fn();
const verifyOtp = vi.fn(async () => ({ error: null }));

/** A `FunctionsHttpError`-shaped rejection: the real one carries the upstream `Response` as `context`. */
function httpError(status: number) {
  return {
    name: 'FunctionsHttpError',
    message: 'Edge Function returned a non-2xx status code',
    context: { status }
  };
}

/**
 * Build the `{ cookies, request, locals }` the endpoint receives.
 *
 * `idToken` is `string | null` rather than an optional with a default: a destructuring default fires on an EXPLICIT `undefined` too, so `eventWith({ idToken: undefined })` would have handed the route the default token and silently tested the wrong branch. `null` is the only way to say "no cookie" that a default cannot overwrite. */
function eventWith({ idToken = 'header.payload.signature' }: { idToken?: string | null } = {}) {
  const deleted: Array<string> = [];
  return {
    deleted,
    event: {
      cookies: {
        get: vi.fn(() => idToken ?? undefined),
        delete: vi.fn((name: string) => deleted.push(name))
      },
      request: new Request('http://localhost/api/candidate/preregister', { method: 'POST' }),
      locals: {
        supabase: {
          functions: { invoke },
          auth: { verifyOtp }
        }
      }
    } as unknown as Parameters<typeof POST>[0]
  };
}

/** Invoke the endpoint and return the thrown SvelteKit `HttpError`'s status, or `'no-throw'`. */
async function statusOf(event: Parameters<typeof POST>[0]): Promise<number | 'no-throw'> {
  try {
    await POST(event);
    return 'no-throw';
  } catch (e) {
    if (e && typeof e === 'object' && 'status' in e) return (e as { status: number }).status;
    throw e;
  }
}

describe('/api/candidate/preregister — upstream status propagation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Silence the route's own error logging; this spec asserts statuses, not log text.
    configureLogger({ level: 'silent' });
  });

  it('propagates an upstream 418, which no hardcoded status could produce (the real control)', async () => {
    invoke.mockResolvedValue({ data: null, error: httpError(418) });
    const { event } = eventWith();
    expect(await statusOf(event)).toBe(418);
  });

  it('propagates a token rejection as 401 rather than collapsing it to 500', async () => {
    invoke.mockResolvedValue({ data: null, error: httpError(401) });
    const { event } = eventWith();
    expect(await statusOf(event)).toBe(401);
  });

  it('still answers 500 when the function itself returned 500 (the misconfigured-deployment case)', async () => {
    invoke.mockResolvedValue({ data: null, error: httpError(500) });
    const { event } = eventWith();
    expect(await statusOf(event)).toBe(500);
  });

  it('answers 502 when the function was never reached, so no upstream status exists', async () => {
    // `FunctionsFetchError` / `FunctionsRelayError` carry no `context`: nothing upstream answered.
    invoke.mockResolvedValue({
      data: null,
      error: { name: 'FunctionsFetchError', message: 'Failed to send a request to the Edge Function' }
    });
    const { event } = eventWith();
    expect(await statusOf(event)).toBe(502);
  });

  it('ignores an out-of-range upstream status rather than forwarding it as an HTTP status', async () => {
    // A 200-with-error, or a garbage value, must not become the response status: `error()` rejects a non-4xx/5xx status outright, which would turn a bad upstream into a crash in this route.
    invoke.mockResolvedValue({ data: null, error: httpError(200) });
    const { event } = eventWith();
    expect(await statusOf(event)).toBe(502);
  });

  it('answers 401 with no id_token cookie, without invoking the function at all', async () => {
    const { event } = eventWith({ idToken: null });
    expect(await statusOf(event)).toBe(401);
    expect(invoke).not.toHaveBeenCalled();
  });

  it('succeeds and clears the id_token cookie when the function returns a magic link', async () => {
    invoke.mockResolvedValue({
      data: { session: { action_link: 'http://localhost:54321/auth/v1/verify?token=abc&type=magiclink' } },
      error: null
    });
    const { event, deleted } = eventWith();
    const response = await POST(event);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ type: 'success' });
    expect(verifyOtp).toHaveBeenCalledWith({ token_hash: 'abc', type: 'magiclink' });
    expect(deleted).toContain('id_token');
  });
});
