// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import {describe, test, expect, vi, Mock} from 'vitest';
import {getAllCandidates, getData} from '../src/api/getData';
import {constants} from '../src/utils/constants';
import candidates from './data/candidates.json';
import parties from './data/parties.json';
import singleCandidate from './data/singleCandidate.json';
import singleParty from './data/singleParty.json';

global.fetch = vi.fn();

function createFetchResponse(data: any) {
  return {json: () => new Promise((resolve) => resolve(data))};
}

describe('Test getting data from backend', () => {
  test('Test requesting all candidates', async () => {
    (fetch as Mock).mockResolvedValue(createFetchResponse(candidates));
    const response = await getAllCandidates().then((response) => {
      return response;
    });

    expect(fetch).toHaveBeenCalledWith(
      `${constants.BACKEND_URL}/api/candidates?populate=*&locale=en`,
      {
        headers: {
          Authorization: `Bearer ${constants.STRAPI_TOKEN}`
        }
      }
    );
    expect(response).toStrictEqual(candidates.data);
  });

  test('Test requesting all parties', async () => {
    (fetch as Mock).mockResolvedValue(createFetchResponse(parties));
    const response = await getData('parties');

    expect(fetch).toHaveBeenCalledWith(`${constants.BACKEND_URL}/api/parties?locale=en`, {
      headers: {
        Authorization: `Bearer ${constants.STRAPI_TOKEN}`
      }
    });
    expect(response).toStrictEqual(parties);
  });

  test('Test requesting individual candidate', async () => {
    (fetch as Mock).mockResolvedValue(createFetchResponse(singleCandidate));
    const response = await getData('candidates/1');

    expect(fetch).toHaveBeenCalledWith(`${constants.BACKEND_URL}/api/candidates/1?locale=en`, {
      headers: {
        Authorization: `Bearer ${constants.STRAPI_TOKEN}`
      }
    });
    expect(response).toStrictEqual(singleCandidate);
  });

  test('Test requesting individual party', async () => {
    (fetch as Mock).mockResolvedValue(createFetchResponse(singleParty));
    const response = await getData('parties/1');

    expect(fetch).toHaveBeenCalledWith(`${constants.BACKEND_URL}/api/parties/1?locale=en`, {
      headers: {
        Authorization: `Bearer ${constants.STRAPI_TOKEN}`
      }
    });
    expect(response).toStrictEqual(singleParty);
  });
});
