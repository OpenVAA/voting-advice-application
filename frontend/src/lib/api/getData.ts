import {error} from '@sveltejs/kit';
import {locale as currentLocale, locales} from '$lib/i18n';
import {constants} from '$lib/utils/constants';
import {matchLocale} from '$lib/i18n/utils/matchLocale';
import {logDebugError} from '$lib/utils/logger';
import {parseAnswers} from './utils/localization';
import type {
  GetDataOptions,
  StrapiElectionData,
  StrapiError,
  StrapiNominationData,
  StrapiPartyData,
  StrapiQuestionTypeData,
  StrapiResponse,
  TestDataProps,
  StrapiTestData,
  StrapiAppLabelsData,
  LocalizedStrapiData
} from './getData.type';
import {translate} from '$lib/i18n/utils/translate';

// To build REST queries, one can use https://docs.strapi.io/dev-docs/api/rest/interactive-query-builder

///////////////////////////////////////////////////////////////////////
// Function declarations
///////////////////////////////////////////////////////////////////////

/** Generic data getter. In most cases, you should use the dedicated functions. */
export function getData<T extends object>(
  endpoint: string,
  params: URLSearchParams = new URLSearchParams({})
) {
  const url = `${constants.BACKEND_URL}/${endpoint}?${params}`;
  return fetch(url, {
    headers: {
      Authorization: `Bearer ${constants.STRAPI_TOKEN}`
    }
  })
    .then((response) => {
      return response.json().then((parsed: StrapiResponse<T> | StrapiError) => {
        if ('error' in parsed) throw new Error(parsed.error.message);
        return parsed.data;
      });
    })
    .catch((e) => {
      throw error(500, `${e}`);
    });
}

/**
 * Get election data from Strapi including the app labels.
 * @param electionId The id of the Election the labels are used for
 */
export const getElection = ({electionId, locale}: GetDataOptions = {}): Promise<ElectionProps> => {
  locale ??= currentLocale.get();
  // Match locale softly
  const matchingLocale = matchLocale(locale, locales.get());
  if (!matchingLocale) throw error(500, `Locale ${locale} not supported`);
  const params = new URLSearchParams({
    'populate[electionAppLabel][populate][actionLabels]': 'true',
    'populate[electionAppLabel][populate][viewTexts]': 'true',
    'populate[electionAppLabel][populate][localizations][populate]': '*'
  });
  return getData<StrapiElectionData[]>(addId('api/elections', electionId), params).then(
    (result) => {
      if (!result.length) throw error(500, 'No election found');
      const el = result[0];
      let appLabels: StrapiAppLabelsData | LocalizedStrapiData<StrapiAppLabelsData>;
      const localized = el.attributes.electionAppLabel.data;
      if (localized.attributes.locale === matchingLocale) {
        appLabels = localized;
      } else {
        const found = localized.attributes.localizations.data.find(
          (d) => d.attributes.locale === matchingLocale
        );
        if (!found)
          throw error(
            500,
            `Could not find app labels for election ${electionId} and locale ${locale}`
          );
        appLabels = found;
      }
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
      return {
        appLabels: appLabels.attributes,
        electionDate: el.attributes.electionDate,
        id: `${el.id}`,
        name: translate(el.attributes.name, locale),
        shortName: translate(el.attributes.shortName, locale),
        type: el.attributes.electionType ?? ''
      };
    }
  );
};

/**
 * Get app labels data from Strapi
 * @param locale The locale to use for translated strings in the data
 */
// export function getAppLabels({electionId, locale}: {electionId?: string, locale: string}): Promise<AppLabels> {
//   return getSupportedLocales().then((locales) => {
//     const params = new URLSearchParams({
//       locale: matchingLocale,
//       populate: '*'
//     });
//     if (electionId != null) {
//       params.set('filters[id][$eq]', electionId);
//     }
//     return getData<StrapiAppLabelsData[]>('api/election-app-labels', params).then(
//       (result) => {
//         if (result.length) {
//           return result[0].attributes;
//         } else {
//           throw error(500, `AppLabels not found for locale ${locale}`);
//         }
//       }
//     );
//   });
// }

