import {error} from '@sveltejs/kit';
import {browser} from '$app/environment';
import {locale as currentLocale, locales} from '$lib/i18n';
import {constants} from '$lib/utils/constants';
import {formatName} from '$lib/utils/internationalisation';
import {matchLocale} from '$lib/i18n/utils/matchLocale';
import {translate} from '$lib/i18n/utils/translate';
import {ensureColors} from './utils/color';
import {parseAnswers} from './utils/localization';
import type {
  StrapiElectionData,
  StrapiError,
  StrapiNominationData,
  StrapiPartyData,
  StrapiResponse,
  StrapiAppLabelsData,
  LocalizedStrapiData,
  StrapiQuestionCategoryData,
  StrapiImageData
} from './getData.type';

// To build REST queries, one can use https://docs.strapi.io/dev-docs/api/rest/interactive-query-builder

///////////////////////////////////////////////////////////////////////
// Function declarations
///////////////////////////////////////////////////////////////////////

/** Generic data getter. In most cases, you should use the dedicated functions. */
export function getData<T extends object>(
  endpoint: string,
  params: URLSearchParams = new URLSearchParams({})
): Promise<T> {
  // Support both SSR and browser as the preview page on candidate's site wants to mimic the candidate preview as closely as possible
  const url = `${browser ? constants.PUBLIC_BACKEND_URL : constants.BACKEND_URL}/${endpoint}?${params}`;
  return fetch(url)
    .then((response) => {
      return response.json().then((parsed: StrapiResponse<T> | StrapiError) => {
        if ('error' in parsed) throw new Error(parsed.error.message);
        return parsed.data;
      });
    })
    .catch((e) => {
      // This is unexpected, so we don't use error()
      throw new Error(e);
    });
}

/**
 * Get election data from Strapi including the app labels.
 * @param id The id of the Election the labels are used for
 * @param locale The locale to translate the texts to
 */
export const getElection = ({
  id,
  locale
}: {
  id?: string;
  locale?: string;
} = {}): Promise<ElectionProps> => {
  locale ??= currentLocale.get();
  // Match locale softly
  const matchingLocale = matchLocale(locale || '', locales.get());
  if (!matchingLocale) throw error(500, `Locale ${locale} not supported`);
  const params = new URLSearchParams({
    'populate[electionAppLabel][populate][actionLabels]': 'true',
    'populate[electionAppLabel][populate][viewTexts]': 'true',
    'populate[electionAppLabel][populate][localizations][populate]': '*'
  });
  if (id) params.set('filters[id][$eq]', id);
  return getData<StrapiElectionData[]>('api/elections', params).then((result) => {
    if (!result.length) throw error(500, 'No election found');
    const el = result[0];
    let appLabels: StrapiAppLabelsData | LocalizedStrapiData<StrapiAppLabelsData>;
    const localized = el?.attributes?.electionAppLabel?.data;

    if (localized?.attributes?.locale === matchingLocale) {
      appLabels = localized;
    } else {
      const found = localized?.attributes?.localizations?.data?.find(
        (d) => d?.attributes?.locale === matchingLocale
      );
      if (!found)
        throw error(500, `Could not find app labels for election ${el.id} and locale ${locale}`);
      appLabels = found;
    }
    // Remove localizations and unnecessary details from appLabels
    for (const key of ['id', 'localizations', 'createdAt', 'publishedAt', 'updatedAt', 'locale']) {
      delete appLabels.attributes[key as keyof StrapiAppLabelsData['attributes']];
    }
    return {
      appLabels: appLabels.attributes,
      electionDate: el.attributes.electionDate,
      id: `${el.id}`,
      name: translate(el.attributes.name, locale),
      shortName: translate(el.attributes.shortName, locale),
      type: el.attributes.electionType ?? ''
    };
  });
};

/**
 * Get data for all candidates from Strapi. NB. This only includes Candidates that
 * are nominated in some Election.
 * @param id The id of the Candidate
 * @param electionId The id of the Election the Candidates are nominated for
 * @param constituencyId The id of the Constituency the Candidates are nominated in
 * @param memberOfPartyId The id of the Party the Candidates are members of
 * @param nominatingPartyId The id of the Party the Candidates are nominated by
 * @param loadAnswers If true, the Candidates' Answers will also be loaded
 * @param locale The locale to translate the texts to
 * @returns An Array of matching Candidates, which may be empty
 */
