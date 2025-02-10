import {
  type AnyQuestionVariantData,
  type ConstituencyData,
  type ConstituencyGroupData,
  ENTITY_TYPE,
  type QuestionCategoryData
} from '@openvaa/data';
import { UniversalDataProvider } from '$lib/api/base/universalDataProvider';
import { translate, translateObject } from '$lib/i18n/utils';
import { ensureColors } from '$lib/utils/color/ensureColors';
import { strapiAdapterMixin } from '../strapiAdapter';
import {
  buildFilterParams,
  makeRule,
  parseBasics,
  parseCandidate,
  parseImage,
  parseNominations,
  parseOrganization,
  parseQuestionType,
  parseRelationIds,
  parseSingleRelationId
} from '../utils';
import { parseEntityType } from '../utils/parseEntityType';
import type { DPDataType } from '$lib/api/base/dataTypes';
import type {
  GetAppCustomizationOptions,
  GetConstituenciesOptions,
  GetElectionsOptions,
  GetEntitiesOptions,
  GetNominationsOptions,
  GetQuestionsOptions
} from '$lib/api/base/getDataOptions.type';
import type { Params } from '../strapiAdapter.type';

export class StrapiDataProvider extends strapiAdapterMixin(UniversalDataProvider) {
  protected async _getAppSettings(): Promise<DPDataType['appSettings']> {
    const params: Params = {
      populate: {
        elections: 'true',
        entities: { populate: { hideIfMissingAnswers: 'true' } },
        entityDetails: {
          populate: {
            contents: 'true',
            showMissingAnswers: 'true',
            showMissingElectionSymbol: 'true'
          }
        },
        header: 'true',
        headerStyle: {
          populate: {
            dark: 'true',
            light: 'true'
          }
        },
        matching: 'true',
        questions: {
          populate: {
            categoryIntros: 'true',
            questionsIntro: 'true',
            dynamicOrdering: 'true'
          }
        },
        results: { populate: { cardContents: 'true' } },
        survey: 'true'
      }
    };
    const data = await this.apiGet({ endpoint: 'appSettings', params });
    if (data.length !== 1) throw new Error(`Expected one AppSettings object, but got ${data.length}`);
    return data[0].attributes;
  }

  protected async _getAppCustomization(
    options: GetAppCustomizationOptions = {}
  ): Promise<DPDataType['appCustomization']> {
    const { locale } = options;
    const params: Params = {
      populate: {
        translationOverrides: { populate: { translations: 'true' } },
        candidateAppFAQ: 'true',
        publisherLogo: 'true',
        publisherLogoDark: 'true',
        poster: 'true',
        posterDark: 'true',
        candPoster: 'true',
        candPosterDark: 'true'
      }
    };
    const data = await this.apiGet({ endpoint: 'appCustomization', params });
    if (!data) throw new Error('Expected one AppCustomization object, but got none.');
    const attr = data.attributes;
    return {
      translationOverrides: translateObject(attr.translationOverrides, locale),
      candidateAppFAQ: translateObject(attr.candidateAppFAQ, locale),
      publisherName: attr.publisherName ? translate(attr.publisherName, locale) : undefined,
      publisherLogo: parseImage(attr.publisherLogo, attr.publisherLogoDark),
      poster: parseImage(attr.poster, attr.posterDark),
      candPoster: parseImage(attr.candPoster, attr.candPosterDark)
    };
  }

  protected async _getElectionData(options: GetElectionsOptions = {}): Promise<DPDataType['elections']> {
    const locale = options.locale ?? null;
    const params = buildFilterParams(options);
    params.populate = {
      constituencyGroups: 'true'
    };
    const data = await this.apiGet({ endpoint: 'elections', params });
    return data.map(({ id, attributes }) => ({
      ...parseBasics({ id, attributes }, locale),
      date: attributes.electionDate,
      subtype: attributes.electionType,
      constituencyGroupIds: parseRelationIds(attributes.constituencyGroups),
      customData: {
        organizer: translate(attributes.organizer, locale)
      }
    }));
  }

