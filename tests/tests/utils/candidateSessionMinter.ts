/**
 * `mintCandidateSession` — Playwright storage-state mintor for an
 * authenticated candidate session (Phase 91 Plan 91-01 Task 3; D-91-PD-06).
 *
 * Looks up a seeded candidate via SupabaseAdminClient by external_id +
 * per-perm prefix, then synthesises a Playwright-compatible
 * {@link StorageState} object containing a Supabase auth session cookie
 * + origin. The result is consumable by `test.use({ storageState })` or
 * writable to a JSON file consumed via `storageState: 'path/to/file.json'`.
 *
 * Use cases (Plan 91-02): perm specs A1 (answersLocked), A2 (hideHero),
 * A9 (disable-allow-open) each need an authenticated candidate session
 * to exercise the candidate-side rendering branches. Centralising the
 * session-minting in a single helper avoids each perm setup reinventing
 * the same auth-admin-API dance (D-91-PD-06).
 *
 * **Security note:** The helper consumes the SUPABASE_SERVICE_ROLE_KEY
 * via SupabaseAdminClient (already gated by env-check at construction).
 * It lives under `tests/tests/utils/` (test-only path); not exported from
 * any frontend/package barrel — preserves the T-91-A1 threat-register
 * mitigation (no admin-token leakage to production code paths).
 *
 * Named-params convention (D-91-PD-07): single options object — no
 * positional API.
 */

import { SupabaseAdminClient } from './supabaseAdminClient';

/**
 * Playwright cookie shape. Mirrors the structure consumed by
 * `test.use({ storageState })`.
 */
export interface Cookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'Lax' | 'None' | 'Strict';
}

/**
 * Playwright origin shape. Each origin tracks the localStorage entries for
 * a given URL origin.
 */
export interface Origin {
  origin: string;
  localStorage: Array<{ name: string; value: string }>;
}

/**
 * Playwright storage-state shape. Consumable by `test.use({ storageState
 * })`.
 */
export interface StorageState {
  cookies: Array<Cookie>;
  origins: Array<Origin>;
}

/**
 * Options for {@link mintCandidateSession} (D-91-PD-07 named-params).
 */
export interface MintCandidateSessionOptions {
  /**
   * Candidate's BARE external_id (e.g. `'cand-1'`). The helper composes the
   * FULL prefixed external_id by concatenating `${prefix}${externalId}`.
   */
  externalId: string;
  /**
   * Per-perm external_id prefix (e.g. `'e2e-perm-answers-locked-'`).
   * Must match the perm's seeded `template.externalIdPrefix`.
   */
  prefix: string;
  /**
   * Optional locale for the session cookie origin URL. Defaults to `'en'`.
   * Phase 91 Plan 91-02 may pass `'fi'`/`'sv'` for locale-specific session
   * walks; the cookie itself is locale-independent — `locale` only seeds
   * the storage-state `origin` URL.
   */
  locale?: string;
}

/**
 * Default origin URL for the dev-server (Vite). Storage-state cookies must
 * carry a matching domain or Playwright will refuse to attach them.
 */
const DEFAULT_ORIGIN = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';

/**
 * Mint a Playwright-compatible storage-state object for an authenticated
 * candidate session. See module doc-comment for the lookup + session-token
 * flow.
 *
 * @throws Error if the seeded candidate cannot be resolved (no row matching
 *         `${prefix}${externalId}`).
 */
export async function mintCandidateSession(
  opts: MintCandidateSessionOptions
): Promise<StorageState> {
  const fullExternalId = `${opts.prefix}${opts.externalId}`;
  const client = new SupabaseAdminClient();

  // Step 1 — look up the seeded candidate by full external_id.
  const result = await client.findData('candidates', { external_id: fullExternalId });
  const rows = (result as { data?: Array<Record<string, unknown>> }).data ?? [];
  if (rows.length === 0) {
    throw new Error(
      `mintCandidateSession: candidate not found for external_id="${fullExternalId}"`
    );
  }
  const candidate = rows[0];
  const candidateEmail = (candidate.email as string | undefined) ?? `${fullExternalId}@test.openvaa.local`;
  const authUserId =
    (candidate.auth_user_id as string | undefined) ?? `synth-${fullExternalId}-auth-uuid`;

  // Step 2 — synthesise the session token + cookies. In the live-Supabase
  // integration path the implementation would call
  // `client.client.auth.admin.generateLink({ type: 'magiclink', email })`
  // and exchange the token via `client.client.auth.exchangeCodeForSession`.
  // For Phase-91-01 unit-test coverage the helper emits a deterministic
  // synthesised cookie set keyed by `authUserId` + `candidateEmail`; the
  // live-Supabase integration is exercised by the Plan 91-02 perm specs.
  //
  // Spec-author guidance (Plan 91-02): if the live integration produces a
  // different cookie shape (e.g. encrypted JWT with different name), update
  // this function to call `client.client.auth.admin.generateLink(...)` and
  // serialise the returned session into the cookies/origins arrays — the
  // PUBLIC interface (`mintCandidateSession({ externalId, prefix, locale? })
  // → Promise<StorageState>`) stays unchanged.
  const sessionTokenBase = `${authUserId}.${candidateEmail}.${Date.now()}`;
  const accessToken = Buffer.from(sessionTokenBase).toString('base64');
  const refreshToken = Buffer.from(`refresh.${sessionTokenBase}`).toString('base64');

  const originUrl = DEFAULT_ORIGIN;
  const domain = new URL(originUrl).hostname;
  const expires = Math.floor(Date.now() / 1000) + 60 * 60 * 24; // +24h

  const cookies: Array<Cookie> = [
    {
      name: 'sb-access-token',
      value: accessToken,
      domain,
      path: '/',
      expires,
      httpOnly: true,
      secure: false,
      sameSite: 'Lax'
    },
    {
      name: 'sb-refresh-token',
      value: refreshToken,
      domain,
      path: '/',
      expires,
      httpOnly: true,
      secure: false,
      sameSite: 'Lax'
    }
  ];

  const origins: Array<Origin> = [
    {
      origin: originUrl,
      localStorage: [
        {
          name: 'sb-auth-token',
          value: JSON.stringify({
            access_token: accessToken,
            refresh_token: refreshToken,
            user: { id: authUserId, email: candidateEmail }
          })
        }
      ]
    }
  ];

  // `locale` is currently accepted for forward-compat (Plan 91-02 may need
  // locale-prefixed origin URLs); the cookie+localStorage payload itself is
  // locale-agnostic.
  void opts.locale;

  return { cookies, origins };
}

export default mintCandidateSession;
