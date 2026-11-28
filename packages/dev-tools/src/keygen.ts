/**
 * Generate a fresh RSA-2048 key pair entirely in memory and print both JWKs formatted for OpenVAA's identity provider env vars and provider dashboards.
 *
 * No PEM files are written to disk, which matches the security guidance in docs/key-generation.md ("Delete the .pem files after converting to JWK").
 *
 * Usage:
 *
 * ```sh
 * yarn workspace @openvaa/dev-tools keygen \
 *   --type <signing|encryption> \
 *   --kid <id> \
 *   [--alg <name>] \
 *   [--size <bits>]
 * ```
 *
 * `--size` defaults to 2048 bits, the Traficom 213/2023 minimum.
 *
 * Output — two JSON blocks on stdout:
 *   1. Private JWK, wrapped in a `[ ... ]` array, ready to paste into IDURA_SIGNING_JWKS or IDENTITY_PROVIDER_DECRYPTION_JWKS.
 *   2. Public JWK, ready to paste into the provider dashboard's JWKS field (wrapped in `{ "keys": [...] }` when a dashboard expects a JWKS document).
 */

import { parseArgs } from 'node:util';
import * as jose from 'jose';
import { resolveKeyMetadata, withMetadata } from './jwkMetadata';

const USAGE = `Usage: keygen --type <signing|encryption> --kid <id> [--alg <name>] [--size <bits>]

  --type         'signing' or 'encryption'
  --kid <id>     Key ID to embed in both JWKs (e.g. openvaa-signing-1)
  --alg <name>   Algorithm override. Defaults: RS256 (signing), RSA-OAEP-256 (encryption)
                 Signicat encryption keys: --alg RSA-OAEP
  --size <bits>  RSA modulus length in bits. Default 2048. Use 4096 for extra margin.
`;

const { values } = parseArgs({
  options: {
    type: { type: 'string' },
    kid: { type: 'string' },
    alg: { type: 'string' },
    size: { type: 'string' },
    help: { type: 'boolean', short: 'h' }
  }
});

if (values.help) {
  process.stdout.write(USAGE);
  process.exit(0);
}

if (!values.type || !values.kid) {
  process.stderr.write(USAGE);
  process.exit(1);
}

const { alg, use } = resolveKeyMetadata(values.type, values.alg);
const modulusLength = values.size ? Number.parseInt(values.size, 10) : 2048;

if (!Number.isFinite(modulusLength) || modulusLength < 2048) {
  process.stderr.write(`Invalid --size: ${values.size}. Must be >= 2048 per Traficom 213/2023.\n`);
  process.exit(1);
}

const { privateKey, publicKey } = await jose.generateKeyPair(alg, {
  extractable: true,
  modulusLength
});

const meta = { kid: values.kid, alg, use };
const privateJwk = withMetadata(await jose.exportJWK(privateKey), meta);
const publicJwk = withMetadata(await jose.exportJWK(publicKey), meta);

process.stdout.write('# Private JWK — wrap in [] for IDURA_SIGNING_JWKS / IDENTITY_PROVIDER_DECRYPTION_JWKS\n');
process.stdout.write(`${JSON.stringify([privateJwk])}\n\n`);
process.stdout.write('# Public JWK — register in the provider dashboard\n');
process.stdout.write(`${JSON.stringify(publicJwk, null, 2)}\n`);
