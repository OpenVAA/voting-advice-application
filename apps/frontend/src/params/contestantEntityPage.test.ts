import { describe, expect, it } from 'vitest';
import { FIRST_QUESTION_ID } from '$lib/routes/route';
import { match } from './contestantEntityPage';

const UUID = '3f2b8c1e-9a4d-4e6f-8b7a-0c1d2e3f4a5b';

/**
 * Unit test for the `contestantEntityPage` SvelteKit param matcher.
 *
 * Accept-set: `profile`, `questions`, `questions/<one segment>`, `preview` and `nominations`.
 *
 * Rejects the empty string, which a rest segment's matcher receives for the app root, a page of the app that is not an entity page (the settings page among them: it belongs to the user and has its own route at the app root), an empty or a nested question segment, a case variant and an id alone.
 */
describe('contestantEntityPage matcher', () => {
  it.each([
    ['profile', true],
    ['questions', true],
    [`questions/${FIRST_QUESTION_ID}`, true],
    [`questions/${UUID}`, true],
    ['preview', true],
    ['nominations', true]
  ])('match(%p) === %p', (input, expected) => {
    expect(match(input)).toBe(expected);
  });

  it('rejects the empty string, so a route using it never competes for the app root', () => {
    expect(match('')).toBe(false);
  });

  it.each([
    'help',
    'login',
    'settings',
    'settings/',
    'questions/',
    'questions/a/b',
    `questions/${UUID}/`,
    'profile/x',
    'preview/',
    'nominations/',
    'nominations/x',
    'nomination',
    '/profile',
    'Profile',
    'questionsx',
    UUID
  ])('match(%p) === false', (input) => {
    expect(match(input)).toBe(false);
  });
});
