import { describe, expect, it, vi } from 'vitest';
import { resolveAdapterConfig } from './dataProvider';
import type { AdapterSource } from './dataProvider';

/**
 * `resolveAdapterConfig`'s three arms are EXHAUSTIVE at runtime, not only in the type (WR-02).
 *
 * The module argues at length that "a caller that supplies none does not compile" and that "a silent fallback is not something this type forbids by convention — it is something it cannot express". Until this spec the third arm was an unguarded `else`: the `browser: true` discriminant was never read, so anything reaching the function without `locals` and without `client` — an `as AdapterSource` cast, a JS consumer, a spread that dropped an `undefined` `client` key, a fourth arm added to the union without a branch — silently received the browser client. On the server that client is process-lifetime shared, which is the contamination ruling **D10** describes, reintroduced one layer above the code this phase deleted.
 *
 * The last case is the one that matters, and it is written against a deliberately malformed source because a well-typed one cannot express the state under test.
 */

const browserMocks = vi.hoisted(() => ({ client: { id: 'the-tab-singleton' } }));
vi.mock('$lib/supabase/browser', () => ({
  createSupabaseBrowserClient: () => browserMocks.client
}));

/** A stand-in client. Only its identity is ever asserted, so its shape is irrelevant. */
function fakeClient(id: string) {
  return { id } as unknown as never;
}

describe('resolveAdapterConfig — every arm is named, and the fourth is a throw', () => {
  it('takes the request-scoped client from the `locals` arm', () => {
    const client = fakeClient('per-request');
    const config = resolveAdapterConfig({ fetch: globalThis.fetch, locals: { supabase: client } });
    expect(config.client).toBe(client);
    expect(config.fetch).toBe(globalThis.fetch);
  });

  it('takes the finished client from the `client` arm', () => {
    const client = fakeClient('from-parent');
    const config = resolveAdapterConfig({ fetch: globalThis.fetch, client });
    expect(config.client).toBe(client);
  });

  it('reads the `browser` discriminant rather than falling through to it', () => {
    const config = resolveAdapterConfig({ fetch: globalThis.fetch, browser: true });
    expect(config.client).toBe(browserMocks.client);
  });

  // WR-03. `SupabaseAdapterConfig` has always declared these and the mixin has always read them, but nothing in the application set them, so `this.locale` was permanently `''` in production and only the provider's own tests could reach the Finnish-extraction path.
  it('forwards the locales on every arm, so the mixin fallback is live rather than dead configuration', () => {
    const client = fakeClient('from-parent');
    expect(resolveAdapterConfig({ fetch: globalThis.fetch, client, locale: 'fi', defaultLocale: 'sv' })).toMatchObject({
      locale: 'fi',
      defaultLocale: 'sv'
    });
    expect(resolveAdapterConfig({ fetch: globalThis.fetch, locals: { supabase: client }, locale: 'fi' })).toMatchObject(
      { locale: 'fi' }
    );
    expect(resolveAdapterConfig({ fetch: globalThis.fetch, browser: true, locale: 'fi' })).toMatchObject({
      locale: 'fi'
    });
  });

  it('leaves the locales undefined when the caller names none, so the mixin defaults still apply', () => {
    const config = resolveAdapterConfig({ fetch: globalThis.fetch, client: fakeClient('from-parent') });
    expect(config.locale).toBeUndefined();
    expect(config.defaultLocale).toBeUndefined();
  });

  it('throws on a source naming no client, instead of handing back the shared browser client', () => {
    // reason: this is exactly the state the union cannot express; the cast is the point of the case.
    const unnamed = { fetch: globalThis.fetch } as unknown as AdapterSource;
    expect(() => resolveAdapterConfig(unnamed)).toThrow('no client source named');
  });
});
