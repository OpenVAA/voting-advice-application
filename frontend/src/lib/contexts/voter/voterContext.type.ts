import type { Id } from '@openvaa/core';
import type { AnyQuestionVariant, Constituency, Election, QuestionCategory } from '@openvaa/data';
import type { MatchingAlgorithm } from '@openvaa/matching';
import type { Readable, Writable } from 'svelte/store';
import type { AppContext } from '../app';
import type { AnswerStore } from './answerStore.type';
import type { FilterTree } from './filters/filterStore';
import type { MatchTree } from './matchStore';
import type { QuestionBlocks } from './questionBlockStore.type';

export type VoterContext = AppContext & {
  /**
   * The matching algorithm object used for matching.
   */
  algorithm: MatchingAlgorithm;
  /**
   * The voters `Answer`s to the `Question`s.
   */
  answers: AnswerStore;
  /**
   * Whether `Election`s can be selected.
   */
  electionsSelectable: Readable<boolean>;
  /**
   * Whether `Constituency`s can be selected.
   */
  constituenciesSelectable: Readable<boolean>;
  /**
   * The `Election`s selected by the voter or automatically selected if they can be implied, e.g. when election selection is disabled by the app settings or there is just one election.
   */
  selectedElections: Readable<Array<Election>>;
  /**
   * The `Constituency`s selected by the user or automatically selected if they can be implied, e.g. when all selected elections have only one constituency.
   */
  selectedConstituencies: Readable<Array<Constituency>>;
  /**
   * Whether there are enough `Answer`s to compute matches.
   */
  resultsAvailable: Readable<boolean>;
  /**
   * The matched `Nomination`s for each `Election` and `EntityType`.
   */
  matches: Readable<MatchTree>;
  /**
   * The currently active `EntityFilter`s for each `Election` and `EntityType`.
   */
  entityFilters: Readable<FilterTree>;
  /**
   * The non-opinion `QuestionCategory`s applicable to the current `Election`s and `Constituency`s.
   * NB. When accessing the `Question`s in the categories, use the `getApplicableQuestions({election, constituency})` method.
   */
  infoQuestionCategories: Readable<Array<QuestionCategory>>;
  /**
   * The non-opinion `Question`s applicable to the current `Election`s and `Constituency`s.
   */
  infoQuestions: Readable<Array<AnyQuestionVariant>>;
  /**
   * The matching `QuestionCategory`s applicable to the current `Election`s and `Constituency`s.
   * NB. When accessing the `Question`s in the categories, use the `getApplicableQuestions({election, constituency})` method.
   */
  opinionQuestionCategories: Readable<Array<QuestionCategory>>;
  /**
   * The matching `Question`s applicable to the current `Election`s and `Constituency`s.
   */
  opinionQuestions: Readable<Array<AnyQuestionVariant>>;
  /**
   * The `Id`s of the opinion `QuestionCategory`s the user has selected for answering.
   */
  selectedQuestionCategoryIds: Writable<Array<Id>>;
  /**
   * The first question id if not the default one. This may be set by a query parameter on the `.../[questionId]/` route.
   */
  firstQuestionId: Writable<Id | null>;
  /**
   * The `Question`s in the selected `QuestionCategory`s as well as some utility methods.
   */
  selectedQuestionBlocks: Readable<QuestionBlocks>;
};
