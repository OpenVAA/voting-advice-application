import { log, staticSettings } from '@openvaa/app-shared';
import { translate } from '@openvaa/data';
import { json } from '@sveltejs/kit';
import { filterData } from '$lib/api/utils/filterData';
import { filterEntitiesByNomination } from '$lib/api/utils/filterEntitiesByNomination';
import { LocalServerAdapter } from '../localServerAdapter';
import type {
  AnyEntityVariantData,
  AnyQuestionVariantData,
  ConstituencyData,
  ConstituencyGroupData,
  ElectionData,
  QuestionCategoryData
} from '@openvaa/data';
import type { DataProvider } from '$lib/api/base/dataProvider.type';
import type { FilterValue } from '$lib/api/base/getDataFilters.type';
import type {
  GetAppCustomizationOptions,
  GetConstituenciesOptions,
  GetDataOptionsBase,
  GetElectionsOptions,
  GetEntitiesOptions,
  GetNominationsOptions,
  GetQuestionsOptions
} from '$lib/api/base/getDataOptions.type';
import type { ReadPath } from '../localPaths';

export class LocalServerDataProvider extends LocalServerAdapter implements DataProvider<'server'> {
  /**
   * This is used for translations when the locale option is missing.
   */
  defaulLocale: string;

  constructor() {
    super();
    const locales = staticSettings.supportedLocales;
    this.defaulLocale = locales.find((l) => l.isDefault)?.code || locales[0].code || 'en';
  }

  async getAppSettings(): Promise<Response> {
    if (!(await this.exists('appSettings'))) return Promise.resolve(json({}));
    return this.readAndFilter('appSettings');
  }

  async getAppCustomization(options: GetAppCustomizationOptions = {}): Promise<Response> {
    if (!(await this.exists('appCustomization'))) return Promise.resolve(json({}));
    warnIfUnsupported(options);
    return this.readAndFilter('appCustomization');
  }

  getElectionData(options: GetElectionsOptions = {}): Promise<Response> {
    warnIfUnsupported(options);
    const { id, locale } = options;
    const filter = id ? (data: Array<ElectionData>) => filterData({ data, filters: { id } }) : undefined;
    return this.readAndFilter('elections', { filter, locale });
  }

  getConstituencyData(options: GetConstituenciesOptions = {}): Promise<Response> {
    warnIfUnsupported(options);
    const { id, locale } = options;
    const filter = id
      ? ({
          groups,
          constituencies
        }: {
          groups: Array<ConstituencyGroupData>;
          constituencies: Array<ConstituencyData>;
        }) => ({
          groups: filterData({ data: groups, filters: { id } }),
          // NB. We return all constituencies regardless of group filters because of possible `parent` relationships
          constituencies
        })
      : undefined;
    return this.readAndFilter('constituencies', { filter, locale });
  }

  async getNominationData(options: GetNominationsOptions = {}): Promise<Response> {
    warnIfUnsupported(options);
    const { constituencyId, electionId, electionRound, locale = this.defaulLocale } = options;
    assertNonEmpty({ constituencyId, electionId });
    // Because nominations and entities are stored in separate files, we cannot use this.readAndFilter
    let [nominations, entities] = await Promise.all([this.read('nominations'), this.read('entities')]).then((data) =>
      data.map((d) => JSON.parse(d))
    );
    nominations = translate({ value: nominations, locale });
    entities = translate({ value: entities, locale });
    if (constituencyId || electionId)
      nominations = filterData({ data: nominations, filters: { constituencyId, electionId } });
    // A nomination with no round is in round 1, the data model's default. This differs from `get_nominations` for one row shape: `nominations.election_round` defaults to 1 but is nullable, and the RPC's equality drops a row that stores an explicit NULL.
    if (electionRound != null)
      nominations = nominations.filter(
        (nomination: { electionRound?: number | null }) => (nomination.electionRound ?? 1) === electionRound
      );
    entities = filterEntitiesByNomination({ entities, nominations });
    return json({ entities, nominations });
  }

