/*
 * The base class for all entities. Note that when listing candidates
 * in an election or a specific constituency, we use a wrapper class
 * Nomination which contains the relevant Entity and may also have
 * sub-nominations.
 */

import {MISSING_VALUE} from '$lib/vaa-matching';
import type {
  HasMatchableAnswers,
  MatchableAnswer,
  MatchableQuestion,
  MatchableValue
} from '$lib/vaa-matching';

import type {ImageUrl, SerializableValue} from '../../data.types';
import {NamedDataObject, type NamedDataObjectData} from '../namedDataObject';
import type {DataRoot} from '../dataRoot';
import type {Question} from '../questions';
import {isMatchableAnswer, type Answer, type AnswerDict, type AnswerProperties} from './answer';

/**
 * The type of an Entity for Nomination and Answer data.
 */
export enum EntityType {
  /** Electoral alliance */
  Alliance = 'Alliance',
  /** Party or constituency association */
  Organization = 'Organization',
  /** A party faction. Used in the ley de lemas system. */
  Faction = 'Faction',
  /** A candidate */
  Person = 'Person'
}

export interface EntityData extends NamedDataObjectData {
  /**
   * Use this to specify the subtype of the Entity, such as 'party' or
   * 'constituency association' for Organizations.
   */
  type?: string;
  image?: ImageUrl;
  answers?: AnswerDict;
}

/**
 * This type is implemented by Nominations to ensure that all of the
 * wrapped Entity's properties are directly accessible.
 */
export type EntityWrapper<T extends Entity> = Omit<
  T,
  'id' | 'data' | 'parent' | 'provideAnswerData' | 'getShortName'
>;

/**
 * This is the base class for all entities. Note that nominated entities,
 * such as candidates and party lists, use separate classes.
 *
 * TO DO: Add a nicer method for getting thumbnails etc. for image.
 * This may require providing the DataRoot with an imageUrlHandler.
 *
 * TO DO: How to make sure we implement HasMatchableAnswers without
 * depending on 'matching'?
 */
export abstract class Entity extends NamedDataObject implements HasMatchableAnswers {
  constructor(public data: EntityData, public parent: DataRoot | Entity) {
    super(data, parent);
  }

  get type() {
    return this.data.type ?? '';
  }

  get imageUrl() {
    return this.data.image ?? '';
  }

  /**
   * Get all answers for this entity as Answer objects.
   * NB! Only call this method if you really need it, because it comes
   * with a bit of an overhead. Usually it's enought to use getAnswer
   * to access the answer value of a specific question.
   */
  get answers() {
    if (!this.data.answers) {
      return [] as Answer[];
    }
    const questionsDict = this.root.questions.asDict;
    return Object.entries(this.data.answers).map(([id, answer]) => ({
      question: questionsDict[id],
      ...answer
    }));
  }

  /**
   * Get all matchable answers for this entity as Answer objects.
   * NB! Only call this method if you really need it, because it comes
   * with a bit of an overhead. Usually it's enought to use getAnswer
   * to access the answer value of a specific question.
   */
  get matchableAnswers(): MatchableAnswer[] {
    return this.answers.filter((a) => isMatchableAnswer(a)) as unknown as MatchableAnswer[];
  }

  /**
   * @param question The Question to get the answer for.
   * @returns The answer value for the given question or undefined if not found.
   */
  getAnswer(question: Question | MatchableQuestion): AnswerProperties | undefined {
    return this.data.answers?.[question.id];
  }

  /**
   * @param question The Question to get the answer for.
   * @returns The answer value for the given question or undefined if not found.
   */
  getAnswerValue(question: Question | MatchableQuestion): SerializableValue | undefined {
    return this.getAnswer(question)?.value;
  }

  /**
   * @param question The MatchableQuestion to get the answer for.
   * @returns The answer value for the given question or undefined if not found.
   */
  getMatchableAnswerValue(question: MatchableQuestion): MatchableValue {
    return (this.getAnswerValue(question) as MatchableValue) ?? MISSING_VALUE;
  }

  /**
   * Call this to provide answers to the Entity either as a dict or a list of answers.
   */
  provideAnswerData(answers: AnswerDict) {
    this.data.answers = {...(this.data.answers ?? {}), ...answers};
  }
}
