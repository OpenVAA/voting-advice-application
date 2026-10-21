/**
 * The reasons the Contestant App's login screen shows a notice for, and the message of each.
 *
 * The reason is read from the address bar, so the cases below include text nobody's code sends.
 */

import { describe, expect, it } from 'vitest';
import { getErrorTranslationKey } from './loginError';

describe('getErrorTranslationKey', () => {
  it('gives a user who was signed out the sentence that says so', () => {
    expect(getErrorTranslationKey('loginFailed')).toBe('contestantApp.login.signedOut');
  });

  it('gives a mailed link that could not be used its own sentence', () => {
    expect(getErrorTranslationKey('authError')).toBe('contestantApp.login.linkFailed');
  });

  it.each([null, undefined, ''])('has no message for an absent reason (%s)', (reason) => {
    expect(getErrorTranslationKey(reason)).toBeUndefined();
  });

  it.each([
    'userNotAuthorized',
    'LoginFailed',
    'loginFailed ',
    'authError,loginFailed',
    'contestantApp.login.signedOut',
    '<b>Sign in at example.test</b>'
  ])('has no message for text that is not one of the reasons (%s)', (reason) => {
    expect(getErrorTranslationKey(reason)).toBeUndefined();
  });

  it.each(['constructor', 'toString', 'hasOwnProperty', '__proto__', 'valueOf'])(
    'has no message for a name every object inherits (%s)',
    (reason) => {
      expect(getErrorTranslationKey(reason)).toBeUndefined();
    }
  );
});
