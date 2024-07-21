import {browser} from '$app/environment';
import {constants} from '$lib/utils/constants';
import type {CandidateData} from '$lib/_vaa-data/candidate.type';
import type {
  DataProvider,
  DataProviderConfig,
  GetDataOptions,
  GetDataReturnType
} from '../../dataProvider.type';
import {DataProviderError} from '../../dataProviderError';
import {parseAnswers, parseImage} from './utils';
import {STRAPI_API, type StrapiApi} from './strapiApi';
import type {
  StrapiError,
  StrapiNominationData,
  StrapiResponse,
  StrapiObject,
  StrapiElectionData,
  StrapiConstituencyData
} from './strapiDataProvider.type';
import {translate} from '$lib/i18n/utils';
import {formatId} from '$lib/_api/utils/formatId';

console.info('[debug] strapiDataProvider.ts: module loaded');

export class StrapiDataProvider implements DataProvider {
  public fetch: typeof fetch | undefined;

  constructor() {
    console.info('[debug] strapiDataProvider.ts: StrapiDataProvider constructor called');
  }

  init(config: DataProviderConfig): void {
    this.fetch = config.fetch;
  }

  async getElectionsData({
    id,
    locale
  }: GetDataOptions['elections'] = {}): GetDataReturnType<'elections'> {
    const params = new URLSearchParams();
    if (id) params.set('filters[id][$eq]', id);
    return this.getData<StrapiElectionData>(STRAPI_API.elections, params)
      .then((result) =>
        result.map((item) => {
          const attr = item.attributes;
          const name = translate(attr.name, locale);
          const shortName = translate(attr.shortName, locale);
          return {
            id: formatId(item.id),
            name,
            shortName: shortName ? shortName : name
          };
        })
      )
      .catch((e) => e);
  }

  async getConstituenciesData({
    id,
    locale
  }: GetDataOptions['constituencies'] = {}): GetDataReturnType<'constituencies'> {
    const params = new URLSearchParams();
    if (id) params.set('filters[id][$eq]', id);
    return this.getData<StrapiConstituencyData>(STRAPI_API.constituencies, params)
      .then((result) =>
        result.map((item) => {
          const attr = item.attributes;
          const name = translate(attr.name, locale);
          const shortName = translate(attr.shortName, locale);
          return {
            id: formatId(item.id),
            name,
            shortName: shortName ? shortName : name
          };
        })
      )
      .catch((e) => e);
  }

  async getNominationsData({
    electionId,
    constituencyId
    // locale
  }: GetDataOptions['nominations'] = {}): GetDataReturnType<'nominations'> {
    const params = new URLSearchParams({
      'populate[candidate]': 'true',
      'populate[party]': 'true'
    });
    if (constituencyId != null) params.set('filters[constituency][id][$eq]', constituencyId);
    if (electionId != null) params.set('filters[election][id][$eq]', electionId);
    return this.getData<StrapiNominationData>(STRAPI_API.nominations, params)
      .then((result) =>
        result.map((item) => {
          const attr = item.attributes;
          return {
            candidateId: formatId(attr.candidate.data?.id),
            partyId: formatId(attr.party.data?.id),
            electionSymbol: attr.electionSymbol ?? undefined
          };
        })
      )
      .catch((e) => e);
  }

  async getCandidatesData({
    id,
    electionId,
    constituencyId,
    locale,
    loadAnswers
  }: GetDataOptions['candidates'] = {}): GetDataReturnType<'candidates'> {
    console.info(
      `[debug] strapiDataProvider.ts: StrapiDataProvider.getCandidatesData() called with locale: ${locale ?? '-'}`
    );
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
    // if (memberOfPartyId != null) params.set('filters[candidate][party][id][$eq]', memberOfPartyId);
    // if (nominatingPartyId != null) params.set('filters[party][id][$eq]', nominatingPartyId);
    return this.getData<StrapiNominationData>(STRAPI_API.candidates, params)
      .then((result) =>
        result
          .filter((item) => item.attributes.candidate?.data != null)
          .map((item) => {
            const cnd = item.attributes.candidate.data;
            const id = formatId(cnd.id);
            const attr = cnd.attributes;
            const {firstName, lastName} = attr;
            const out: CandidateData = {
              id,
              firstName: (locale ?? '?') + firstName,
              lastName,
              answers:
                loadAnswers && attr.answers?.data ? parseAnswers(attr.answers.data, locale) : {}
            };
            const photo = attr.photo?.data?.attributes;
            if (photo) out.image = parseImage(photo);
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
