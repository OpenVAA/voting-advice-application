/**
 * SPIKE 007 — Scoped rune-native voterContext orchestrator.
 *
 * Production `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts` is
 * a 474-line factory that exposes 18+ reactive accessors as getters. The
 * factory consumes appSettings + locale + dataRoot + voterAnswers and derives
 * downstream state via `$derived`/`$derived.by`. Consumers (route + layout
 * components) destructure or read these accessors.
 *
 * Per CLAUDE.md "Context Destructuring Rule", destructuring a getter that
 * returns `$state`/`$derived`-backed values captures the INITIAL value at
 * component-init time and binds it to a static local. Subsequent reads of the
 * local don't re-invoke the getter, so they don't propagate dependency
 * invalidation. This is the documented Phase 61 production bug — and this
 * spike validates whether the rune-native version reproduces the trap in the
 * same shape (it must, for the migration to be paradigm-preserving).
 *
 * The factory below replicates the production GETTER SHAPE for 4 representative
 * accessors:
 *   - selectedElections  → $state-backed (settable via mutator)
 *   - opinionQuestions   → $derived over (selectedElections, dataRoot)
 *   - matches            → $derived over (voterAnswers, opinionQuestions)
 *   - profileComplete    → $derived boolean over voterAnswers
 *
 * Re-uses Spike 002's `dataRootRuneContext` and Spike 003's
 * `voterAnswerRuneStore` to validate the full cascade.
 */

import { ENTITY_TYPE } from '@openvaa/data';
import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext } from 'svelte';
import { getDataRootRuneContext } from '../contexts/dataRootRuneContext.svelte';
import { voterAnswerRuneStore } from '../contexts/voterAnswerRuneStore.svelte';
import type { AnyQuestionVariant, Election } from '@openvaa/data';
import type { VoterAnswerRuneStore } from '../contexts/voterAnswerRuneStore.svelte';

const CONTEXT_KEY = Symbol('voterRuneContext');

export interface VoterRuneContext {
  /** Mutator. Real voterContext does this via URL navigation; spike does it
   *  directly so the consumer demo can drive it from a button. */
  selectElection: (election: Election | undefined) => void;
  /** Sets all 3 demo answers at once — proves cascade through to matches. */
  setDemoAnswers: () => void;
  /** Underlying store handle (so consumer demos can mutate answers). */
  readonly voterAnswers: VoterAnswerRuneStore;

  // ── reactive accessors (the destructure-trap surface) ──────────────────
  /** Currently selected elections. $state-backed. */
  readonly selectedElections: ReadonlyArray<Election>;
  /** Opinion questions across all selected elections. $derived. */
  readonly opinionQuestions: ReadonlyArray<AnyQuestionVariant>;
  /** Count of matches (raw, no algorithm yet — spike scope). $derived. */
  readonly matchesCount: number;
  /** True iff voter has answered at least 1 question. $derived. */
  readonly profileComplete: boolean;
}

export function getVoterRuneContext(): VoterRuneContext {
  if (!hasContext(CONTEXT_KEY)) error(500, 'getVoterRuneContext() called before initVoterRuneContext()');
  return getContext<VoterRuneContext>(CONTEXT_KEY);
}

export function initVoterRuneContext(): VoterRuneContext {
  if (hasContext(CONTEXT_KEY)) error(500, 'initVoterRuneContext() called twice');

  const dataRoot = getDataRootRuneContext();
  const voterAnswers = voterAnswerRuneStore({
    storageKey: 'runes-test-007-voterAnswers'
  });

  let _selectedElections = $state<Array<Election>>([]);

  // $derived chain — mirrors production `_opinionQuestions` shape. Production
  // filters by category + matchable getter; spike accepts any singleChoiceOrdinal
  // question as a proxy for "opinion question" (matches the seeded default
  // template, which uses Likert-scale singleChoiceOrdinal for the matching set).
  const _opinionQuestions = $derived.by(() => {
    if (_selectedElections.length === 0) return [];
    const all = dataRoot.current.questions ?? [];
    return all.filter((q) => {
      const type = (q as unknown as { type?: string }).type;
      return type === 'singleChoiceOrdinal';
    });
  });

  // matches count — $derived over (voterAnswers, opinionQuestions). In
  // production this is matchStore.value across all entity types. The spike
  // simplifies to a count of (answered questions) × (candidates in dataRoot).
  const _matchesCount = $derived.by(() => {
    const answeredIds = Object.keys(voterAnswers.answers);
    if (answeredIds.length === 0) return 0;
    const candidates = dataRoot.current.candidates ?? [];
    return candidates.length;
  });

  const _profileComplete = $derived(Object.keys(voterAnswers.answers).length > 0);

  function selectElection(election: Election | undefined) {
    _selectedElections = election ? [election] : [];
  }

  function setDemoAnswers() {
    voterAnswers.setAnswer('demo-q1', 3);
    voterAnswers.setAnswer('demo-q2', 5);
    voterAnswers.setAnswer('demo-q3', 1);
  }

  const ctx: VoterRuneContext = {
    selectElection,
    setDemoAnswers,
    voterAnswers,
    get selectedElections() {
      return _selectedElections;
    },
    get opinionQuestions() {
      return _opinionQuestions;
    },
    get matchesCount() {
      return _matchesCount;
    },
    get profileComplete() {
      return _profileComplete;
    }
  };

  return setContext(CONTEXT_KEY, ctx);
}
