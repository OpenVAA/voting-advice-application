// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import {describe, test, expect, vi, Mock} from 'vitest';
import {getData} from '$lib/api/getData';
import {constants} from '$lib/utils/constants';
import parties from './data/parties.json';
import singleCandidate from './data/singleCandidate.json';
import singleParty from './data/singleParty.json';
import type * as environment from '$app/environment';

// Mock SvelteKit runtime module $app/environment
vi.mock('$app/environment', (): typeof environment => ({
  browser: false,
  dev: true,
  building: false,
  version: 'any'
}));

vi.mock(
  '$env/dynamic/public',
  (): Record<string, object> => ({
    env: {
      PUBLIC_BACKEND_URL: 'http://localhost:1337'
    }
  })
);

global.fetch = vi.fn();

function createFetchResponse(data: unknown) {
  return {json: () => new Promise((resolve) => resolve(data))};
}

describe('Test getting data from backend', () => {
  // test('Test requesting all candidates', async () => {
  //   (fetch as Mock).mockResolvedValue(createFetchResponse(candidates));
  //   const response = await getNominatedCandidates().then((response) => {
  //     return response;
  //   });

  //   expect(fetch).toHaveBeenCalledWith(`${constants.BACKEND_URL}/api/candidates?populate=*`, {
  //     headers: {
  //       Authorization: `Bearer ${constants.STRAPI_TOKEN}`
  //     }
  //   });
  //   expect(response).toStrictEqual(candidates.data);
  // });

  test('Test requesting all parties', async () => {
    (fetch as Mock).mockResolvedValue(createFetchResponse(parties));
    const response = await getData('api/parties');

    expect(fetch).toHaveBeenCalledWith(`${constants.BACKEND_URL}/api/parties?`, {
      headers: {
        Authorization: `Bearer ${constants.STRAPI_TOKEN}`
      }
    });
    expect(response).toStrictEqual(parties);
  });

  test('Test requesting individual candidate', async () => {
    (fetch as Mock).mockResolvedValue(createFetchResponse(singleCandidate));
    const response = await getData('api/candidates/1');

    expect(fetch).toHaveBeenCalledWith(`${constants.BACKEND_URL}/api/candidates/1?`, {
      headers: {
        Authorization: `Bearer ${constants.STRAPI_TOKEN}`
      }
    });
    expect(response).toStrictEqual(singleCandidate);
  });

  test('Test requesting individual party', async () => {
    (fetch as Mock).mockResolvedValue(createFetchResponse(singleParty));
    const response = await getData('api/parties/1');

    expect(fetch).toHaveBeenCalledWith(`${constants.BACKEND_URL}/api/parties/1?`, {
      headers: {
        Authorization: `Bearer ${constants.STRAPI_TOKEN}`
      }
    });
    expect(response).toStrictEqual(singleParty);
  });
});
