import { ENTITY_TYPE, QUESTION_CATEGORY_TYPE } from '@openvaa/data';
import { describe, expect, it } from 'vitest';
import { nominationAndQuestionState } from './nominationAndQuestionState.svelte';
import type { Constituency, DataRoot, Election, EntityType, QuestionCategoryType } from '@openvaa/data';

/**
 * The filter that hides entities with missing answers, over plain objects shaped like the surface the module reads: an election's applicable constituency, its nominations by entity type and its questions by entity type and category type.
 */

type HideIfMissingAnswers = AppSettings['entities']['hideIfMissingAnswers'];

/** A question as far as the module reads one. `entityType`, when set, is the one type the question is addressed to. */
type FakeQuestion = { id: string; type: QuestionCategoryType; entityType?: EntityType };

type FakeNomination = {
  id: string;
  entity: { getAnswer: (question: { id: string }) => { value: unknown } | undefined };
  data: { candidateNominationIds?: Array<string> };
};

const CONSTITUENCY = { id: 'constituency-1' } as unknown as Constituency;

const ORGANIZATION_OPINION: FakeQuestion = {
  id: 'q-organization',
  type: QUESTION_CATEGORY_TYPE.Opinion,
  entityType: ENTITY_TYPE.Organization
};
const CANDIDATE_OPINION: FakeQuestion = {
  id: 'q-candidate',
  type: QUESTION_CATEGORY_TYPE.Opinion,
  entityType: ENTITY_TYPE.Candidate
};
const SHARED_OPINION: FakeQuestion = { id: 'q-any', type: QUESTION_CATEGORY_TYPE.Opinion };
const ORGANIZATION_INFO: FakeQuestion = {
  id: 'q-info',
  type: QUESTION_CATEGORY_TYPE.Info,
  entityType: ENTITY_TYPE.Organization
};
const QUESTIONS = [ORGANIZATION_OPINION, CANDIDATE_OPINION, SHARED_OPINION, ORGANIZATION_INFO];

/**
 * A nomination whose entity has an answer to each of `answered` and to no other question.
 */
function nomination({
  id,
  answered,
  candidateNominationIds
}: {
  id: string;
  answered: Array<FakeQuestion>;
  candidateNominationIds?: Array<string>;
}): FakeNomination {
  const answeredIds = new Set(answered.map((q) => q.id));
  return {
    id,
    entity: { getAnswer: (question) => (answeredIds.has(question.id) ? { value: 'answer' } : undefined) },
    data: { candidateNominationIds }
  };
}

/**
 * Build the state over one election and read the tree's leaf for each entity type.
 * @returns The ids of the nominations left for candidates and for organizations, the organizations' nominations themselves, and the opinion questions the module took for organizations.
 */
function setup({
  hideIfMissingAnswers,
  candidates = [],
  organizations,
  questions = QUESTIONS
}: {
  hideIfMissingAnswers: Partial<HideIfMissingAnswers> | undefined;
  candidates?: Array<FakeNomination>;
  organizations: Array<FakeNomination>;
  questions?: Array<FakeQuestion>;
}): {
  candidateIds: Array<string> | undefined;
  organizationIds: Array<string> | undefined;
  organizationNominations: Array<FakeNomination>;
  organizationOpinionQuestionIds: Array<string> | undefined;
} {
  const nominations: Partial<Record<EntityType, Array<FakeNomination>>> = {
    [ENTITY_TYPE.Candidate]: candidates,
    [ENTITY_TYPE.Organization]: organizations
  };
  const election = {
    id: 'election-1',
    constituencyGroups: [],
    getApplicableConstituency: () => CONSTITUENCY,
    getNominations: (entityType: EntityType) => nominations[entityType] ?? [],
    getQuestions: ({ entityType, type }: { entityType: EntityType; type: QuestionCategoryType }) =>
      questions.filter((q) => q.type === type && (!q.entityType || q.entityType === entityType))
  } as unknown as Election;
  const state = nominationAndQuestionState({
    dataRoot: () => ({}) as DataRoot,
    constituencies: () => [CONSTITUENCY],
    elections: () => [election],
    entityTypes: () => [ENTITY_TYPE.Candidate, ENTITY_TYPE.Organization],
    hideIfMissingAnswers: () => hideIfMissingAnswers as HideIfMissingAnswers
  });
  const leaves = state.value['election-1'];
  const organizationLeaf = leaves?.[ENTITY_TYPE.Organization];
  return {
    candidateIds: leaves?.[ENTITY_TYPE.Candidate]?.nominations.map((n) => n.id),
    organizationIds: organizationLeaf?.nominations.map((n) => n.id),
    organizationNominations: (organizationLeaf?.nominations ?? []) as unknown as Array<FakeNomination>,
    organizationOpinionQuestionIds: organizationLeaf?.opinionQuestions.map((q) => q.id)
  };
}

