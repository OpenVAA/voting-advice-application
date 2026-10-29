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
 * 1. Each instrument must actually record. A trap that never pushed would make every assertion below `[] === []`. The control cases at the foot of this file are the answer, one per instrument.
 * 2. The `untrack` counter must actually suppress, or a load reading the URL untracked would be reported. The `url` control asserts that the read it makes INSIDE `untrack` is absent from the recorded set.
 * 3. The subject must be the REAL load, run to its end on both of its paths: the positive cases import `load` from `./+page.server` and assert the empty object it resolves for an open preview and the redirect it throws for a closed one. The controls deliberately do not import it.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { load } from './+page.server';
import { forbiddenRoute, recordingParams, recordingUrl } from '../../../../loadTracking.testUtils';
import type { Untrack } from '../../../../loadTracking.testUtils';

const { createDataProvider, isPreviewOpen } = vi.hoisted(() => ({
  createDataProvider: vi.fn(),
  isPreviewOpen: vi.fn()
}));

// Hoisted because `vi.mock`'s factory is lifted above every import and cannot close over an ordinary module-scope binding.
vi.mock('$lib/api/dataProvider', () => ({ createDataProvider }));
vi.mock('$lib/server/contestant/previewGate', () => ({ isPreviewOpen }));

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

/**
 * A request event below the parent loads of an ungated user whose entity was read, with every instrument in place.
 * @param href - The URL of the request.
 * @returns The event and what its instruments recorded.
 */
function recordingEvent(href: string) {
  const { url, trackedReads, untrack } = recordingUrl(href);
  const { params, paramReads } = recordingParams({ ...ENTITY_PARAMS });
  const eventReads: Array<string> = [];
  const event = new Proxy(
    {
      fetch: vi.fn(),
      locals: { supabase: { auth: { signOut: vi.fn() } } },
      params,
      parent: async () => ({
        gate: null,
        user: USER,
        entities: [CANDIDATE],
        questionData: QUESTION_DATA,
        contestantUserData: { entity: { type: 'candidate', id: CANDIDATE_ID, answers: {} }, nominations: [NOMINATION] }
      }),
      route: forbiddenRoute(),
      untrack,
      url
    },
    {
      get(target, prop) {
        if (typeof prop === 'string') eventReads.push(prop);
        return Reflect.get(target, prop, target);
      }
    }
  );
  return { event: event as unknown as Parameters<typeof load>[0], eventReads, paramReads, trackedReads };
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
      const { event, eventReads, paramReads, trackedReads } = recordingEvent(`http://localhost${path}`);

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
      const { event, eventReads, paramReads, trackedReads } = recordingEvent(`http://localhost${path}`);

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

  /**
   * Negative controls: the assertions above are only meaningful if each instrument can catch what it guards against.
   *
   * Each subject is a LOCAL load-shaped function. None imports the real `load`: that would make the control a test of production code rather than of the instrument.
   *
   * NAMED LIMIT: these prove the INSTRUMENTS work. They do not prove the real load was ever wrong.
   */
  it('the recording url Proxy catches a tracked url.searchParams read (negative control)', () => {
    /** Whether a preview is open, taken from a tracked query parameter, kept local to this control. */
    function openFromQuery({ url, untrack }: { url: URL; untrack: Untrack }): boolean {
      // An untracked read, exercised so the counter's suppression is covered as well as its recording.
      untrack(() => url.pathname);
      // Tracked.
      return url.searchParams.get('open') === '1';
    }

    const { url, trackedReads, untrack } = recordingUrl(`http://localhost${ENTITY_HOME}/preview?open=1`);

    expect(openFromQuery({ url, untrack })).toBe(true);
    expect(
      trackedReads,
      'the Proxy failed to record a tracked url.searchParams read, so the assertions above prove nothing'
    ).toEqual(['searchParams']);
    expect(
      trackedReads,
      'the untrack counter failed to suppress a read inside it, so a legitimate untracked read would be reported'
    ).not.toEqual(expect.arrayContaining(['pathname']));
  });

  it('the recording params Proxy records a param read (negative control)', () => {
    /** A load-shaped function that picks a question from the route params, kept local to this control. */
    function questionFromParams({ params }: { params: Record<string, string> }): string {
      return `${params.entityId}/${params.questionId}`;
    }

    const { params, paramReads } = recordingParams({ ...ENTITY_PARAMS, questionId: 'q-1' });

    expect(questionFromParams({ params })).toBe(`${CANDIDATE_ID}/q-1`);
    expect(paramReads, 'the Proxy failed to record a param read, so the assertions above prove nothing').toEqual([
      'entityId',
      'questionId'
    ]);
  });

  it('the route Proxy throws on a read, and the event Proxy records which members were taken (negative control)', () => {
    /** A load-shaped function that takes the route from its event, kept local to this control. */
    function routeIdOf({ route }: { route: { id: string } }): string {
      return route.id;
    }

    const { event, eventReads } = recordingEvent(`http://localhost${ENTITY_HOME}/preview`);

    expect(() => routeIdOf(event as unknown as { route: { id: string } })).toThrow(/route\.id/);
    expect(eventReads, 'the event Proxy failed to record which member was taken').toEqual(['route']);
  });
});
