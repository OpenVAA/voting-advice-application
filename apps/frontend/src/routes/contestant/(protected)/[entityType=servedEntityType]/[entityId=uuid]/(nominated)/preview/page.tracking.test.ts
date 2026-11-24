/**
 * The server load of an entity's preview depends on the two entity params and on nothing else of the URL, the route or the params.
 *
 * SvelteKit reruns a load whenever a `url` property, `route.id` or a param it read TRACKED changes, and a value read from the URL is a value the browser chose. This load builds the entity's home from `entityType` and `entityId`, and may read those two. It takes `fetch`, `locals`, `params` and `parent` from the request event and nothing else.
 *
 * The load is driven DIRECTLY with a fake event that is itself a recording Proxy, and whose members are instruments:
 * - `url` records every property read that happens outside the event's own `untrack`;
 * - `route` throws on any read;
 * - `params` records every param name read;
 * - `parent` resolves the parent loads' data for an ungated user whose entity was read.
 *
 * The helper that answers whether the preview is open and the factory of the data provider are replaced, so that the load runs to its end without a backend and each case sets the helper's answer.
 *
 * Correctness invariants, each one a distinct way this file could hand back a false pass:
 * 1. Each instrument must actually record. A trap that never pushed would make every assertion below `[] === []`. The controls in `loadTracking.testUtils.test.ts` are the answer, one per instrument.
 * 2. The `untrack` counter must actually suppress, or a load reading the URL untracked would be reported. The `url` control there asserts that the read it makes INSIDE `untrack` is absent from the recorded set.
 * 3. The subject must be the REAL load, run to its end on both of its paths: the positive cases import `load` from `./+page.server` and assert the empty object it resolves for an open preview and the redirect it throws for a closed one.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { load } from './+page.server';
import { recordingEvent } from '../../../../loadTracking.testUtils';

const { createDataProvider, isPreviewOpen } = vi.hoisted(() => ({
  createDataProvider: vi.fn(),
  isPreviewOpen: vi.fn()
}));

// Hoisted because `vi.mock`'s factory is lifted above every import and cannot close over an ordinary module-scope binding.
vi.mock('$lib/api/dataProvider', () => ({ createDataProvider }));
vi.mock('$lib/server/contestant/previewOpen', () => ({ isPreviewOpen }));

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
const NOMINATION = { electionId: 'election-1', constituencyId: 'constituency-1' };
const QUESTION_DATA = { categories: [], questions: [] };

/** The params of a URL that names the candidate. */
const ENTITY_PARAMS = { entityType: 'candidate', entityId: CANDIDATE_ID };
/** The path of the candidate's home. */
const ENTITY_HOME = `/contestant/candidate/${CANDIDATE_ID}`;

/** The preview's URL, with and without a query string. */
const PREVIEW_URLS = [`${ENTITY_HOME}/preview`, `${ENTITY_HOME}/preview?start=true`, `${ENTITY_HOME}/preview?open=1`];

/** The members of the request event the load may take. */
const ALLOWED_EVENT_MEMBERS = ['fetch', 'locals', 'params', 'parent'];

/** The members of the event beside the instruments and `parent`. */
const EVENT_MEMBERS = { fetch: vi.fn(), locals: { supabase: { auth: { signOut: vi.fn() } } } };

/** The parent loads' data of an ungated user whose entity was read. */
async function ungatedParent() {
  return {
    gate: null,
    user: USER,
    entities: [CANDIDATE],
    questionData: QUESTION_DATA,
    contestantUserData: { entity: { type: 'candidate', id: CANDIDATE_ID, answers: {} }, nominations: [NOMINATION] }
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  createDataProvider.mockReturnValue({});
});

describe('contestant/(protected)/[entityType]/[entityId]/(nominated)/preview/+page.server.ts load dependency tracking', () => {
  it.each(PREVIEW_URLS)(
    'serves an open preview on no URL property tracked, no route and no param but the two entity params (%s)',
    async (path) => {
      isPreviewOpen.mockResolvedValue(true);
      const { event, eventReads, paramReads, trackedReads } = recordingEvent<Parameters<typeof load>[0]>({
        href: `http://localhost${path}`,
        params: ENTITY_PARAMS,
        parent: ungatedParent,
        extra: EVENT_MEMBERS
      });

      const result = await load(event);

      expect(trackedReads, 'a tracked url read lets the URL decide what this load does').toEqual([]);
      expect(
        paramReads.filter((name) => name !== 'entityType' && name !== 'entityId'),
        'the load reads the two entity params and no other'
      ).toEqual([]);
      expect(eventReads, 'the load awaits its parent').toContain('parent');
      expect(
        eventReads.filter((name) => !ALLOWED_EVENT_MEMBERS.includes(name)),
        'the load takes fetch, locals, params and parent from the event and nothing else'
      ).toEqual([]);
      // The load ran to its end, past the helper.
      expect(isPreviewOpen).toHaveBeenCalledTimes(1);
      expect(result).toEqual({});
    }
  );

  it.each(PREVIEW_URLS)(
    'redirects a closed preview on the two entity params and no other, no URL property tracked and no route (%s)',
    async (path) => {
      isPreviewOpen.mockResolvedValue(false);
      const { event, eventReads, paramReads, trackedReads } = recordingEvent<Parameters<typeof load>[0]>({
        href: `http://localhost${path}`,
        params: ENTITY_PARAMS,
        parent: ungatedParent,
        extra: EVENT_MEMBERS
      });

      // The load ran to its end on the path that builds a target, so every stage had the chance to read.
      await expect(load(event)).rejects.toMatchObject({ status: 307, location: ENTITY_HOME });

      expect(trackedReads, 'a tracked url read lets the URL decide what this load does').toEqual([]);
      expect(
        [...new Set(paramReads)].sort(),
        'the target is the home of the entity the URL names, built from its two params and no other'
      ).toEqual(['entityId', 'entityType']);
      expect(
        [...new Set(eventReads)].sort(),
        'the load takes fetch, locals, params and parent from the event and nothing else'
      ).toEqual(ALLOWED_EVENT_MEMBERS);
    }
  );
});
