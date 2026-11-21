/**
 * `UniversalDataWriter.registerIdentityProviderAccount` against a stubbed request `fetch`: the request it makes, and the answers it reads, a failed request among them, which it never rejects for.
 */

import { describe, expect, it, vi } from 'vitest';
import { UNIVERSAL_API_ROUTES } from './universalApiRoutes';
import { UniversalDataWriter } from './universalDataWriter';
import type { AdapterConfig } from './universalAdapter.type';

/** The writer's concrete methods alone: the abstract ones are never called here. */
const ConcreteWriter = UniversalDataWriter as unknown as new (config: AdapterConfig) => UniversalDataWriter;

function answer(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

function writerAnswering(reply: () => Promise<Response>) {
  const fetchMock = vi.fn<typeof fetch>(reply);
  return { writer: new ConcreteWriter({ fetch: fetchMock }), fetchMock };
}

describe('registerIdentityProviderAccount', () => {
  it('posts the intent as JSON to the endpoint and answers its result', async () => {
    const { writer, fetchMock } = writerAnswering(() => Promise.resolve(answer({ result: 'in-use' })));

    expect(await writer.registerIdentityProviderAccount({ intent: 'save', email: 'typed@example.org' })).toBe('in-use');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(UNIVERSAL_API_ROUTES.identityProviderRegistration);
    expect(init.method).toBe('POST');
    expect(new Headers(init.headers).get('content-type')).toBe('application/json');
    expect(JSON.parse(String(init.body))).toEqual({ intent: 'save', email: 'typed@example.org' });
  });

  it.each([
    ['a body without a result', () => Promise.resolve(answer({}))],
    ['a body that is not an object', () => Promise.resolve(answer('sent'))],
    ['a refused request', () => Promise.resolve(answer({ result: 'failed' }, 403))],
    ['a failed request', () => Promise.reject(new Error('offline'))]
  ])('answers undefined for %s', async (_, reply) => {
    const { writer } = writerAnswering(reply);

    await expect(writer.registerIdentityProviderAccount({ intent: 'resend' })).resolves.toBeUndefined();
  });
});
