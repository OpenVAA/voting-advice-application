/**
 * The root server load hands the browser the analytics projection and nothing more: exactly three members, and neither the provider's name nor its key anywhere in what it returns.
 *
 * The configuration is resolved at module scope, so each case resets the module registry, mocks the private environment and imports the load afresh.
 *
 * @vitest-environment node
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { INACTIVE_PROJECTION } from '$lib/analytics/modes';

/** A key value planted to prove it never reaches the hydration payload. */
const PLANTED_KEY = 'phc_planted_zz9';

/**
 * Import the root server load against the given private environment and call it with one Supabase cookie and one unrelated cookie.
 *
 * @param privateEnv - The private environment the load's configuration is resolved from.
 * @returns What the load returned.
 */
async function runLoad(privateEnv: Record<string, string>) {
  vi.resetModules();
  vi.doMock('$env/dynamic/private', () => ({ env: privateEnv }));
  vi.doMock('$lib/api/dataProvider', () => ({ SUPABASE_COOKIE_PREFIX: 'sb-' }));
  const { load } = await import('./+layout.server');
  return load({
    cookies: {
      getAll: () => [
        { name: 'sb-test-auth-token', value: 'cookie-value' },
        { name: 'id_token', value: 'not-for-the-payload' }
      ]
    }
  } as unknown as Parameters<typeof load>[0]);
}

afterEach(() => {
  vi.doUnmock('$env/dynamic/private');
  vi.doUnmock('$lib/api/dataProvider');
});

describe('root server load', () => {
  it('returns the projection of a configured provider, with three members and neither the provider nor the key', async () => {
    const result = await runLoad({ ANALYTICS_PROVIDER: 'posthog', ANALYTICS_POSTHOG_KEY: PLANTED_KEY });

    expect(result.analytics).toEqual({ active: true, consentMode: 'gated', visitIdMode: 'memory' });
    expect(Object.keys(result.analytics)).toHaveLength(3);
    const serialised = JSON.stringify(result);
    expect(serialised).not.toContain('posthog');
    expect(serialised).not.toContain(PLANTED_KEY);
  });

  it('returns the inactive projection with an empty private environment', async () => {
    const result = await runLoad({});

    expect(result.analytics).toEqual(INACTIVE_PROJECTION);
  });

  it('still returns only the Supabase cookies beside the projection', async () => {
    const result = await runLoad({});

    expect(result).toEqual({
      supabaseCookies: [{ name: 'sb-test-auth-token', value: 'cookie-value' }],
      analytics: INACTIVE_PROJECTION
    });
  });
});
