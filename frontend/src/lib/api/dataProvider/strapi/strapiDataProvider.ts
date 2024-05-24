/**
 * This is a limited `DataProvider` implementation for use with the Strapi backend.
 *
 * To build REST queries, one can use https://docs.strapi.io/dev-docs/api/rest/interactive-query-builder
 */

import {error} from '@sveltejs/kit';
import {locale as currentLocale, locales} from '$lib/i18n';
import {constants} from '$lib/utils/constants';
import {formatName} from '$lib/utils/internationalisation';
import {matchLocale} from '$lib/i18n/utils/matchLocale';
import {translate} from '$lib/i18n/utils/translate';
import {parseAnswers} from './utils/parseAnswers';
import {parseCustomData} from './utils/parseCustomData';
import type {
  FeedbackData,
  GetAllPartiesOptions,
  GetAnyQuestionsOptions,
  GetDataOptionsBase,
  GetElectionOptions,
  GetNominatedCandidatesOptions,
  GetNominatingPartiesOptions,
  GetQuestionsOptionsBase,
  DataProvider
} from '../dataProvider';
import {parseParty, parseImage, parseQuestionCategory} from './utils';
import type {
  StrapiElectionData,
  StrapiError,
  StrapiNominationData,
  StrapiPartyData,
  StrapiResponse,
  StrapiAppLabelsData,
  LocalizedStrapiData,
  StrapiQuestionCategoryData,
  StrapiAppSettingsData,
  StrapiFeedbackData
} from './strapiDataProvider.type';

/**
 * The default limit for query results. This is set to be very high, because we don't use pagination.
 * NB! Make sure that Strapi's own config is also high enough, see `/backend/vaa-strapi/config/server.ts`
 */
const ITEM_LIMIT = 1000;

///////////////////////////////////////////////////////
// MAIN INTERNAL GETTER
///////////////////////////////////////////////////////

/**
 * Generic data getter. In most cases, you should use the dedicated functions.
 * NB. If the `pagination[pageSize]` param is not set, the default value of `ITEM_LIMIT` is used.
 */
function getData<T extends object>(
  endpoint: string,
  params: URLSearchParams = new URLSearchParams({})
): Promise<T> {
  if (!params.has('pagination[pageSize]')) {
    params = new URLSearchParams(params);
    params.set('pagination[pageSize]', `${ITEM_LIMIT}`);
  }
  const url = `${constants.BACKEND_URL}/${endpoint}?${params}`;
  return fetch(url)
    .then((response) => {
      return response.json().then((parsed: StrapiResponse<T> | StrapiError) => {
        if ('error' in parsed) throw new Error(`Error with getData: ${parsed?.error?.message}`);
        return parsed.data;
      });
    })
    .catch((e) => {
      throw new Error(`Error with getData: ${e?.message}`);
    });
}

///////////////////////////////////////////////////////
// DATAPROVIDER IMPLEMENTATION
///////////////////////////////////////////////////////

/**
 * Get app settings defined in Strapi.
 * NB. `getAppSettings` can be used to test the database connection, because unlike the other `getData` functions, it will not throw if a connection could not be made but instead resolves to `undefined`.
 * @returns The app settings or `undefined` if there was an error
 */
function getAppSettings({locale}: GetDataOptionsBase = {}): Promise<
  Partial<AppSettings> | undefined
> {
  const params = new URLSearchParams({
    'populate[poster]': 'true',
    'populate[posterCandidateApp]': 'true',
    'populate[publisherLogo]': 'true',
    'populate[publisherLogoDark]': 'true'
  });
  return getData<StrapiAppSettingsData[]>('api/app-settings', params)
    .then((result) => {
      if (result.length !== 1)
        error(500, `Expected one AppSettings object, but got ${result.length}`);
      const attr = result[0].attributes;
      const publisher: AppSettings['publisher'] = {
        name: translate(attr.publisherName, locale)
      };
      if (attr.publisherLogo.data) publisher.logo = parseImage(attr.publisherLogo.data.attributes);
      if (attr.publisherLogoDark.data)
        publisher.logoDark = parseImage(attr.publisherLogoDark.data.attributes);
      const poster = attr.poster?.data?.attributes;
      const posterCandidateApp = attr.posterCandidateApp?.data?.attributes;
      return {
        publisher,
        poster: poster ? parseImage(poster) : undefined,
        posterCandidateApp: posterCandidateApp ? parseImage(posterCandidateApp) : undefined,
        underMaintenance: attr.underMaintenance ?? false
      };
    })
    .catch(() => undefined);
}

/**
 * Get election data from Strapi including the possible app labels.
 */
