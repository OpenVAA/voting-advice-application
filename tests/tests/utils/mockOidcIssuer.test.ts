/**
 * Unit tests for the mock OIDC issuer: what its authorize and token endpoints answer with and without the selector cookie, that a code is good once, and that the server listens on the loopback address alone.
 *
 * The issuer is started on an ephemeral port with its committed certificate, and every request trusts that certificate for its own connection only.
 *
 * Run: yarn test:unit:tests mockOidcIssuer
 */
import { readFileSync } from 'node:fs';
import https from 'node:https';
import { join } from 'node:path';
import * as jose from 'jose';
import { beforeAll, describe, expect, it } from 'vitest';
import { encPrivJwk, getTestKeys } from './testKeys';
import {
  createMockOidcIssuer,
  decodeMockScenario,
  encodeMockScenario,
  IDURA_CLAIMS,
  MOCK_AUDIENCE,
  MOCK_ISSUER,
  MOCK_SCENARIO_COOKIE,
  mockIdentityClaims
} from '../support/mockOidcIssuer';
import type { MockOidcIssuerHandle, MockScenario } from '../support/mockOidcIssuer';

const CERT = readFileSync(join(import.meta.dirname, '..', 'support', 'mock-oidc-cert.pem'));

const REDIRECT_URI = 'http://localhost:5273/en/api/oidc/callback';
const STATE = 'state-value_1';

/** The answer of one request: its status, its `Location` header and its body. */
interface Answer {
  status: number;
  location: string | undefined;
  body: string;
}

let issuer: MockOidcIssuerHandle;

/** Make one request to the issuer, trusting its certificate for this connection alone. */
function request(
  path: string,
  options: { method?: 'GET' | 'POST'; cookie?: string; form?: Record<string, string> } = {}
): Promise<Answer> {
  const body = options.form ? new URLSearchParams(options.form).toString() : undefined;
  const headers: Record<string, string> = {};
  if (options.cookie) headers.cookie = options.cookie;
  if (body !== undefined) headers['content-type'] = 'application/x-www-form-urlencoded';
  return new Promise((resolve, reject) => {
    const req = https.request(
      new URL(path, issuer.url),
      { method: options.method ?? 'GET', headers, ca: CERT },
      (res) => {
        const chunks: Array<Buffer> = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () =>
          resolve({
            status: res.statusCode ?? 0,
            location: res.headers.location,
            body: Buffer.concat(chunks).toString('utf8')
          })
        );
        res.on('error', reject);
      }
    );
    req.on('error', reject);
    if (body !== undefined) req.write(body);
    req.end();
  });
}

/** A request object of the shape the application sends: a signed JWT carrying `redirect_uri` and `state`. */
async function requestObject(): Promise<string> {
  const { sigPriv } = await getTestKeys();
  return new jose.SignJWT({ redirect_uri: REDIRECT_URI, state: STATE })
    .setProtectedHeader({ alg: 'RS256', kid: 'test-sig-1' })
    .sign(sigPriv);
}

/** Call the authorize endpoint, with a selector cookie when one is given. */
async function authorize(cookie?: string): Promise<Answer> {
  return request(`/oauth2/authorize?request=${encodeURIComponent(await requestObject())}`, { cookie });
}

/** The cookie header a browser holding the selector for a scenario sends, beside a cookie of another name. */
function selectorCookie(scenario: MockScenario): string {
  return `other=1; ${MOCK_SCENARIO_COOKIE}=${encodeMockScenario(scenario)}`;
}

/** The query of an authorize answer's redirect, with the redirect's target checked. */
function redirectQuery(answer: Answer): URLSearchParams {
  expect(answer.status).toBe(302);
  const location = new URL(answer.location ?? '');
  expect(`${location.origin}${location.pathname}`).toBe(REDIRECT_URI);
  return location.searchParams;
}

/** Exchange a code at the token endpoint as the application's server does. */
function exchange(code: string): Promise<Answer> {
  return request('/oauth2/token', {
    method: 'POST',
    form: { grant_type: 'authorization_code', code, redirect_uri: REDIRECT_URI, client_assertion: 'unchecked' }
  });
}

/** Decrypt a token answer's id_token, verify its signature and return the claims. */
async function claimsOf(answer: Answer): Promise<jose.JWTPayload> {
  expect(answer.status).toBe(200);
  const { id_token: idToken } = JSON.parse(answer.body) as { id_token: string };
  const { plaintext } = await jose.compactDecrypt(idToken, await jose.importJWK(encPrivJwk, 'RSA-OAEP-256'));
  const { sigPubJwk } = await getTestKeys();
  const { payload } = await jose.jwtVerify(
    new TextDecoder().decode(plaintext),
    await jose.importJWK(sigPubJwk, 'RS256')
  );
  return payload;
}

const SCENARIO: MockScenario = {
  sub: 'e2e-idp-unit-0001',
  givenName: 'Aino',
  familyName: 'Ahonen',
  outcome: 'success'
};

beforeAll(async () => {
  issuer = createMockOidcIssuer({ port: 0 });
  await issuer.start();
  return () => issuer.stop();
});

