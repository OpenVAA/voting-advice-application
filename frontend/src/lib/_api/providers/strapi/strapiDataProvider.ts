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
import {STRAPI_API} from './strapiApi';
import type {StrapiError, StrapiResponse, StrapiCollectionTypes} from './strapiDataProvider.type';
import {translate} from '$lib/i18n/utils';
import {formatId} from '../../utils/formatId';
import type {Id, NominationData} from '$lib/_vaa-data';
import {parseCandidate} from './utils';

export class StrapiDataProvider implements DataProvider {
  public fetch: typeof fetch | undefined;

  constructor() {}

  init(config: DataProviderConfig): void {
    this.fetch = config.fetch;
  }

  async getElectionsData({
    id,
    locale
  }: GetDataOptions['elections'] = {}): GetDataReturnType<'elections'> {
    const params = new URLSearchParams();
    if (id) params.set('filters[id][$eq]', id);
    return this.getData('elections', params)
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
    return this.getData('constituencies', params)
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
    constituencyId,
    loadAllEntities,
    loadAnswers,
    loadCandidates,
    // loadParties,
    locale
  }: GetDataOptions['nominations'] = {}): GetDataReturnType<'nominations'> {
    loadCandidates ||= loadAllEntities;
    // loadParties ||= loadAllEntities;
    const populateAnswers = loadAnswers ? '[populate][answers]' : '';
    const params = new URLSearchParams({
      [`populate[candidate]${populateAnswers}`]: loadCandidates ? 'true' : 'false'
      // [`populate[party]${populateAnswers}`]: loadParties ? 'true' : 'false',
    });
    if (constituencyId != null) params.set('filters[constituency][id][$eq]', constituencyId);
    if (electionId != null) params.set('filters[election][id][$eq]', electionId);
    return this.getData('nominations', params)
      .then((result) => {
        const nominations = new Array<NominationData>();
        const candidates: Record<Id, CandidateData> = {};
        // const parties = Record<Id, PartyData> = {};
        for (const item of result) {
          const attr = item.attributes;
          const cnd = attr.candidate?.data;
          const candidateId = formatId(cnd?.id);
          const party = attr.party?.data;
          const partyId = formatId(party?.id);
          nominations.push({
            candidateId,
            partyId,
            electionSymbol: attr.electionSymbol ?? undefined
          });
          if (loadCandidates && candidateId && !(candidateId in candidates))
            candidates[candidateId] = parseCandidate(cnd, {locale, loadAnswers});
          // if (loadParties && partyId && !(partyId in parties))
          //   parties[partyId] = parseParty(party, { locale, loadAnswers });
        }
        return {
          nominations,
          candidates: loadCandidates ? Object.values(candidates) : undefined
          // parties: loadParties ? Object.values(parties) : undefined,
        };
      })
      .catch((e) => e);
  }

  async getCandidatesData({
    id,
    locale,
    loadAnswers
  }: GetDataOptions['candidates'] = {}): GetDataReturnType<'candidates'> {
    console.info(
      `[debug] strapiDataProvider.ts: StrapiDataProvider.getCandidatesData() called with locale: ${locale ?? '-'}`
    );
    const params = new URLSearchParams({
      'populate[photo]': 'true',
      'populate[answers][populate][question]': loadAnswers ? 'true' : 'false'
    });
    if (id) params.set('filters[candidate][id][$eq]', id);
    return this.getData('candidates', params)
      .then((result) => result.map((item) => parseCandidate(item, {locale, loadAnswers})))
      .catch((e) => e);
  }

  protected async getData<
    TCollection extends keyof StrapiCollectionTypes,
    TData = Array<StrapiCollectionTypes[TCollection]>
  >(collection: TCollection, params?: URLSearchParams): Promise<TData> {
    if (!this.fetch)
      throw new Error('You must provide a fetch function before calling any get methods.');
    const url = `${
      browser ? constants.PUBLIC_BACKEND_URL : constants.BACKEND_URL
    }/${STRAPI_API[collection]}?${params}`;
    console.info(`[debug] strapiDataProvider.ts: StrapiDataProvider.getData() url: ${url}`);
    return this.fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error(`Response: ${response.status} / ${response.statusText}`);
        return response.json().then((parsed: StrapiResponse<TData> | StrapiError) => {
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