export const getNominatedCandidates = ({
  id,
  electionId,
  constituencyId,
  locale,
  memberOfPartyId,
  nominatingPartyId,
  loadAnswers
}: {
  id?: string;
  electionId?: string;
  constituencyId?: string;
  locale?: string;
  memberOfPartyId?: string;
  nominatingPartyId?: string;
  loadAnswers?: boolean;
} = {}): Promise<CandidateProps[]> => {
  const params = new URLSearchParams({
    // We need a specific calls to populate relations, * only goes one-level deep
    'populate[election]': 'true',
    'populate[constituency]': 'true',
    'populate[party][populate][logo]': 'true',
    // Not used currently, would be memberOf property
    // 'populate[candidate][populate][party]': 'true',
    'populate[candidate][populate][photo]': 'true',
    'populate[candidate][populate][gender]': 'true',
    'populate[candidate][populate][motherTongues]': 'true',
    'populate[candidate][populate][otherLanguages]': 'true',
    'populate[candidate][populate][answers][populate][question]': loadAnswers ? 'true' : 'false'
  });
  if (id) {
    params.set('filters[candidate][id][$eq]', id);
  } else {
    params.set('filters[candidate][id][$notNull]', 'true'); // We need to apply $notNull to id, not the candidate relation
  }
  if (constituencyId != null) params.set('filters[constituency][id][$eq]', constituencyId);
  if (electionId != null) params.set('filters[election][id][$eq]', electionId);
  if (memberOfPartyId != null) params.set('filters[candidate][party][id][$eq]', memberOfPartyId);
  if (nominatingPartyId != null) params.set('filters[party][id][$eq]', nominatingPartyId);
  return getData<StrapiNominationData[]>('api/nominations', params).then((result) =>
    result.map((nom) => {
      const cnd = nom.attributes.candidate.data;
      const id = '' + cnd.id;
      const attr = cnd.attributes;
      if (!nom.attributes.party.data)
        throw error(
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
};

/**
 * Get data for all parties from Strapi.
 * @param loadAnswers If true, the Parties' Answers will also be loaded
 * @param loadMembers If true, the Parties' member Candidates will also be loaded
 * @param locale The locale to translate the texts to
 */
export const getAllParties = ({
  loadAnswers,
  loadMembers,
  locale
}: {
  loadAnswers?: boolean;
  loadMembers?: boolean;
  locale?: string;
} = {}): Promise<PartyProps[]> => {
  const params = new URLSearchParams({
    // We need a specific calls to populate relations, * only goes one-level deep
    'populate[logo]': 'true',
    'populate[candidates]': loadMembers ? 'true' : 'false',
    'populate[answers][populate][question]': loadAnswers ? 'true' : 'false'
  });
  return getData<StrapiPartyData[]>('api/parties', params).then((result) => {
    return result.map((prt) => parseParty(prt, locale, loadAnswers, loadMembers));
  });
};

/**
 * Parse Strapi Party data into a `PartyProps` object.
 */
const parseParty = (
  party: StrapiPartyData,
  locale?: string,
  includeAnswers = false,
  includeMembers = false
): PartyProps => {
  const id = `${party.id}`;
  const attr = party.attributes;
  const props: PartyProps = {
    electionRound: 0, // We use a default here
    id,
    info: translate(attr.info, locale),
    name: translate(attr.name, locale),
    shortName: translate(attr.shortName, locale),
    ...ensureColors(attr.color, attr.colorDark),
    answers: includeAnswers && attr.answers?.data ? parseAnswers(attr.answers.data, locale) : {}
  };
  const photo = attr.logo?.data?.attributes;
  if (photo) props.photo = parseImage(photo);
  if (includeMembers) props.memberCandidateIds = attr.candidates.data.map((c) => `${c.id}`);
  return props;
};

/**
 * Get data for all parties from Strapi that have nominations in some Election.
 * @param id The id of the Party
 * @param electionId The id of the Election the Parties are nominated for
 * @param constituencyId The id of the Constituency the Parties are nominated in
 * @param loadAnswers If true, the Parties' Answers will also be loaded
 * @param loadMembers If true, the Parties' member Candidates will also be loaded
 * @param loadNominations If true, the Parties' nominated Candidates will also be loaded
 * @param locale The locale to translate the texts to
 * @returns An Array of matching Parties, which may be empty
 */
export const getNominatingParties = ({
  id,
  electionId,
  constituencyId,
  loadAnswers,
  loadMembers,
  loadNominations,
  locale
}: {
  id?: string;
  electionId?: string;
  constituencyId?: string;
  loadAnswers?: boolean;
  loadMembers?: boolean;
  loadNominations?: boolean;
  locale?: string;
} = {}): Promise<PartyProps[]> => {
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
    } else {
      params.set('filters[party][id][$notNull]', 'true'); // We need to apply $notNull to id, not the candidate relation
    }
    if (constituencyId != null) params.set('filters[constituency][id][$eq]', constituencyId);
    if (electionId != null) params.set('filters[election][id][$eq]', electionId);
    return getData<StrapiNominationData[]>('api/nominations', params).then((result) => {
      // For easier access by id
      const partyMap = new Map(parties.map((p) => [p.id, p]));
      // We collect the ids of the parties in these nominations here
      const partyIds = new Set<string>();
      // Get the nominated candidates for each party
      result.map((nom) => {
        const partyId = `${nom.attributes.party.data.id}`;
        partyIds.add(partyId);
        const party = partyMap.get(partyId);
        if (!party)
          throw error(
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
};

/**
 * Get all questions from Strapi.
 *
 * NB. We use the `question-categories` endpoint, and thus any Questions that do not
 * belong to a category are excluded.
 *
 * TODO: Enable ordering
 * @param electionId The id of the Election the Questions are for
 * @param categoryType The type of the question category to include. @default 'opinion'
 * @param locale The locale to translate the texts to
 */
export const getQuestions = ({
  electionId,
  locale,
  categoryType
}: {
  electionId?: string;
  locale?: string;
  categoryType?: QuestionCategoryType | 'all';
} = {}): Promise<QuestionProps[]> => {
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
      const catProps = parseQuestionCategory(cat, locale);
      for (const qst of cat.attributes.questions.data) {
        const attr = qst.attributes;
        const settings = attr.questionType?.data.attributes.settings;
        if (!settings) throw new Error(`Question with id '${qst.id}' has no settings!`);
        const props: QuestionProps = {
          id: `${qst.id}`,
          order: attr.order ?? 0,
          text: translate(attr.text, locale),
          info: translate(attr.info, locale),
          shortName: translate(attr.shortName, locale),
          category: catProps,
          filterable: attr.filterable ?? false,
          type: settings.type
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
        questions.push(props);
      }
    }
    // Sort by ascending order of first category and then question
    return questions.sort((a, b) => {
      const catCmp = a.category.order - b.category.order;
      if (catCmp !== 0) return catCmp;
      return (a.order ?? 0) - (b.order ?? 0);
    });
  });
};

/**
 * Parse StrapiQuestionCategory data into a `QuestionCategoryProps` object.
 */
const parseQuestionCategory = (
  category: StrapiQuestionCategoryData,
  locale?: string
): QuestionCategoryProps => {
  const id = `${category.id}`;
  const attr = category.attributes;
  const props: QuestionCategoryProps = {
    id,
    order: attr.order ?? 0,
    type: attr.type,
    info: translate(attr.info, locale),
    name: translate(attr.name, locale),
    shortName: translate(attr.shortName, locale),
    ...ensureColors(attr.color, attr.colorDark)
  };
  return props;
};

/**
 * A shorthand for getting all opinion questions from Strapi.
 * @param electionId The id of the Election the Questions are for
 * @param locale The locale to translate the texts to
 */
export const getOpinionQuestions = ({
  electionId,
  locale
}: {
  electionId?: string;
  locale?: string;
} = {}) => {
  return getQuestions({
    electionId,
    locale,
    categoryType: 'opinion'
  });
};

/**
 * A shorthand for getting all info questions from Strapi.
 * @param electionId The id of the Election the Questions are for
 * @param locale The locale to translate the texts to
 */
export const getInfoQuestions = ({
  electionId,
  locale
}: {
  electionId?: string;
  locale?: string;
} = {}) => {
  return getQuestions({
    electionId,
    locale,
    categoryType: 'info'
  });
};

/**
 * Parse image properties from Strapi, providing the full image url as a default for the thumbnail.
 */
const parseImage = (image: StrapiImageData): ImageProps => {
  const url = `${constants.PUBLIC_BACKEND_URL}${image.url}`;
  return {
    url,
    thumbnail: {
      url: image.formats?.thumbnail
        ? `${constants.PUBLIC_BACKEND_URL}${image.formats.thumbnail.url}`
        : url
    }
  };
};
