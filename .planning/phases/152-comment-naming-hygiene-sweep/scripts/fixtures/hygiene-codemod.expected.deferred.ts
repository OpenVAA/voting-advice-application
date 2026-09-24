/**
 * Fixture INPUT for the INVERTED rule 6 (PHASE-152 CHANGE (1)).
 *
 * NOT compiled, NOT imported, NOT linted. It exists because a codemod whose fixtures do not
 * cover the rule that changed is untested at exactly the point it changed. Its two siblings
 * are `.expected.deferred.ts` (the byte-exact output — which for this rule means the
 * phase and spike references are UNCHANGED) and `.expected.deferred.residue` (the roster of
 * what was handed to the judgement pass, and under which reason). Both are asserted.
 *
 * THE THREE LOAD-BEARING CASES, one per line below:
 *   - a bare `Phase 88` reference, which the source codemod would have COLLAPSED;
 *   - an already-collapsed `see phase 88`, which the source codemod treated as a fixed point
 *     and which this phase's criterion forbids as a survivor;
 *   - an attributive `Mirrors the Phase 64 fix`, which no regex can repair into a sentence.
 * None of the three may be rewritten. All three must appear in the residue roster.
 */

// Phase 88 introduced the overlay registry.
export const BARE = 1;

// see phase 88 — the collapsed survivor form. It is residue here, not a fixed point.
export const COLLAPSED = 2;

// Mirrors the Phase 64 fix, so the same guard applies.
export const ATTRIBUTIVE = 3;

// Spike-024 documents the alias hole; see spike 016 covers the a11y half.
export const SPIKES = 4;

// PHASE 1: an algorithm stage marker, not a planning citation.
export const STAGE = 5;

// A delete rule still fires on the same line as a deferred reference: Phase 88.
export const DELETE_STILL_FIRES = 6;

export const NOT_A_COMMENT = 'Phase 88 inside a string literal must survive untouched';