  getEntityData(options: GetEntitiesOptions = {}): Promise<Response> {
    warnIfUnsupported(options);
    const { id, entityType, locale } = options;
    if (id && !entityType) throw new Error('If id is defined entityType must also be defined.');
    const filter =
      id || entityType
        ? (data: Array<AnyEntityVariantData>) => filterData({ data, filters: { id, type: entityType } })
        : undefined;
    return this.readAndFilter('entities', { filter, locale });
  }

  async getQuestionData(options: GetQuestionsOptions = {}): Promise<Response> {
    warnIfUnsupported(options);
    const { constituencyId, electionId, electionRound, locale } = options;
    assertNonEmpty({ constituencyId, electionId });
    const filter =
      electionId || constituencyId || electionRound != null
        ? ({
            categories,
            questions
          }: {
            categories: Array<QuestionCategoryData>;
            questions: Array<AnyQuestionVariantData>;
          }) => {
            // Categories and questions are filtered independently, as `get_questions` does, and a question is also dropped with its category.
            function inScope(row: QuestionCategoryData | AnyQuestionVariantData): boolean {
              return (
                appliesTo(row.electionIds, electionId) &&
                appliesTo(row.constituencyIds, constituencyId) &&
                appliesTo(row.electionRounds, electionRound)
              );
            }
            categories = categories.filter(inScope);
            const categoryId = categories.map((c) => c.id);
            questions = filterData({ data: questions.filter(inScope), filters: { categoryId } });
            return { categories, questions };
          }
        : undefined;
    return this.readAndFilter('questions', { filter, locale });
  }

  /**
   * Reads the data from the endpoint, possibly filters it and handles wrapping the `Response` in a `Promise`.
   * @param endpoint - The endpoint from which to read the data.
   * @param filter - An optional function to filter the parsed and translated data.
   * @param locale - An optional locale to translate the data. Set to `null` to disable translation. @default this.defaulLocale
   */
  protected async readAndFilter<TPath extends ReadPath, TData>(
    endpoint: TPath,
    {
      filter,
      locale = this.defaulLocale
    }: {
      filter?: (data: TData) => TData;
      locale?: string | null;
    } = {}
  ): Promise<Response> {
    const data = await this.read(endpoint);
    // Parse the JSON data, filter it and serialize it back to a JSON response.
    let value = JSON.parse(data);
    if (locale) value = translate({ value, locale });
    return json(filter ? filter(value) : value);
  }
}

/**
 * Whether a question or category whose filter list is `listed` applies to `wanted`, with the semantics of the `get_questions` RPC: without a `wanted` value, or when `listed` is missing or empty, the row applies to all; otherwise `listed` must contain one of the wanted values.
 *
 * `filterData` is not used because an empty target list matches nothing there. Values are compared strictly, so election rounds compare as numbers.
 * @param listed - The row's `electionIds`, `constituencyIds` or `electionRounds`.
 * @param wanted - The requested value or values.
 * @returns Whether the row is kept.
 */
function appliesTo(listed: unknown, wanted: FilterValue<string | number> | undefined): boolean {
  if (wanted == null) return true;
  const values: Array<unknown> = listed == null ? [] : [listed].flat();
  if (values.length === 0) return true;
  const wantedValues: Array<unknown> = [wanted].flat();
  return values.some((value) => wantedValues.includes(value));
}

/**
 * Reject an empty id filter, as the Supabase adapter does: an empty array requests nothing, so answering it would return a partial or empty result with no error.
 * @param filters - The id filters, by option name.
 */
function assertNonEmpty(filters: Record<string, FilterValue<string> | undefined>): void {
  for (const [name, value] of Object.entries(filters)) {
    if (Array.isArray(value) && value.length === 0)
      throw new Error(
        `LocalServerDataProvider: an empty ${name} array requests nothing and cannot be answered; pass \`undefined\` to omit the filter instead.`
      );
  }
}

/**
 * Temporary utility for warning when unsupported options are used.
 * TODO: Remove when includeUnconfirmed is supported.
 */
function warnIfUnsupported(options?: GetDataOptionsBase): void {
  if (!options) return;
  if ('includeUnconfirmed' in options)
    log.debug('[LocalServerDataProvider] includeUnconfirmed is not yet supported. Ignoring it.');
}
