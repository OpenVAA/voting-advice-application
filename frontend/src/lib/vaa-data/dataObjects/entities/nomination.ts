/*
 * Nomination and its subclasses are used to represent nominations of
 * candidates, party lists and such. They serve as wrappers for Entities
 * and are specific to a Constituency. For convenience, Nominations provide
 * getters for all of the relevant properties of the contained Entity.
 *
 * The reasoning behind separating nominations from the nominated and nominating
 * Entities is that Entities are semantically permanent whilst Nominations
 * are temporary. On the other hand, we also want to make technically sure
 * that a nationwide party may have separate lists for candidates in different
 * Constituencies whilst still existing only as a single party Entity.
 */

import type {Id} from '../../data.types';
import type {MatchableQuestion} from '$lib/vaa-matching';
import {DataObject, type DataObjectData} from '../dataObject';
import type {Election} from '../election';
import type {Question} from '../questions';
import type {Entity, EntityType, EntityWrapper} from './entity';

export interface NominationData extends DataObjectData {
  /**
   * The type of the nominated Entity.
   */
  entityType: EntityType;
  /**
   * The id of the nominated entity.
   */
  entityId: Id;
  /**
   * The id of the Election for which the Nomination is.
   * TO DO: Can be omitted if there is only one Election.
   */
  electionId: Id;
  /**
   * The id of the Constituency in which the entity is nominated.
   * TO DO: Can be omitted if there is only one Constituency in the Election.
   */
  constituencyId: Id;
  /**
   * The possible candidate number or any symbol other than the Entity's
   * name or shortName.
   */
  electionSymbol?: string | number;
  /**
   * The round number (2+) of the nomination if there are multiple rounds.
   * Defaults to 1, i.e. the first round, so this is only needed for nominees
   * advancing to later rounds.
   */
  electionRound?: number;
}

/**
 * Nomination and its subclasses are used to represent nominations of
 * candidates, party lists and such. They serve as wrappers for Entities
 * and are specific to a Constituency. For convenience, Nominations provide
 * getters for all of the relevant properties of the contained Entity.
 */
export abstract class Nomination extends DataObject implements EntityWrapper<Entity> {
  constructor(public data: NominationData, public parent: Election, public entity: Entity) {
    super(data, parent);
    if (data.entityId !== entity.id) {
      throw new Error(
        `Data.entityId '${data.entityId}' and entity.id '${entity.id}' do not match!`
      );
    }
  }

  // Own accessors

  /**
   * This is a utility getter that's more explicit
   */
  get nominationId() {
    return this.data.id;
  }

  get entityType() {
    return this.data.entityType;
  }

  get entityId() {
    return this.data.entityId;
  }

  get electionId() {
    return this.data.electionId ?? '';
  }

  get constituencyId() {
    return this.data.constituencyId ?? '';
  }

  get electionRound() {
    return this.data.electionRound ?? 1;
  }

  get electionSymbol() {
    return this.data.electionSymbol ?? '';
  }

  get election() {
    return this.parent;
  }

  get constituency() {
    return this.election.constituencies.byId(this.constituencyId);
  }

  // Wrapped Entity property accessors

  get name() {
    return this.entity.name;
  }

  get shortName() {
    return this.entity.shortName;
  }

  get order() {
    return this.entity.order;
  }

  get root() {
    return this.entity.root;
  }

  get type() {
    return this.entity.type;
  }

  get imageUrl() {
    return this.entity.imageUrl;
  }

  /**
   * Wrapper for the same getter of the wrapped Entity.
   * Get all answers for this entity as Answer objects.
   * NB! Only call this method if you really need it, because it comes
   * with a bit of an overhead. Usually it's enought to use getAnswer
   * to access the answer value of a specific question.
   */
  get answers() {
    return this.entity.answers;
  }

  get matchableAnswers() {
    return this.entity.matchableAnswers;
  }

  /**
   * Wrapper for the same method of the wrapped Entity.
   * @param question The Question to get the answer for.
   * @returns The answer value for the given question or undefined if not found.
   */
  getAnswer(question: Question | MatchableQuestion) {
    return this.entity.getAnswer(question);
  }

  /**
   * Wrapper for the same method of the wrapped Entity.
   * @param question The Question to get the answer for.
   * @returns The answer value for the given question or undefined if not found.
   */
  getAnswerValue(question: Question | MatchableQuestion) {
    return this.entity.getAnswerValue(question);
  }

  /**
   * Wrapper for the same method of the wrapped Entity.
   * @param question The MatchableQuestion to get the answer for.
   * @returns The answer value for the given question or undefined if not found.
   */
  getMatchableAnswerValue(question: MatchableQuestion) {
    return this.entity.getMatchableAnswerValue(question);
  }
}
