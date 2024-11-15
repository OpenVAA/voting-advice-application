/**
 * This is a limited `DataProvider` implementation for use with the Strapi backend.
 *
 * To build REST queries, one can use https://docs.strapi.io/dev-docs/api/rest/interactive-query-builder
 */

import { error } from '@sveltejs/kit';
import { browser } from '$app/environment';
import { locale as currentLocale, locales } from '$lib/i18n';
import { matchLocale } from '$lib/i18n/utils/matchLocale';
import { translate, translateObject } from '$lib/i18n/utils/translate';
import { constants } from '$lib/utils/constants';
import { formatName } from '$lib/utils/internationalisation';
import { parseImage, parseParty, parseQuestionCategory } from './utils';
import { parseAnswers } from './utils/parseAnswers';
import { parseCustomData } from './utils/parseCustomData';
import type {
  DataProvider,
  FeedbackData,
  GetAllPartiesOptions,
  GetAnyQuestionsOptions,
  GetDataOptionsBase,
  GetElectionOptions,
  GetNominatedCandidatesOptions,
  GetNominatingPartiesOptions,
  GetQuestionsOptionsBase
} from '../dataProvider';
import type {
  StrapiAppCustomizationData,
  StrapiAppSettingsData,
  StrapiElectionData,
  StrapiError,
  StrapiFeedbackData,
  StrapiNominationData,
  StrapiPartyData,
  StrapiQuestionCategoryData,
  StrapiResponse
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
function getData<TData extends object>(
  endpoint: string,
  params: URLSearchParams = new URLSearchParams({})
): Promise<TData> {
  if (!params.has('pagination[pageSize]')) {
    params = new URLSearchParams(params);
    params.set('pagination[pageSize]', `${ITEM_LIMIT}`);
  }
  const url = `${browser ? constants.PUBLIC_BACKEND_URL : constants.BACKEND_URL}/${endpoint}?${params}`;
  return fetch(url)
    .then((response) => {
      return response.json().then((parsed: StrapiResponse<TData> | StrapiError) => {
        if ('error' in parsed) throw new Error(`Error with getData: ${parsed?.error?.message} • ${url}`);
        return parsed.data;
      });
    })
    .catch((e) => {
      throw new Error(`Error with getData: ${e?.message} • ${url}`);
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
function getAppSettings(): Promise<Partial<AppSettings> | undefined> {
  const params = new URLSearchParams({
    'populate[entities][populate][hideIfMissingAnswers]': 'true',
    'populate[entityDetails][populate][contents]': 'true',
    'populate[entityDetails][populate][showMissingAnswers]': 'true',
    'populate[entityDetails][populate][showMissingElectionSymbol]': 'true',
    'populate[header]': 'true',
    'populate[headerStyle][populate][dark]': 'true',
    'populate[headerStyle][populate][light]': 'true',
    'populate[matching]': 'true',
    'populate[questions][populate][categoryIntros]': 'true',
    'populate[questions][populate][questionsIntro]': 'true',
    'populate[results][populate][cardContents]': 'true',
    'populate[survey]': 'true'
  });
  return getData<Array<StrapiAppSettingsData>>('api/app-settings', params)
    .then((result) => {
      if (result.length !== 1) error(500, `Expected one AppSettings object, but got ${result.length}`);
      const appSettings = Object.fromEntries(Object.entries(result[0].attributes).filter(([, value]) => value));
      return appSettings;
    })
    .catch(() => undefined);
}

/**
 * Get app customization defined in Strapi.
 */
function getAppCustomization({ locale }: GetDataOptionsBase = {}): Promise<AppCustomization> {
  const params = new URLSearchParams({
    'populate[translationOverrides][populate][translations]': 'true',
    'populate[candidateAppFAQ]': 'true',
    'populate[publisherLogo]': 'true',
    'populate[publisherLogoDark]': 'true',
    'populate[poster]': 'true',
    'populate[posterDark]': 'true',
    'populate[candPoster]': 'true',
    'populate[candPosterDark]': 'true'
  });
  return getData<StrapiAppCustomizationData>('api/app-customization', params).then((result) => {
    const attr = result.attributes;
    const publisherLogo = attr.publisherLogo?.data?.attributes;
    const publisherLogoDark = attr.publisherLogoDark?.data?.attributes;
    const poster = attr.poster?.data?.attributes;
    const posterDark = attr.posterDark?.data?.attributes;
    const candPoster = attr.candPoster?.data?.attributes;
    const candPosterDark = attr.candPosterDark?.data?.attributes;
    return {
      translationOverrides: translateObject(attr.translationOverrides, locale),
      candidateAppFAQ: translateObject(attr.candidateAppFAQ, locale),
      publisherName: attr.publisherName ? translate(attr.publisherName, locale) : undefined,
      publisherLogo: publisherLogo ? parseImage(publisherLogo) : undefined,
      publisherLogoDark: publisherLogoDark ? parseImage(publisherLogoDark) : undefined,
      poster: poster ? parseImage(poster) : undefined,
      posterDark: posterDark ? parseImage(posterDark) : undefined,
      candPoster: candPoster ? parseImage(candPoster) : undefined,
      candPosterDark: candPosterDark ? parseImage(candPosterDark) : undefined
    };
  });
}

/**
 * Get election data from Strapi.
 */
function getElection({ id, locale }: GetElectionOptions = {}): Promise<LegacyElectionProps> {
  locale ??= currentLocale.get();
  // Match locale softly
  const matchingLocale = matchLocale(locale || '', locales.get());
  if (!matchingLocale) error(500, `Locale ${locale} not supported`);
  const params = new URLSearchParams({});
  if (id) params.set('filters[id][$eq]', id);
  return getData<Array<StrapiElectionData>>('api/elections', params).then((result) => {
    if (!result.length) error(500, 'No election found');
    const el = result[0];
    const attr = el.attributes;
    const name = translate(attr.name, locale);
    const shortName = translate(attr.shortName, locale);
    return {
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
}: GetNominatedCandidatesOptions = {}): Promise<Array<LegacyCandidateProps>> {
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
  return getData<Array<StrapiNominationData>>('api/nominations', params).then((result) =>
    result
      .filter((nom) => nom.attributes.candidate?.data != null)
      .map((nom) => {
        const cnd = nom.attributes.candidate.data;
        const id = '' + cnd.id;
        const attr = cnd.attributes;
        const { firstName, lastName } = attr;
        const props: LegacyCandidateProps = {
          id,
          electionRound: nom.attributes.electionRound,
          electionSymbol: nom.attributes.electionSymbol,
          firstName,
          lastName,
          name: formatName({ firstName, lastName }),
          party: nom.attributes.party.data ? parseParty(nom.attributes.party.data, locale) : undefined,
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
function getAllParties({ id, loadAnswers, loadMembers, locale }: GetAllPartiesOptions = {}): Promise<
  Array<LegacyPartyProps>
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
  return getData<Array<StrapiPartyData>>('api/parties', params).then((result) => {
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
}: GetNominatingPartiesOptions = {}): Promise<Array<LegacyPartyProps>> {
  // We first get all available parties and then fetch the nominated candidates for them
  // The reason we do this, is that we don't want to populate the parties deeply within
  // the Nominations, because they would be reduplicated for each candidate Nomination
  return getAllParties({ loadAnswers, loadMembers, locale }).then((parties) => {
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
    return getData<Array<StrapiNominationData>>('api/nominations', params).then((result) => {
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
            error(500, `Could not retrieve result for nominating parties: party with id '${partyId}' not found`);
          if (loadNominations) {
            const candId = nom.attributes.candidate.data?.id;
            if (candId != null) {
              party.nominatedCandidateIds ??= [];
              party.nominatedCandidateIds.push(candId + '');
            }
          }
        });
      // Only return those parties that were found in the nominations
      return Array.from(partyIds).map((id) => partyMap.get(id) as LegacyPartyProps);
    });
  });
}

/**
 * Get all questions from Strapi.
 * NB. We use the `question-categories` endpoint, and thus any Questions that do not belong to a category are excluded.
 */
function getQuestions({ electionId, locale, categoryType }: GetAnyQuestionsOptions = {}): Promise<
  Array<LegacyQuestionProps>
> {
  const params = new URLSearchParams({
    'populate[questions][populate][questionType]': 'true',
    sort: 'order:asc'
  });
  categoryType ??= 'opinion';
  if (categoryType !== 'all') params.set('filters[type][$eq]', categoryType);
  if (electionId != null) params.set('filters[elections][id][$eq]', electionId);
  return getData<Array<StrapiQuestionCategoryData>>('api/question-categories', params).then((result) => {
    const questions: Array<LegacyQuestionProps> = [];
    for (const cat of result) {
      // Because the caterory needs references to the questions, we need to parse them first and supply them later
      const catQuestions: Array<LegacyQuestionProps> = [];
      const catProps = parseQuestionCategory(cat, locale);
      for (const qst of cat.attributes.questions.data) {
        const attr = qst.attributes;
        const settings = attr.questionType?.data.attributes.settings;
        if (!settings) error(500, `Question with id '${qst.id}' has no settings!`);
        const text = translate(attr.text, locale);
        const shortName = translate(attr.shortName, locale);
        const props: LegacyQuestionProps = {
          id: `${qst.id}`,
          order: attr.order ?? 0,
          required: attr.required ?? true,
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
          props.values = settings.values.map(({ key, label }) => ({
            key,
            label: translate(label, locale)
          }));
        if ('min' in settings) props.min = settings.min;
        if ('max' in settings) props.max = settings.max;
        if ('dateType' in settings) props.dateType = settings.dateType;
        if ('textType' in settings) props.textType = settings.textType;
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
function getOpinionQuestions({ electionId, locale }: GetQuestionsOptionsBase = {}) {
  return getQuestions({
    electionId,
    locale,
    categoryType: 'opinion'
  });
}

/**
 * A shorthand for getting all info questions from Strapi.
 */
function getInfoQuestions({ electionId, locale }: GetQuestionsOptionsBase = {}) {
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
  getAppCustomization,
  getElection,
  getQuestions,
  getInfoQuestions,
  getOpinionQuestions,
  getAllParties,
  getNominatingParties,
  getNominatedCandidates,
  setFeedback
};
