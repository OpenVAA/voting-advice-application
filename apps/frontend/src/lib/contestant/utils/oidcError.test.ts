import { describe, expect, it } from 'vitest';
import { buildRoute } from '$lib/routes';
import { OIDC_ERROR, oidcErrorClass, oidcErrorFromFunction, oidcErrorFromProvider } from './oidcError';

/**
 * # The codes an identification failure is reported with, and the class each is shown as
 *
 * The callback of the identity provider's flow reports a failure as `?error=<code>` on the address it redirects to. The codes are a closed set this application chooses: an operator reads them on the address bar with the identity-provider runbook, so their spellings are pinned exactly. The error screen shows a code as one of three classes, and any value it does not know as the class that says trying again may help.
 *
 * What this file holds:
 *
 * 1. **The codes** — nine spellings, each declared once.
 * 2. **The classes** — the class of every code, and of a value that is not one, an inherited property name among them.
 * 3. **The provider's values** — its cancel, and every other value as one code.
 * 4. **The function's results** — each result of `identity-callback`'s answer as one code.
 * 5. **The error screen's address** — every code reaches it and reads back unchanged.
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

describe('OIDC_ERROR — the codes this application chooses', () => {
  it('spells the nine wire values exactly as the operator runbook names them', () => {
    expect(OIDC_ERROR).toEqual({
      invalidState: 'invalid_state',
      invalidToken: 'invalid_token',
      missingCode: 'missing_code',
      tokenExchangeFailed: 'token_exchange_failed',
      cancelled: 'cancelled',
      providerError: 'provider_error',
      modeNotAllowed: 'mode_not_allowed',
      registrationFailed: 'registration_failed',
      configurationError: 'configuration_error'
    });
  });

  it('declares every value exactly once, so no two names share a wire spelling', () => {
    const values = Object.values(OIDC_ERROR);

    expect(new Set(values).size).toBe(values.length);
  });
});

describe('oidcErrorClass — the class the error screen shows', () => {
  it.each([
    ['cancelled', 'cancelled'],
    ['invalid_state', 'retry'],
    ['missing_code', 'retry'],
    ['token_exchange_failed', 'retry'],
    ['provider_error', 'retry'],
    ['registration_failed', 'retry'],
    ['invalid_token', 'noRetry'],
    ['mode_not_allowed', 'noRetry'],
    ['configuration_error', 'noRetry']
  ])('shows %s as %s', (code, errorClass) => {
    expect(oidcErrorClass(code)).toBe(errorClass);
  });

  it('gives every code a class', () => {
    for (const code of Object.values(OIDC_ERROR))
      expect(['cancelled', 'retry', 'noRetry']).toContain(oidcErrorClass(code));
  });

  it.each([null, undefined, '', 'access_denied', 'CANCELLED', 'noRetry', ' cancelled', '<b>x</b>'])(
    'shows a value that is not a code, %j, as retry',
    (value) => {
      expect(oidcErrorClass(value)).toBe('retry');
    }
  );

  it.each(['constructor', 'toString', '__proto__', 'hasOwnProperty', 'valueOf'])(
    'shows the inherited property name %s as retry',
    (value) => {
      expect(oidcErrorClass(value)).toBe('retry');
    }
  );
});

describe("oidcErrorFromProvider — the provider's own error value", () => {
  it('reads the cancel both providers send as cancelled', () => {
    expect(oidcErrorFromProvider('access_denied')).toBe('cancelled');
  });

  it.each([
    'login_required',
    'server_error',
    'temporarily_unavailable',
    'access denied',
    'ACCESS_DENIED',
    'cancelled',
    ''
  ])('reads %j as provider_error', (value) => {
    expect(oidcErrorFromProvider(value)).toBe('provider_error');
  });
});

describe("oidcErrorFromFunction — the result of identity-callback's answer", () => {
  it.each([
    ['mode_not_allowed', 'mode_not_allowed'],
    ['invalid_token', 'invalid_token'],
    ['configuration', 'configuration_error'],
    ['refused', 'configuration_error'],
    ['bad_request', 'configuration_error'],
    ['unavailable', 'registration_failed']
  ])('reads %s as %s', (result, code) => {
    expect(oidcErrorFromFunction(result)).toBe(code);
  });

  it.each([undefined, null, '', 'created', 'something_else', 'constructor', 42, { result: 'refused' }])(
    'reads %j, an absent or unknown result, as registration_failed',
    (result) => {
      expect(oidcErrorFromFunction(result)).toBe('registration_failed');
    }
  );
});

describe('the error screen address a code is carried on', () => {
  it.each(Object.values(OIDC_ERROR))('reads %s back unchanged from a built address', (value) => {
    const url = buildRoute({ route: 'ContestantAppIdentityProviderError', locale: 'en', error: value });

    expect(url).toBe(`/contestant/register/identity-provider/error?error=${value}`);
    expect(readError(url)).toBe(value);
  });
});
