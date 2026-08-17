/**
 * Fixture INPUT for hygiene-codemod.mjs --self-test.
 *
 * NOT compiled, NOT imported, NOT linted. It exists so the comment-span classifier has a
 * committed proof rather than a claim. Its sibling `.expected.ts` is the byte-exact output
 * the codemod must produce; `--self-test` diffs the two and exits non-zero on any drift.
 *
 * THE LOAD-BEARING CASE is the `warn()` pair below: the same planning reference appears once
 * inside a comment and once inside a runtime string literal. Exactly one may be rewritten.
 *
 * Every comment line here is copied from, or shaped exactly like, a real occurrence in the
 * in-scope tree — this is not a synthetic worst case.
 *
 * Push-based mirror, mirroring the candidateContext fix
 * documented at .planning/phases/61-voter-app-question-flow/61-03-DIAGNOSIS.md.
 * Introduced by Phase 88 Plan 88-02 (D-137-11, D-04) and revised in Spike-024.
 * Milestone tag v2.11 and tool version Node 22.22.1 are both left alone.
 * TODO: this marker is reported, never rewritten.
 * CLAUDE.md §Context Destructuring Rule keeps its titled anchor.
 */

// A trailing comment on a code line is still a comment span: Phase 62 D-08.
export const NOTE = 'kept';

export function warn(): void {
  // The comment says Phase 62 D-06; the string below says the same and must not change.
  console.warn('filter presets are not implemented in Phase 62 — see D-06 for the rationale');
}

export const ESLINT_MESSAGE =
  'svelte/store is banned (v2.11 K1). See .planning/v2.11-DECISIONS.md K1 — Phase 115 SWEEP-03.';

/* A single-line block comment: Phase 129 Plan 129-09, D-13. */
export const TEMPLATE = `
  a multi-line template literal whose body mentions Phase 140 and D-24
  // and contains a slash-slash sequence that is NOT a comment
`;

// PHASE 1: an algorithm stage marker, not a planning citation.
export const STAGE = 1;

// see phase 117 — already collapsed, so a second pass is a no-op.
export const COLLAPSED = true;

// Phase 67 GEN-04
export const COLLAPSES_NOT_DELETED = true;

// D-137-11, D-04
export const DEGENERATE_ABOVE_IS_DELETED = true;