function getElection({id, locale}: GetElectionOptions = {}): Promise<ElectionProps> {
  locale ??= currentLocale.get();
  // Match locale softly
  const matchingLocale = matchLocale(locale || '', locales.get());
  if (!matchingLocale) error(500, `Locale ${locale} not supported`);
  const params = new URLSearchParams({
    'populate[electionAppLabel][populate][actionLabels]': 'true',
    'populate[electionAppLabel][populate][viewTexts]': 'true',
    'populate[electionAppLabel][populate][localizations][populate]': '*'
  });
  if (id) params.set('filters[id][$eq]', id);
  return getData<StrapiElectionData[]>('api/elections', params).then((result) => {
    if (!result.length) error(500, 'No election found');
    const el = result[0];
    const attr = el.attributes;
    let appLabels: StrapiAppLabelsData | LocalizedStrapiData<StrapiAppLabelsData> | undefined;
    const localized = attr.electionAppLabel?.data;
    if (localized?.attributes?.locale === matchingLocale) {
      appLabels = localized;
    } else {
      appLabels = localized?.attributes?.localizations?.data?.find(
        (d) => d?.attributes?.locale === matchingLocale
      );
    }
    if (appLabels) {
      // Remove localizations and unnecessary details from appLabels
      for (const key of [
        'id',
        'localizations',
        'createdAt',
        'publishedAt',
        'updatedAt',
        'locale'
      ]) {
        delete appLabels.attributes[key as keyof StrapiAppLabelsData['attributes']];
      }
    }
    const name = translate(attr.name, locale);
    const shortName = translate(attr.shortName, locale);
    return {
      appLabels: appLabels?.attributes,
      electionDate: attr.electionDate,
      id: `${el.id}`,
      name,
      shortName: shortName ? shortName : name,
      type: attr.electionType ?? ''
    };
  });
}

/**
 * Get data for all candidates from Strapi. NB. This only includes Candidates that are nominated in some Election.
 * @returns An Array of matching Candidates, which may be empty
 */
function getNominatedCandidates({
  id,
  electionId,
  constituencyId,
  locale,
  memberOfPartyId,
  nominatingPartyId,
  loadAnswers
}: GetNominatedCandidatesOptions = {}): Promise<CandidateProps[]> {
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
  return getData<StrapiNominationData[]>('api/nominations', params).then((result) =>
    result
      .filter((nom) => nom.attributes.candidate?.data != null)
      .map((nom) => {
        const cnd = nom.attributes.candidate.data;
        const id = '' + cnd.id;
        const attr = cnd.attributes;
        if (!nom.attributes.party.data)
          error(
            500,
            `Could not retrieve result for nominating candidates: party for candidate with id '${id}' not found`
          );
        const {firstName, lastName} = attr;
        const props: CandidateProps = {
          id,
          electionRound: nom.attributes.electionRound,
          electionSymbol: nom.attributes.electionSymbol,
          firstName,
          lastName,
          name: formatName({firstName, lastName}),
          party: parseParty(nom.attributes.party.data, locale),
          answers: loadAnswers && attr.answers?.data ? parseAnswers(attr.answers.data, locale) : {}
        };
        const photo = attr.photo?.data?.attributes;
        if (photo) props.photo = parseImage(photo);
        return props;
      })
  );
}

/**
 * Get data for all parties from Strapi.
 */
function getAllParties({id, loadAnswers, loadMembers, locale}: GetAllPartiesOptions = {}): Promise<
  PartyProps[]
> {
  const params = new URLSearchParams({
    // We need a specific calls to populate relations, * only goes one-level deep
    'populate[logo]': 'true',
    'populate[candidates]': loadMembers ? 'true' : 'false',
    'populate[answers][populate][question]': loadAnswers ? 'true' : 'false'
  });
  if (id) {
    params.set('filters[id][$eq]', id);
  }
  return getData<StrapiPartyData[]>('api/parties', params).then((result) => {
    return result.map((prt) => parseParty(prt, locale, loadAnswers, loadMembers));
  });
}

/**
 * Get data for all parties from Strapi that have nominations in some Election.
 * @returns An Array of matching Parties, which may be empty
 */
function getNominatingParties({
  id,
  electionId,
  constituencyId,
  loadAnswers,
  loadMembers,
  loadNominations,
  locale
}: GetNominatingPartiesOptions = {}): Promise<PartyProps[]> {
  // We first get all available parties and then fetch the nominated candidates for them
  // The reason we do this, is that we don't want to populate the parties deeply within
  // the Nominations, because they would be reduplicated for each candidate Nomination
  return getAllParties({loadAnswers, loadMembers, locale}).then((parties) => {
    const params = new URLSearchParams({
      'populate[party]': 'true',
      'populate[candidate]': loadNominations ? 'true' : 'false'
    });
    if (id) {
      params.set('filters[party][id][$eq]', id);
    }
    // Checking for missing relations is tricky, $notNull has very strange bugs, which may be fixed in 4.23.0 and we can't use the filter below. We'll instead filter the results after the fact. See: https://github.com/strapi/strapi/issues/12225
    // else {params.set('filters[party][id][$notNull]', 'true');}
    if (constituencyId != null) params.set('filters[constituency][id][$eq]', constituencyId);
    if (electionId != null) params.set('filters[election][id][$eq]', electionId);
    return getData<StrapiNominationData[]>('api/nominations', params).then((result) => {
      // For easier access by id
      const partyMap = new Map(parties.map((p) => [p.id, p]));
      // We collect the ids of the parties in these nominations here
      const partyIds = new Set<string>();
      // Get the nominated candidates for each party
      result
        .filter((nom) => nom.attributes.party?.data != null)
        .map((nom) => {
          const partyId = `${nom.attributes.party.data.id}`;
          partyIds.add(partyId);
          const party = partyMap.get(partyId);
          if (!party)
            error(
              500,
              `Could not retrieve result for nominating parties: party with id '${partyId}' not found`
            );
          if (loadNominations) {
            const candId = nom.attributes.candidate.data?.id;
            if (candId != null) {
              party.nominatedCandidateIds ??= [];
              party.nominatedCandidateIds.push(candId + '');
            }
          }
        });
      // Only return those parties that were found in the nominations
      return Array.from(partyIds).map((id) => partyMap.get(id) as PartyProps);
    });
  });
}

