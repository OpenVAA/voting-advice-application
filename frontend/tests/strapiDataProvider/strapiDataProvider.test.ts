/**
 * This is an incomplete test suite for the StrapiDataProvider.
 * TODO: Test all required functions.
 */

import {describe, test, expect, vi, type Mock} from 'vitest';
import {loadTranslations, locale, locales} from '$lib/i18n';
import type * as environment from '$app/environment';
import {constants} from '$lib/utils/constants';
import {dataProvider} from '$lib/api/dataProvider/strapi';
import allPartiesResponse from './data/allParties.response.json';
import allPartiesResult from './data/allParties.result.json';

const LOCALE = 'fi';

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

describe('Test mock processing of data that should be fetched from the backend', async () => {
  // Initialize localization
  locale.set(LOCALE);
  await loadTranslations(LOCALE);
  console.info(locale.get(), locales.get());
  const {getAllParties} = await dataProvider;

  test('getAllParties', async () => {
    (fetch as Mock).mockResolvedValue(createFetchResponse(allPartiesResponse));
    const response = await getAllParties({loadAnswers: true, locale: LOCALE});
    expect(fetch).toHaveBeenCalledWith(
      `${constants.BACKEND_URL}/api/parties?populate%5Blogo%5D=true&populate%5Bcandidates%5D=false&populate%5Banswers%5D%5Bpopulate%5D%5Bquestion%5D=true&pagination%5BpageSize%5D=1000`
    );
    expect(response).toStrictEqual(allPartiesResult);
  });
});

function createFetchResponse(data: unknown) {
  return {json: () => new Promise((resolve) => resolve(data))};
}
