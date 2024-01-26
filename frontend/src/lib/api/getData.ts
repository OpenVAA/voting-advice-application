// Quick test function to get data from Strapi
// To be refactored (GraphQL in the future?)
// To build REST queries, one can use https://docs.strapi.io/dev-docs/api/rest/interactive-query-builder

import type {
  StrapiAnswerData,
  StrapiElectionData,
  StrapiLanguageData,
  StrapiNominationData,
  StrapiPartyData,
  StrapiQuestionData,
  StrapiQuestionTypeData
} from './getData.type';
import {constants} from '$lib/utils/constants';

// TODO: Use locale (now defaults to en)
export const getData = async <T>(
  endpoint: string,
  params: URLSearchParams = new URLSearchParams({})
): Promise<{data: T} | undefined> => {
  const url = `${constants.BACKEND_URL}/${endpoint}?${params}`;

  return await fetch(url, {
    headers: {
      Authorization: `Bearer ${constants.STRAPI_TOKEN}`
    }
  })
    .then((response) => {
      return response.json() as Promise<{data: T} | undefined>;
    })
    .catch((error) => {
      console.error('Error in getting data from backend: ', error);
      return undefined;
    });
};

/**
 * Get election data from Strapi
 * @param electionId The id of the Election the labels are used for
 */
export const getElection = ({electionId}: {electionId?: string} = {}): Promise<ElectionProps> => {
  const params = new URLSearchParams({});
  if (electionId != null) {
    params.set('filters[id][$eq]', electionId);
  }
  return getData<StrapiElectionData[]>('api/elections', params).then((result) => {
    if (result?.data?.length) {
      const el = result.data[0];
      return {
        electionDate: el.attributes.electionDate,
        id: '' + el.id,
        locale: el.locale,
        name: el.attributes.name,
        shortName: el.attributes.shortName ?? '',
        type: el.attributes.type ?? ''
      };
    } else {
      throw new Error('Could not retrieve election data');
    }
  });
};

/**
 * Get app labels data from Strapi
 * @param electionId The id of the Election the labels are used for
 */
export const getAppLabels = ({electionId}: {electionId?: string} = {}): Promise<AppLabels> => {
  const params = new URLSearchParams({
    // We need a specific calls to populate relations, * only goes one-level deep
    'populate[electionAppLabel][populate][actionLabels]': 'true',
    'populate[electionAppLabel][populate][viewTexts]': 'true'
  });
  if (electionId != null) {
    params.set('filters[id][$eq]', electionId);
  }
  return getData<StrapiElectionData[]>('api/elections', params).then((result) => {
    if (result?.data?.length) {
      return result.data[0].attributes.electionAppLabel.data.attributes;
    } else {
      throw new Error('Could not retrieve app labels');
    }
  });
};

/**
 * Get data for all candidates from Strapi. NB. This only includes Candidates that
 * are nominated in some Election.
 * @param id The id of the Candidate
 * @param electionId The id of the Election the Candidates are nominated for
 * @param constituencyId The id of the Constituency the Candidates are nominated in
 * @param memberOfPartyId The id of the Party the Candidates are members of
 * @param nominatingPartyId The id of the Party the Candidates are nominated by
 * @param loadAnswers If true, the Candidates' Answers will also be loaded
 * @returns An Array of matching Candidates, which may be empty
 */
