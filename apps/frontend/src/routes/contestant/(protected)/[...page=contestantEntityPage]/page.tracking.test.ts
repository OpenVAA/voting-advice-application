/**
 * The server load that resolves an entity page asked for without an entity depends on the `page` param and on nothing else of the URL, the route or the params.
 *
 * SvelteKit reruns a load whenever a `url` property, `route.id` or a param it read TRACKED changes. This load redirects to the page its `page` param names under the user's one entity, so it takes `params` and `parent` from the request event and nothing else, and the query string of the request is never read.
 *
 * The load is driven DIRECTLY with a fake event that is itself a recording Proxy, and whose members are instruments:
 * - `url` records every property read that happens outside the event's own `untrack`;
 * - `route` throws on any read;
 * - `params` records every param name read;
 * - `parent` resolves the user-level load's data for the state the case names.
 *
 * A redirect the load throws is caught by the case: the reads recorded up to it are what is asserted.
 *
 * Correctness invariants, each one a distinct way this file could hand back a false pass:
 * 1. Each instrument must actually record. A trap that never pushed would make every assertion below `[] === []`. The controls in `loadTracking.testUtils.test.ts` are the answer, one per instrument.
 * 2. The `untrack` counter must actually suppress, or a load reading the URL untracked would be reported. The `url` control there asserts that the read it makes INSIDE `untrack` is absent from the recorded set.
 * 3. The subject must be the REAL load, run to its redirect: the positive cases import `load` from `./+page.server` and assert the target only the real load builds.
 */

import { describe, expect, it, vi } from 'vitest';
import { load } from './+page.server';
import { recordingEvent } from '../loadTracking.testUtils';

const USER = {
  id: 'user-1',
  email: 'user@example.test',
  username: 'user@example.test',
  role: 'contestant',
  settings: {},
  termsOfUseAccepted: '2026-10-06T00:54:12.277826+00:00',
  passwordSet: true
};
const CANDIDATE_ID = '11111111-1111-4111-8111-111111111111';
const QUESTION_ID = '33333333-3333-4333-8333-333333333333';
const CANDIDATE = { type: 'candidate', id: CANDIDATE_ID, firstName: 'A', lastName: 'B', confirmed: true };
const ORGANIZATION = { type: 'organization', id: '22222222-2222-4222-8222-222222222222', name: 'Org', confirmed: true };

/** Four forms of sub-path that name an entity page. */
const SUB_PATHS = ['profile', 'questions', `questions/${QUESTION_ID}`, 'preview'];

/** The members of the event beside the instruments and `parent`. */
const EVENT_MEMBERS = {
  fetch: vi.fn(),
  locals: { supabase: { auth: { signOut: vi.fn(async () => ({ error: null })) } } }
};

/** What the load resolved to or threw. */
async function outcomeOf(event: Parameters<typeof load>[0]): Promise<{ resolved?: unknown; thrown?: unknown }> {
  try {
    return { resolved: await load(event) };
  } catch (e) {
    return { thrown: e };
  }
}

describe('contestant/(protected)/[...page]/+page.server.ts load dependency tracking', () => {
  it.each(SUB_PATHS.flatMap((page) => ['', '?start=true'].map((query) => [page, query] as const)))(
    'reads the page param and no other, no URL property tracked and no route (%s%s)',
    async (page, query) => {
      const { event, eventReads, paramReads, trackedReads } = recordingEvent<Parameters<typeof load>[0]>({
        href: `http://localhost/contestant/${page}${query}`,
        params: { page },
        parent: async () => ({ gate: null, user: USER, entities: [CANDIDATE] }),
        extra: EVENT_MEMBERS
      });

      const outcome = await outcomeOf(event);

      expect(trackedReads, 'a tracked url read would make the load depend on the query string').toEqual([]);
      expect([...new Set(paramReads)], 'the load resolves the sub-path and depends on no other param').toEqual([
        'page'
      ]);
      expect(
        [...new Set(eventReads)].sort(),
        'the load takes params and parent from the event and nothing else'
      ).toEqual(['params', 'parent']);
      // The load ran to its redirect, so every branch had the chance to read.
      expect(outcome.thrown).toMatchObject({
        status: 307,
        location: `/contestant/candidate/${CANDIDATE_ID}/${page}`
      });
    }
  );

  it.each([
    ['a pending gate', { gate: 'termsOfUse', user: USER }],
    ['no entity', { gate: null, user: USER, entities: [] }],
    ['several entities', { gate: null, user: USER, entities: [CANDIDATE, ORGANIZATION] }]
  ])('reads no URL property tracked, no route and no param other than page for %s', async (_, parentData) => {
    const { event, eventReads, paramReads, trackedReads } = recordingEvent<Parameters<typeof load>[0]>({
      href: 'http://localhost/contestant/profile?start=true',
      params: { page: 'profile' },
      parent: async () => parentData,
      extra: EVENT_MEMBERS
    });

    await outcomeOf(event);

    expect(trackedReads).toEqual([]);
    expect(paramReads.filter((name) => name !== 'page')).toEqual([]);
    expect([...new Set(eventReads)].sort()).toEqual(['params', 'parent']);
  });
});
