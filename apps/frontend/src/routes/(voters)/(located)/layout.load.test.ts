/**
 * The located voter layout's election/constituency guard.
 *
 * REGRESSION (157 review, Lot B CR-05). A degenerate URL — `?electionId=`, which `parseParams` reduces to `[]` because it filters empty values out of an array param — reached the data reads as a PRESENT selection, because `[]` is truthy and the guard tested truthiness. Nothing redirected, the adapter fanned out over zero ids, and the voter got a blank app with no error and no log line. The same hole exists one level down: `getImpliedConstituencyIds` returns `[]` (not `undefined`) when it is handed no elections to imply from, so the implication branch could satisfy its own guard with an empty selection too.
 *
 * These tests drive `load` directly rather than through a browser, so they pin the guard itself: the assertion is that the load REDIRECTS to the selector instead of resolving with data.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const getQuestionData = vi.fn(async () => ({ questions: [] }));
const getNominationData = vi.fn(async () => ({ nominations: [] }));
const init = vi.fn();

vi.mock('$lib/api/dataProvider', () => ({
  dataProvider: Promise.resolve({
    init,
    getQuestionData: (...args: Array<unknown>) => getQuestionData(...(args as [])),
    getNominationData: (...args: Array<unknown>) => getNominationData(...(args as []))
  })
}));

const { load } = await import('./+layout');

/**
 * Call `load` with the minimum SvelteKit surface it touches.
 *
 * The parent data is deliberately EMPTY: with no elections in the temporary `DataRoot`, neither id can be implied, so a correct guard has nowhere to go but the selector. That isolates the guard from the implication logic.
 */
function runLoad(search: string) {
  return load({
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
 * `redirect()` throws a `Redirect`; `isRedirect` is not exported from the test surface, so match on the shape SvelteKit gives it.
 */
async function captureRedirect(promise: Promise<unknown>): Promise<{ status: number; location: string }> {
  try {
    await promise;
  } catch (thrown) {
    const redirected = thrown as { status?: number; location?: string };
    if (typeof redirected?.status === 'number' && typeof redirected?.location === 'string') {
      return { status: redirected.status, location: redirected.location };
    }
    throw thrown;
  }
  throw new Error('load resolved with data instead of redirecting to the selector');
}

describe('(voters)/(located)/+layout.ts — an empty id array is not a selection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects a `?electionId=` URL to the election selector instead of reading with zero ids', async () => {
    const { status, location } = await captureRedirect(runLoad('?electionId='));
    expect(status).toBe(307);
    expect(location).toMatch(/elections/i);
    // The reads must not have happened at all: the point of the guard is that no request is issued for a selection the voter never made.
    expect(getQuestionData).not.toHaveBeenCalled();
    expect(getNominationData).not.toHaveBeenCalled();
  });

  it('redirects a `?constituencyId=` URL the same way', async () => {
    const { status } = await captureRedirect(runLoad('?constituencyId='));
    expect(status).toBe(307);
    expect(getNominationData).not.toHaveBeenCalled();
  });

  it('redirects when both params are present but empty', async () => {
    const { status } = await captureRedirect(runLoad('?electionId=&constituencyId='));
    expect(status).toBe(307);
    expect(getNominationData).not.toHaveBeenCalled();
  });

  it('still redirects when neither param is present at all, the pre-existing behaviour', async () => {
    // Guards the shape of the fix: treating `[]` as absent must not change what an absent param does.
    const { status } = await captureRedirect(runLoad(''));
    expect(status).toBe(307);
  });
});