/** An organization with every answer an organization is asked for, and one that lacks the answer to the question addressed to organizations. */
function completeAndIncomplete(): Array<FakeNomination> {
  return [
    nomination({ id: 'or-complete', answered: [ORGANIZATION_OPINION, SHARED_OPINION] }),
    nomination({ id: 'or-incomplete', answered: [SHARED_OPINION] })
  ];
}

describe('nominationAndQuestionState, the organization key of hideIfMissingAnswers', () => {
  it('on: an organization that lacks an answer to an opinion question addressed to organizations is not among the nominations, and one with every such answer is', () => {
    const { organizationIds } = setup({
      hideIfMissingAnswers: { candidate: false, organization: true },
      organizations: completeAndIncomplete()
    });

    expect(organizationIds).toEqual(['or-complete']);
  });

  it.each([
    ['off', { candidate: false, organization: false }],
    ['absent', { candidate: false }],
    ['absent with the whole setting', undefined]
  ])('%s: both organizations are among the nominations', (_label, hideIfMissingAnswers) => {
    const { organizationIds } = setup({ hideIfMissingAnswers, organizations: completeAndIncomplete() });

    expect(organizationIds).toEqual(['or-complete', 'or-incomplete']);
  });

  it('on: the questions an organization must have answered are the opinion questions that apply to organizations, and no other', () => {
    const { organizationIds, organizationOpinionQuestionIds } = setup({
      hideIfMissingAnswers: { candidate: false, organization: true },
      organizations: [
        // Lacks the answers to the question addressed to candidates and to the info question, which do not count.
        nomination({ id: 'or-complete', answered: [ORGANIZATION_OPINION, SHARED_OPINION] }),
        nomination({ id: 'or-lacks-shared', answered: [ORGANIZATION_OPINION, CANDIDATE_OPINION, ORGANIZATION_INFO] })
      ]
    });

    expect(organizationOpinionQuestionIds).toEqual(['q-organization', 'q-any']);
    expect(organizationIds).toEqual(['or-complete']);
  });

  it('on: every organization stays while no opinion question applies to organizations', () => {
    const { organizationIds } = setup({
      hideIfMissingAnswers: { candidate: false, organization: true },
      organizations: [nomination({ id: 'or-unanswered', answered: [] })],
      questions: [CANDIDATE_OPINION, ORGANIZATION_INFO]
    });

    expect(organizationIds).toEqual(['or-unanswered']);
  });

  it('on, with the candidate key off: no candidate is hidden and no organization loses a child', () => {
    const { candidateIds, organizationIds, organizationNominations } = setup({
      hideIfMissingAnswers: { candidate: false, organization: true },
      candidates: [nomination({ id: 'ca-incomplete', answered: [] })],
      organizations: [
        nomination({
          id: 'or-complete',
          answered: [ORGANIZATION_OPINION, SHARED_OPINION],
          candidateNominationIds: ['ca-incomplete']
        }),
        // Has no child at all, which the candidate key alone would hide it for.
        nomination({ id: 'or-childless', answered: [ORGANIZATION_OPINION, SHARED_OPINION] })
      ]
    });

    expect(candidateIds).toEqual(['ca-incomplete']);
    expect(organizationIds).toEqual(['or-complete', 'or-childless']);
    expect(organizationNominations[0].data.candidateNominationIds).toEqual(['ca-incomplete']);
  });
});

