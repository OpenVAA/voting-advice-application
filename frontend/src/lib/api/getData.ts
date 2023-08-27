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

// TODO: Define what type of data this returns instead of just any
export const getData = async (
  endpoint: string,
  params: URLSearchParams = new URLSearchParams({})
): Promise<any> => {
  const url = `${constants.BACKEND_URL}/${endpoint}?${params}`;

  return await fetch(url, {
    headers: {
      Authorization: `Bearer ${constants.STRAPI_TOKEN}`
    }
  })
    .then((response) => {
      return response.json();
    })
    .catch((error) => console.error('Error in getting data from backend: ', error));
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
export const getAllCandidates = async (): Promise<CandidateProps[]> => {
  return await getData(
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
    if (result?.data) {
      return result.data.map((d: StrapiCandidateData) => {
        const id = d.id;
        const attr = d.attributes;
        const answers = attr.answers.data.map((a: StrapiAnswerData) => ({
          questionId: a.attributes.question.data.id,
          answer: a.attributes.answer.data.key
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
        };
      });
    } else {
      throw new Error('Could not retrieve result for all candidates');
    }
  });
};

/**
 * Get all question data from the database and convert them to a nicer format.
 */
export const getAllQuestions = async (): Promise<QuestionProps[]> => {
  // The questions are contained in the data returned by the question-types
  // endpoint
  return await getData(
    'api/question-types',
    new URLSearchParams({
      // We need a specific call to populate the category relations, * only goes one-level deep
      'populate[questions][populate][0]': 'category'
    })
  ).then((result) => {
    if (result?.data) {
      const questions: QuestionProps[] = [];
      for (const qType of result.data as StrapiQuestionTypeData[]) {
        // Get the value options for the question
        // TODO: Change to match new specs {type: string, values: [{key: number, label: string}]}
        const options = qType.attributes.settings.data;
        // Create the individual question objects
        qType.attributes.questions.data.forEach((d: StrapiQuestionData) =>
          questions.push({
            id: '' + d.id,
            text: d.attributes.text,
            category: d.attributes.category.data.attributes.name ?? '',
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
