// Quick test function to get data from Strapi
// To be refactored (GraphQL in the future?)

import type {
  StrapiAnswerData,
  StrapiCandidateData,
  StrapiLanguageData,
  StrapiQuestionData,
  StrapiQuestionTypeData
} from './getData.type';
import {constants} from '$lib/utils/constants';
import type {QuestionProps} from '$lib/components/questions';
import type {CandidateProps} from '$lib/components/candidates';

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

export const getSingleTypeData = async ({fetch, params, route, url, endpoint}): Promise<any> => {
  const backendUrl = `${constants.BACKEND_URL}/${endpoint}`;

  return await fetch(backendUrl, {
    headers: {
      Authorization: `Bearer ${constants.STRAPI_TOKEN}`
    }
  })
    .then((response: {json: () => any}) => {
      return response.json();
    })
    .catch((error: any) =>
      console.error(`Error fetching data from Strapi: ${error} - 
      URL: ${backendUrl}`)
    );
};

// TODO: Define what type of data this returns instead of just any
export const getAllCandidates = (): Promise<CandidateProps[]> => {
  return getData<StrapiCandidateData[]>(
    'api/candidates',
    new URLSearchParams({
      // We need a specific calls to populate relations, * only goes one-level deep
      // NB. We cannot mix populate[0]=motherTongues with the deeper population def for answers!
      'populate[motherTongues]': 'true',
      'populate[otherLanguages]': 'true',
      'populate[party]': 'true',
      'populate[answers][populate][0]': 'question'
    })
  ).then((result) => {
    if (result) {
      return result.data.map((d) => {
        const id = d.id;
        const attr = d.attributes;
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
        const party = {
          name: attr.party.data.attributes.name,
          shortName: attr.party.data.attributes.shortName
        };
        return {
          answers,
          candidateNumber: attr.candidateNumber,
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
      'populate[questions][populate][0]': 'questionCategory'
    })
  ).then((result) => {
    if (result) {
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
            type: typeName,
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
