import { describe, expect, it, vi } from 'vitest';
import { loginRedirectTargetOf, safeRedirectTarget } from './loginRedirectTarget';

// Paraglide's `url` strategy: a non-base locale is the first path segment, the base locale has none.
vi.mock('$lib/paraglide/runtime', () => ({
  deLocalizeUrl: (url: URL) => {
    const delocalized = new URL(url);
    delocalized.pathname = url.pathname.replace(/^\/(fi|sv)(?=\/|$)/, '') || '/';
    return delocalized;
  }
}));

describe('loginRedirectTargetOf', () => {
  it('strips the leading separator from a base-locale path', () => {
    expect(loginRedirectTargetOf(new URL('http://localhost/candidate/profile'))).toBe('candidate/profile');
  });

  it('strips the locale prefix of a non-base locale', () => {
    expect(loginRedirectTargetOf(new URL('http://localhost/fi/candidate/questions/q-1'))).toBe(
      'candidate/questions/q-1'
    );
  });

  it('keeps a first segment that merely begins with a locale code', () => {
    expect(loginRedirectTargetOf(new URL('http://localhost/finance/x'))).toBe('finance/x');
  });

  it('produces a value the login action accepts', () => {
    expect(safeRedirectTarget(loginRedirectTargetOf(new URL('http://localhost/fi/candidate/settings')))).toBe(
      'candidate/settings'
    );
  });
});
