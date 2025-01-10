import type { DataObjectData, EntityType, Id } from '../../../internal';

export interface NominationData<TEntity extends EntityType = EntityType, TParent extends EntityType | never = never>
  extends DataObjectData {
  // From HasId
  // - id: Id;
  //
  // From DataObjectData
  // - color?: Colors | null;
  // - image?: Image | null;
  // - name?: string;
  // - shortName?: string;
  // - info?: string;
  // - order?: number;
  // - customData?: object;
  // - subtype?: string;
  // - isGenerated?: boolean;

  /**
   * The `type` of `Entity` owning of the nomination.
   */
  entityType: TEntity;
  /**
   * The `id` of the `Entity` owning of the nomination.
   */
  entityId: Id;
  /**
   * The `Election` which the nomination is made in.
   */
  electionId: Id;
  /**
   * The possible election rounnd for which the nomination is made in. @defaultValue 1
   */
  electionRound?: number | null;
  /**
   * The `Constituency` which the nomination is made in.
   */
  constituencyId: Id;
  /**
   * The optional symbol, usually a number, marked on the ballot instead of nominee’s name. @defaultValue ''
   */
  electionSymbol?: string | null;
  /**
   * The possible `FactionNomination` this nomination is part of, e.g. a faction list. If the data is provided as part of `FactionNominationData`, this `id` will be automatically added. Only applicable to certain `Nomination` types.
   */
  parentNominationId?: TParent extends never ? never : Id | null;
  /**
   * The `EntityType` of the possible parent nomination.
   */
  parentNominationType?: TParent | null;
}

/**
 * Used for nominations nested in a list or sublist nomination, for which some properties are implied or inherited.
 */
export type NestedNomination<TData> = Omit<
  TData,
  'constituencyId' | 'electionId' | 'electionRound' | 'entityType' | 'parentNominationId' | 'parentNominationType'
>;

/**
 * Used for `AllianceNomination`s and `FactionNomination`s when an explicit `Entity` is not defined. An automatically created `Entity` will be used instead. Note that the data still need to contain an `entityId`.
 */
export type WithImpliedEntity<TData> = TData & {
  /**
   * The optional name of the `Entity`. @defaultValue '—'
   */
  name?: string | null;
  /**
   * The optional short name of the `Entity`. @defaultValue `name`
   */
  shortName?: string | null;
};
