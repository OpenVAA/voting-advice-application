/**
 * This is an incomplete test suite for the StrapiDataProvider.
 * TODO: Test all required functions.
 */

import { describe, expect, type Mock, test, vi } from 'vitest';
import { loadTranslations, locale } from '$lib/i18n';
import { dataProvider } from '$lib/legacy-api/dataProvider/strapi';
import { constants } from '$lib/utils/constants';
import allPartiesResponse from './data/allParties.response.json';
import allPartiesResult from './data/allParties.result.json';
import type * as environment from '$app/environment';

const LOCALE = 'fi';

// Mock SvelteKit runtime module $app/environment
vi.mock('$app/environment', (): typeof environment => ({
  browser: false,
  dev: true,
  building: false,
  version: 'any'
}));

global.fetch = vi.fn();

describe.todo('Test mock processing of data that should be fetched from the backend', async () => {
  // Initialize localization
  locale.set(LOCALE);
  await loadTranslations(LOCALE);
  const { getAllParties } = await dataProvider;

  // TODO: getAllParties is no longer available

  test('getAllParties', async () => {
    (fetch as Mock).mockResolvedValue(createFetchResponse(allPartiesResponse));
    const response = await getAllParties({ loadAnswers: true, locale: LOCALE });
    expect(fetch).toHaveBeenCalledWith(
      `${constants.PUBLIC_SERVER_BACKEND_URL}/api/parties?populate%5Blogo%5D=true&populate%5Bcandidates%5D=false&populate%5Banswers%5D%5Bpopulate%5D%5Bquestion%5D=true&pagination%5BpageSize%5D=1000`
    );
    expect(response).toStrictEqual(allPartiesResult);
  });
});

function createFetchResponse(data: unknown) {
  return { json: () => new Promise((resolve) => resolve(data)) };
}
