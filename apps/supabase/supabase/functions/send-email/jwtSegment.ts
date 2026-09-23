/**
 * Base64url decoding for JWT segments.
 *
 * Pure functions extracted from the invite-candidate Edge Function for testability. This module has NO Deno imports (no Deno.env, no Deno.serve, no URL imports from deno.land) so it can be imported by both the Edge Function and vitest.
 *
 * DUPLICATED ON PURPOSE. Byte-identical copies of this file live in `apps/supabase/supabase/functions/invite-candidate/` and `apps/supabase/supabase/functions/send-email/` -- this file is one of the two -- because Supabase treats each top-level function directory as its own deployment unit and this repository has no shared-module directory for Edge Functions. The set is named in full, including the directory you are reading this in, rather than as "the other directory": the copies are byte-identical, so a sentence naming a relative sibling would be correct from one vantage point and wrong from the other, and correcting it per file would break the identity the guard enforces. The copies are held identical by `scripts/assert-edge-env-defaults.mjs`; introducing a shared directory instead is a separate decision with its own deployment validation, so a reader who finds two identical files is looking at a choice rather than at an oversight.
 *
 * TWO MEASURED CORRECTIONS, recorded because both contradict the wording this fix was requested with and a future reader would otherwise re-derive them wrongly. First, it is the ALPHABET that breaks, not the padding: `atob` implements WHATWG forgiving-base64, which accepts unpadded input at every length class a real JWT segment can produce -- base64url of n bytes is never one more than a multiple of four -- and rejects only that impossible class, so a fixture built on stripped padding demonstrates nothing. What it does reject is `-` and `_`, the two characters base64url substitutes for `+` and `/`. Second, the defect is latent rather than a live outage: zero of 2205 realistic Supabase access-token payloads produced a segment containing either character, so the honest framing is a correctness defect on an authorisation path with a real trigger, not an ongoing failure.
 *
 * The `TextDecoder` step is a second fix in the same expression: `atob` returns a binary string of one code unit per byte, which renders any multi-byte claim value as latin1 mojibake after `JSON.parse` -- a silent corruption rather than a throw.
 */

/**
 * Decode one base64url JWT segment to a UTF-8 string.
 *
 * RFC 7515 section 2 has required base64url for JOSE segments since 2015. The translate step is genuinely needed rather than merely tidy: Deno has no `Buffer`, so `Buffer.from(segment, 'base64url')` is unavailable inside an Edge Function.
 *
 * @param segment - One dot-separated JWT segment, unpadded as JOSE requires
 * @returns The segment's bytes decoded as UTF-8
 * @throws {Error} When the segment is valid base64url in neither alphabet
 */
export function decodeJwtSegment(segment: string): string {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  // The outer `% 4` is what keeps an already-aligned segment untouched; a bare `4 - length % 4` would append four `=` to it.
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