export const getNominatedCandidates = ({
  id,
  electionId,
  constituencyId,
  memberOfPartyId,
  nominatingPartyId,
  loadAnswers
}: {
  id?: string;
  electionId?: string;
  constituencyId?: string;
  memberOfPartyId?: string;
  nominatingPartyId?: string;
  loadAnswers?: boolean;
} = {}): Promise<CandidateProps[]> => {
  const params = new URLSearchParams({
    // We need a specific calls to populate relations, * only goes one-level deep
    'populate[election]': 'true',
    'populate[constituency]': 'true',
    'populate[party]': 'true',
    'populate[candidate][populate][party]': 'true',
    'populate[candidate][populate][motherTongues]': 'true',
    'populate[candidate][populate][otherLanguages]': 'true',
    'populate[candidate][populate][answers][populate][question]': loadAnswers ? 'true' : 'false',
    'filters[candidate][id][$notNull]': 'true' // We need to apply $notNull to id, not the candidate relation
  });
  if (id != null) {
    params.set('filters[candidate][id][$eq]', id);
  }
  if (constituencyId != null) {
    params.set('filters[constituency][id][$eq]', constituencyId);
  }
  if (electionId != null) {
    params.set('filters[election][id][$eq]', electionId);
  }
  if (memberOfPartyId != null) {
    params.set('filters[candidate][party][id][$eq]', memberOfPartyId);
  }
  if (nominatingPartyId != null) {
    params.set('filters[party][id][$eq]', nominatingPartyId);
  }
  return getData<StrapiNominationData[]>('api/nominations', params).then((result) => {
    if (result?.data) {
      return result.data.map((nom) => {
        const cnd = nom.attributes.candidate.data;
        const id = '' + cnd.id;
        const attr = cnd.attributes;
        const props: CandidateProps = {
          electionRound: nom.attributes.electionRound,
          electionSymbol: nom.attributes.electionSymbol,
          firstName: attr.firstName,
          id,
          lastName: attr.lastName,
          motherTongues: attr.motherTongues.data.map((l: StrapiLanguageData) => l.attributes.name),
          otherLanguages: attr.otherLanguages.data.map(
            (l: StrapiLanguageData) => l.attributes.name
          ),
          party: {
            name: nom.attributes.party.data.attributes.name,
            shortName: nom.attributes.party.data.attributes.shortName
          },
          politicalExperience: attr.politicalExperience
        };
        if (loadAnswers) {
          props['answers'] = attr.answers.data.map((a: StrapiAnswerData) => ({
            questionId: '' + a.attributes.question.data.id,
            answer: a.attributes.answer.key
            // openAnswer?: string;
          }));
        }
        return props;
      });
    } else {
      throw new Error('Could not retrieve result for nominated candidates');
    }
  });
};

/**
 * Get data for all parties from Strapi.
 * @param loadAnswers If true, the Parties' Answers will also be loaded
 * @param loadMembers If true, the Parties' member Candidates will also be loaded
 */
export const getAllParties = ({
  loadAnswers,
  loadMembers
}: {
  loadAnswers?: boolean;
  loadMembers?: boolean;
} = {}): Promise<PartyProps[]> => {
  const params = new URLSearchParams({
    // We need a specific calls to populate relations, * only goes one-level deep
    'populate[candidates]': loadMembers ? 'true' : 'false',
    'populate[answers][populate][question]': loadAnswers ? 'true' : 'false'
  });
  return getData<StrapiPartyData[]>('api/parties', params).then((result) => {
    if (result?.data?.length) {
      return result.data.map((prt) => {
        const id = '' + prt.id;
        const attr = prt.attributes;
        const props: PartyProps = {
          electionRound: 0, // We use a default here
          id,
          info: attr.info ?? '',
          name: attr.name,
          shortName: attr.shortName ?? ''
        };
        if (loadAnswers) {
          props.answers = attr.answers.data.map((a) => ({
            questionId: '' + a.attributes.question.data.id,
            answer: a.attributes.answer.key
            // openAnswer?: string;
          }));
        }
        if (loadMembers) {
          props.memberCandidateIds = attr.candidates.data.map((c) => '' + c.id);
        }
        return props;
      });
    } else {
      throw new Error('Could not retrieve result for all parties');
    }
  });
};

