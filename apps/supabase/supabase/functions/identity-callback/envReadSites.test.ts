/**
 * Source-level guard over `index.ts`'s environment READ SITES.
 *
 * `index.ts` cannot be imported by vitest — it imports `@supabase/supabase-js` and `jose` through `npm:` specifiers, which only Deno resolves. So the property asserted here ("every required variable is read through a guard that names it when unset") is asserted against the module's SOURCE TEXT, the way this repository already gates call shapes it cannot execute (`scripts/assert-project-scoped-queries.mjs`).
 *
 * Why this exists: a required variable read as `Deno.env.get(...)!` throws incidentally when it is unset -- a `SyntaxError` from `JSON.parse(undefined)`, a `TypeError` from `new URL(undefined)` -- so an operator with a half-configured deployment gets an error naming neither the variable nor configuration as the cause, and the function cannot tell that failure from an outage. Every required read goes through `requireEnv`, and this file is what keeps it so. It also pins the whole set of variables the function reads.
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
  'IDENTITY_CALLBACK_SERVER_SECRET'
] as const;

const CLAIM_BINDING_GUARDED = ['IDENTITY_PROVIDER_CLIENT_ID', 'IDENTITY_PROVIDER_ISSUER'] as const;

/** The two variables the platform sets. */
const PLATFORM_SET = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] as const;

/** The name of every `Deno.env.get('<name>')` read in the source. */
function readNames(): Array<string> {
  return Array.from(
    new Set(Array.from(INDEX_SOURCE.matchAll(/Deno\.env\.get\('([A-Z_]+)'\)/g)).map((m) => m[1]))
  ).sort();
}

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

  it("reads the identity provider's variables, the server's secret and the platform's two, and nothing else", () => {
    expect(readNames()).toEqual([...REQUIRE_ENV_GUARDED, ...CLAIM_BINDING_GUARDED, ...PLATFORM_SET].sort());
  });

  it('reads no site origin', () => {
    expect(INDEX_SOURCE).not.toContain("'SITE_URL'");
  });

  it('reads no project from its environment: the project is the one the request names', () => {
    expect(INDEX_SOURCE).not.toContain('PUBLIC_PROJECT_ID');
    expect(INDEX_SOURCE).toContain('const projectId = request.projectId;');
  });

  it("reads the server's secret once, through requireEnv", () => {
    expect(INDEX_SOURCE.split("requireEnv('IDENTITY_CALLBACK_SERVER_SECRET'").length - 1).toBe(1);
  });

  /**
   * Non-vacuity control. The two assertions above are `toContain` / `not.toContain` over a file read at import time; if the read silently produced an empty string they would both pass for every name and this suite would be a clean bill over nothing. Pin the source as non-empty and as actually being the module under test.
   */
  it('read a non-empty index.ts, so the assertions above are not vacuous', () => {
    expect(INDEX_SOURCE.length).toBeGreaterThan(1000);
    expect(INDEX_SOURCE).toContain('Provider-Agnostic Identity Callback Edge Function');
  });

  /**
   * The catch arm at the bottom of `index.ts` answers one fixed result precisely so an unauthenticated caller (the endpoint is served `--no-verify-jwt`) cannot learn which variables are unconfigured. The comment there names every `requireEnv` throw it catches, and has to keep counting correctly: a stale count is how the next reader concludes a throw leaks.
   */
  it('keeps the catch arm comment naming every requireEnv throw it swallows', () => {
    for (const name of REQUIRE_ENV_GUARDED) {
      expect(INDEX_SOURCE).toContain(name);
    }
    expect(INDEX_SOURCE).toContain('four ERR_ENV_UNCONFIGURED throws');
  });
});