/**
 * Get data for all candidates from Strapi. NB. This only includes Candidates that
 * are nominated in some Election.
 * @param id The id of the Candidate
 * @param electionId The id of the Election the Candidates are nominated for
 * @param constituencyId The id of the Constituency the Candidates are nominated in
 * @param memberOfPartyId The id of the Party the Candidates are members of
 * @param nominatingPartyId The id of the Party the Candidates are nominated by
 * @param loadAnswers If true, the Candidates' Answers will also be loaded
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
    'populate[party]': 'true',
    'populate[candidate][populate][party]': 'true',
    'populate[candidate][populate][photo]': 'true',
    'populate[candidate][populate][answers][populate][question]': loadAnswers ? 'true' : 'false',
    'filters[candidate][id][$notNull]': 'true' // We need to apply $notNull to id, not the candidate relation
  });
  if (constituencyId != null) params.set('filters[constituency][id][$eq]', constituencyId);
  if (electionId != null) params.set('filters[election][id][$eq]', electionId);
  if (memberOfPartyId != null) params.set('filters[candidate][party][id][$eq]', memberOfPartyId);
  if (nominatingPartyId != null) params.set('filters[party][id][$eq]', nominatingPartyId);
  return getData<StrapiNominationData[]>(addId('api/nominations', id), params).then((result) => {
    // if (!result.length)
    //   throw error(500, 'Could not retrieve results for nominated candidates');
    return result.map((nom) => {
      const cnd = nom.attributes.candidate.data;
      const id = '' + cnd.id;
      const attr = cnd.attributes;
      const props: CandidateProps = {
        electionRound: nom.attributes.electionRound,
        electionSymbol: nom.attributes.electionSymbol,
        firstName: attr.firstName,
        id,
        lastName: attr.lastName,
        // motherTongues: attr.motherTongues.data.map((l: StrapiLanguageData) => l.attributes.name),
        // otherLanguages: attr.otherLanguages.data.map(
        //   (l: StrapiLanguageData) => l.attributes.name
        // ),
        party: nom.attributes.party?.data
          ? {
              name: translate(nom.attributes.party.data.attributes.name, locale),
              shortName: translate(nom.attributes.party.data.attributes.shortName, locale)
            }
          : {name: '', shortName: ''},
        photo: attr.photo?.data ?? ''
      };
      if (loadAnswers)
        props['answers'] = attr.answers?.data ? parseAnswers(attr.answers.data, locale) : [];
      return props;
    });
  });
};

/**
 * Get data for all parties from Strapi.
 * @param loadAnswers If true, the Parties' Answers will also be loaded
 * @param loadMembers If true, the Parties' member Candidates will also be loaded
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
    'populate[candidates]': loadMembers ? 'true' : 'false',
    'populate[answers][populate][question]': loadAnswers ? 'true' : 'false'
  });
  return getData<StrapiPartyData[]>('api/parties', params).then((result) => {
    if (!result.length) throw error(500, 'Could not retrieve result for all parties');
    return result.map((prt) => {
      const id = `${prt.id}`;
      const attr = prt.attributes;
      const props: PartyProps = {
        electionRound: 0, // We use a default here
        id,
        info: translate(attr.info, locale),
        name: translate(attr.name, locale),
        shortName: translate(attr.shortName, locale),
        photo: attr.logo.data ?? ''
      };
      if (loadAnswers) props['answers'] = parseAnswers(attr.answers.data, locale);
      if (loadMembers) props.memberCandidateIds = attr.candidates.data.map((c) => `${c.id}`);
      return props;
    });
  });
};

/**
 * Get data for all parties from Strapi that have nominations in some Election.
 * @param id The id of the Party
 * @param electionId The id of the Election the Parties are nominated for
 * @param constituencyId The id of the Constituency the Parties are nominated in
 * @param loadAnswers If true, the Parties' Answers will also be loaded
 * @param loadMembers If true, the Parties' member Candidates will also be loaded
 * @param loadNominations If true, the Parties' nominated Candidates will also be loaded
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
      'populate[candidate]': loadNominations ? 'true' : 'false',
      'filters[party][id][$notNull]': 'true' // We need to apply $notNull to the id, not the relation
    });
    if (constituencyId != null) params.set('filters[constituency][id][$eq]', constituencyId);
    if (electionId != null) params.set('filters[election][id][$eq]', electionId);
    return getData<StrapiNominationData[]>(addId('api/nominations', id), params).then((result) => {
      // if (result.length)
      //   throw error(500, 'Could not retrieve result for nominating parties');
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
 * Get all question data from the database and convert them to a nicer format.
 * TODO:
 * - Enable other question types
 * - Base on the questions endpoint instead of type
 * - Filter based on q category type
 * - Enable ordering
 */
