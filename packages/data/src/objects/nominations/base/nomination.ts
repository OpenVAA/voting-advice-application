import { DataNotFoundError, DataObject, DataProvisionError } from '../../../internal';
import type {
  Answers,
  AnyQuestionVariant,
  Constituency,
  DataAccessor,
  DataRoot,
  Election,
  EntityType,
  EntityVariant,
  HasAnswers,
  NominationData,
  NominationVariant,
  WithOptional,
  WrappedEntity
} from '../../../internal';

/**
 * The abstract base class for all nomination variants. Represents the nomination of the associated `Entity` in a `Constituency` in an `Election`.
 */
export abstract class Nomination<
    TEntity extends EntityType = EntityType,
    TParent extends EntityType | never = never,
    TData extends NominationData<TEntity, TParent> = NominationData<TEntity, TParent>
  >
  extends DataObject<TData>
  implements DataAccessor<NominationData<TEntity, TParent>>, WrappedEntity, HasAnswers
{
  //////////////////////////////////////////////////////////////////////////////
  // Initialization
  //////////////////////////////////////////////////////////////////////////////

  /**
   * The `Nomination` constructor can be called with data lacking an `id` in which case a non-deterministic, unique `id` will be generated.
   * @param data The data with an optional `id`.
   * @param root The `DataRoot` object.
   */
  constructor({ data, root }: { data: WithOptional<TData, 'id'>; root: DataRoot }) {
    if (
      (data.parentNominationType && !data.parentNominationId) ||
      (!data.parentNominationType && data.parentNominationId)
    )
      throw new DataProvisionError(
        `Either none or both parentNominationType and parentNominationId must be defined. Type: ${data.parentNominationType} • Id: ${data.parentNominationId}`
      );

    let fullData: TData;
    if (!data.id) {
      fullData = {
        ...data,
        id: root.createId({ type: 'nomination', data }),
        isGenerated: true
      } as TData;
    } else {
      fullData = data as TData;
    }
    super({ data: fullData, root });
  }

  //////////////////////////////////////////////////////////////////////////////
  // Property and collection getters
  //////////////////////////////////////////////////////////////////////////////

  /**
   * A utility getter for compatibility with the `@openvaa/core.HasAnswers` interface.
   */
  get answers(): Answers {
    return this.entity.answers;
  }

  /**
   * All `Question`s that are applicable to the nominated `Entity`’s type and the `Nomination`s election` and `constituency`.
   */
  get applicableQuestions(): Array<AnyQuestionVariant> {
    return this.root.findQuestions({
      entityType: this.entityType,
      // Pass just the ids to save extraneous getter calls
      elections: { id: this.data.electionId } as Election,
      constituencies: { id: this.data.constituencyId } as Constituency
    });
  }

  /**
   * The `Constituency` which the nomination is made in.
   */
  get constituency(): Constituency {
    return this.root.getConstituency(this.data.constituencyId);
  }

  /**
   * The `Election` which the nomination is made in.
   */
  get election(): Election {
    return this.root.getElection(this.data.electionId);
  }

  /**
   * The possible election rounnd which the nomination is made in. @defaultValue 1
   */
  get electionRound(): number {
    return this.data.electionRound ?? 1;
  }

  /**
   * The optional symbol, usually a number, marked on the ballot instead of nominee’s name. @defaultValue ''
   */
  get electionSymbol(): string {
    return this.data.electionSymbol ?? '';
  }

  /**
   * The nominated `Entity`.
   */
  get entity(): EntityVariant[TEntity] {
    if (this.data.entityId == null) throw new DataNotFoundError('EntityId is missing.');
    return this.root.getEntity(this.data.entityType, this.data.entityId);
  }

  /**
   * The type of the nomination. The type property of `NominationBaseData` determines the `Nomination` subclass that it uses.
   */
  get entityType(): TEntity {
    return this.data.entityType;
  }

  /**
   * A utility getter for the name of the nominated `Entity` unless the `Nomination` itself has a `name`.
   */
  get name(): string {
    return this.data.name || this.entity.name;
  }

  /**
   * The possible parent `Nomination` when the `Candidate` is nominated on an organization or faction list.
   */
  get parentNomination(): NominationVariant[TParent] | null {
    return this.data.parentNominationType && this.data.parentNominationId
      ? this.root.getNomination(this.data.parentNominationType, this.data.parentNominationId)
      : null;
  }

  /**
   * The `EntityType` of the possible parent nomination.
   */
  get parentNominationType(): TParent | null {
    return this.data.parentNominationType ?? null;
  }

  /**
   * A utility getter for the shortName of the nominated `Entity` unless the `Nomination` itself has a `shortName` or `name`.
   */
  get shortName(): string {
    return this.data.shortName || this.data.name || this.entity.shortName;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Utilities
  //////////////////////////////////////////////////////////////////////////////

  /**
   * A utility for creating nested `Nomination`s.
   * @returns The properties of the parent `Nomination` that the children should inherit.
   */
  protected getInheritableData(): Pick<
    NominationData<EntityType, EntityType>,
    'constituencyId' | 'electionId' | 'electionRound' | 'parentNominationId'
  > {
    return {
      constituencyId: this.data.constituencyId,
      electionId: this.data.electionId,
      electionRound: this.data.electionRound,
      parentNominationId: this.data.id
    };
  }

  //////////////////////////////////////////////////////////////////////////////
  // Debugging
  //////////////////////////////////////////////////////////////////////////////

  /**
   * Override the default string representation
   */
  toString(): string {
    return `${this.constructor.name} for '${this.entity.name}' in ${this.election.shortName} / ${this.constituency.shortName} • id: ${this.id} (${this.entity.id})`;
  }
}
