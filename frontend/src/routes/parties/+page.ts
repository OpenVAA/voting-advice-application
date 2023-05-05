import {getData} from '../../api/getData';

export async function load() {
  const parties = await getData('api/parties').then((result) => {
    return result?.data;
  });
  return {parties: parties};
}