/**
 * Get data for all parties from Strapi that have nominations in some Election.
 * @param id The id of the Party
 * @param electionId The id of the Election the Parties are nominated for
 * @param constituencyId The id of the Constituency the Parties are nominated in
 * @param loadAnswers If true, the Parties' Answers will also be loaded
 * @param loadMembers If true, the Parties' member Candidates will also be loaded
 * @param loadNominations If true, the Parties' nominated Candidates will also be loaded
 * @returns An Array of matching Parties, which may be empty
 */
export const getNominatingParties = ({
  id,
  electionId,
  constituencyId,
  loadAnswers,
  loadMembers,
  loadNominations
}: {
  id?: string;
  electionId?: string;
  constituencyId?: string;
  loadAnswers?: boolean;
  loadMembers?: boolean;
  loadNominations?: boolean;
} = {}): Promise<PartyProps[]> => {
  // We first get all available parties and then fetch the nominated candidates for them
  // The reason we do this, is that we don't want to populate the parties deeply within
  // the Nominations, because they would be reduplicated for each candidate Nomination
  return getAllParties({loadAnswers, loadMembers}).then((parties) => {
    const params = new URLSearchParams({
      'populate[party]': 'true',
      'populate[candidate]': loadNominations ? 'true' : 'false',
      'filters[party][id][$notNull]': 'true' // We need to apply $notNull to the id, not the relation
    });
    if (id != null) {
      params.set('filters[party][id][$eq]', id);
    }
    if (constituencyId != null) {
      params.set('filters[constituency][id][$eq]', constituencyId);
    }
    if (electionId != null) {
      params.set('filters[election][id][$eq]', electionId);
    }
    return getData<StrapiNominationData[]>('api/nominations', params).then((result) => {
      if (result?.data) {
        // For easier access by id
        const partyMap = new Map(parties.map((p) => [p.id, p]));
        // We collect the ids of the parties in these nominations here
        const partyIds = new Set<string>();
        // Get the nominated candidates for each party
        result.data.map((nom) => {
          const partyId = nom.attributes.party.data.id + '';
          partyIds.add(partyId);
          const party = partyMap.get(partyId);
          if (!party) {
            throw new Error(
              `Could not retrieve result for nominating parties: party with id '${partyId}' not found`
            );
          }
          if (loadNominations) {
            const candId = nom.attributes.candidate.data?.id;
            if (candId != null) {
              if (!party.nominatedCandidateIds) {
                party.nominatedCandidateIds = [];
              }
              party.nominatedCandidateIds.push(candId + '');
            }
          }
        });
        // Only return those parties that were found in the nominations
        return Array.from(partyIds).map((id) => partyMap.get(id) as PartyProps);
      } else {
        throw new Error('Could not retrieve result for nominating parties');
      }
    });
  });
};

/**
 * Get all question data from the database and convert them to a nicer format.
 */
export const getQuestions = (): Promise<QuestionProps[]> => {
  // The questions are contained in the data returned by the question-types
  // endpoint
  return getData<StrapiQuestionTypeData[]>(
    'api/question-types',
    new URLSearchParams({
      // We need a specific call to populate the category relations, * only goes one-level deep
      'populate[questions][populate][questionCategory]': 'true'
    })
  ).then((result) => {
    if (result?.data?.length) {
      const questions: QuestionProps[] = [];
      for (const qType of result.data) {
        // Get the value options for the question
        const options = qType.attributes.settings.values;
        const typeName = qType.attributes.settings.type;
        // Create the individual question objects
        qType.attributes.questions.data.forEach((d: StrapiQuestionData) =>
          questions.push({
            id: '' + d.id,
            text: d.attributes.text,
            type: typeName as QuestionType,
            category: d.attributes.questionCategory.data.attributes.name ?? '',
            info: d.attributes.info,
            fillingInfo: d.attributes.fillingInfo,
            options
          })
        );
      }
      // Finally sort by category
      // TODO: Add sorting by the order property
      return questions.sort((a, b) => (a.category ?? '').localeCompare(b.category ?? ''));
    } else {
      throw new Error('Could not retrieve result for all questions');
    }
  });
};
