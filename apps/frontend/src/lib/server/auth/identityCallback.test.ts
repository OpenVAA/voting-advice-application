/**
 * Tests for `invokeIdentityCallback`: the call it makes to the `identity-callback` Edge Function, and how it reads every answer the function gives into an arrival and a token or one closed code with a cause.
 *
 * @vitest-environment node
 */

import { describe, expect, it, vi } from 'vitest';
import { errorName, invokeIdentityCallback } from './identityCallback';

const SERVER_SECRET = 'test-server-secret';
const TOKEN = 'function-sign-in-token';
const ARGS = { serverSecret: SERVER_SECRET, idToken: 'test.id.token', projectId: 'project-1', entityType: 'candidate' };

/** A client whose `functions.invoke` resolves with `answer`. */
function clientAnswering(answer: { data?: unknown; error?: unknown }) {
  const invoke = vi.fn().mockResolvedValue({ data: answer.data ?? null, error: answer.error ?? null });
  return { invoke, client: { functions: { invoke } } as never };
}

/** The error `functions.invoke` returns for a non-2xx answer, keeping the response as its `context`. */
function httpError(status: number, body: unknown) {
  return { name: 'FunctionsHttpError', context: new Response(JSON.stringify(body), { status }) };
}

describe('invokeIdentityCallback', () => {
  it("invokes identity-callback once with the server's secret in the credential header, the token, the project and the type", async () => {
    const { invoke, client } = clientAnswering({ data: { result: 'created', token: TOKEN } });
    await invokeIdentityCallback({ supabase: client, ...ARGS });
    expect(invoke).toHaveBeenCalledTimes(1);
    expect(invoke).toHaveBeenCalledWith('identity-callback', {
      headers: { 'x-identity-callback-secret': SERVER_SECRET },
      body: { id_token: 'test.id.token', project_id: 'project-1', entity_type: 'candidate' }
    });
  });

  it.each([
    ['created', 'created'],
    ['found', 'existing'],
    ['no_entity', 'existing']
  ])('reads the result %s as the arrival %s, with its token', async (result, arrival) => {
    const { client } = clientAnswering({ data: { result, token: TOKEN } });
    await expect(invokeIdentityCallback({ supabase: client, ...ARGS })).resolves.toEqual({
      ok: true,
      arrival,
      token: TOKEN
    });
  });

  it('answers a successful result without a sign-in token as registration_failed', async () => {
    const { client } = clientAnswering({ data: { result: 'created' } });
    await expect(invokeIdentityCallback({ supabase: client, ...ARGS })).resolves.toEqual({
      ok: false,
      error: 'registration_failed',
      cause: 'function result created, status 2xx, with no sign-in token'
    });
  });

  it("reads a failed answer's result and status from the response the error keeps", async () => {
    const { client } = clientAnswering({ error: httpError(403, { result: 'mode_not_allowed', message: 'secret' }) });
    const outcome = await invokeIdentityCallback({ supabase: client, ...ARGS });
    expect(outcome).toEqual({
      ok: false,
      error: 'mode_not_allowed',
      cause: 'function result mode_not_allowed, status 403'
    });
    expect(JSON.stringify(outcome)).not.toContain('secret');
  });

  it('names the differing secret in the cause of a refused answer', async () => {
    const { client } = clientAnswering({ error: httpError(401, { result: 'refused' }) });
    const outcome = await invokeIdentityCallback({ supabase: client, ...ARGS });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.cause).toContain('the secret differs between the root .env and the function env');
  });

  it('does not take a result inherited from Object.prototype as an arrival', async () => {
    const { client } = clientAnswering({ data: { result: 'toString', token: TOKEN } });
    const outcome = await invokeIdentityCallback({ supabase: client, ...ARGS });
    expect(outcome.ok).toBe(false);
  });

  it('answers a function that was never reached as registration_failed, with an unreachable status', async () => {
    const { client } = clientAnswering({ error: { name: 'FunctionsFetchError', context: new Error('down') } });
    await expect(invokeIdentityCallback({ supabase: client, ...ARGS })).resolves.toEqual({
      ok: false,
      error: 'registration_failed',
      cause: 'function result undefined, status unreachable'
    });
  });

  it('answers an invoke that rejects as registration_failed, naming only the error', async () => {
    const invoke = vi.fn().mockRejectedValue(new TypeError('a message that must not be logged'));
    const outcome = await invokeIdentityCallback({ supabase: { functions: { invoke } } as never, ...ARGS });
    expect(outcome).toEqual({ ok: false, error: 'registration_failed', cause: 'the invoke threw TypeError' });
  });
});

describe('errorName', () => {
  it('names an error by its name and anything else generically, never by a message', () => {
    expect(errorName(new RangeError('message'))).toBe('RangeError');
    expect(errorName('message')).toBe('a non-error value');
  });
});
