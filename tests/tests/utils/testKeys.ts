/**
 * Fixed committed TEST-ONLY key pair for bank-auth (Idura/Signicat OIDC) E2E tests.
 *
 * SECURITY — TEST-ONLY KEYS (threat T-122-01, Spoofing):
 *   These RSA JWKs are committed plaintext in the repository purely so the SAME keys are shared by three test-side processes:
 *     1. the Playwright worker (builds synthetic id_tokens via `buildTestIdToken`),
 *     2. the served Edge Function (`IDENTITY_PROVIDER_DECRYPTION_JWKS` = `encPrivJwk`),
 *     3. the mock OIDC issuer (serves `sigPubJwk` at its JWKS endpoint).
 *   This eliminates per-run key propagation — the #1 source of bank-auth flake (RESEARCH A2 / Open-Q3, the determinism-preferred path over per-run `jose.generateKeyPair`). They MUST NEVER be used by any non-test environment; production decryption/signing keys come from real env/secrets and are never this committed pair. Reusing these in prod would enable id_token spoofing.
 *
 * Key contract (mirrors the prior in-spec `generateTestKeys`):
 *   - encryption: RSA-OAEP-256, kid `test-enc-1`, use `enc`
 *   - signing:    RS256,        kid `test-sig-1`, use `sig`
 *
 * Generated once locally via `jose.generateKeyPair(...)` and inlined as committed consts. Do NOT regenerate per run.
 */
import * as jose from 'jose';
import type { JWK } from 'jose';

/** Public encryption JWK (RSA-OAEP-256). Used by `buildTestIdToken` to encrypt the JWE. */
export const encPubJwk: JWK = {
  kty: 'RSA',
  n: 'qkDUW1SJRfEljguLUZQOSVvZTiIgBHBtftiMEEdsCs8a7yUXXbJLkSBidVo_gmLxOkQPxWYM9rFb5BC_whULGL1WMHR2GDXSkqedxjXD9icSZaVp5XnlwOnpHP2JML8P3pHK9Bsu7J6M8SeQauLOY9gkHXXn_vQ4iDEZ-fODuPI-Y_XMOcTPWpEs2bjP1Yb14p1aBw3O20mKmLyiqZvexFixkaaQK3Tv1r9XbJifsHqu00Fib_jiLNnngP3o2yIgSN7rzblOnXeEqaWn-dQ9N9EgLmHfr4FKZ6hYHm3zEI2U7ZneT76sKI3UkpRjuSGv6MK4ucsLVUiOHYVAoN1jJw',
  e: 'AQAB',
  kid: 'test-enc-1',
  use: 'enc',
  alg: 'RSA-OAEP-256'
};

/**
 * Private encryption JWK (RSA-OAEP-256). Used by the served Edge Function to decrypt the JWE. The Edge Function reads `IDENTITY_PROVIDER_DECRYPTION_JWKS` as a JSON `[{...}]` array — see `decryptionJwks` below.
 */
