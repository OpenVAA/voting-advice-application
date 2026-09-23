/**
 * Tests for the ID-token failure-class table.
 *
 * The thing under test is a promise about DOCUMENTATION, so the assertions are about coverage and honesty rather than about behaviour:
 *
 * - every code this application throws is mapped, and mapped to a real stage (so adding a code without a hint reds here, which is the mechanism that stops this table rotting into the false closed-set comment it replaced);
 * - every jose 6.x code this pipeline can produce is mapped, enumerated against jose's own error classes rather than against a list retyped by hand;
 * - `ERR_JOSE_GENERIC` specifically resolves to the jwks-fetch stage, because that is the only thing it can mean in jose 6.x and mis-attributing it is what cost the debug session;
 * - the describer is TOTAL -- an unknown code is admitted as unknown, never mapped to a plausible-looking stage;
 * - no hint interpolates anything, which is what makes `formatOidcFailure` safe to log.
 *
 * @vitest-environment node
 */

import * as jose from 'jose';
import { describe, expect, it } from 'vitest';
import { describeOidcFailure, formatOidcFailure, OIDC_FAILURE, OIDC_FAILURE_NONE } from './oidcFailure';
import type { OidcFailureKey, OidcFailureStage } from './oidcFailure';

/** The keys of `OIDC_FAILURE`, enumerated so a new member cannot be added without a mapping. */
const OWN_KEYS: Array<OidcFailureKey> = [
  'jwksMalformed',
  'jwksEmpty',
  'jwkKidMismatch',
  'audienceUnconfigured',
  'issuerUnconfigured',
  'jwksUriUnconfigured',
  'jwksUriHttpStatus',
  'jwksUriNotJson',
  'jwksUriUnreachable'
];

/**
 * jose's own codes, read off jose's exported error CLASSES rather than retyped.
 *
 * This is the load-bearing detail of the file: a jose upgrade that adds an error class makes this list grow by itself, so the coverage test below reds on the upgrade instead of on the next production incident.
 */
const JOSE_CODES: Array<string> = Object.values(jose.errors)
  .map((cls) => (cls as unknown as { code?: unknown }).code)
  .filter((code): code is string => typeof code === 'string');

describe('OIDC_FAILURE', () => {
  it('exposes a code for every declared key', () => {
    for (const key of OWN_KEYS) {
      expect(OIDC_FAILURE[key], key).toMatch(/^ERR_[A-Z0-9_]+$/);
    }
  });

  it('declares no duplicate codes', () => {
    const codes = OWN_KEYS.map((key) => OIDC_FAILURE[key]);
    expect(new Set(codes).size).toBe(codes.length);
  });

  // These five spellings have appeared in operator-facing server logs and in the bank-authentication runbook, so renaming one is a documentation change rather than a refactor. Pinned verbatim.
  it('preserves the five pre-existing wire spellings verbatim', () => {
    expect(OIDC_FAILURE.jwksMalformed).toBe('ERR_JWKS_MALFORMED');
    expect(OIDC_FAILURE.jwksEmpty).toBe('ERR_JWKS_EMPTY');
    expect(OIDC_FAILURE.jwkKidMismatch).toBe('ERR_JWK_KID_MISMATCH');
    expect(OIDC_FAILURE.audienceUnconfigured).toBe('ERR_AUDIENCE_UNCONFIGURED');
    expect(OIDC_FAILURE.issuerUnconfigured).toBe('ERR_ISSUER_UNCONFIGURED');
  });
});

