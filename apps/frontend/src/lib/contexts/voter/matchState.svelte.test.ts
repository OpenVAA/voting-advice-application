import { ENTITY_TYPE, OBJECT_TYPE } from '@openvaa/data';
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
    const election = state.current.e1!;
    expect(election[ENTITY_TYPE.Candidate]!.every(isMatch)).toBe(true);
    for (const type of [ENTITY_TYPE.Organization, ENTITY_TYPE.Faction, ENTITY_TYPE.Alliance]) {
      expect(election[type]!.some(isMatch), `${type} must carry no match`).toBe(false);
      expect(election[type]).toHaveLength(2);
    }
    expect(match).toHaveBeenCalledTimes(1);
  });

  it("'answersOnly' matches the parent entities on their own answers", () => {
    const { state, match } = setup('answersOnly');
    const election = state.current.e1!;
    for (const type of [ENTITY_TYPE.Candidate, ENTITY_TYPE.Organization, ENTITY_TYPE.Faction, ENTITY_TYPE.Alliance]) {
      expect(election[type]!.every(isMatch), `${type} must be matched`).toBe(true);
    }
    expect(match).toHaveBeenCalledTimes(4);
  });
});

describe('matchState alliance imputation', () => {
  const ordinal = {
    id: 'q1',
    objectType: OBJECT_TYPE.SingleChoiceOrdinalQuestion,
    isMatchable: true,
    choices: [{ id: 'agree' }, { id: 'disagree' }],
    category: { id: 'c1' }
  } as unknown as AnyQuestionVariant;

  /** A nomination with the given own answer to `q1` and child nominations. */
  function nomination(id: string, value?: string, children: Array<unknown> = []) {
    const answers = value ? { q1: { value } } : {};
    return {
      id,
      answers,
      entity: { getAnswer: () => answers.q1 },
      childNominations: children,
      organizationNominations: children
    };
  }

  /** Two alliances whose parties have not answered, each with candidates who have. */
  function alliances() {
    const orgA = nomination('or-a', undefined, [nomination('ca-1', 'agree'), nomination('ca-2', 'agree')]);
    const orgB = nomination('or-b', undefined, [nomination('ca-3', 'disagree')]);
    return {
      orgs: [orgA, orgB],
      alliances: [nomination('al-a', undefined, [orgA]), nomination('al-b', undefined, [orgB])]
    };
  }

  /** The distance of each alliance, keyed by id, for a tree holding the given sections in that order. */
  function allianceDistances(sections: Array<string>): Record<string, number> {
    const { orgs, alliances: allianceNominations } = alliances();
    const leaves: Record<string, unknown> = {
      [ENTITY_TYPE.Candidate]: { infoQuestions: [], opinionQuestions: [ordinal], nominations: [] },
      [ENTITY_TYPE.Organization]: { infoQuestions: [], opinionQuestions: [ordinal], nominations: orgs },
      [ENTITY_TYPE.Alliance]: { infoQuestions: [], opinionQuestions: [ordinal], nominations: allianceNominations }
    };
    const tree = {
      e1: Object.fromEntries(sections.map((s) => [s, leaves[s]]))
    } as unknown as NominationAndQuestionTree;
    // The distance reads the answer the target is matched on: an agreeing answer is near, any other far.
    function match({ targets }: { targets: Array<{ answers: Record<string, { value: unknown } | undefined> }> }) {
      return targets.map((target) => ({ target, distance: target.answers.q1?.value === 'agree' ? 0.1 : 0.9 }));
    }
    const state = matchState({
      answers: { answers: { q1: { value: 'agree' } } } as unknown as AnswerState,
      nominationsAndQuestions: () => tree,
      algorithm: { match } as unknown as MatchingAlgorithm,
      minAnswers: () => 1,
      calcSubmatches: () => [],
      parentMatchingMethod: () => 'impute'
    });
    const matches = state.current.e1![ENTITY_TYPE.Alliance] as unknown as Array<{
      distance: number;
      target: { id: string };
    }>;
    return Object.fromEntries(matches.map((m) => [m.target.id, m.distance]));
  }

  it('imputes alliances from their candidates whatever the order of the sections and whether organizations are shown', () => {
    const expected = { 'al-a': 0.1, 'al-b': 0.9 };
    expect(allianceDistances([ENTITY_TYPE.Candidate, ENTITY_TYPE.Organization, ENTITY_TYPE.Alliance])).toEqual(
      expected
    );
    expect(allianceDistances([ENTITY_TYPE.Candidate, ENTITY_TYPE.Alliance])).toEqual(expected);
    expect(allianceDistances([ENTITY_TYPE.Alliance, ENTITY_TYPE.Organization])).toEqual(expected);
  });
});
