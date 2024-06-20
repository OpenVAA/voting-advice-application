import {browser} from '$app/environment';
import {constants} from '$lib/utils/constants';
import type {CandidateData} from '$lib/_vaa-data/candidate.type';
import {
  type DataProvider,
  type DataProviderConfig,
  type GetNominatedCandidatesOptions
} from '../../dataProvider.type';
import {DataProviderError} from '../../dataProviderError';
import {parseAnswers, parseImage} from './utils';
import {STRAPI_API, type StrapiApi} from './strapiApi';
import type {
  StrapiError,
  StrapiNominationData,
  StrapiResponse,
  StrapiObject
} from './strapiDataProvider.type';

console.info('[debug] strapiDataProvider.ts: module loaded');

export class StrapiDataProvider implements DataProvider {
  public fetch: typeof fetch | undefined;

  constructor() {
    console.info('[debug] strapiDataProvider.ts: StrapiDataProvider constructor called');
  }

  init(config: DataProviderConfig): void {
    this.fetch = config.fetch;
  }

  async getCandidatesData({
    id,
    electionId,
    constituencyId,
    locale,
    memberOfPartyId,
    nominatingPartyId,
    loadAnswers
  }: GetNominatedCandidatesOptions = {}): Promise<CandidateData[] | DataProviderError> {
    console.info('[debug] strapiDataProvider.ts: StrapiDataProvider.getCandidatesData() called');
    const params = new URLSearchParams({
      // We need a specific calls to populate relations, * only goes one-level deep
      'populate[election]': 'true',
      'populate[constituency]': 'true',
      'populate[party][populate][logo]': 'true',
      // Not used currently, would be memberOf property
      // 'populate[candidate][populate][party]': 'true',
      'populate[candidate][populate][photo]': 'true',
      'populate[candidate][populate][answers][populate][question]': loadAnswers ? 'true' : 'false'
    });
    if (id) {
      params.set('filters[candidate][id][$eq]', id);
    }
    // Checking for missing relations is tricky, $notNull has very strange bugs, which may be fixed in 4.23.0 and we can't use the filter below. We'll instead filter the results after the fact. See: https://github.com/strapi/strapi/issues/12225
    // else {params.set('filters[candidate][id][$notNull]', 'true');}
    if (constituencyId != null) params.set('filters[constituency][id][$eq]', constituencyId);
    if (electionId != null) params.set('filters[election][id][$eq]', electionId);
    if (memberOfPartyId != null) params.set('filters[candidate][party][id][$eq]', memberOfPartyId);
    if (nominatingPartyId != null) params.set('filters[party][id][$eq]', nominatingPartyId);
    return this.getData<StrapiNominationData>(STRAPI_API.candidates, params)
      .then((result) =>
        result
          .filter((nom) => nom.attributes.candidate?.data != null)
          .map((nom) => {
            const cnd = nom.attributes.candidate.data;
            const id = `${cnd.id}`;
            const attr = cnd.attributes;
            const {firstName, lastName} = attr;
            const out: CandidateData = {
              id,
              electionRound: nom.attributes.electionRound,
              electionSymbol: nom.attributes.electionSymbol,
              firstName,
              lastName,
              answers:
                loadAnswers && attr.answers?.data ? parseAnswers(attr.answers.data, locale) : {}
            };
            const photo = attr.photo?.data?.attributes;
            if (photo) out.photo = parseImage(photo);
            return out;
          })
      )
      .catch((e) => e);
  }

  // TODO: This now requires the data always to be an array. Check if we should relax this requirement.
  protected async getData<TData extends StrapiObject>(
    endpoint: StrapiApi,
    params?: URLSearchParams
  ): Promise<TData[]> {
    if (!this.fetch)
      throw new Error('You must provide a fetch function before calling any get methods.');
    const url = `${
      browser ? constants.PUBLIC_BACKEND_URL : constants.BACKEND_URL
    }/${endpoint}?${params}`;
    console.info(`[debug] strapiDataProvider.ts: StrapiDataProvider.getData() url: ${url}`);
    return this.fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error(`Response: ${response.status} / ${response.statusText}`);
        return response.json().then((parsed: StrapiResponse<TData[]> | StrapiError) => {
          if ('error' in parsed) throw new Error(`Strapi error: ${JSON.stringify(parsed)}`);
          return parsed.data;
        });
      })
      .catch((e) => {
        throw new DataProviderError(`Error with getData: ${e}`);
      });
  }
}

export const dataProvider = new StrapiDataProvider();
