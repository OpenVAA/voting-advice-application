import { describe, expect, it } from 'vitest';
import { getErrorTranslationKey } from './loginError';
import type { LoginError } from './loginError';

describe('getErrorTranslationKey (Admin App)', () => {
  it('answers the key of each known reason', () => {
    expect(getErrorTranslationKey('loginFailed')).toBe('error.loginFailed');
    expect(getErrorTranslationKey('userNotAuthorized')).toBe('error.403');
  });

  it('answers nothing for no reason and for an unknown one', () => {
    expect(getErrorTranslationKey(null)).toBeUndefined();
    expect(getErrorTranslationKey('somethingElse' as LoginError)).toBeUndefined();
  });

  it.each(['constructor', 'toString', '__proto__', 'hasOwnProperty'])(
    'answers nothing for %s, a name every object inherits, which arrives on the address bar like any reason',
    (name) => {
      expect(getErrorTranslationKey(name as LoginError)).toBeUndefined();
    }
  );
});
