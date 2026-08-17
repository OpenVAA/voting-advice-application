/**
 * Option-B local mock OIDC issuer for the bank-auth full-browser journey
 * (EFLOW-10b). PLAYWRIGHT_BANK_AUTH-gated, localhost-only, TEST-ONLY.
 *
 * WHY THIS EXISTS (the decisive architectural fact):
 *   The real OIDC code→token exchange AND the JWE id_token decryption run in the
 *   SvelteKit Node server (`/api/oidc/callback` → `exchangeCodeForToken()`;
 *   `+layout.server.ts` → `getIdTokenClaims()`), NOT in the browser — so
 *   `page.route()` cannot stub them. The only deterministic, no-live-IdP path is
 *   a SERVER-reachable mock issuer that the existing env vars point at, leaving the
 *   real authorize→callback→exchange→decrypt→claims chain UNMODIFIED (Option C — a
 *   test-only branch in production auth code — was rejected + operator-LOCKED).
 *
 * THE THREE ENDPOINTS (derived from the verified server-side Idura flow —
 * `providers/idura.ts` + `api/oidc/callback/+server.ts` + `getIdTokenClaims.ts`):
 *   1. GET  /oauth2/authorize  — `idura.ts` builds `https://${IDURA_DOMAIN}/oauth2/authorize`
 *      with all params inside an RS256-signed JAR (RFC 9101) carried in the `request`
 *      query param. We DECODE (NOT verify) the JAR to read `state` + `redirect_uri`,
 *      then 302 back to `${redirect_uri}?code=test-code&state=${state}` so the callback's
 *      `returnedState === oidc_state cookie` check passes.
 *   2. POST /oauth2/token      — returns `{ id_token }` built by the shared
 *      `buildTestIdToken` with iss/aud aligned to IDENTITY_PROVIDER_ISSUER /
 *      PUBLIC_IDENTITY_PROVIDER_CLIENT_ID (Pitfall 4). The `client_assertion` is
 *      accepted without validation (the mock does not authenticate the client).
 *   3. GET  <JWKS path>        — returns `{ keys: [sigPubJwk] }` (kid `test-sig-1`) so
 *      the server's `createRemoteJWKSet` can verify the inner JWT signature.
 *
 * HTTPS (A3 / Pitfall 2 — the single highest-uncertainty design point, resolved here):
 *   `idura.ts` hard-codes the `https://` prefix for BOTH the browser authorize leg
 *   AND the server `fetch` token/JWKS leg. A plain-HTTP mock is therefore unreachable;
 *   this issuer serves over HTTPS with a committed self-signed localhost cert
 *   (CN=127.0.0.1, SAN IP:127.0.0.1 + DNS:localhost). Because the cert is self-signed,
 *   the SvelteKit-server process must run with `NODE_TLS_REJECT_UNAUTHORIZED=0` SCOPED
 *   to the opt-in bank-auth-journey run only (documented in IDURA-TEST-RUNBOOK.md
 *   EFLOW-10b; threat T-122-07 — never in a default run / CI).
 *
 * SECURITY — TEST-ONLY (threats T-122-08 / T-122-09):
 *   Binds 127.0.0.1 ONLY (never a public interface). The self-signed cert/key under
 *   `tests/tests/support/` are TEST-ONLY localhost certs, never installed into any
 *   trust store, never used by production. The keys served come from the committed
 *   TEST key pair (`tests/tests/utils/testKeys.ts`); production keys are never this pair.
 */
import { readFileSync } from 'node:fs';
import https from 'node:https';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as jose from 'jose';
import { buildTestIdToken } from '../utils/buildTestIdToken';
import { getTestKeys } from '../utils/testKeys';
import type { IncomingMessage, ServerResponse } from 'node:http';

const HERE = dirname(fileURLToPath(import.meta.url));

/** Fixed loopback host the issuer binds to — never a public interface. */
const BIND_HOST = '127.0.0.1';

/**
 * The Idura test identity claims the token endpoint mints (reuses the
 * TEST_IDENTITY shape: sub/given_name/family_name/birthdate/hetu/country). `sub`
 * is the persistent pseudonym Idura matches identity on.
 */
export const IDURA_CLAIMS: Record<string, string> = {
  sub: 'test-bank-auth-journey-sub-001',
  given_name: 'Testi',
  family_name: 'Tunnistautuja',
  birthdate: '1990-01-15',
  hetu: '150190-999X',
  country: 'FI',
  identityscheme: 'fitupas'
};

