/**
 * The server's credential: the header by which the frontend server identifies itself to the identity-callback function.
 *
 * Pure functions and constants with no Deno imports, no URL imports and no reference to the Deno global, so the module can be imported by both the Edge Function and vitest. The configured secret is a parameter: the caller reads the environment.
 *
 * WHY THE FUNCTION ANSWERS THE FRONTEND SERVER ALONE. The function turns a verified ID token into a session. It is reachable directly at its public address, and the anonymous key is public, so anyone holding an ID token could present it there without passing through the frontend's own checks. The frontend server holds a secret no browser sees and sends it in {@link SERVER_CREDENTIAL_HEADER}; a request without it gets nothing.
 *
 * WHY THE COMPARISON TAKES CONSTANT TIME. A comparison that stops at the first differing byte answers sooner the earlier the difference, which lets a caller recover the secret one byte at a time by timing. The comparison here reads every byte of the presented value whatever it finds, and its running time depends on the presented value's length alone.
 *
 * WHY AN UNSET SECRET THROWS. An unset secret compared as empty would accept an empty header, and a check skipped when nothing is configured is an open door. The configured value goes through `requireEnv`, so an unset or empty secret is a configuration failure. A missing header is refused before the secret is consulted, so a request without one learns nothing about the configuration.
 */

import { requireEnv } from './envConfig.ts';

/** The request header that carries the server's credential. */
export const SERVER_CREDENTIAL_HEADER = 'x-identity-callback-secret';

/** The environment variable that holds the configured secret. */
const SERVER_SECRET_VARIABLE = 'IDENTITY_CALLBACK_SERVER_SECRET';

/**
 * Whether two byte strings are equal, in a time that depends on the length of the first alone.
 *
 * @param presented - The bytes presented by the caller.
 * @param expected - The configured bytes; never empty.
 * @returns True only when both have the same length and every byte is equal.
 */
function bytesEqual(presented: Uint8Array, expected: Uint8Array): boolean {
  let difference = presented.length ^ expected.length;
  for (let index = 0; index < presented.length; index++) {
    difference |= presented[index] ^ expected[index % expected.length];
  }
  return difference === 0;
}

/**
 * Whether the presented header carries the configured secret.
 *
 * @param presented - The value of {@link SERVER_CREDENTIAL_HEADER}, or null or undefined when the request carries none.
 * @param expected - The configured secret, as the caller read it from the environment variable `IDENTITY_CALLBACK_SERVER_SECRET`.
 * @returns True only for a non-empty header equal, byte for byte, to the configured secret; false for a missing, empty or different header.
 * @throws {Error & { code: string; variable: string }} `ERR_ENV_UNCONFIGURED` naming the variable when a header is presented and the secret is unset or empty.
 */
export function presentsServerCredential(presented: string | null | undefined, expected: string | undefined): boolean {
  if (typeof presented !== 'string' || presented === '') return false;

  const secret = requireEnv(SERVER_SECRET_VARIABLE, expected);
  const encoder = new TextEncoder();
  return bytesEqual(encoder.encode(presented), encoder.encode(secret));
}
