import { ENTITY_TYPE } from '@openvaa/data';
import { describe, expect, it, vi } from 'vitest';
import { matchState } from './matchState.svelte';
import type { AnyNominationVariant, AnyQuestionVariant } from '@openvaa/data';
import type { MatchingAlgorithm } from '@openvaa/matching';
import type { AnswerState } from './answerState.type';
import type { NominationAndQuestionTree } from './nominationAndQuestionState.svelte';

type Method = AppSettings['matching']['organizationMatching'];

const question = { id: 'q1', category: { id: 'c1' } } as unknown as AnyQuestionVariant;

function nominations(prefix: string): Array<AnyNominationVariant> {
  return [{ id: `${prefix}-1` }, { id: `${prefix}-2` }] as unknown as Array<AnyNominationVariant>;
}

/**
 * Build a match state over one election with a candidate, an organization, a faction and an alliance section, and a stub algorithm that tags every target it matches.
 */
function setup(method: Method) {
  const tree = {
    e1: {
      [ENTITY_TYPE.Candidate]: { infoQuestions: [], opinionQuestions: [question], nominations: nominations('ca') },
      [ENTITY_TYPE.Organization]: { infoQuestions: [], opinionQuestions: [question], nominations: nominations('or') },
      [ENTITY_TYPE.Faction]: { infoQuestions: [], opinionQuestions: [question], nominations: nominations('fa') },
      [ENTITY_TYPE.Alliance]: { infoQuestions: [], opinionQuestions: [question], nominations: nominations('al') }
    }
  } as unknown as NominationAndQuestionTree;
  const match = vi.fn(({ targets }: { targets: Array<unknown> }) =>
    targets.map((target) => ({ target, score: 50, matched: true }))
  );
  const state = matchState({
    answers: { answers: { q1: { value: 1 } } } as unknown as AnswerState,
    nominationsAndQuestions: () => tree,
    algorithm: { match } as unknown as MatchingAlgorithm,
    minAnswers: () => 1,
    calcSubmatches: () => [],
    parentMatchingMethod: () => method
  });
  return { state, match };
}

function isMatch(value: unknown): boolean {
  return typeof value === 'object' && value !== null && 'matched' in value;
}

describe('matchState organizationMatching', () => {
  it("'none' leaves organizations, factions and alliances unmatched and still matches candidates", () => {
    const { state, match } = setup('none');
    const election = state.value.e1!;
    expect(election[ENTITY_TYPE.Candidate]!.every(isMatch)).toBe(true);
    for (const type of [ENTITY_TYPE.Organization, ENTITY_TYPE.Faction, ENTITY_TYPE.Alliance]) {
      expect(election[type]!.some(isMatch), `${type} must carry no match`).toBe(false);
      expect(election[type]).toHaveLength(2);
    }
    expect(match).toHaveBeenCalledTimes(1);
  });

  it("'answersOnly' matches the parent entities on their own answers", () => {
    const { state, match } = setup('answersOnly');
    const election = state.value.e1!;
    for (const type of [ENTITY_TYPE.Candidate, ENTITY_TYPE.Organization, ENTITY_TYPE.Faction, ENTITY_TYPE.Alliance]) {
      expect(election[type]!.every(isMatch), `${type} must be matched`).toBe(true);
    }
    expect(match).toHaveBeenCalledTimes(4);
  });
});