/**
 * Get all questions from Strapi.
 * NB. We use the `question-categories` endpoint, and thus any Questions that do not belong to a category are excluded.
 */
function getQuestions({electionId, locale, categoryType}: GetAnyQuestionsOptions = {}): Promise<
  QuestionProps[]
> {
  const params = new URLSearchParams({
    'populate[questions][populate][questionType]': 'true',
    sort: 'order:asc'
  });
  categoryType ??= 'opinion';
  if (categoryType !== 'all') params.set('filters[type][$eq]', categoryType);
  if (electionId != null) params.set('filters[elections][id][$eq]', electionId);
  return getData<StrapiQuestionCategoryData[]>('api/question-categories', params).then((result) => {
    const questions: QuestionProps[] = [];
    for (const cat of result) {
      // Because the caterory needs references to the questions, we need to parse them first and supply them later
      const catQuestions: QuestionProps[] = [];
      const catProps = parseQuestionCategory(cat, locale);
      for (const qst of cat.attributes.questions.data) {
        const attr = qst.attributes;
        const settings = attr.questionType?.data.attributes.settings;
        if (!settings) error(500, `Question with id '${qst.id}' has no settings!`);
        const text = translate(attr.text, locale);
        const shortName = translate(attr.shortName, locale);
        const props: QuestionProps = {
          id: `${qst.id}`,
          order: attr.order ?? 0,
          text,
          info: translate(attr.info, locale),
          shortName: shortName ? shortName : text,
          filterable: attr.filterable ?? false,
          entityType: attr.entityType ?? 'all',
          type: settings.type,
          customData: attr.customData ? parseCustomData(attr.customData) : null,
          category: catProps
        };
        if ('values' in settings)
          props.values = settings.values.map(({key, label}) => ({
            key,
            label: translate(label, locale)
          }));
        if ('min' in settings) props.min = settings.min;
        if ('max' in settings) props.max = settings.max;
        if ('dateType' in settings) props.dateType = settings.dateType;
        if ('notLocalizable' in settings) props.notLocalizable = settings.notLocalizable;
        catQuestions.push(props);
      }
      catProps['questions'] = catQuestions;
      questions.push(...catQuestions);
    }
    // Sort by ascending order of first category and then question
    return questions.sort((a, b) => {
      const catCmp = a.category.order - b.category.order;
      if (catCmp !== 0) return catCmp;
      return (a.order ?? 0) - (b.order ?? 0);
    });
  });
}

/**
 * A shorthand for getting all opinion questions from Strapi.
 */
function getOpinionQuestions({electionId, locale}: GetQuestionsOptionsBase = {}) {
  return getQuestions({
    electionId,
    locale,
    categoryType: 'opinion'
  });
}

/**
 * A shorthand for getting all info questions from Strapi.
 */
function getInfoQuestions({electionId, locale}: GetQuestionsOptionsBase = {}) {
  return getQuestions({
    electionId,
    locale,
    categoryType: 'info'
  });
}

/**
 * Send feedback to Strapi.
 */
function setFeedback(data: FeedbackData): Promise<Response | undefined> {
  // NB. We need to use the public backend URL here, bc this is function is called from the client side
  const url = `${constants.PUBLIC_BACKEND_URL}/api/feedbacks`;
  const request = {
    method: 'POST',
    body: JSON.stringify({
      data: data as StrapiFeedbackData['attributes']
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  };
  return fetch(url, request).catch((e) => {
    console.error('Error in posting feedback to Strapi: ', e);
    return undefined;
  });
}

///////////////////////////////////////////////////////
// EXPORT
///////////////////////////////////////////////////////

export const dataProvider: DataProvider = {
  getAppSettings,
  getElection,
  getQuestions,
  getInfoQuestions,
  getOpinionQuestions,
  getAllParties,
  getNominatingParties,
  getNominatedCandidates,
  setFeedback
};
