/**
 * Base64url JWT-segment decode tests for send-email (REVIEW-EDGE-01, second site).
 *
 * This file is deliberately NOT shared with `invite-candidate/jwtSegment.test.ts`. The two `jwtSegment.ts` modules are separate deployment artefacts -- Supabase treats each top-level function directory as its own deployment unit -- and a copy without its own test is a copy that can rot: a future edit to this directory's module would still be green if the only test lived next to the other copy.
 *
 * The defect under test is two characters wide: base64url substitutes `-` for `+` and `_` for `/`, so a plain base64 decoder agrees with a base64url one on almost every input and disagrees on the rest. That is why the first assertion in the round-trip test is a guard on the FIXTURE rather than on the code: a payload picked without care produces a segment containing neither character, `atob` decodes it happily, and the negative control silently becomes a tautology that is green before and after the fix. Measured for THIS file's fixtures rather than inherited: the same admin payload WITHOUT the tilde marker produces a segment with no `-` and no `_`, on which `atob` succeeds, so the marker is what makes the control load-bearing.
 *
 * The negative control -- the assertion that the PREVIOUS expression, `JSON.parse(atob(segment))`, throws on the same fixture -- is permanent. It lives here rather than in a summary so that reverting the fix reddens the suite instead of merely contradicting a document.
 *
 * No mocks and no network. `Buffer.from(..., 'base64url')` builds the fixtures because this file runs under Node; the module it tests deliberately cannot use `Buffer`, because Deno has none.
 */

import { describe, it, expect } from 'vitest';
import { decodeJwtSegment } from './jwtSegment';

/**
 * A payload shaped like the one `send-email` actually reads, plus a run of tildes.
 *
 * `project_admin` rather than `super_admin` on purpose: send-email's `isAdmin` predicate accepts three roles where invite-candidate's accepts two, and `project_admin` is the one only this function honours, so the fixture exercises this directory's own authorisation shape rather than the sibling's.
 *
 * The tildes are what force the base64url alphabet: `~~~` encodes to the 6-bit group that base64url spells `-`. The premise guard below asserts that this worked rather than assuming it.
 */
const ADMIN_PAYLOAD = {
  user_roles: [{ role: 'project_admin', scope_type: 'project', scope_id: 'proj-1' }],
  marker: '~~~'
};

const ADMIN_SEGMENT = Buffer.from(JSON.stringify(ADMIN_PAYLOAD)).toString('base64url');

/** The SAME payload without the marker, kept as the control on the control: it proves the marker is what carries the base64url-only character, so the premise guard below is a real constraint rather than an accident of this particular payload. */
const UNMARKED_SEGMENT = Buffer.from(JSON.stringify({ user_roles: ADMIN_PAYLOAD.user_roles })).toString('base64url');

/** A payload whose base64url form is already a multiple of four characters long, so the padding step has nothing to add. */
const ALIGNED_PAYLOAD = { sub: 'user-1', name: 'Test' };

const ALIGNED_SEGMENT = Buffer.from(JSON.stringify(ALIGNED_PAYLOAD)).toString('base64url');

/** A name whose UTF-8 encoding is multi-byte, so a latin1 decode mangles it visibly instead of failing. */
const NON_ASCII_PAYLOAD = { name: 'Ääkkönen' };

const NON_ASCII_SEGMENT = Buffer.from(JSON.stringify(NON_ASCII_PAYLOAD)).toString('base64url');

/** The expression `send-email/index.ts` used before this module existed, kept verbatim so the negative control tests the real thing. */
function previousExpression(segment: string): unknown {
  return JSON.parse(atob(segment));
}

/** Pad a segment to a multiple of four, so the latin1 comparison below isolates the ENCODING difference instead of tripping on the one length class `atob` rejects outright. */
function padToFour(segment: string): string {
  return segment + '='.repeat((4 - (segment.length % 4)) % 4);
}

describe('decodeJwtSegment in send-email (REVIEW-EDGE-01)', () => {
  it('decodes a segment that the previous base64 expression rejects', () => {
    // PREMISE FIRST. Without this the rest of the test proves nothing: if the fixture happens to encode without `-` or `_`, `atob` succeeds, the negative control below never fires, and the suite stays green whether or not the fix is present.
    expect(/[-_]/.test(ADMIN_SEGMENT), 'fixture must actually exercise the base64url alphabet').toBe(true);

    // The negative control. This is the demonstration itself, not a description of one.
    expect(() => previousExpression(ADMIN_SEGMENT)).toThrow();

    // The same segment, through the fix.
    expect(JSON.parse(decodeJwtSegment(ADMIN_SEGMENT))).toEqual(ADMIN_PAYLOAD);
  });

  it('would have been a tautology without the marker, which is why the premise is asserted', () => {
    // The control on the control: the same roles array, with the marker removed, encodes to a segment the OLD expression parses happily. So the negative control above is not a property of admin payloads in general -- it is a property of this fixture, deliberately constructed, and the guard above is what keeps it that way.
    expect(/[-_]/.test(UNMARKED_SEGMENT)).toBe(false);
    expect(() => previousExpression(UNMARKED_SEGMENT)).not.toThrow();
  });

  it('preserves the three-role authorisation claim the decode feeds', () => {
    // The point of the fix, stated as behaviour rather than as encoding: a decode failure on this path is an authorisation failure, because `user_roles` is what send-email's `isAdmin` reads before permitting a bulk send.
    const payload = JSON.parse(decodeJwtSegment(ADMIN_SEGMENT)) as {
      user_roles: Array<{ role: string }>;
    };
    const isAdmin = payload.user_roles.some(
      (r) => r.role === 'super_admin' || r.role === 'account_admin' || r.role === 'project_admin'
    );

    expect(isAdmin, 'the decoded claim must still authorise, or the fix has moved the defect').toBe(true);
  });

  it('round-trips a non-ASCII claim value as UTF-8 rather than as latin1', () => {
    // `atob` returns a binary string, one code unit per byte, so the pre-fix path renders any multi-byte claim as mojibake instead of throwing -- a silent corruption rather than a loud one. Both renderings are computed here so the assertion compares two live values rather than a hard-coded misspelling.
    const latin1Rendering = (JSON.parse(atob(padToFour(NON_ASCII_SEGMENT))) as { name: string }).name;
    const decoded = (JSON.parse(decodeJwtSegment(NON_ASCII_SEGMENT)) as { name: string }).name;

    expect(decoded).toBe('Ääkkönen');
    expect(decoded).not.toBe(latin1Rendering);
  });

  it('leaves an already-aligned segment alone, so the padding step is a no-op where nothing is missing', () => {
    // Guards the padding arithmetic against the `(4 - 0 % 4) % 4` case, where a naive `4 - len % 4` would append four `=` and break a segment that was correct.
    expect(ALIGNED_SEGMENT.length % 4, 'fixture must already be a multiple of four characters').toBe(0);
    expect(JSON.parse(decodeJwtSegment(ALIGNED_SEGMENT))).toEqual(ALIGNED_PAYLOAD);
  });

  it('still throws on a segment that is valid in neither alphabet', () => {
    // A stray `.` is what a malformed token produces. The caller treats any throw as an authorisation failure, so the only property asserted here is that the input is rejected rather than silently truncated.
    expect(() => decodeJwtSegment('ab.c')).toThrow();
  });
});
