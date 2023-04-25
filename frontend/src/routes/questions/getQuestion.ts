import {getData} from '../../api/getData';

export async function getQuestion(number: number): Promise<any> {
  return await getData(`api/questions/${number}`).then((result: any) => {
    if (result) {
      return result.data;
    } else {
      console.error('Fetching question failed.');
    }
  });
}
