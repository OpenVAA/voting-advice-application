// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import {describe, test, expect, vi, Mock} from 'vitest';
import {constants} from '$lib/utils/constants';
import locales from './data/locales.json';
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

// Import getData only after mock fetch has been set up because it calls
// getSupportedLocales at initialization
(fetch as Mock).mockResolvedValue(createFetchResponse(locales));
const getData = await import('$lib/api/getData').then((mod) => mod.getData);

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

    expect(fetch).toHaveBeenCalledWith(
      `${constants.BACKEND_URL}/api/parties?pagination%5BpageSize%5D=1000`
    );
    expect(response).toStrictEqual(parties.data);
  });

  test('Test requesting individual candidate', async () => {
    (fetch as Mock).mockResolvedValue(createFetchResponse(singleCandidate));
    const response = await getData('api/candidates/1');

    expect(fetch).toHaveBeenCalledWith(
      `${constants.BACKEND_URL}/api/candidates/1?pagination%5BpageSize%5D=1000`
    );
    expect(response).toStrictEqual(singleCandidate.data);
  });

  test('Test requesting individual party', async () => {
    (fetch as Mock).mockResolvedValue(createFetchResponse(singleParty));
    const response = await getData('api/parties/1');

    expect(fetch).toHaveBeenCalledWith(
      `${constants.BACKEND_URL}/api/parties/1?pagination%5BpageSize%5D=1000`
    );
    expect(response).toStrictEqual(singleParty.data);
  });
});
