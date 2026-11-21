/**
 * The server load of the Contestant App's root page must not depend on the URL, the route or a route param.
 *
 * SvelteKit reruns a load whenever a `url` property, `route.id` or a param it read TRACKED changes. This load decides what a user who names no entity gets, on its parent's list alone, so it takes `parent` from the request event and nothing else.
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
 * 3. The subject must be the REAL load, run past its parent: the positive cases import `load` from `./+page.server`, and every case asserts the outcome only the real load produces for its state.
 */

import { describe, expect, it, vi } from 'vitest';
import { load } from './+page.server';
import { recordingEvent } from './loadTracking.testUtils';

const USER = {
  id: 'user-1',
  email: 'user@example.test',
  username: 'user@example.test',
  role: 'contestant',
  settings: {},
  termsOfUseAccepted: '2026-10-06T00:54:12.277826+00:00',
  passwordSet: true
};
const CANDIDATE = {
  type: 'candidate',
  id: '11111111-1111-4111-8111-111111111111',
  firstName: 'A',
  lastName: 'B',
  confirmed: true
};
const ORGANIZATION = { type: 'organization', id: '22222222-2222-4222-8222-222222222222', name: 'Org', confirmed: true };

/** The states of the user-level load the root load decides on. */
const PARENT_STATES = {
  'a pending gate': { gate: 'termsOfUse', user: USER },
  'no entity': { gate: null, user: USER, entities: [] },
  'one entity': { gate: null, user: USER, entities: [CANDIDATE] },
  'several entities': { gate: null, user: USER, entities: [CANDIDATE, ORGANIZATION] }
};

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

describe('contestant/(protected)/+page.server.ts load dependency tracking', () => {
  const cases = Object.keys(PARENT_STATES).flatMap((state) =>
    ['/contestant', '/contestant?redirectTo=contestant%2Fprofile'].map((path) => [state, path] as const)
  ) as Array<readonly [keyof typeof PARENT_STATES, string]>;

  it.each(cases)('reads no URL property tracked, no route and no param (%s, %s)', async (state, path) => {
    const { event, eventReads, paramReads, trackedReads } = recordingEvent<Parameters<typeof load>[0]>({
      href: `http://localhost${path}`,
      parent: async () => PARENT_STATES[state],
      extra: EVENT_MEMBERS
    });

    const outcome = await outcomeOf(event);

    expect(trackedReads, 'a tracked url read makes SvelteKit rerun this load on every navigation').toEqual([]);
    expect(paramReads, 'the app root carries no entity, so this load has no param to depend on').toEqual([]);
    expect([...new Set(eventReads)].sort(), 'the load takes parent from the event and nothing else').toEqual([
      'parent'
    ]);
    // The load ran past its parent, so every branch had the chance to read.
    if (state === 'a pending gate') expect(outcome).toEqual({ resolved: {} });
    if (state === 'no entity') expect(outcome).toEqual({ resolved: { view: 'nothingToEdit' } });
    if (state === 'one entity')
      expect(outcome.thrown).toMatchObject({
        status: 307,
        location: '/contestant/candidate/11111111-1111-4111-8111-111111111111'
      });
    if (state === 'several entities') expect(outcome).toEqual({ resolved: { view: 'select' } });
  });
});
