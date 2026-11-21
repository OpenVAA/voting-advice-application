/**
 * Unit tests for the tests-side route builder: a param segment is filled or refused, never emitted as text.
 *
 * Run: yarn vitest run --config tests/vitest.config.ts buildRoute
 */
import { describe, expect, it } from 'vitest';
import { buildRoute, fillRouteId, parseParamSegment } from './buildRoute';

/** Route ids for the segment forms no route on the tree shows. */
const LOCAL_ROUTE = {
  Localized: '/[[lang=locale]]/(group)/page',
  Matched: '/shop/[itemId=uuid]',
  OptionalPair: '/list/[[tab]]/[[kind=etSg]]',
  Rest: '/files/[...path]',
  RestMatched: '/files/[...path=filePath]'
} as const;

function fill(route: keyof typeof LOCAL_ROUTE, params?: Record<string, string | undefined>): string {
  return fillRouteId({ route, routeId: LOCAL_ROUTE[route], locale: 'fi', params });
}

describe('parseParamSegment', () => {
  it.each([
    ['[questionId]', { name: 'questionId', kind: 'required' }],
    ['[entityId=uuid]', { name: 'entityId', kind: 'required' }],
    ['[[electionTab]]', { name: 'electionTab', kind: 'optional' }],
    ['[[entity=etSg]]', { name: 'entity', kind: 'optional' }],
    ['[...path]', { name: 'path', kind: 'rest' }],
    ['[...path=filePath]', { name: 'path', kind: 'rest' }]
  ])('reads %s', (segment, expected) => {
    expect(parseParamSegment(segment)).toEqual(expected);
  });

  it.each(['questions', '(protected)', '', 'a[b]'])('reads %j as no param', (segment) => {
    expect(parseParamSegment(segment)).toBeUndefined();
  });
});

describe('buildRoute', () => {
  it('builds a route without params as the route id less its groups', () => {
    expect(buildRoute({ route: 'ContestantAppLogin', locale: 'en' })).toBe('/contestant/login');
    expect(buildRoute({ route: 'About', locale: 'en' })).toBe('/about');
    expect(buildRoute({ route: 'Questions', locale: 'en' })).toBe('/questions');
    expect(buildRoute({ route: 'Home', locale: 'en' })).toBe('');
  });

  it('fills a required param', () => {
    expect(buildRoute({ route: 'Question', locale: 'en', params: { questionId: 'q-1' } })).toBe('/questions/q-1');
    expect(buildRoute({ route: 'AdminAppJob', locale: 'en', params: { jobId: '42' } })).toBe('/admin/jobs/42');
  });

  it('throws on an unfilled required param, naming the route and the param', () => {
    const build = () => buildRoute({ route: 'Question', locale: 'en' });
    expect(build).toThrow(/route "Question"/);
    expect(build).toThrow(/"questionId"/);
    // Another param's value does not fill it, and neither does an empty one.
    expect(() => buildRoute({ route: 'Question', locale: 'en', params: { jobId: '42' } })).toThrow(/"questionId"/);
    expect(() => buildRoute({ route: 'Question', locale: 'en', params: { questionId: '' } })).toThrow(/"questionId"/);
  });

  it('never returns a bracketed segment for any route on the tree', () => {
    expect(buildRoute({ route: 'ResultCandidate', locale: 'en' })).toBe('/results');
    expect(
      buildRoute({
        route: 'ResultCandidate',
        locale: 'en',
        params: { electionTab: 'e-1', entityTab: 'candidates', entity: 'candidate', id: 'c-1' }
      })
    ).toBe('/results/e-1/candidates/candidate/c-1');
  });
});

describe('fillRouteId', () => {
  it('replaces the locale segment with the locale and drops a group', () => {
    expect(fill('Localized')).toBe('/fi/page');
  });

  it('fills a required param that carries a matcher, and refuses it unfilled', () => {
    expect(fill('Matched', { itemId: 'abc' })).toBe('/shop/abc');
    expect(() => fill('Matched')).toThrow(/"itemId".*"Matched"/);
  });

  it('drops an unfilled optional segment and fills a given one', () => {
    expect(fill('OptionalPair')).toBe('/list');
    expect(fill('OptionalPair', { tab: 'a' })).toBe('/list/a');
    expect(fill('OptionalPair', { tab: 'a', kind: 'b' })).toBe('/list/a/b');
  });

  it('treats a rest segment as required', () => {
    expect(fill('Rest', { path: 'a/b' })).toBe('/files/a/b');
    expect(() => fill('Rest')).toThrow(/"path".*"Rest"/);
    expect(fill('RestMatched', { path: 'a' })).toBe('/files/a');
    expect(() => fill('RestMatched')).toThrow(/"path".*"RestMatched"/);
  });
});