describe('nominationAndQuestionState, the candidate key of hideIfMissingAnswers', () => {
  /** A candidate with every answer a candidate is asked for and one without, and an organization nominating each of them alone, one nominating both and one nominating nobody. No organization has an answer of its own. */
  function candidatesAndParents(): { candidates: Array<FakeNomination>; organizations: Array<FakeNomination> } {
    return {
      candidates: [
        nomination({ id: 'ca-complete', answered: [CANDIDATE_OPINION, SHARED_OPINION] }),
        nomination({ id: 'ca-incomplete', answered: [SHARED_OPINION] })
      ],
      organizations: [
        nomination({ id: 'or-of-complete', answered: [], candidateNominationIds: ['ca-complete'] }),
        nomination({ id: 'or-of-incomplete', answered: [], candidateNominationIds: ['ca-incomplete'] }),
        nomination({ id: 'or-of-both', answered: [], candidateNominationIds: ['ca-complete', 'ca-incomplete'] }),
        nomination({ id: 'or-childless', answered: [] })
      ]
    };
  }

  it('on, with the organization key off: a candidate with a missing answer is hidden, removed from its organizations, and an organization left with no candidate is hidden', () => {
    const { candidateIds, organizationIds, organizationNominations } = setup({
      hideIfMissingAnswers: { candidate: true, organization: false },
      ...candidatesAndParents()
    });

    expect(candidateIds).toEqual(['ca-complete']);
    // No organization is hidden for its own missing answers: the two that stay have none either.
    expect(organizationIds).toEqual(['or-of-complete', 'or-of-both']);
    expect(organizationNominations.map((n) => n.data.candidateNominationIds)).toEqual([
      ['ca-complete'],
      ['ca-complete']
    ]);
  });

  it('off, with the organization key off: no candidate and no organization is hidden, and no organization loses a child', () => {
    const { candidateIds, organizationIds, organizationNominations } = setup({
      hideIfMissingAnswers: { candidate: false, organization: false },
      ...candidatesAndParents()
    });

    expect(candidateIds).toEqual(['ca-complete', 'ca-incomplete']);
    expect(organizationIds).toEqual(['or-of-complete', 'or-of-incomplete', 'or-of-both', 'or-childless']);
    expect(organizationNominations.map((n) => n.data.candidateNominationIds)).toEqual([
      ['ca-complete'],
      ['ca-incomplete'],
      ['ca-complete', 'ca-incomplete'],
      undefined
    ]);
  });

  it('on, with the organization key on: each key hides for its own reason', () => {
    const { candidates } = candidatesAndParents();
    const { candidateIds, organizationIds } = setup({
      hideIfMissingAnswers: { candidate: true, organization: true },
      candidates,
      organizations: [
        nomination({
          id: 'or-complete-with-candidate',
          answered: [ORGANIZATION_OPINION, SHARED_OPINION],
          candidateNominationIds: ['ca-complete']
        }),
        nomination({ id: 'or-incomplete-with-candidate', answered: [], candidateNominationIds: ['ca-complete'] }),
        nomination({
          id: 'or-complete-without-candidate',
          answered: [ORGANIZATION_OPINION, SHARED_OPINION],
          candidateNominationIds: ['ca-incomplete']
        })
      ]
    });

    expect(candidateIds).toEqual(['ca-complete']);
    expect(organizationIds).toEqual(['or-complete-with-candidate']);
  });
});
