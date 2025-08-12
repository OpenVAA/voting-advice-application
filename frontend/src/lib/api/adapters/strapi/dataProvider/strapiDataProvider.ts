import {
  type AnyQuestionVariantData,
  type ConstituencyData,
  type ConstituencyGroupData,
  ENTITY_TYPE,
  type QuestionCategoryData
} from '@openvaa/data';
import { UniversalDataProvider } from '$lib/api/base/universalDataProvider';
import { translate, translateObject } from '$lib/i18n';
import { strapiAdapterMixin } from '../strapiAdapter';
import {
  buildFilterParams,
  makeRule,
  parseBasics,
  parseCandidate,
  parseImage,
  parseNominations,
  parseOrganization,
  parseQuestionInfoSections,
  parseQuestionType,
  parseRelationIds,
  parseSingleRelationId
} from '../utils';
import { parseEntityType } from '../utils/parseEntityType';
import { parseQuestionTerms } from '../utils/parseQuestionTerms';
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
        access: 'true',
        elections: 'true',
        entities: { populate: '*' },
        entityDetails: { populate: '*' },
        header: 'true',
        headerStyle: { populate: '*' },
        matching: 'true',
        notifications: { populate: '*' },
        questions: {
          populate: {
            categoryIntros: 'true',
            questionsIntro: 'true',
            interactiveInfo: 'true'
          }
        },
        results: { populate: '*' },
        survey: 'true'
      }
    };
    const data = await this.apiGet({ endpoint: 'appSettings', params });
    if (!data) throw new Error('Expected one AppSettings object, but got none.');
    return data;
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
    return {
      translationOverrides: translateObject(data.translationOverrides, locale),
      candidateAppFAQ: translateObject(data.candidateAppFAQ, locale),
      publisherName: data.publisherName ? translate(data.publisherName, locale) : undefined,
      publisherLogo: parseImage(data.publisherLogo, data.publisherLogoDark),
      poster: parseImage(data.poster, data.posterDark),
      candPoster: parseImage(data.candPoster, data.candPosterDark)
    };
  }

  protected async _getElectionData(options: GetElectionsOptions = {}): Promise<DPDataType['elections']> {
    const locale = options.locale ?? null;
    const params = buildFilterParams(options);
    params.populate = {
      constituencyGroups: 'true'
    };
    const data = await this.apiGet({ endpoint: 'elections', params });
    return data.map((election) => ({
      ...parseBasics(election, locale),
      date: election.electionDate,
      subtype: election.electionType,
      constituencyGroupIds: parseRelationIds(election.constituencyGroups),
      customData: {
        organizer: translate(election.organizer, locale)
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
      const members = group.constituencies;
      groups.push({
        ...parseBasics(group, locale),
        constituencyIds: parseRelationIds(members)
      });
      if (!members) continue;
      for (const constituency of members) {
        const { documentId, keywords, parent } = constituency;
        if (constituencies.has(constituency.documentId)) continue;
        constituencies.set(documentId, {
          ...parseBasics(constituency, locale),
          keywords: keywords ? translate(keywords, locale).split(/\s*,\s*/) : null,
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
    if (!options.includeUnconfirmed) {
      params.filters ??= {};
      params.filters.unconfirmed = { $ne: 'true' };
    }
    params.populate = {
      constituency: 'true',
      election: 'true',
      candidate: {
        populate: {
          image: 'true',
          party: 'true'
        }
      },
      party: { populate: { image: 'true' } }
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
    // Collect Promises so we don't need to await separately
    const promises = new Array<Promise<DPDataType['entities']>>();
    if (!entityType || entityType === ENTITY_TYPE.Candidate) {
      const candParams = { ...params };
      candParams.populate = {
        party: 'true',
        image: 'true'
      };
      const candidates = this.apiGet({
        endpoint: 'candidates',
        params: candParams
      }).then((data) => data.map((d) => parseCandidate(d, locale)));
      promises.push(candidates);
    }
    if (!entityType || entityType === ENTITY_TYPE.Organization) {
      params.populate = {
        image: 'true'
      };
      const organizations = this.apiGet({
        endpoint: 'parties',
        params
      }).then((data) => data.map((d) => parseOrganization(d, locale)));
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
        $or: [
          { elections: { documentId: makeRule(options.electionId) } },
          { elections: { documentId: { $null: 'true' } } }
        ]
      };
    const data = await this.apiGet({ endpoint: 'questionCategories', params });
    const categories = new Array<QuestionCategoryData>();
    const allQuestions = new Map<string, AnyQuestionVariantData>();
    for (const category of data) {
      const { color, colorDark, constituencies, elections, questions, type } = category;
      categories.push({
        ...parseBasics(category, locale),
        color: { normal: color, dark: colorDark },
        constituencyIds: parseRelationIds(constituencies),
        electionIds: parseRelationIds(elections),
        type
      });
      if (!questions) continue;
      for (const question of questions) {
        const {
          documentId,
          allowOpen,
          customData,
          entityType,
          fillingInfo,
          filterable,
          constituencies,
          questionType,
          required
        } = question;
        if (allQuestions.has(documentId)) continue;
        if (!questionType) throw new Error(`Question ${documentId} has no questionType.`);
        // Parsing the question type may yield props that belong to the question’s customData
        const { customData: typeCustom, ...typeProps } = parseQuestionType(questionType, locale);
        // We'll add these to the question’s own customData, which will be parsed by parseBasics
        const additionalCustomData = {
          ...typeCustom,
          allowOpen: !!allowOpen,
          fillingInfo: translate(fillingInfo, locale),
          filterable: !!filterable,
          required: !!required,
          infoSections: parseQuestionInfoSections(customData, locale),
          terms: parseQuestionTerms(customData, locale)
        };
        allQuestions.set(documentId, {
          ...parseBasics({ ...question, customData: { ...customData, ...additionalCustomData } }, locale),
          ...typeProps,
          categoryId: category.documentId,
          constituencyIds: parseRelationIds(constituencies),
          entityType: parseEntityType(entityType)
        } as AnyQuestionVariantData);
      }
    }
    return {
      categories,
      questions: [...allQuestions.values()]
    };
  }
}