  protected async _getConstituencyData(options: GetConstituenciesOptions = {}): Promise<DPDataType['constituencies']> {
    const locale = options.locale ?? null;
    const params = buildFilterParams(options);
    // We populate the Constituencies for simplicity even though this may lead to duplicates if the same Constituencies belong to multiple Groups
    params.populate = {
      constituencies: { populate: { parent: 'true' } }
    };
    const data = await this.apiGet({ endpoint: 'constituencyGroups', params });
    const groups = new Array<ConstituencyGroupData>();
    const constituencies = new Map<string, ConstituencyData>();
    for (const group of data) {
      const members = group.attributes.constituencies;
      groups.push({
        ...parseBasics(group, locale),
        constituencyIds: parseRelationIds(members)
      });
      if (!members) continue;
      for (const { id, attributes } of members.data) {
        if (constituencies.has(id)) continue;
        const { keywords, parent } = attributes;
        constituencies.set(id, {
          ...parseBasics({ id, attributes }, locale),
          keywords: keywords ? translate(attributes.keywords, locale).split(/\s*,\s*/) : null,
          parentId: parseSingleRelationId(parent)
        });
      }
    }
    return {
      groups,
      constituencies: [...constituencies.values()]
    };
  }

  protected async _getNominationData(options: GetNominationsOptions = {}): Promise<DPDataType['nominations']> {
    const locale = options.locale ?? null;
    const params = buildFilterParams(options);
    params.populate = {
      constituency: 'true',
      election: 'true',
      candidate: {
        populate: {
          answers: { populate: { question: 'true' } },
          party: 'true'
        }
      },
      party: { populate: { answers: { populate: { question: 'true' } } } }
    };
    const data = await this.apiGet({ endpoint: 'nominations', params });
    return parseNominations(data, locale);
  }

  protected async _getEntityData(options: GetEntitiesOptions = {}): Promise<DPDataType['entities']> {
    const locale = options.locale ?? null;
    const { id, entityType } = options;
    if (id && !entityType) throw new Error('If id is defined entityType must also be defined.');
    // Common params for both APIs
    const params = buildFilterParams({ id });
    params.populate = {
      answers: { populate: { question: 'true' } }
    };
    // Collect Promises so we don't need to await separately
    const promises = new Array<Promise<DPDataType['entities']>>();
    if (!entityType || entityType === ENTITY_TYPE.Candidate) {
      const candParams = { ...params };
      candParams.populate!.party = 'true';
      const candidates = this.apiGet({
        endpoint: 'candidates',
        params: candParams
      }).then((data) => data.map((c) => parseCandidate(c, locale)));
      promises.push(candidates);
    }
    if (!entityType || entityType === ENTITY_TYPE.Organization) {
      const organizations = this.apiGet({
        endpoint: 'parties',
        params
      }).then((data) => data.map((c) => parseOrganization(c, locale)));
      promises.push(organizations);
    }
    // Merge the results into a single array
    return Promise.all(promises).then((data) => data.flat());
  }

  protected async _getQuestionData(options: GetQuestionsOptions = {}): Promise<DPDataType['questions']> {
    const locale = options.locale ?? null;
    const params: Params = {
      populate: {
        constituencies: 'true',
        elections: 'true',
        questions: {
          populate: {
            constituencies: 'true',
            questionType: 'true'
          }
        }
      }
    };
    // If the category has no election defined, it means it applies to all elections
    if (options.electionId)
      params.filters = {
        $or: [{ elections: { id: makeRule(options.electionId) } }, { elections: { id: { $null: 'true' } } }]
      };
    const data = await this.apiGet({ endpoint: 'questionCategories', params });
    const categories = new Array<QuestionCategoryData>();
    const allQuestions = new Map<string, AnyQuestionVariantData>();
    for (const category of data) {
      const { color, colorDark, constituencies, elections, questions, type } = category.attributes;
      categories.push({
        ...parseBasics(category, locale),
        ...ensureColors({ normal: color, dark: colorDark }),
        constituencyIds: parseRelationIds(constituencies),
        electionIds: parseRelationIds(elections),
        type
      });
      if (!questions) continue;
      for (const { id, attributes } of questions.data) {
        if (allQuestions.has(id)) continue;
        const { allowOpen, customData, entityType, fillingInfo, filterable, constituencies, questionType } = attributes;
        if (!questionType?.data) throw new Error(`Question ${id} has no questionType.`);
        // Parsing the question type may yield props that belong to the question’s customData
        const { customData: typeCustom, ...typeProps } = parseQuestionType(questionType.data, locale);
        allQuestions.set(id, {
          ...parseBasics({ id, attributes }, locale),
          ...typeProps,
          categoryId: category.id,
          constituencyIds: parseRelationIds(constituencies),
          entityType: parseEntityType(entityType),
          customData: {
            ...customData,
            ...typeCustom,
            allowOpen,
            fillingInfo,
            filterable
          }
        } as AnyQuestionVariantData);
      }
    }
    return {
      categories,
      questions: [...allQuestions.values()]
    };
  }
}