describe('describeOidcFailure', () => {
  // The rot-guard. Add a member to `OIDC_FAILURE` without a hint and this reds -- which is exactly the failure mode the false closed-set comment had and could not detect.
  it('maps every code this application throws to a known stage and a non-empty hint', () => {
    for (const key of OWN_KEYS) {
      const code = OIDC_FAILURE[key];
      const description = describeOidcFailure(code);

      expect(description.code, code).toBe(code);
      expect(description.stage, code).not.toBe('unknown');
      expect(description.hint.length, code).toBeGreaterThan(20);
    }
  });

  // Grows by itself on a jose upgrade, so the gap is reported by CI rather than by a production log line that says nothing.
  it('maps every jose 6.x error code to a known stage', () => {
    expect(JOSE_CODES.length).toBeGreaterThan(10);

    for (const code of JOSE_CODES) {
      const description = describeOidcFailure(code);
      expect(description.stage, `jose code ${code} is unmapped`).not.toBe('unknown');
      expect(description.hint.length, code).toBeGreaterThan(20);
    }
  });

  // THE POINT OF THE WHOLE MODULE. `ERR_JOSE_GENERIC` is jose's base-class code and in jose 6.x a bare `JOSEError` is constructed at exactly two sites, both fetching the remote key set. Attributing it to any other stage sends the next reader to the wrong variable.
  it('attributes ERR_JOSE_GENERIC to the jwks-fetch stage and names IDENTITY_PROVIDER_JWKS_URI', () => {
    const description = describeOidcFailure('ERR_JOSE_GENERIC');

    expect(description.stage).toBe('jwks-fetch');
    expect(description.hint).toContain('IDENTITY_PROVIDER_JWKS_URI');
  });

  it('is the code jose’s own base error class actually carries', () => {
    // Guards the premise rather than the mapping: if a jose upgrade renamed the base code, the reasoning above stops holding and this says so.
    expect(jose.errors.JOSEError.code).toBe('ERR_JOSE_GENERIC');
  });

  // The stage partitions the remedy, so a configuration fault must say which variable to edit. A `config`-stage hint that names no variable is useless in precisely the situation it exists for.
  it('names at least one environment variable in every config-stage hint', () => {
    const configCodes = [...OWN_KEYS.map((key) => OIDC_FAILURE[key]), ...JOSE_CODES].filter(
      (code) => describeOidcFailure(code).stage === 'config'
    );

    expect(configCodes.length).toBeGreaterThan(0);
    for (const code of configCodes) {
      expect(describeOidcFailure(code).hint, code).toMatch(/[A-Z][A-Z0-9_]{6,}/);
    }
  });

  it('routes each JWKS-URI class to the stage its remedy belongs to', () => {
    // An unconfigured variable is a `.env` edit; a bad response from a configured one is a URL or reachability problem at the provider. Collapsing the two would merge two different remedies under one label.
    expect(describeOidcFailure(OIDC_FAILURE.jwksUriUnconfigured).stage).toBe('config');
    expect(describeOidcFailure(OIDC_FAILURE.jwksUriHttpStatus).stage).toBe('jwks-fetch');
    expect(describeOidcFailure(OIDC_FAILURE.jwksUriNotJson).stage).toBe('jwks-fetch');
    expect(describeOidcFailure(OIDC_FAILURE.jwksUriUnreachable).stage).toBe('jwks-fetch');
  });

  // Where the cross-runtime client-id drift surfaces. The hint has to point at the two variables and at the checker, because a claim mismatch looks identical to a key problem from the outside.
  it('points a claim-validation failure at the audience and issuer variables and at the pair checker', () => {
    const { stage, hint } = describeOidcFailure('ERR_JWT_CLAIM_VALIDATION_FAILED');

    expect(stage).toBe('claims');
    expect(hint).toContain('PUBLIC_IDENTITY_PROVIDER_CLIENT_ID');
    expect(hint).toContain('IDENTITY_PROVIDER_ISSUER');
    expect(hint).toContain('check:env-pairs-agree');
  });

  describe('totality', () => {
    it('admits an unrecognised code as unknown instead of guessing a stage', () => {
      const description = describeOidcFailure('ERR_SOMETHING_JOSE_SEVEN_INVENTED');

      expect(description.code).toBe('ERR_SOMETHING_JOSE_SEVEN_INVENTED');
      expect(description.stage).toBe('unknown');
      expect(description.hint).toContain('Unrecognised');
    });

    // Boundary neighbours of "a code": the two ways `IdTokenClaimsResult.error.code` can be absent. `error: {}` is a real production shape -- both provider catch arms return it when the thrown value carries no `code`.
    it.each([undefined, ''])('resolves %o to the none placeholder', (code) => {
      const description = describeOidcFailure(code);

      expect(description.code).toBe(OIDC_FAILURE_NONE);
      expect(description.stage).toBe('unknown');
      expect(description.hint).toContain('no code');
    });

    it('never returns an empty hint for any input', () => {
      const inputs = [
        undefined,
        '',
        'nonsense',
        'ERR_JOSE_GENERIC',
        ...OWN_KEYS.map((key) => OIDC_FAILURE[key]),
        ...JOSE_CODES
      ];

      for (const input of inputs) {
        expect(describeOidcFailure(input).hint.length, String(input)).toBeGreaterThan(0);
      }
    });

    it('only ever reports a declared stage', () => {
      const stages: Array<OidcFailureStage> = ['config', 'jwks-fetch', 'decrypt', 'verify', 'claims', 'unknown'];
      const inputs = [undefined, 'nonsense', ...OWN_KEYS.map((key) => OIDC_FAILURE[key]), ...JOSE_CODES];

      for (const input of inputs) {
        expect(stages, String(input)).toContain(describeOidcFailure(input).stage);
      }
    });
  });

  // The hints are logged verbatim, so they are only safe because they are FIXED. A hint that interpolated a value would be a leak with no call site to blame.
  describe('leak safety', () => {
    it('contains no interpolation in any hint', () => {
      const inputs = [undefined, 'nonsense', ...OWN_KEYS.map((key) => OIDC_FAILURE[key]), ...JOSE_CODES];

      for (const input of inputs) {
        const { hint } = describeOidcFailure(input);
        expect(hint, String(input)).not.toContain('${');
        expect(hint, String(input)).not.toContain('undefined');
        expect(hint, String(input)).not.toMatch(/\bhttps?:\/\/(?!\{)/);
      }
    });
  });
});

describe('formatOidcFailure', () => {
  it('renders one greppable line carrying the code, stage, provider and hint', () => {
    const line = formatOidcFailure(OIDC_FAILURE.jwksUriHttpStatus, 'idura');

    expect(line).toContain(`code=${OIDC_FAILURE.jwksUriHttpStatus}`);
    expect(line).toContain('stage=jwks-fetch');
    expect(line).toContain('provider=idura');
    expect(line).toContain('IDENTITY_PROVIDER_JWKS_URI');
    expect(line).not.toContain('\n');
  });

  // Naming the active provider is what makes "the wrong provider was selected" -- finding 1 of the bank-auth session, where an unset type silently defaulted to signicat -- visible in the log instead of invisible.
  it('names the active provider so a wrong-provider selection is visible', () => {
    expect(formatOidcFailure('ERR_JOSE_GENERIC', 'signicat')).toContain('provider=signicat');
    expect(formatOidcFailure('ERR_JOSE_GENERIC', 'idura')).toContain('provider=idura');
  });

  it('renders the none placeholder for a failure with no code', () => {
    expect(formatOidcFailure(undefined, 'idura')).toContain(`code=${OIDC_FAILURE_NONE}`);
  });
});
