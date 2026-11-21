/**
 * The entity-level load of the Contestant App's protected tree depends on the two entity params and on nothing else of the URL, the route or the params.
 *
 * SvelteKit reruns a load whenever a `url` property, `route.id` or a param it read TRACKED changes. This load reads the entity the URL names, so it reads `entityType` and `entityId` and reruns when the selected entity changes. Any other tracked read, of `questionId` above all, would rerun it, and with it the entity and question reads, on every navigation between the pages of one entity. It takes `fetch`, `locals`, `params` and `parent` from the request event and nothing else.
 *
 * The load is driven DIRECTLY with a fake event that is itself a recording Proxy, and whose members are instruments:
 * - `url` records every property read that happens outside the event's own `untrack`;
 * - `route` throws on any read;
 * - `params` records every param name read;
 * - `parent` resolves the user-level load's data for an ungated user.
 *
 * Correctness invariants, each one a distinct way this file could hand back a false pass:
 * 1. Each instrument must actually record. A trap that never pushed would make every assertion below `[] === []`. The controls in `loadTracking.testUtils.test.ts` are the answer, one per instrument.
 * 2. The `untrack` counter must actually suppress, or a load reading the URL untracked would be reported. The `url` control there asserts that the read it makes INSIDE `untrack` is absent from the recorded set.
 * 3. The subject must be the REAL load, run to its end: the positive cases import `load` from `./+layout.server` and assert the resolved entity data.
 */

import { describe, expect, it, vi } from 'vitest';
import { load } from './+layout.server';
import { recordingEvent } from '../../loadTracking.testUtils';

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
  passwordSet: true
};
const CANDIDATE_ID = '11111111-1111-4111-8111-111111111111';
const CANDIDATE = { type: 'candidate', id: CANDIDATE_ID, firstName: 'A', lastName: 'B', confirmed: true };
const ENTITY_DATA = {
  entity: { type: 'candidate', id: CANDIDATE_ID },
  nominations: [{ electionId: 'election-1', constituencyId: 'constituency-1' }]
};
const QUESTION_DATA = { categories: [], questions: [] };

/** The params of a URL that names the candidate. */
const ENTITY_PARAMS = { entityType: 'candidate', entityId: CANDIDATE_ID };
/** The path of the candidate's home. */
const ENTITY_HOME = `/contestant/candidate/${CANDIDATE_ID}`;

/** The members of the event beside the instruments and `parent`. */
const EVENT_MEMBERS = { fetch: vi.fn(), locals: { supabase: { auth: { signOut: vi.fn() } } } };

/** The user-level load's data for an ungated user who is listed with one served entity. */
async function ungatedParent() {
  return { gate: null, user: USER, entities: [CANDIDATE] };
}

describe('contestant/(protected)/[entityType]/[entityId]/+layout.server.ts load dependency tracking', () => {
  it.each([
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
      createDataWriter.mockReturnValue({ getEntityUserData: async () => ENTITY_DATA });
      createDataProvider.mockReturnValue({ getQuestionData: async () => QUESTION_DATA });
      const { event, eventReads, paramReads, trackedReads } = recordingEvent<Parameters<typeof load>[0]>({
        href: `http://localhost${path}`,
        params: routeParams,
        parent: ungatedParent,
        extra: EVENT_MEMBERS
      });

      const result = await load(event);

      expect(trackedReads, 'a tracked url read makes SvelteKit rerun this load on every navigation').toEqual([]);
      expect(
        [...new Set(paramReads)].sort(),
        'the load reruns when the selected entity changes, and on no other param'
      ).toEqual(['entityId', 'entityType']);
      expect(
        paramReads,
        'a read of questionId would rerun this load on every navigation between two questions'
      ).not.toContain('questionId');
      expect(
        [...new Set(eventReads)].sort(),
        'the load takes fetch, locals, params and parent from the event and nothing else'
      ).toEqual(['fetch', 'locals', 'params', 'parent']);
      // The load ran to its end, so every stage had the chance to read.
      expect(result).toEqual({ questionData: QUESTION_DATA, contestantUserData: ENTITY_DATA });
    }
  );
});
