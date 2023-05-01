import {getData} from '../../api/getData';

export async function getQuestion(number: number): Promise<any> {
  return await getData(
    'questions',
    new URLSearchParams({
      'filters[questionOrder]': number.toString()
    })
  ).then((result: any) => {
    if (result?.data) {
      return result.data[0].attributes;
    } else {
      console.error('Fetching question failed.');
    }
  });
}
