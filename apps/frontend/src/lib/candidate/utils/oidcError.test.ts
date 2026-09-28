import { describe, expect, it } from 'vitest';
import { buildRoute } from '$lib/routes';
import { OIDC_ERROR, upstreamOidcError } from './oidcError';

/**
 * # Contract test for the error values the OIDC callback endpoint puts on the query string
 *
 * The callback endpoint redirects the browser to the preregistration page carrying `?error=<value>`. Four of those values are chosen by this application; a fifth case reflects a value the identity provider chose, which this application does not define.
 *
 * ## Why the wire strings are pinned exactly
 *
 * The four application-chosen values are an operator-facing contract: the bank authentication runbook tells an operator to read the query parameter to find out which stage of the flow failed, and names three of them by their exact spelling. Renaming one silently breaks a written diagnostic procedure that no other test covers, so the spellings are asserted here rather than left to whatever the constant happens to say.
 *
 * ## Why the encoding is asserted, and the discriminating case
 *
 * `error` is not a declared route param, so `buildRoute` routes it to the search side and emits it through `qs.stringify(..., { encodeValuesOnly: true })`, which percent-encodes the value itself. The endpoint used to hand-encode the provider-supplied value with `encodeURIComponent` before concatenating it onto a literal path. Passing that already-encoded value to the builder would encode it a SECOND time, so the page would receive `access%2520denied` where the provider said `access denied`, and nothing would error.
 *
 * The last case below is the discriminating one: it feeds the builder a hand-encoded value and asserts the round trip yields the encoded form rather than the original. Without it the passing cases above could hold on a builder that never encoded anything, and the reason the hand encoding had to be removed rather than kept would not be pinned by any assertion.
 *
 * ## What this harness can and cannot see
 *
 * `buildRoute` finishes by handing its result to Paraglide's `localizeHref`. The unit harness aliases the Paraglide runtime to a stub whose `localizeHref` is the identity function, because the real module is generated at build time and is not in the repository. Every expectation below is therefore the string `buildRoute` itself assembles, before localization. The base locale is `en` and the generated runtime omits the prefix for it, so the English URL is the same string either way.
 */

/**
 * Read `error` back out of a built URL the way the browser and the page do.
 *
 * @param url - A URL string produced by `buildRoute`.
 * @returns The decoded `error` value, or `null` when the URL carries none.
 */
function readError(url: string): string | null {
  const queryStart = url.indexOf('?');
  return new URLSearchParams(queryStart === -1 ? '' : url.slice(queryStart + 1)).get('error');
}

describe('OIDC_ERROR — the values this application chooses', () => {
  it('spells the four wire values exactly as the operator runbook names them', () => {
    expect(OIDC_ERROR).toEqual({
      invalidState: 'invalid_state',
      invalidToken: 'invalid_token',
      missingCode: 'missing_code',
      tokenExchangeFailed: 'token_exchange_failed'
    });
  });

  it('declares every value exactly once, so no two names share a wire spelling', () => {
    const values = Object.values(OIDC_ERROR);

    expect(new Set(values).size).toBe(values.length);
  });
});

describe('the redirect target the callback endpoint emits', () => {
  it.each(Object.values(OIDC_ERROR))('builds the preregistration URL carrying %s', (value) => {
    const url = buildRoute({ route: 'CandAppPreregister', locale: 'en', error: value });

    expect(url).toBe(`/candidate/preregister?error=${value}`);
    expect(readError(url)).toBe(value);
  });

  it('builds the bare preregistration URL when there is no error to report', () => {
    expect(buildRoute({ route: 'CandAppPreregister', locale: 'en' })).toBe('/candidate/preregister');
  });
});

describe('the provider-supplied value passes through encoded exactly once', () => {
  const raw = ['access_denied', 'login_required', 'access denied', 'weird/value', 'a&b=c'];

  it.each(raw)('round trips %s unchanged', (value) => {
    const url = buildRoute({ route: 'CandAppPreregister', locale: 'en', error: upstreamOidcError(value) });

    expect(readError(url)).toBe(value);
  });

  it('encodes the reserved characters itself, so the caller must not', () => {
    const url = buildRoute({ route: 'CandAppPreregister', locale: 'en', error: upstreamOidcError('access denied/x') });

    expect(url).toBe('/candidate/preregister?error=access%20denied%2Fx');
  });

  it('double encodes a value that was hand encoded first, which is why the hand encoding was removed', () => {
    // The discriminating case. This is what the endpoint used to do, and it is what the rewrite must not do.
    const url = buildRoute({
      route: 'CandAppPreregister',
      locale: 'en',
      error: encodeURIComponent('access denied')
    });

    expect(readError(url)).toBe('access%20denied');
    expect(readError(url)).not.toBe('access denied');
  });
});
