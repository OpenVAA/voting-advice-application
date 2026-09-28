import { describe, expect, it } from 'vitest';
import { buildRoute } from './buildRoute';
import { safeRedirectTarget } from './loginRedirectTarget';

/**
 * # Characterisation test for the two redirect targets the request hook emits
 *
 * The candidate auth handler in `hooks.server.ts` bounces a signed-in visitor off the login page, and an unauthenticated visitor off a protected candidate route onto the login page carrying `?redirectTo=<the path they wanted>`. Both targets are built by `buildRoute`. This file pins the strings that produces, so a later change to `buildRoute`, to the route map or to the handler cannot alter the emitted URL without a test going red.
 *
 * ## The failure mode this exists to catch
 *
 * `redirectTo` is not a declared route param, so `buildRoute` routes it to the SEARCH side and emits it through `qs.stringify(..., { encodeValuesOnly: true })`. That percent-encodes the separators inside the value, where the older hand-built interpolation wrote them raw. The value is then read back by the login page off `url.searchParams`, posted to the form action, and validated by `safeRedirectTarget`, whose accepted-path pattern permits `%` inside a query string but NOT inside a path segment.
 *
 * So an encoded value that is never decoded would be REJECTED, and the rejection is silent: the validator's fallback to the app home is deliberate and documented, so the deep link would quietly degrade and nothing would error. The round-trip cases below therefore assert the whole encode-then-decode path, not just the encode half. The mirror assertion matters just as much: a value the validator REJECTS must still be rejected after the round trip, so the trip cannot launder a hostile value into an accepted one.
 *
 * ## What this harness can and cannot see
 *
 * `buildRoute` finishes by handing its result to Paraglide's `localizeHref`, which adds the locale prefix. The unit harness aliases the Paraglide runtime to a stub whose `localizeHref` is the identity function, because the real module is generated at build time and is not in the repository. Every expectation below is therefore the string `buildRoute` itself assembles, BEFORE localization.
 *
 * That boundary is deliberate and is not a gap: the prefixing is Paraglide's behaviour, not this module's, and it is exercised by the browser suite. Measured against the generated runtime, the prefix is added for every non-base locale and omitted for the base locale, which is why the localized candidate home is `/candidate` rather than `/en/candidate` in English. The protected candidate layout has always built its login redirect this same way, so the two now agree.
 */

/**
 * Read `redirectTo` back out of a built URL the way the browser and the login page do.
 *
 * @param url - A URL string produced by `buildRoute`.
 * @returns The decoded `redirectTo` value, or `null` when the URL carries none.
 */
function readRedirectTo(url: string): string | null {
  const queryStart = url.indexOf('?');
  return new URLSearchParams(queryStart === -1 ? '' : url.slice(queryStart + 1)).get('redirectTo');
}

describe('buildRoute — the redirect targets emitted by the candidate auth handler', () => {
  it('builds the candidate home target as an exact string', () => {
    expect(buildRoute({ route: 'CandAppHome', locale: 'en' })).toBe('/candidate');
  });

  it('builds the login target on the same path and carries the redirect target under the same query key', () => {
    const url = buildRoute({ route: 'CandAppLogin', locale: 'en', redirectTo: 'candidate/profile' });

    expect(url.split('?')[0]).toBe('/candidate/login');
    expect(readRedirectTo(url)).toBe('candidate/profile');
  });

  it('percent-encodes the separators inside the redirect target', () => {
    const url = buildRoute({ route: 'CandAppLogin', locale: 'en', redirectTo: 'candidate/profile' });

    expect(url).toBe('/candidate/login?redirectTo=candidate%2Fprofile');
  });
});

describe('redirectTo round trip — a value the validator accepts survives buildRoute', () => {
  const accepted = [
    'candidate/profile',
    'candidate/questions/first-question',
    'candidate/profile?tab=basic',
    'candidate/settings/'
  ];

  it.each(accepted)('accepts %s before the round trip, and again after it', (value) => {
    expect(safeRedirectTarget(value)).toBe(value);

    const decoded = readRedirectTo(buildRoute({ route: 'CandAppLogin', locale: 'en', redirectTo: value }));

    expect(decoded).toBe(value);
    expect(safeRedirectTarget(decoded)).toBe(value);
  });

  it('rejects the still-encoded form, which is what makes the decode step load-bearing', () => {
    // The discriminating half. Without this the round-trip cases above could pass vacuously, on a `buildRoute` that never encoded anything.
    const url = buildRoute({ route: 'CandAppLogin', locale: 'en', redirectTo: 'candidate/profile' });
    const stillEncoded = url.slice(url.indexOf('redirectTo=') + 'redirectTo='.length);

    expect(stillEncoded).toBe('candidate%2Fprofile');
    expect(safeRedirectTarget(stillEncoded)).toBeUndefined();
  });
});

describe('redirectTo round trip — a value the validator rejects stays rejected', () => {
  const rejected = ['https://evil.example.com', '//evil.example.com', '../../etc/passwd', '\\\\evil.example.com'];

  it.each(rejected)('rejects %s before the round trip, and still rejects it after', (value) => {
    expect(safeRedirectTarget(value)).toBeUndefined();

    const decoded = readRedirectTo(buildRoute({ route: 'CandAppLogin', locale: 'en', redirectTo: value }));

    expect(decoded).toBe(value);
    expect(safeRedirectTarget(decoded)).toBeUndefined();
  });
});
