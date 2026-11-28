import type * as jose from 'jose';

/**
 * The algorithm and key use of a JWK, as derived from the `--type` and `--alg` options of the key CLIs.
 */
export interface KeyMetadata {
  alg: string;
  use: 'sig' | 'enc';
}

/**
 * Resolve the algorithm and key use for a `--type` value. Writes an error to stderr and exits with status 1 when the type is neither `signing` nor `encryption`.
 * @param type - The `--type` option: `signing` or `encryption`.
 * @param algOverride - The `--alg` option, which replaces the default algorithm: RS256 for signing, RSA-OAEP-256 for encryption.
 * @returns The algorithm and the `sig` or `enc` key use.
 */
export function resolveKeyMetadata(type: string | undefined, algOverride?: string): KeyMetadata {
  if (type !== 'signing' && type !== 'encryption') {
    process.stderr.write(`Invalid --type: ${type}. Use 'signing' or 'encryption'.\n`);
    process.exit(1);
  }
  return {
    alg: algOverride ?? (type === 'signing' ? 'RS256' : 'RSA-OAEP-256'),
    use: type === 'signing' ? 'sig' : 'enc'
  };
}

/**
 * Stamp the key id, use and algorithm onto an exported JWK.
 * @param jwk - The JWK to decorate, which is modified in place.
 * @param meta - The `kid`, `alg` and `use` to set.
 * @returns The same JWK.
 */
export function withMetadata(jwk: jose.JWK, meta: { kid: string; alg: string; use: string }): jose.JWK {
  jwk.kid = meta.kid;
  jwk.use = meta.use;
  jwk.alg = meta.alg;
  return jwk;
}
