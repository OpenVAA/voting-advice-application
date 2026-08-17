// A2 SEAM (research open-question A2 — RESOLVED): spy-on-collaborator under
// `$effect.root`, driving the REAL `CandidateContextProvider` (NO pure-helper
// extract in play). The upstream `../app` + `../auth` context modules are
// `vi.mock`-ed to return minimal fakes; the fake `getAppContext().dataRoot`
// exposes `questionCategories[]` whose `getApplicableQuestions` is a `vi.fn()`
// spy. Constructing the provider inside `$effect.root` + `flushSync()` settles
// the real `questionBlocks` $effect (candidateContext.svelte.ts:355-394), so the
// blocks-path `getApplicableQuestions` invocation at source :378 is exercised by
// production code — not by a copied helper. Plan 02 turns this RED test green via
// the one-line fix at :378 (add `entityType` to the blocks-path arg object).
//
// CLAUDE.md Context Destructuring Rule: this harness never destructures a reactive
// context accessor — the provider is constructed and its members are read only
// through the live class instance / spy `mock.calls`, never via destructuring.

import { ENTITY_TYPE, QUESTION_CATEGORY_TYPE } from '@openvaa/data';
import { flushSync } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AnyQuestionVariant, QuestionCategory } from '@openvaa/data';

// ── Upstream-context module mocks ────────────────────────────────────────────
// `getAppContext`/`getAuthContext` throw `error(500, ...)` unless their context
// has been initialised. The provider reads `appContext.dataRoot`,
// `appContext.appSettings`, `appContext.locale`, `appContext.getRoute`, and
// `authContext.logout` at field-init / construction time, so the fakes must
// expose those members. `dataRoot` is the load-bearing collaborator: its
// `questionCategories[]` drive the `questionBlocks` $effect.
const { spies } = vi.hoisted(() => ({ spies: { getApplicableQuestions: vi.fn() } }));

/**
 * Build a `QuestionCategory`-shaped fake. `appliesTo` returns `true` so the
 * category survives the filter; `getApplicableQuestions` is the SHARED spy so we
 * can inspect every invocation's arg object (including the blocks-path call at
 * source :378). The spy returns a non-empty array of matchable-question-shaped
 * fakes so the category clears the `.length > 0` filter AND the opinion-matchable
 * guard at source :373 (`!q.isMatchable` would `error(500)`).
 */
function makeQuestionCategory(id: string, type: string): QuestionCategory {
  const question = {
    id: `${id}-q1`,
    isMatchable: true,
    category: { id }
  } as unknown as AnyQuestionVariant;
  return {
    id,
    type,
    appliesTo: () => true,
    getApplicableQuestions: spies.getApplicableQuestions
  } as unknown as QuestionCategory;
}

/**
 * A fake `DataRoot` exposing only what the candidate context's field initialisers
 * + `questionBlocks` $effect touch. One Opinion category guarantees the
 * `nextOpinionCats` blocks computation (source :377-379) runs and invokes the
 * blocks-path `getApplicableQuestions`.
 */
function makeDataRoot() {
  return {
    questionCategories: [makeQuestionCategory('opinion-cat', QUESTION_CATEGORY_TYPE.Opinion)],
    elections: [],
    constituencies: [],
    getElection: () => undefined,
    getConstituency: () => undefined
  };
}

const fakeDataRoot = makeDataRoot();

vi.mock('../app', () => ({
  getAppContext: () => ({
    dataRoot: fakeDataRoot,
    appSettings: { access: { answersLocked: false } },
    locale: 'en',
    getRoute: { current: () => '/' }
  })
}));

vi.mock('../auth', () => ({
  getAuthContext: () => ({
    isAuthenticated: false,
    logout: vi.fn()
  })
}));

// `inheritContextMembers` copies own-enumerable members + forwards accessors; with
// a plain-object appContext fake it behaves as a shallow copy, which is all the
// harness needs.
vi.mock('../utils/inheritContextMembers', () => ({
  inheritContextMembers: (target: object, source: object) => Object.assign(target, source)
}));

// The userData composite producer is constructed in a field initializer. Stub it
// so construction does not reach the real dataWriter / persisted-state machinery.
vi.mock('./candidateUserDataState.svelte', () => ({
  candidateUserDataState: () => ({ current: undefined })
}));

vi.mock('$lib/api/dataWriter', () => ({ dataWriter: Promise.resolve({}) }));
// `$app/navigation` is resolved via the vitest.config alias stub
// (src/lib/i18n/tests/__mocks__/app-navigation.ts) — no per-test mock needed.

describe('candidateContext questionBlocks — Bug 1 (RUNES-05): entityType passed to getApplicableQuestions', () => {
  let cleanup: (() => void) | undefined;

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
    vi.clearAllMocks();
  });

  it('every blocks-path getApplicableQuestions call receives entityType === Candidate (RED until :378 fix)', async () => {
    spies.getApplicableQuestions.mockReturnValue([
      { id: 'opinion-cat-q1', isMatchable: true, category: { id: 'opinion-cat' } } as unknown as AnyQuestionVariant
    ]);

    // Import inside the test so the module mocks above are wired before the
    // provider class evaluates its field initializers.
    const { CandidateContextProvider } = await import('./candidateContext.svelte');

    let provider: InstanceType<typeof CandidateContextProvider> | undefined;
    cleanup = $effect.root(() => {
      provider = new CandidateContextProvider();
    });
    // Read a reactive member off the live instance (NOT destructured) to anchor
    // the $effect settle, then flush so questionBlocks computes.
    void provider?.questionBlocks;
    flushSync();

    // The single load-bearing assertion: EVERY getApplicableQuestions invocation
    // reachable through the questionBlocks blocks computation received an arg
    // object whose entityType === ENTITY_TYPE.Candidate. Against current source
    // the blocks-path call at :378 omits entityType, so this FAILS (assertion
    // failure on a missing entityType — NOT a harness/construction error).
    expect(spies.getApplicableQuestions).toHaveBeenCalled();
    for (const call of spies.getApplicableQuestions.mock.calls) {
      const arg = call[0] as { entityType?: unknown } | undefined;
      expect(arg?.entityType).toBe(ENTITY_TYPE.Candidate);
    }
  });
});
