/**
 * The user-level load of the Contestant App's protected tree depends on the two entity params and on nothing else of the URL, the route or the params.
 *
 * SvelteKit reruns a load whenever a `url` property, `route.id` or a param it read TRACKED changes. This load decides who the user is and what they may edit. It reads `entityType` and `entityId` so that it reruns when the selected entity changes, and the list every decision below it is made on is then read in the same request chain. Any other tracked read would rerun it, and with it the user and entity-list reads and the entity-level load that awaits it, on every navigation between the pages of one entity. It takes `cookies`, `fetch`, `locals` and `params` from the request event and nothing else; a cookie read is not a dependency SvelteKit tracks.
 *
 * The load is driven DIRECTLY with a fake event that is itself a recording Proxy, and whose members are instruments:
 * - `url` records every property read that happens outside the event's own `untrack`;
 * - `route` throws on any read;
 * - `params` records every param name read;
 * - `cookies` answers no cookie;
 * - `parent` rejects.
 *
 * Correctness invariants, each one a distinct way this file could hand back a false pass:
 * 1. Each instrument must actually record. A trap that never pushed would make every assertion below `[] === []`. The controls in `loadTracking.testUtils.test.ts` are the answer, one per instrument.
 * 2. The `untrack` counter must actually suppress, or a load reading the URL untracked for a redirect target would be reported. The `url` control there asserts that the read it makes INSIDE `untrack` is absent from the recorded set.
 * 3. The subject must be the REAL load, run to its end: the positive cases import `load` from `./+layout.server` and assert the ungated result.
 */

import { describe, expect, it, vi } from 'vitest';
import { load } from './+layout.server';
import { recordingEvent } from './loadTracking.testUtils';

const { createDataProvider, createDataWriter } = vi.hoisted(() => ({
  createDataProvider: vi.fn(),
  createDataWriter: vi.fn()
}));

// Hoisted because `vi.mock`'s factory is lifted above every import and cannot close over an ordinary module-scope binding.
vi.mock('$lib/api/dataWriter', () => ({ createDataWriter }));
vi.mock('$lib/api/dataProvider', () => ({ createDataProvider }));

const USER = {
  id: 'user-1',
  email: 'user@example.test',
  username: 'user@example.test',
  role: 'contestant',
  settings: {},
  termsOfUseAccepted: '2026-10-06T00:54:12.277826+00:00',
  passwordSet: true,
  address: { state: 'proved' }
};
const CANDIDATE_ID = '11111111-1111-4111-8111-111111111111';
const CANDIDATE = { type: 'candidate', id: CANDIDATE_ID, firstName: 'A', lastName: 'B', confirmed: true };

/** The params of a URL that names the candidate. */
const ENTITY_PARAMS = { entityType: 'candidate', entityId: CANDIDATE_ID };
/** The path of the candidate's home. */
const ENTITY_HOME = `/contestant/candidate/${CANDIDATE_ID}`;

/** The members of the event beside the instruments: a signed-in, ungated user, and no cookie. */
const EVENT_MEMBERS = {
  cookies: { get: () => undefined },
  fetch: vi.fn(),
  locals: {
    safeGetSession: async () => ({ session: { expires_at: 1893456000 }, user: { id: 'user-1' } }),
    supabase: { auth: { signOut: vi.fn() } }
  }
};

describe('contestant/(protected)/+layout.server.ts load dependency tracking', () => {
  it.each([
    // The app root, which carries no param.
    ['/contestant', {}],
    ['/contestant?redirectTo=contestant%2Fprofile', {}],
    // A path that names no entity.
    ['/contestant/profile', { page: 'profile' }],
    ['/contestant/questions/q-1?start=true', { page: 'questions/q-1' }],
    // The entity home.
    [ENTITY_HOME, ENTITY_PARAMS],
    [`${ENTITY_HOME}?start=true`, ENTITY_PARAMS],
    // The profile page.
    [`${ENTITY_HOME}/profile`, ENTITY_PARAMS],
    [`${ENTITY_HOME}/profile?start=true`, ENTITY_PARAMS],
    // The questions overview.
    [`${ENTITY_HOME}/questions`, ENTITY_PARAMS],
    [`${ENTITY_HOME}/questions?start=true`, ENTITY_PARAMS],
    // A question page.
    [`${ENTITY_HOME}/questions/q-1`, { ...ENTITY_PARAMS, questionId: 'q-1' }],
    [`${ENTITY_HOME}/questions/q-1?start=true`, { ...ENTITY_PARAMS, questionId: 'q-1' }]
  ] as Array<[string, Record<string, string>]>)(
    'reads the two entity params and no other, no URL property tracked and no route (%s)',
    async (path, routeParams) => {
      createDataWriter.mockReturnValue({
        getBasicUserData: async () => USER,
        getUserEntities: async () => [CANDIDATE]
      });
      createDataProvider.mockReturnValue({
        getAppSettings: async () => ({ contestantApp: { servedEntityTypes: { candidate: { registrationModes: [] } } } })
      });
      const { event, eventReads, paramReads, trackedReads } = recordingEvent<Parameters<typeof load>[0]>({
        href: `http://localhost${path}`,
        params: routeParams,
        extra: EVENT_MEMBERS
      });

      const result = await load(event);

      expect(trackedReads, 'a tracked url read makes SvelteKit rerun this load on every navigation').toEqual([]);
      expect(
        [...new Set(paramReads)].sort(),
        'the load reruns when the selected entity changes, and a read of any other param would rerun it on a navigation inside one entity'
      ).toEqual(['entityId', 'entityType']);
      expect(
        [...new Set(eventReads)].sort(),
        'the load takes cookies, fetch, locals and params from the event and nothing else'
      ).toEqual(['cookies', 'fetch', 'locals', 'params']);
      // The load ran to its end, so every stage had the chance to read.
      expect(result).toEqual({ gate: null, user: USER, entities: [CANDIDATE] });
    }
  );
});
