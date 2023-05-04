import {getQuestion} from './getQuestion';
import {getData} from '../../api/getData';
import {errorInGettingQuestion, questionsLoaded} from '../../utils/stores';
import {logDebugError} from '../../utils/logger';

async function getNumberOfQuestions(): Promise<number> {
  questionsLoaded.set(false);
  return await getData('questions')
    .then((result: any) => {
      if (result) {
        questionsLoaded.set(true);
        return result.data.length;
      } else {
        return NaN;
      }
    })
    .catch((error) => {
      logDebugError('Could not retrieve the number of questions in database: ', error);
      return 0;
    });
}

export async function load() {
  const numberOfQuestions = await getNumberOfQuestions().then((result) => {
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
