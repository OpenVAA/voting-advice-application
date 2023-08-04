import {getData} from '$lib/api/getData';
import {constants} from '../../lib/utils/constants';

export async function getQuestion(number: number): Promise<any> {
  return fetch('http://localhost:1337/api/questions?filters[questionOrder]=' + number.toString(), {
    headers: {
      Authorization: `Bearer ${constants.STRAPI_TOKEN}`
    }
  })
    .then((response) => {
      return response.json();
    })
    .then((result: any) => {
      if (result) {
        if (result.data[0]) {
          return result.data[0].attributes;
        } else {
          throw new Error('Fetching question failed.');
        }
      }
    })
    .catch((error) => console.error('Error in getting data from backend: ', error));

  // return await getData(
  //   'api/questions',
  //   new URLSearchParams({
  //     'filters[questionOrder]': number.toString()
  //   })
  // ).then((result: any) => {
  //   if (result) {
  //     if (result.data[0]) {
  //       return result.data[0].attributes;
  //     } else {
  //       throw new Error('Fetching question failed.');
  //     }
  //   }
  // });
}