/** Options for {@link createMockOidcIssuer}. */
export interface MockOidcIssuerOptions {
  /** Port to bind on 127.0.0.1. */
  port: number;
  /**
   * Absolute paths to the TLS cert/key. Defaults to the committed self-signed
   * localhost pair colocated with this module.
   */
  certPath?: string;
  keyPath?: string;
}

/** Handle returned by {@link createMockOidcIssuer}. */
export interface MockOidcIssuerHandle {
  /** Start listening; resolves once bound. */
  start(): Promise<void>;
  /** Stop listening; resolves once closed. */
  stop(): Promise<void>;
  /** The base HTTPS URL (e.g. `https://127.0.0.1:9443`). */
  readonly url: string;
}

/**
 * Read the inner-JWT iss/aud the token endpoint must align to (Pitfall 4). Read
 * lazily per token request so the values reflect the SvelteKit-server env this
 * issuer was launched alongside. Throws loudly if absent — a silent default would
 * produce a mysterious `invalid_token` callback redirect.
 */
function tokenIssAud(): { issuer: string; audience: string } {
  const issuer = process.env.IDENTITY_PROVIDER_ISSUER;
  const audience = process.env.PUBLIC_IDENTITY_PROVIDER_CLIENT_ID;
  if (!issuer || !audience) {
    throw new Error(
      'mockOidcIssuer: IDENTITY_PROVIDER_ISSUER and PUBLIC_IDENTITY_PROVIDER_CLIENT_ID must be set ' +
        'so the synthetic id_token iss/aud match the server verify (Pitfall 4).'
    );
  }
  return { issuer, audience };
}

/** Read the full request body (used for the token endpoint). */
async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Array<Buffer> = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString('utf8');
}

/**
 * Create the Option-B mock OIDC issuer. Returns a `{ start, stop, url }` handle.
 *
 * Serves exactly three routes over HTTPS (self-signed localhost cert):
 *   - `GET  /oauth2/authorize` → 302 echoing the JAR state + redirect_uri
 *   - `POST /oauth2/token`     → `{ id_token }` via the shared `buildTestIdToken`
 *   - `GET  <any path ending /jwks>` → `{ keys: [sigPubJwk] }`
 */
export function createMockOidcIssuer(opts: MockOidcIssuerOptions): MockOidcIssuerHandle {
  const certPath = opts.certPath ?? join(HERE, 'mock-oidc-cert.pem');
  const keyPath = opts.keyPath ?? join(HERE, 'mock-oidc-key.pem');

  const tlsCert = readFileSync(certPath);
  const tlsKey = readFileSync(keyPath);

  const server = https.createServer({ cert: tlsCert, key: tlsKey }, (req, res) => {
    void handle(req, res);
  });

  async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      // Base only matters for relative-URL parsing; the host is irrelevant here.
      const u = new URL(req.url ?? '/', `https://${BIND_HOST}`);

      // 1. Authorize — decode (NOT verify) the signed JAR to echo state + redirect_uri.
      if (u.pathname === '/oauth2/authorize') {
        const jarParam = u.searchParams.get('request');
        if (!jarParam) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'missing request (JAR) param' }));
          return;
        }
        const jar = jose.decodeJwt(jarParam);
        const redirectUri = String(jar.redirect_uri ?? '');
        const state = String(jar.state ?? '');
        if (!redirectUri) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'JAR missing redirect_uri' }));
          return;
        }
        const location = `${redirectUri}?code=test-code&state=${encodeURIComponent(state)}`;
        res.writeHead(302, { Location: location });
        res.end();
        return;
      }

      // 2. Token — return a synthetic JWE id_token via the shared builder.
      if (u.pathname === '/oauth2/token' && req.method === 'POST') {
        await readBody(req); // drain the body; client_assertion accepted without validation
        const { sigPriv, encPubJwk } = await getTestKeys();
        const idToken = await buildTestIdToken(IDURA_CLAIMS, sigPriv, encPubJwk, tokenIssAud());
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ id_token: idToken, token_type: 'Bearer', expires_in: 300 }));
        return;
      }

      // 3. JWKS — serve the TEST signing public key (kid test-sig-1).
      if (req.method === 'GET' && u.pathname.endsWith('/jwks')) {
        const { sigPubJwk } = await getTestKeys();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ keys: [sigPubJwk] }));
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'not found', path: u.pathname }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'mock issuer error', detail: String(err) }));
    }
  }

  return {
    url: `https://${BIND_HOST}:${opts.port}`,
    start(): Promise<void> {
      return new Promise<void>((resolve, reject) => {
        server.once('error', reject);
        server.listen(opts.port, BIND_HOST, () => {
          server.removeListener('error', reject);
          resolve();
        });
      });
    },
    stop(): Promise<void> {
      return new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    }
  };
}