describe('the mock issuer without a selector', () => {
  it('listens on the loopback address alone', () => {
    expect(new URL(issuer.url).hostname).toBe('127.0.0.1');
  });

  it('redirects to the request object redirect_uri with the fixed code and its state', async () => {
    const query = redirectQuery(await authorize());
    expect(query.get('code')).toBe('test-code');
    expect(query.get('state')).toBe(STATE);
    expect(query.get('error')).toBeNull();
  });

  it('mints the fixed identity for the fixed code, with the mock issuer and audience', async () => {
    const claims = await claimsOf(await exchange('test-code'));
    expect(claims.sub).toBe(IDURA_CLAIMS.sub);
    expect(claims.given_name).toBe(IDURA_CLAIMS.given_name);
    expect(claims.family_name).toBe(IDURA_CLAIMS.family_name);
    expect(claims.iss).toBe(MOCK_ISSUER);
    expect(claims.aud).toBe(MOCK_AUDIENCE);
  });

  it('answers a malformed selector as no selector', async () => {
    for (const value of [
      'not-base64-json',
      encodeURIComponent('{"sub":1}'),
      Buffer.from('{"sub":"x"}').toString('base64url')
    ]) {
      const query = redirectQuery(await authorize(`${MOCK_SCENARIO_COOKIE}=${value}`));
      expect(query.get('code')).toBe('test-code');
    }
  });
});

describe('the mock issuer with a selector', () => {
  it('for a success, redirects with a fresh code that mints the selected identity once', async () => {
    const query = redirectQuery(await authorize(selectorCookie(SCENARIO)));
    const code = query.get('code') ?? '';
    expect(code).not.toBe('');
    expect(code).not.toBe('test-code');
    expect(query.get('state')).toBe(STATE);

    const claims = await claimsOf(await exchange(code));
    expect(claims.sub).toBe(SCENARIO.sub);
    expect(claims.given_name).toBe(SCENARIO.givenName);
    expect(claims.family_name).toBe(SCENARIO.familyName);
    expect(claims.iss).toBe(MOCK_ISSUER);
    expect(claims.aud).toBe(MOCK_AUDIENCE);

    const second = await exchange(code);
    expect(second.status).toBe(400);
    expect(JSON.parse(second.body)).toEqual({ error: 'invalid_grant' });
  });

  it('gives two authorizations of one selector two different codes', async () => {
    const first = redirectQuery(await authorize(selectorCookie(SCENARIO))).get('code');
    const second = redirectQuery(await authorize(selectorCookie(SCENARIO))).get('code');
    expect(first).not.toBe(second);
  });

  it('for a cancel, redirects with access_denied and the state, and no code', async () => {
    const query = redirectQuery(await authorize(selectorCookie({ ...SCENARIO, outcome: 'cancel' })));
    expect(query.get('error')).toBe('access_denied');
    expect(query.get('state')).toBe(STATE);
    expect(query.get('code')).toBeNull();
  });

  it('for a provider error, redirects with server_error and the state, and no code', async () => {
    const query = redirectQuery(await authorize(selectorCookie({ ...SCENARIO, outcome: 'provider-error' })));
    expect(query.get('error')).toBe('server_error');
    expect(query.get('state')).toBe(STATE);
    expect(query.get('code')).toBeNull();
  });

  it('for a token error, redirects with a code that the token endpoint refuses', async () => {
    const query = redirectQuery(await authorize(selectorCookie({ ...SCENARIO, outcome: 'token-error' })));
    const code = query.get('code') ?? '';
    expect(code).not.toBe('');
    const answer = await exchange(code);
    expect(answer.status).toBe(400);
    expect(JSON.parse(answer.body)).toEqual({ error: 'invalid_grant' });
  });

  it('refuses a code it never issued', async () => {
    const answer = await exchange('never-issued');
    expect(answer.status).toBe(400);
    expect(JSON.parse(answer.body)).toEqual({ error: 'invalid_grant' });
  });
});

describe('the selector encoding', () => {
  it('decodes what it encodes', () => {
    expect(decodeMockScenario(encodeMockScenario(SCENARIO))).toEqual(SCENARIO);
  });

  it('decodes an unknown outcome, a missing field, an overlong field and a non-string field to null', () => {
    const encode = (value: unknown): string => Buffer.from(JSON.stringify(value)).toString('base64url');
    expect(decodeMockScenario(encode({ ...SCENARIO, outcome: 'other' }))).toBeNull();
    expect(decodeMockScenario(encode({ sub: SCENARIO.sub, givenName: 'A', outcome: 'success' }))).toBeNull();
    expect(decodeMockScenario(encode({ ...SCENARIO, sub: 'x'.repeat(1000) }))).toBeNull();
    expect(decodeMockScenario(encode({ ...SCENARIO, givenName: 7 }))).toBeNull();
    expect(decodeMockScenario(encode({ ...SCENARIO, sub: '' }))).toBeNull();
    expect(decodeMockScenario('%%%')).toBeNull();
  });

  it('builds the claim set of the fixed identity with the selected subject and names', () => {
    const claims = mockIdentityClaims(SCENARIO);
    expect(Object.keys(claims).sort()).toEqual(Object.keys(IDURA_CLAIMS).sort());
    expect(claims.sub).toBe(SCENARIO.sub);
    expect(claims.given_name).toBe(SCENARIO.givenName);
    expect(claims.family_name).toBe(SCENARIO.familyName);
  });
});
