// Quick test function to get data from Strapi
// To be refactored (GraphQL in the future?)
// To build REST queries, one can use https://docs.strapi.io/dev-docs/api/rest/interactive-query-builder

import type {
  StrapiAnswerData,
  StrapiElectionData,
  StrapiLanguageData,
  StrapiNominationData,
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
 * Get data for all candidates from Strapi.
 * @param electionId The id of the Election the Candidates are nominated for
 * @param constituencyId The id of the Constituency the Candidates are nominated in
 */
export const getAllCandidates = ({
  electionId,
  constituencyId
}: {electionId?: string; constituencyId?: string} = {}): Promise<CandidateProps[]> => {
  const params = new URLSearchParams({
    // We need a specific calls to populate relations, * only goes one-level deep
    'populate[election]': 'true',
    'populate[constituency]': 'true',
    'populate[party]': 'true',
    'populate[candidate][populate][party]': 'true',
    'populate[candidate][populate][motherTongues]': 'true',
    'populate[candidate][populate][otherLanguages]': 'true',
    'populate[candidate][populate][answers][populate][question]': 'true',
    'filters[candidate][id][$notNull]': 'true' // We need to apply $notNull to id, not the candidate relation
  });
  if (constituencyId != null) {
    params.set('filters[constituency][id][$eq]', constituencyId);
  }
  if (electionId != null) {
    params.set('filters[election][id][$eq]', electionId);
  }
  return getData<StrapiNominationData[]>('api/nominations', params).then((result) => {
    if (result?.data?.length) {
      return result.data.map((nom) => {
        const cnd = nom.attributes.candidate.data;
        const id = cnd.id;
        const attr = cnd.attributes;
        const answers = attr.answers.data.map((a: StrapiAnswerData) => ({
          questionId: a.attributes.question.data.id,
          answer: a.attributes.answer.key
          // openAnswer?: string;
        }));
        const motherTongues = attr.motherTongues.data.map(
          (l: StrapiLanguageData) => l.attributes.name
        );
        const otherLanguages = attr.otherLanguages.data.map(
          (l: StrapiLanguageData) => l.attributes.name
        );
        // We use the party on whose list the candidate is
        const party = {
          name: nom.attributes.party.data.attributes.name,
          shortName: nom.attributes.party.data.attributes.shortName
        };
        return {
          answers,
          electionSymbol: nom.attributes.electionSymbol,
          firstName: attr.firstName,
          id,
          lastName: attr.lastName,
          motherTongues,
          otherLanguages,
          party,
          politicalExperience: attr.politicalExperience
        } as CandidateProps;
      });
    } else {
      throw new Error('Could not retrieve result for all candidates');
    }
  });
};

/**
 * Get all question data from the database and convert them to a nicer format.
 */
export const getAllQuestions = (): Promise<QuestionProps[]> => {
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
