/**
 * The root universal load forwards the analytics projection. A present universal load hands on only what it returns, so a projection it forgets reads as inactive in every app and sends nothing, with no error.
 */

import { describe, expect, it, vi } from 'vitest';
import type { AnalyticsProjection } from '$lib/analytics/modes';

vi.mock('$lib/api/dataProvider', () => ({
  createDataProvider: () => ({
    getAppCustomization: async () => ({}),
    getAppSettings: async () => ({}),
    getElectionData: async () => [],
    getConstituencyData: async () => ({ groups: [], constituencies: [] })
  }),
  createSupabaseUniversalClient: vi.fn(() => ({}))
}));

const { load } = await import('./+layout');

describe('root universal load', () => {
  it('forwards the projection the server load returned', async () => {
    const analytics: AnalyticsProjection = { active: true, consentMode: 'free', visitIdMode: 'none' };

    const result = await load({
      data: { supabaseCookies: [], analytics },
      fetch: (async () => new Response()) as typeof fetch
    } as unknown as Parameters<typeof load>[0]);

    expect(result.analytics).toBe(analytics);
  });
});
