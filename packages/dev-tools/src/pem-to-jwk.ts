/**
 * Convert a PEM-encoded RSA key (private or public) into a JWK with the
 * metadata OpenVAA's identity provider env vars expect.
 *
 * Supports both signing keys (Idura JAR + private_key_jwt) and encryption keys
 * (JWE id_token decryption for Idura and Signicat).
 *
 * Usage:
 *   yarn workspace @openvaa/dev-tools pem-to-jwk \
 *     --in <path>             PEM file to convert
 *     --type <signing|encryption>
 *     --kid <id>              Key ID to embed in the JWK (e.g. openvaa-signing-1)
 *     [--alg <name>]          Algorithm override. Defaults:
 *                               signing    -> RS256
 *                               encryption -> RSA-OAEP-256 (Idura)
 *                             Signicat encryption keys need --alg RSA-OAEP.
 *
 * Private/public detection is based on the PEM header.
 *
 * Example — Idura signing private key for IDURA_SIGNING_JWKS:
 *   yarn workspace @openvaa/dev-tools pem-to-jwk \
 *     --in signing-private.pem --type signing --kid openvaa-signing-1
 */

import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import * as jose from 'jose';

const USAGE = `Usage: pem-to-jwk --in <path> --type <signing|encryption> --kid <id> [--alg <name>]

  --in <path>    Path to a PEM file (private or public; auto-detected)
  --type         'signing' or 'encryption'
  --kid <id>     Key ID to embed in the JWK
  --alg <name>   Algorithm override. Defaults: RS256 (signing), RSA-OAEP-256 (encryption)
                 Signicat encryption keys: --alg RSA-OAEP
`;

const { values } = parseArgs({
  options: {
    in: { type: 'string' },
    type: { type: 'string' },
    kid: { type: 'string' },
    alg: { type: 'string' },
    help: { type: 'boolean', short: 'h' }
  }
});

if (values.help) {
  process.stdout.write(USAGE);
  process.exit(0);
}

if (!values.in || !values.type || !values.kid) {
  process.stderr.write(USAGE);
  process.exit(1);
}

if (values.type !== 'signing' && values.type !== 'encryption') {
  process.stderr.write(`Invalid --type: ${values.type}. Use 'signing' or 'encryption'.\n`);
  process.exit(1);
}

const pem = readFileSync(values.in, 'utf8');
const isPrivate = /-----BEGIN (?:RSA |ENCRYPTED )?PRIVATE KEY-----/.test(pem);
const isPublic = /-----BEGIN (?:RSA )?PUBLIC KEY-----/.test(pem);

if (!isPrivate && !isPublic) {
  process.stderr.write(`Could not detect a PEM header in ${values.in}. Expected BEGIN PRIVATE KEY or BEGIN PUBLIC KEY.\n`);
  process.exit(1);
}

const alg = values.alg ?? (values.type === 'signing' ? 'RS256' : 'RSA-OAEP-256');
const use = values.type === 'signing' ? 'sig' : 'enc';

const key = isPrivate
  ? await jose.importPKCS8(pem, alg, { extractable: true })
  : await jose.importSPKI(pem, alg, { extractable: true });
const jwk = await jose.exportJWK(key);
jwk.kid = values.kid;
jwk.use = use;
jwk.alg = alg;

process.stdout.write(`${JSON.stringify(jwk, null, 2)}\n`);