export const encPrivJwk: JWK = {
  kty: 'RSA',
  n: 'qkDUW1SJRfEljguLUZQOSVvZTiIgBHBtftiMEEdsCs8a7yUXXbJLkSBidVo_gmLxOkQPxWYM9rFb5BC_whULGL1WMHR2GDXSkqedxjXD9icSZaVp5XnlwOnpHP2JML8P3pHK9Bsu7J6M8SeQauLOY9gkHXXn_vQ4iDEZ-fODuPI-Y_XMOcTPWpEs2bjP1Yb14p1aBw3O20mKmLyiqZvexFixkaaQK3Tv1r9XbJifsHqu00Fib_jiLNnngP3o2yIgSN7rzblOnXeEqaWn-dQ9N9EgLmHfr4FKZ6hYHm3zEI2U7ZneT76sKI3UkpRjuSGv6MK4ucsLVUiOHYVAoN1jJw',
  e: 'AQAB',
  d: 'FtZhZereCxLA3d_wjT3V-MMoUBHFx7KpDWXQy_I4rO6BB2krTDc5abs1WdaERGIvR4iPsQPyYzkBQYN5pXgbJ_Nl11QX70FxAJkZUdgudBtjnVzl6pFCX3FBAtGDkJVgdJOL7Nikn7rY3xRWi-_mjYAVwBnrx8hMuQAVIvEmTy1_J-Amd180QSYaOuA3MaockwKqrSXgk7EZP0TEj6x6AJeH61BllSiLL9oVTGlFgCT9jGtAP_fJGNXCYRr_dZ_CYSzMEfzo5mTrMmqW6BXvExLU0_kDSKEamGRgVTZFCbr1kEH_b8iyyhsWIYWzEWcQI1TLbwniWR1iY_K_mQv-0Q',
  p: '5kIF1BPqUUs2LMooxkZe7V10n1SmMuIODffOxTSh7qWoTm8sXw_xh99lWaRBhqpZ6iNgBxqgYz0hrUWowUt9UmAOMRPeED6eQ8R8wPvTnpgSBEaQqkRPIYkJlBnMtaasN_9P56H2bB4J9sZLk1BMjs9FScH-XK1Id4DEQvSzYQ8',
  q: 'vUl5cCsL6847MH0325w5APH54hpDGZVqhL4bj3V4Y7KqMuLeV0S-mTKiJeWAp9HXkV1Mw3Zs_rMukVXwHk_OCgQ2eE7WpVUZNuWhxdzAUQRj71tJD90L6upbTRJx0vo7Turdjl_3wih0bPAFPKXshs6Bk1DBBdCD2EFXCK-kLGk',
  dp: 'KQIpN5Q0bzYN9_wpNubhkTTLyHSzBOztw98WnFi7Xl1ylEWIiYW1ZpWK32Q5p1o_mUujlqBPYF1K2ilF3Ocs8rbY0DTRn-MHHNqpvVUcY2qCCvDmYuy3iyl040OVCeUdVvvJp19ZG_hdne3DGAF9IRIZLQG345mZBm-QhLxAFlE',
  dq: 'Cp69toJjx9YpUf4kjSjFtfzdlUb97siIUmxMJY9ksstKa1J5QRI1U2kY2eF3h3LpkllWvjy9vsiU20ikET9PAxbba4KY3mvY31Cg8_X_wEvrw3kurzoqugJuHvPi-QBbJYFd7ugJgZY9egM5d_6jN6kMchR8z_O0AgUgefdI0ck',
  qi: 'Q6mJni6Zrz6xpMaZcohYakNZ9mJ4bPlM5D2O2uP1GHRAGeCg0IVGQjgHhCggwKenxHZy0BA-A61_baURC5xhUCct0xAhm0P1Gv9rI1BOrprW2kFGNIGFOPCdUR46snHkprlhinLarRQIDKrTLZNjmbDk9XuGUJvI9LKiooqFyMk',
  kid: 'test-enc-1',
  use: 'enc',
  alg: 'RSA-OAEP-256'
};

/** Public signing JWK (RS256). Served by the mock OIDC issuer's JWKS endpoint. */
export const sigPubJwk: JWK = {
  kty: 'RSA',
  n: 'wHiG2m7QlDlB4bx5E6owfERRNqFG1baDBG2AlLJeMK2hJMSYc_nY9B5xf22bfsxE77AFjhgpHVozVpWhg61e5XSKKJ2zjT10xHzZn-uKDB7m8hw5h5sNCN-Ug_dnpMKRP5qd9GkpgGnC6-k7nLwwbQiK7KvY-L_FnQ6uCM2rI1MlubL9sQ9jdLIScJft639E2_VyAczQLC7LOVZHIGFV0X4xw_Q0e-yDQH6mucDB6mZk5VenKtJNrNhY7NAfM73vY9ZJYy1CeM4L_Gg4FugqUhTvpGlwe-0C1dptXAYc15G0UxtECY5q4iUmlH_2ofdKzMfmD00BOF3bxXBh36ptsw',
  e: 'AQAB',
  kid: 'test-sig-1',
  use: 'sig',
  alg: 'RS256'
};

