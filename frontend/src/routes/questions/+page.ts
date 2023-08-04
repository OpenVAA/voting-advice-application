import {getQuestion} from './getQuestion';
import {getData} from '$lib/api/getData';
import {errorInGettingQuestion, questionsLoaded} from '$lib/utils/stores';
import {logDebugError} from '$lib/utils/logger';
import type {LoadEvent} from '@sveltejs/kit';
import {constants} from '../../lib/utils/constants';

async function getNumberOfQuestions(fetch: any): Promise<number> {
  questionsLoaded.set(false);

  return fetch('http://localhost:1337/api/questions', {
    headers: {
      Authorization: `Bearer ${constants.STRAPI_TOKEN}`
    }
  })
    .then((result: any) => {
      return result.json();
    })
    .then((result: any) => {
      if (result) {
        questionsLoaded.set(true);
        return result.data.length;
      } else {
        return NaN;
      }
    })
    .catch((error: any) => {
      logDebugError('Could not retrieve the number of questions in database: ', error);
      return 0;
    });

  // return await getData('api/questions', fetch)
  //   .then((result: any) => {
  //     if (result) {
  //       questionsLoaded.set(true);
  //       return result.data.length;
  //     } else {
  //       return NaN;
  //     }
  //   })
  //   .catch((error) => {
  //     logDebugError('Could not retrieve the number of questions in database: ', error);
  //     return 0;
  //   });
}

export async function load({fetch}: LoadEvent) {
  const numberOfQuestions = await getNumberOfQuestions(fetch).then((result) => {
    return result;
  });
  const firstQuestion =
    numberOfQuestions > 0
      ? await getQuestion(1)
          .then((result) => {
            return result;
          })
          .catch((error) => {
            errorInGettingQuestion.set(true);
            logDebugError(error);
          })
      : null;
  return {
    firstQuestion,
    numberOfQuestions
  };
}