export const getQuestions = ({
  electionId,
  locale
}: {
  electionId?: string;
  locale?: string;
} = {}): Promise<QuestionProps[]> => {
  // The questions are contained in the data returned by the question-types
  // endpoint
  return getData<StrapiQuestionTypeData[]>(
    'api/question-types',
    new URLSearchParams({
      // We need a specific call to populate the category relations, * only goes one-level deep
      'populate[questions][populate][category][populate][elections]': 'true'
    })
  ).then((result) => {
    // if (result.length)
    //   throw error(500, 'Could not retrieve result for questions');
    logDebugError(`Getting questions for ${locale}`);
    const questions: QuestionProps[] = [];
    for (const qType of result) {
      if (qType.attributes.settings?.type !== 'singleChoiceOrdinal') {
        // TODO: Allow other question types
        // Also check TODO below
        logDebugError('Skipping all other question types than single choice ordinal for now!');
        continue;
      }
      // These contain the question type literal, possible multiple choice options as well as
      // other possible settings
      const settings = qType.attributes.settings;
      // Create the individual question objects
      qType.attributes.questions.data
        .filter(
          (d) =>
            electionId == null ||
            d.attributes.category.data?.attributes.elections.data.find((e) => e.id == electionId)
        )
        .forEach((d) => {
          const q: QuestionProps = {
            id: '' + d.id,
            text: translate(d.attributes.text, locale),
            info: translate(d.attributes.info, locale),
            category: d.attributes.category.data
              ? translate(d.attributes.category.data.attributes.name, locale)
              : '',
            type: settings.type
          };
          if ('values' in settings)
            q.values = settings.values.map(({key, label}) => ({
              key,
              label: translate(label, locale)
            }));
          // TODO: Allow these when other question types are supported
          // if ('min' in settings) q.min = settings.min;
          // if ('max' in settings) q.max = settings.max;
          // if ('notLocalizable' in settings) q.notLocalizable = settings.notLocalizable;
          questions.push(q);
        });
    }
    // Finally sort by category
    // TODO: Add sorting by the order property
    return questions.sort((a, b) => (a.category ?? '').localeCompare(b.category ?? ''));
  });
};

/**
 * Get test data from the database.
 * @param locale The locale to use for translated strings in the data
 */
export function getTestData({locale}: {locale: string}): Promise<TestDataProps[]> {
  const params = new URLSearchParams({
    'populate[election_app_label][populate][localizations][populate]': '*'
  });
  return getData<StrapiTestData[]>('api/v2-questions', params).then((result) =>
    result.map((d) => ({
      id: `${d.id}`,
      normalText: d.attributes.normalText ?? '',
      multiLangText: translate(d.attributes.multiLangText, locale),
      election_app_label: d.attributes.election_app_label
    }))
  );
}

///////////////////////////////////////////////////////////////////////
// Utilities
///////////////////////////////////////////////////////////////////////

/** Adds the possible `id` to the `endpoint` url */
function addId(endpoint: string, id: string | number | null | undefined): string {
  return id == null ? endpoint : `${endpoint}/${id}`;
}