/** Private signing JWK (RS256). Source of the `sigPriv` CryptoKey used to sign the inner JWT. */
export const sigPrivJwk: JWK = {
  kty: 'RSA',
  n: 'wHiG2m7QlDlB4bx5E6owfERRNqFG1baDBG2AlLJeMK2hJMSYc_nY9B5xf22bfsxE77AFjhgpHVozVpWhg61e5XSKKJ2zjT10xHzZn-uKDB7m8hw5h5sNCN-Ug_dnpMKRP5qd9GkpgGnC6-k7nLwwbQiK7KvY-L_FnQ6uCM2rI1MlubL9sQ9jdLIScJft639E2_VyAczQLC7LOVZHIGFV0X4xw_Q0e-yDQH6mucDB6mZk5VenKtJNrNhY7NAfM73vY9ZJYy1CeM4L_Gg4FugqUhTvpGlwe-0C1dptXAYc15G0UxtECY5q4iUmlH_2ofdKzMfmD00BOF3bxXBh36ptsw',
  e: 'AQAB',
  d: 'DOcnlzYtmno6LfFuJoDWzkXgMere7k3Ve7MBlzZb9SR2tJnPZJr_zeHKlxHYhkgYaP8iaDO7ceHNpkTStpqlTXmiF3X3BwVzMgbyqfNm5kgeEGYO_0XIOmuOr8gitRtsFFj_tNZl91tfu2P_4JKHJpAXjCU7HvXwQAavaRysl-oJv19lv7jwDjc-R2QcF-HyuD3lF4QmuX2W5y_k3ZzWzzI61ygiKs8ckfWrXUo8mZ0fy787fZxX_o_yIAgm4C43duhOnQJS6ajvcES3jeggVj0BHhx3uHdMbJ7QBJLKMyiha_GdJ8LI3Sd8h9zvM6YIryzrWYxMxDtZ-LwiEjFBDQ',
  p: '7JDqHX66mRhTqTXJl0N4AZwlhyniDpqqUV7cMJyLq7RT58Soi7nW1bvg3MoV1g9WRKexsvxEWUx5R_GvEpGOYsgKrRP8IDciz5IZ77XWWN5rjbyjkObQ5H4rkor_gvDIIBna-1s_4aX2UlFuIoDVzYSvtTIWEw3R8EsPQUriCp0',
  q: '0EhFH_4zH-OezCGy9Bi-xX7_PZbJ2ZEIdX8Q_6xvd5f2ZjwSCuJ3I01sNozH-Wll_SvJmZWcZh7wo0OKOnEeaPh0YeCaZjoaWN4ESvcC8hb3eEYEK-rSH-uj-s_uDfHtLQ5VsQvFoN3Evd3jtLBl2OzA53LPBTWU2iNokVb4gI8',
  dp: 'aXs8SKaHQVhNhXeMSbw1uFINkbUlLOnd46Zue-ZxiMBBYWiY1qSonGjHnOsmzWnNR5OWcn51Y3Pr6B5lt9vbJ0SXLhFpLFwpU3CLzAzCZKHYRzzDmgqxPhDcEN2VjKccNOQSdl17oHvF13KjrxLPQnJVfm-01A4nfAOb67seCyk',
  dq: 'BxSt5OyLaGYgm-f5YXsF4Ujz_HAH5LGdjAEJ3udJ0tMDuW4JXv1b94NGToRyt_PxV64JaINBkeczXxmItXvrAL6RllJAbYFELAlANBw5qWlGeHxI4AVXp2YnaPtwqGC1I3b9SsuPqGxhp-LHPvlQPROvay7oAtFTgib6Axbl09k',
  qi: 'unl5mVa7vgWxMRb17-AubkwHHzDoIJtASB0k3REl60Sc-aRZyw_JJcgRAxtyj5xClVeA5hWra3aTCHzoLsKzRnftYG33pIeqVbrxP3yDijzzS902vaU4USFTcsq2Q3mkoYaMcaCLZ3zDvPACPq8M_cn6AqfkW9ZybNeiqrUhJcY',
  kid: 'test-sig-1',
  use: 'sig',
  alg: 'RS256'
};

/**
 * The value the served Edge Function reads from `IDENTITY_PROVIDER_DECRYPTION_JWKS` (a JSON `[{...}]` array of private decryption JWKs). The bank-auth setup stringifies this into the Edge Function env so the keys-configured create path runs deterministically.
 */
export const decryptionJwks: ReadonlyArray<JWK> = [encPrivJwk];

/** Shape returned by {@link getTestKeys}. */
export interface TestKeys {
  /** Public encryption JWK — passed to `buildTestIdToken`. */
  encPubJwk: JWK;
  /** Private encryption JWK — served Edge Function decryption key. */
  encPrivJwk: JWK;
  /** Public signing JWK — mock issuer JWKS endpoint. */
  sigPubJwk: JWK;
  /** Private signing JWK (raw). */
  sigPrivJwk: JWK;
  /** Imported RS256 signing key (jose v6 WebCrypto CryptoKey) — passed to `buildTestIdToken`. */
  sigPriv: CryptoKey;
}

/**
 * Accessor returning the fixed test keys in the shape `buildTestIdToken` and downstream consumers need. `sigPriv` is imported via `jose.importJWK(..., 'RS256')`, which in jose v6 returns a WebCrypto `CryptoKey` (not the removed `KeyLike` alias).
 */
export async function getTestKeys(): Promise<TestKeys> {
  const sigPriv = (await jose.importJWK(sigPrivJwk, 'RS256')) as CryptoKey;
  return { encPubJwk, encPrivJwk, sigPubJwk, sigPrivJwk, sigPriv };
}
