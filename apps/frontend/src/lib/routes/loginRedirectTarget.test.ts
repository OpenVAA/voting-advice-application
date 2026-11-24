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
    expect(loginRedirectTargetOf(new URL('http://localhost/contestant/profile'))).toBe('contestant/profile');
  });

  it('strips the locale prefix of a non-base locale', () => {
    expect(loginRedirectTargetOf(new URL('http://localhost/fi/contestant/questions/q-1'))).toBe(
      'contestant/questions/q-1'
    );
  });

  it('keeps a first segment that merely begins with a locale code', () => {
    expect(loginRedirectTargetOf(new URL('http://localhost/finance/x'))).toBe('finance/x');
  });

  it('produces a value the login action accepts', () => {
    expect(safeRedirectTarget(loginRedirectTargetOf(new URL('http://localhost/fi/contestant/settings')))).toBe(
      'contestant/settings'
    );
  });
});

describe('safeRedirectTarget on the protected paths of the Contestant App', () => {
  it('accepts a path that names an entity', () => {
    const entityPath =
      'contestant/candidate/11111111-1111-4111-8111-111111111111/questions/33333333-3333-4333-8333-333333333333';

    expect(safeRedirectTarget(entityPath)).toBe(entityPath);
    expect(safeRedirectTarget(loginRedirectTargetOf(new URL(`http://localhost/fi/${entityPath}`)))).toBe(entityPath);
  });

  it('accepts a protected path that names no entity', () => {
    expect(safeRedirectTarget('contestant/profile')).toBe('contestant/profile');
    expect(safeRedirectTarget('contestant/questions/33333333-3333-4333-8333-333333333333')).toBe(
      'contestant/questions/33333333-3333-4333-8333-333333333333'
    );
  });
});
