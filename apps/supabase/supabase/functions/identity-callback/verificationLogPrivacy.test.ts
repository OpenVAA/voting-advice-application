import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const INDEX_SOURCE = readFileSync(new URL('./index.ts', import.meta.url), 'utf8');

/**
 * The token-verification failure arm must not log the jose error OBJECT.
 *
 * ## The defect this is a control for
 *
 * `console.error('[identity-callback] token verification failed:', e)` passed the whole error, and Deno serialises an error's own enumerable properties. jose's `JWTClaimValidationFailed` carries `payload` — the ENTIRE DECODED ID TOKEN. On a Finnish bank-auth deployment that meant a single `aud`/`iss` misconfiguration wrote the holder's `hetu` (a national identity number), full name and date of birth into the edge runtime's container log in plaintext, durably, on a path that fires for an ordinary configuration error rather than for anything exceptional. Observed 2026-09-21 while debugging exactly such a misconfiguration (`.planning/debug/idura-bank-auth-empty-client.md`).
 *
 * ## Why the assertion is shaped this way
 *
 * The property being protected is negative — "the payload does not reach the log" — and it has no runtime signature to observe: the log line is written by a Deno function this suite cannot execute, and a test that stubbed `console.error` would prove only what the stub was handed, not what Deno would serialise from it. So this reads the source, which is how the sibling `flowConformance` specs in this directory pin their properties too.
 *
 * The arm is located by the log prefix rather than by line number, so ordinary edits above it do not move the assertion off its target.
 */

/** The verification arm: from its `catch` through the response it returns. */
function verificationFailureArm(): string {
  // Quote-agnostic: the line is a template literal today and was a single-quoted string before the fix, so the anchor deliberately starts INSIDE the string rather than at its opening delimiter.
  const anchor = INDEX_SOURCE.indexOf('[identity-callback] token verification failed');
  expect(
    anchor,
    'the verification-failure log line was not found by its prefix — if it was renamed, re-anchor this spec rather than deleting it'
  ).toBeGreaterThan(-1);
  // Back up to the enclosing `catch`, forward to the end of the returned Response.
  const start = INDEX_SOURCE.lastIndexOf('catch', anchor);
  const end = INDEX_SOURCE.indexOf('});', INDEX_SOURCE.indexOf('return new Response', anchor));

  // COMMENTS STRIPPED, and this is load-bearing rather than tidiness: the arm's own comment explains the defect by NAMING it, so it contains both the literal `console.error(..., e)` shape and the word `payload`. Asserting over the raw slice made this spec fail against the FIXED code — the prose describing the fix looked like the bug. Only executable text is examined below.
  const arm = INDEX_SOURCE.slice(start, end);
  return arm
    .split('\n')
    .filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line))
    .join('\n');
}

describe('identity-callback verification-failure logging', () => {
  it('does not pass the caught error object to console.error', () => {
    const arm = verificationFailureArm();
    // `console.error(msg, e)` — a second argument that is the caught binding is the defect itself.
    expect(arm).not.toMatch(/console\.error\([^)]*,\s*e\s*\)/);
    expect(arm).not.toMatch(/console\.error\([^)]*,\s*(error|err)\s*\)/);
  });

  it('never names `payload` in the arm, in any form', () => {
    const arm = verificationFailureArm();
    // Covers `e.payload`, `payload`, `...e` spreads and `JSON.stringify(e)` — any of which would put claim VALUES back into the log. The docblock's escape hatch is `Object.keys(payload)`, which lives outside this arm precisely so it cannot be smuggled in behind this assertion.
    expect(arm).not.toMatch(/payload/);
    expect(arm).not.toMatch(/\.\.\.\s*e\b/);
    expect(arm).not.toMatch(/JSON\.stringify\(\s*e\s*\)/);
  });

  it('still logs the three diagnostic fields, so the fix did not trade privacy for blindness', () => {
    const arm = verificationFailureArm();
    // These are what jose's own message interpolates, and none is derived from the token's subject. Losing them would make the arm private and useless, which is not the property wanted.
    for (const field of ['code', 'claim', 'reason']) {
      expect(arm, `the arm no longer logs '${field}'`).toMatch(new RegExp(`${field}=`));
    }
  });

  it('still returns the opaque 401 body, unchanged by this fix', () => {
    const arm = verificationFailureArm();
    // The response contract is the oracle defence and is deliberately untouched: the caller learns only that verification failed, never which check failed.
    expect(arm).toMatch(/'Token verification failed'/);
    expect(arm).toMatch(/status:\s*401/);
  });
});
