import { SERVED_ENTITY_TYPES } from '@openvaa/app-shared';
import { ENTITY_TYPE } from '@openvaa/data';
import { describe, expect, it } from 'vitest';
import { match } from './servedEntityType';

/**
 * Unit test for the `servedEntityType` SvelteKit param matcher.
 *
 * Accept-set: the members of `SERVED_ENTITY_TYPES`, compared member for member with the constant and not with a list of this file's own.
 *
 * Rejects the entity types the app never serves, the legacy `party`, a page name, a case variant and the empty string.
 */
describe('servedEntityType matcher', () => {
  it('accepts exactly the members of SERVED_ENTITY_TYPES among all entity types', () => {
    const accepted = Object.values(ENTITY_TYPE).filter((type) => match(type));
    expect([...accepted].sort()).toEqual([...SERVED_ENTITY_TYPES].sort());
  });

  it.each([...SERVED_ENTITY_TYPES])('match(%p) === true', (type) => {
    expect(match(type)).toBe(true);
  });

  it.each(['alliance', 'faction', 'party', 'questions', 'Candidate', ''])('match(%p) === false', (input) => {
    expect(match(input)).toBe(false);
  });
});
