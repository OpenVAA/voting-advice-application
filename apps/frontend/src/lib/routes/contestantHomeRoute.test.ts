import { describe, expect, it } from 'vitest';
import { contestantHomeRoute } from './contestantHomeRoute';

describe('contestantHomeRoute', () => {
  it('answers the entity home when the params name an entity', () => {
    expect(contestantHomeRoute({ entityType: 'candidate', entityId: 'entity-1' })).toBe('ContestantAppEntityHome');
  });

  it('ignores the other params of the page', () => {
    expect(contestantHomeRoute({ entityType: 'organization', entityId: 'entity-1', questionId: 'q-1' })).toBe(
      'ContestantAppEntityHome'
    );
    expect(contestantHomeRoute({ questionId: 'q-1' })).toBe('ContestantAppHome');
  });

  it.each([
    ['only the type', { entityType: 'candidate' }],
    ['only the id', { entityId: 'entity-1' }]
  ])('answers the app root when the params carry %s', (_, params) => {
    expect(contestantHomeRoute(params)).toBe('ContestantAppHome');
  });

  it('answers the app root when the params carry neither', () => {
    expect(contestantHomeRoute({})).toBe('ContestantAppHome');
  });

  it.each([
    ['the type', { entityType: '', entityId: 'entity-1' }],
    ['the id', { entityType: 'candidate', entityId: '' }],
    ['both', { entityType: '', entityId: '' }]
  ])('answers the app root when %s is an empty string', (_, params) => {
    expect(contestantHomeRoute(params)).toBe('ContestantAppHome');
  });
});
