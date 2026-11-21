/**
 * The instruments in `loadTracking.testUtils.ts` catch what they guard against. Every `*.tracking.test.ts` of the Contestant App's protected tree asserts that a load's recorded reads are empty or limited, which proves something only if each instrument records.
 *
 * Each subject is a LOCAL load-shaped function. None imports a real `load`: that would make a control a test of production code rather than of the instrument.
 *
 * NAMED LIMIT: these prove the INSTRUMENTS work. They do not prove any real load was ever wrong.
 */

import { describe, expect, it } from 'vitest';
import { recordingEvent, recordingParams, recordingUrl } from './loadTracking.testUtils';
import type { Untrack } from './loadTracking.testUtils';

const CANDIDATE_ID = '11111111-1111-4111-8111-111111111111';

describe('loadTracking.testUtils instruments', () => {
  it('the recording url Proxy records a tracked url read and not one inside untrack', () => {
    /** A redirect target built from a tracked path, with the query read untracked. */
    function trackedRedirectTarget({ url, untrack }: { url: URL; untrack: Untrack }): string {
      untrack(() => url.searchParams.get('redirectTo'));
      return `redirectTo=${encodeURIComponent(url.pathname)}`;
    }

    const { url, trackedReads, untrack } = recordingUrl('http://localhost/contestant/profile?redirectTo=x');
    trackedRedirectTarget({ url, untrack });

    expect(
      trackedReads,
      'the Proxy failed to record a tracked url.pathname read, so the tracking tests prove nothing'
    ).toEqual(['pathname']);
    expect(
      trackedReads,
      'the untrack counter failed to suppress a read inside it, so a legitimate untracked read would be reported'
    ).not.toEqual(expect.arrayContaining(['searchParams']));
  });

  it('the recording params Proxy records a param read', () => {
    /** A load-shaped function that picks a question from the route params. */
    function questionFromParams({ params }: { params: Record<string, string> }): string {
      return `${params.entityId}/${params.questionId}`;
    }

    const { params, paramReads } = recordingParams({
      entityType: 'candidate',
      entityId: CANDIDATE_ID,
      questionId: 'q-1'
    });

    expect(questionFromParams({ params })).toBe(`${CANDIDATE_ID}/q-1`);
    expect(paramReads, 'the Proxy failed to record a param read, so the tracking tests prove nothing').toEqual([
      'entityId',
      'questionId'
    ]);
  });

  it('the route Proxy throws on a read, and the event Proxy records which member was taken', () => {
    /** A load-shaped function that takes the route from its event. */
    function routeIdOf({ route }: { route: { id: string } }): string {
      return route.id;
    }

    const { event, eventReads } = recordingEvent<{ route: { id: string } }>({ href: 'http://localhost/contestant' });

    expect(() => routeIdOf(event)).toThrow(/route\.id/);
    expect(eventReads, 'the event Proxy failed to record which member was taken').toEqual(['route']);
  });
});
