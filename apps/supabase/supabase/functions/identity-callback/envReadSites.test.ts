/**
 * Source-level guard over `index.ts`'s environment READ SITES.
 *
 * `index.ts` cannot be imported by vitest — it resolves `https://esm.sh/@supabase/supabase-js@2` and `https://deno.land/x/jose@v5.9.6/index.ts`, which are Deno-only remote specifiers. So the property asserted here ("every required variable is read through a guard that names it when unset") is asserted against the module's SOURCE TEXT, the way this repository already gates call shapes it cannot execute (`scripts/assert-project-scoped-queries.mjs`).
 *
 * Why this exists: five of the seven required variables threw `ERR_ENV_UNCONFIGURED` naming the variable, while `IDENTITY_PROVIDER_DECRYPTION_JWKS` and `IDENTITY_PROVIDER_JWKS_URI` were read as `Deno.env.get(...)!` and threw incidentally instead — a `SyntaxError` from `JSON.parse(undefined)` and a `TypeError` from `new URL(undefined)`. Both still failed closed, so this was a diagnostics defect rather than a security one: an operator with a half-configured deployment got an error naming neither the variable nor configuration as the cause. The two reads now go through `requireEnv`, and this file is what stops them drifting back.
 *
 * The assertions are deliberately about the read site rather than about runtime behaviour, because the runtime behaviour of an unset variable is exactly what cannot be exercised from here.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const INDEX_SOURCE = readFileSync(new URL('./index.ts', import.meta.url), 'utf8');

/**
 * The variables whose absence must produce `ERR_ENV_UNCONFIGURED` naming the variable.
 *
 * `IDENTITY_PROVIDER_CLIENT_ID` and `IDENTITY_PROVIDER_ISSUER` are NOT here: they are required too, but they are bound by `requireVerifyClaimBinding` (which throws `ERR_AUDIENCE_UNCONFIGURED` / `ERR_ISSUER_UNCONFIGURED`), asserted separately below.
 *
 * `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are NOT here and are NOT required to be guarded: the platform sets both, so there is no deployment in which an operator can leave them unset.
 */
const REQUIRE_ENV_GUARDED = [
  'IDENTITY_PROVIDER_TYPE',
  'IDENTITY_PROVIDER_DECRYPTION_JWKS',
  'IDENTITY_PROVIDER_JWKS_URI',
  'PUBLIC_PROJECT_ID',
  'SITE_URL'
] as const;

const CLAIM_BINDING_GUARDED = ['IDENTITY_PROVIDER_CLIENT_ID', 'IDENTITY_PROVIDER_ISSUER'] as const;

describe('identity-callback env read sites', () => {
  it.each(REQUIRE_ENV_GUARDED)('reads %s through requireEnv', (name) => {
    expect(INDEX_SOURCE).toContain(`requireEnv('${name}'`);
  });

  it.each(REQUIRE_ENV_GUARDED)('does not read %s with a non-null assertion', (name) => {
    // The shape this guard exists to forbid: `Deno.env.get('X')!`, which discards the unset case and lets the failure surface as whatever the next expression happens to throw.
    expect(INDEX_SOURCE).not.toContain(`Deno.env.get('${name}')!`);
  });

  it.each(CLAIM_BINDING_GUARDED)('passes %s into requireVerifyClaimBinding rather than asserting it', (name) => {
    expect(INDEX_SOURCE).not.toContain(`Deno.env.get('${name}')!`);
    expect(INDEX_SOURCE).toContain(`Deno.env.get('${name}')`);
  });

  it('binds both verification claims through the one guard on the path to jwtVerify', () => {
    expect(INDEX_SOURCE).toContain('requireVerifyClaimBinding(');
  });

  /**
   * Non-vacuity control. The two assertions above are `toContain` / `not.toContain` over a file read at import time; if the read silently produced an empty string they would both pass for every name and this suite would be a clean bill over nothing. Pin the source as non-empty and as actually being the module under test.
   */
  it('read a non-empty index.ts, so the assertions above are not vacuous', () => {
    expect(INDEX_SOURCE.length).toBeGreaterThan(1000);
    expect(INDEX_SOURCE).toContain('Provider-Agnostic Identity Callback Edge Function');
  });

  /**
   * The catch arm at the bottom of `index.ts` returns a fixed literal precisely so an unauthenticated caller (the endpoint is served `--no-verify-jwt`) cannot learn which variables are unconfigured. Routing two more reads through `requireEnv` increases the number of throws that arm swallows, so the comment naming them has to keep counting correctly — a stale count there is how the next reader concludes the two new throws leak.
   */
  it('keeps the catch arm comment naming every requireEnv throw it swallows', () => {
    for (const name of REQUIRE_ENV_GUARDED) {
      expect(INDEX_SOURCE).toContain(name);
    }
    expect(INDEX_SOURCE).toContain('five ERR_ENV_UNCONFIGURED throws');
  });
});
