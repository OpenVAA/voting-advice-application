/**
 * The located voter layout's election and constituency guard.
 *
 * An empty selection redirects to the selector instead of reading data. `parseParams` reduces a degenerate `?electionId=` to `[]`, and `getImpliedConstituencyIds` returns `[]` when it has no elections to imply from; neither counts as a selection.
 *
 * The tests drive `load` directly. Each case first asserts that neither data read was issued and then that the load redirected, so a change that lets a selection through the guard fails on the read spies.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const getQuestionData = vi.fn(async () => ({ questions: [] }));
const getNominationData = vi.fn(async () => ({ nominations: [] }));

vi.mock('$lib/api/dataProvider', () => ({
  createDataProvider: () => ({
    getQuestionData: (...args: Array<unknown>) => getQuestionData(...(args as [])),
    getNominationData: (...args: Array<unknown>) => getNominationData(...(args as []))
  }),
  createSupabaseUniversalClient: vi.fn()
}));

const { load } = await import('./+layout');

/**
 * Call `load` with the minimum SvelteKit surface it touches.
 *
 * The parent data is empty: with no elections in the temporary `DataRoot`, neither id can be implied, so a correct guard has nowhere to go but the selector. That isolates the guard from the implication logic.
 */
function runLoad(search: string) {
  return load({
    data: { supabaseCookies: [] },
    fetch: (async () => new Response()) as typeof fetch,
    parent: async () => ({
      appSettingsData: Promise.resolve({}),
      constituencyData: Promise.resolve({ groups: [], constituencies: [] }),
      electionData: Promise.resolve([])
    }),
    untrack: <TValue>(fn: () => TValue): TValue => fn(),
    url: new URL(`https://vaa.test/results${search}`)
  } as unknown as Parameters<typeof load>[0]);
}

/**
 * Settle `load`, returning the redirect it threw, or `undefined` when it resolved with data.
 *
 * `redirect()` throws a `Redirect`; `isRedirect` is not exported from the test surface, so match on the shape SvelteKit gives it.
 */
async function redirectOf(promise: Promise<unknown>): Promise<{ status: number; location: string } | undefined> {
  try {
    await promise;
  } catch (thrown) {
    const redirected = thrown as { status?: number; location?: string };
    if (typeof redirected?.status === 'number' && typeof redirected?.location === 'string') {
      return { status: redirected.status, location: redirected.location };
    }
    throw thrown;
  }
  return undefined;
}

describe('(voters)/(located)/+layout.ts — an empty id array is not a selection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects a `?electionId=` URL to the election selector instead of reading with zero ids', async () => {
    const redirected = await redirectOf(runLoad('?electionId='));
    expect(getQuestionData).not.toHaveBeenCalled();
    expect(getNominationData).not.toHaveBeenCalled();
    expect(redirected?.status).toBe(307);
    expect(redirected?.location).toMatch(/elections/i);
  });

  it('redirects a `?constituencyId=` URL the same way', async () => {
    const redirected = await redirectOf(runLoad('?constituencyId='));
    expect(getQuestionData).not.toHaveBeenCalled();
    expect(getNominationData).not.toHaveBeenCalled();
    expect(redirected?.status).toBe(307);
  });

  it('redirects when both params are present but empty', async () => {
    const redirected = await redirectOf(runLoad('?electionId=&constituencyId='));
    expect(getQuestionData).not.toHaveBeenCalled();
    expect(getNominationData).not.toHaveBeenCalled();
    expect(redirected?.status).toBe(307);
  });

  it('redirects when neither param is present', async () => {
    const redirected = await redirectOf(runLoad(''));
    expect(getQuestionData).not.toHaveBeenCalled();
    expect(getNominationData).not.toHaveBeenCalled();
    expect(redirected?.status).toBe(307);
  });
});
