import {getQuestion} from './getQuestion';
import {getData} from '../../api/getData';

async function getNumberOfQuestions(): Promise<number> {
  return await getData('api/questions')
    .then((result: any) => {
      if (result) {
        return result.data.length;
      } else {
        return 0;
      }
    })
    .catch((error) => {
      console.error('Could not retrieve the number of questions in database: ', error);
      return 0;
    });
}

export async function load() {
  return {
    firstQuestion: await getQuestion(1).then((result) => {
      return result;
    }),
    numberOfQuestions: await getNumberOfQuestions().then((result) => {
      return result;
    })
  };
}
