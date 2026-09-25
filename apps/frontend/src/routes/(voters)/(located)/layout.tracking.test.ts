/**
 * The `(located)` universal load must not depend on the URL.
 *
 * SvelteKit reruns a load whenever a `url` property it read TRACKED changes. This load deliberately `untrack`s its URL reads — it only needs the selection params and the path for the `next=` redirect target. A single tracked `url.pathname` read made it rerun on every results tab / entity-drawer navigation: it re-streamed the question + nomination data, `+layout.svelte` flipped `ready` to false, `<Loading/>` replaced the whole subtree for a frame, and everything remounted (intro redraw, scroll clamped to 0, list flicker).
 *
 * The load is driven DIRECTLY with a fake event whose `url` records every property read and whether it happened inside the provided `untrack`.
 *
 * Correctness invariants, each one a distinct way this file could hand back a false pass:
 * 1. The recording Proxy must actually record a tracked read. A trap that never pushes would make every assertion below `[] === []`. The control case at the foot of this file is the answer, and it is the reason the four positive cases mean anything.
 * 2. The `untrack` counter must actually suppress. A counter that never suppressed would make the positive cases fail rather than pass, so the positive cases cover that direction; the control additionally asserts that the read it makes INSIDE `untrack` is absent from the recorded set.
 * 3. The subject must be the REAL load. The positive cases import `load` from `./+layout`; the control deliberately does not (see its own docblock).
 */

import { describe, expect, it, vi } from 'vitest';
import { load } from './+layout';

vi.mock('$lib/paraglide/runtime', () => ({ getLocale: () => 'en' }));
vi.mock('$lib/api/dataProvider', () => ({
  createSupabaseUniversalClient: () => ({}),
  createDataProvider: () => ({
    getQuestionData: () => Promise.resolve({}),
    getNominationData: () => Promise.resolve({})
  })
}));

/** A `URL` whose property reads are logged unless they happen inside the returned `untrack`. */
function recordingUrl(href: string): {
  url: URL;
  trackedReads: Array<string>;
  untrack: <TValue>(fn: () => TValue) => TValue;
} {
  const real = new URL(href);
  const trackedReads: Array<string> = [];
  let untracked = 0;
  const url = new Proxy(real, {
    get(target, prop) {
      if (!untracked && typeof prop === 'string') trackedReads.push(prop);
      const value = Reflect.get(target, prop, target);
      return typeof value === 'function' ? value.bind(target) : value;
    }
  });
  function untrack<TValue>(fn: () => TValue): TValue {
    untracked++;
    try {
      return fn();
    } finally {
      untracked--;
    }
  }
  return { url, trackedReads, untrack };
}

describe('(located)/+layout.ts load dependency tracking', () => {
  it.each([
    // Bare results URL — the selection lives entirely in the search params.
    '/results?electionId=el-1&constituencyId=co-1',
    // Results URL carrying an election segment.
    '/results/el-1?electionId=el-1&constituencyId=co-1',
    // Full entity URL — the shape the drawer opens on.
    '/results/el-1/candidates/candidate/c-1?electionId=el-1&constituencyId=co-1',
    // A URL carrying persistent search params beyond the selection pair.
    '/results/el-1/organizations?electionId=el-1&constituencyId=co-1&nominationId=n-1'
  ])('reads no URL property tracked (%s)', async (path) => {
    const { url, trackedReads, untrack } = recordingUrl(`http://localhost${path}`);
    const result = await load({
      data: { supabaseCookies: [] },
      fetch,
      parent: () => Promise.reject(new Error('parent() must not be needed when the selection is in the URL')),
      untrack,
      url
    } as unknown as Parameters<typeof load>[0]);
    expect(trackedReads, 'a tracked url read makes SvelteKit rerun this load on every navigation').toEqual([]);
    expect(result).toHaveProperty('questionData');
    expect(result).toHaveProperty('nominationData');
  });

  /**
   * Negative control: the four assertions above are only meaningful if the Proxy can catch a tracked read.
   *
   * The subject is a LOCAL load-shaped function reproducing the pre-fix body — `url.pathname` read OUTSIDE `untrack`, which is what `(located)/+layout.ts` did before the fix. It deliberately does NOT import the real `load`, and there is deliberately no checked-in legacy copy of the production body anywhere: either would make this control a test of production code rather than of the instrument.
   *
   * NAMED LIMIT: this proves the INSTRUMENT works. It does NOT prove the real load was ever wrong. The record of that is `.planning/spikes/031-results-nav-flicker-forensics/README.md` § Investigation Trail item 2 — "(located)/+layout.ts deliberately untracks parseParams … then reads url.pathname / url.search *tracked* two lines later for the `next=` redirect target."
   */
  it('the recording Proxy catches a tracked url.pathname read (negative control)', () => {
    /** The pre-fix shape, reproduced locally and nowhere else. */
    function legacyNextTarget(url: URL, untrack: <TValue>(fn: () => TValue) => TValue): string {
      // The half that WAS untracked, exercised so the counter's suppression is covered as well as its recording.
      untrack(() => url.searchParams.get('electionId'));
      // TRACKED — the bug.
      const isVoterRoute = /^\/[a-z]{2}\/.*|^\/(results|questions|nominations)\b/.test(url.pathname);
      return isVoterRoute ? `next=${encodeURIComponent(url.pathname + url.search)}` : '';
    }

    const { url, trackedReads, untrack } = recordingUrl('http://localhost/results/el-1?electionId=el-1');
    legacyNextTarget(url, untrack);

    expect(
      trackedReads,
      'the Proxy failed to record a tracked url.pathname read, so the four assertions above prove nothing'
    ).toEqual(expect.arrayContaining(['pathname']));
    expect(
      trackedReads,
      'the untrack counter failed to suppress a read inside it, so the four assertions above could pass for the wrong reason'
    ).not.toEqual(expect.arrayContaining(['searchParams']));
  });
});
