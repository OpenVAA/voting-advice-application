/**
 * Vitest coverage for {@link mintCandidateSession} (Phase 91 Plan 91-01
 * Task 3).
 *
 * The helper depends on a live Supabase admin client to look up the seeded
 * candidate and mint a session. For unit-test purposes we mock the
 * SupabaseAdminClient surface — full integration coverage lives at the
 * Playwright spec layer (Plan 91-02 A1/A2/A9 perm specs consume this helper
 * end-to-end against a live local Supabase instance).
 *
 * Covers the 3 RED-phase test cases enumerated in the plan's `<behavior>`
 * block:
 *
 *  1. `mintCandidateSession({ externalId, prefix })` returns an object with
 *     a non-empty `cookies` array (Playwright storage-state shape).
 *  2. The returned object is structurally compatible with Playwright's
 *     `test.use({ storageState })` signature (`cookies[]` + `origins[]`).
 *  3. `mintCandidateSession` rejects with a not-found error when the seeded
 *     candidate cannot be resolved.
 */

import { describe, expect, it, vi } from 'vitest';

// Mock the SupabaseAdminClient surface BEFORE importing the helper.
// The helper composes:
//   1. SupabaseAdminClient.findData('candidates', { external_id })
//   2. supabase.auth.admin.generateLink({ type: 'magiclink', email })
//   3. Exchange / hash → session cookies
// We stub steps 1-3 to return canned shapes so the helper's storage-state
// emission logic can be verified deterministically.
vi.mock('./supabaseAdminClient', () => {
  class MockSupabaseAdminClient {
    async findData(collection: string, filters: Record<string, unknown>): Promise<unknown> {
      const extId = (filters.external_id as { $eq?: string } | string | undefined) ?? '';
      const ext = typeof extId === 'string' ? extId : extId.$eq ?? '';
      if (collection !== 'candidates') return { data: [] };
      if (ext.includes('does-not-exist')) return { data: [] };
      // Canned candidate row — minimal shape consumed by the helper.
      return {
        data: [
          {
            id: 'mock-cand-uuid-1',
            external_id: ext,
            email: `${ext}@test.openvaa.local`,
            auth_user_id: 'mock-auth-uuid-1'
          }
        ]
      };
    }
  }
  return { SupabaseAdminClient: MockSupabaseAdminClient };
});

import { mintCandidateSession } from './candidateSessionMinter';

describe('mintCandidateSession', () => {
  it('returns a Playwright storage-state object with a non-empty cookies array (Test 1)', async () => {
    const state = await mintCandidateSession({
      externalId: 'cand-1',
      prefix: 'e2e-perm-answers-locked-'
    });
    expect(state).toBeDefined();
    expect(Array.isArray(state.cookies)).toBe(true);
    expect(state.cookies.length).toBeGreaterThan(0);
  });

  it('returned object is structurally compatible with Playwright test.use({ storageState }) (Test 2)', async () => {
    const state = await mintCandidateSession({
      externalId: 'cand-1',
      prefix: 'e2e-perm-hide-hero-'
    });
    // Playwright storageState shape: { cookies: Cookie[]; origins: Origin[] }
    expect(state).toHaveProperty('cookies');
    expect(state).toHaveProperty('origins');
    expect(Array.isArray(state.cookies)).toBe(true);
    expect(Array.isArray(state.origins)).toBe(true);
    // Sample cookie structure must have name + value at minimum.
    const first = state.cookies[0];
    expect(first).toHaveProperty('name');
    expect(first).toHaveProperty('value');
  });

  it('rejects with a not-found error when the seeded candidate cannot be resolved (Test 3)', async () => {
    await expect(
      mintCandidateSession({
        externalId: 'does-not-exist',
        prefix: 'e2e-perm-x-'
      })
    ).rejects.toThrow(/not.*found|candidate/i);
  });
});
