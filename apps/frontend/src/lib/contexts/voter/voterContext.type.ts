import type { Id } from '@openvaa/core';
import type { AnyQuestionVariant, Constituency, Election, QuestionCategory } from '@openvaa/data';
import type { MatchingAlgorithm } from '@openvaa/matching';
import type { AppContext } from '../app';
import type { QuestionBlocks } from '../utils/questionBlockStore.type';
import type { AnswerStore } from './answerStore.type';
import type { FilterTree } from './filters/filterStore.svelte';
import type { MatchTree } from './matchStore.svelte';

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
  electionsSelectable: boolean;
  /**
   * Whether `Constituency`s can be selected.
   */
  constituenciesSelectable: boolean | undefined;
  /**
   * The `Election`s selected by the voter or automatically selected if they can be implied, e.g. when election selection is disabled by the app settings or there is just one election.
   */
  selectedElections: Array<Election>;
  /**
   * The `Constituency`s selected by the user or automatically selected if they can be implied, e.g. when all selected elections have only one constituency.
   */
  selectedConstituencies: Array<Constituency>;
  /**
   * Whether there are enough `Answer`s to compute matches.
   */
  resultsAvailable: boolean;
  /**
   * A utility value detailing whether any nominations are available for the selected `Election`s.
   */
  nominationsAvailable: { [selectedElectionId: Id]: boolean };
  /**
   * The matched `Nomination`s for each `Election` and `EntityType`.
   */
  matches: MatchTree;
  /**
   * The currently active `EntityFilter`s for each `Election` and `EntityType`.
   */
  entityFilters: FilterTree;
  /**
   * The non-opinion `QuestionCategory`s applicable to the current `Election`s and `Constituency`s.
   * NB. When accessing the `Question`s in the categories, use the `getApplicableQuestions({election, constituency})` method.
   */
  infoQuestionCategories: Array<QuestionCategory>;
  /**
   * The non-opinion `Question`s applicable to the current `Election`s and `Constituency`s.
   */
  infoQuestions: Array<AnyQuestionVariant>;
  /**
   * The matching `QuestionCategory`s applicable to the current `Election`s and `Constituency`s.
   * NB. When accessing the `Question`s in the categories, use the `getApplicableQuestions({election, constituency})` method.
   */
  opinionQuestionCategories: Array<QuestionCategory>;
  /**
   * The matching `Question`s applicable to the current `Election`s and `Constituency`s.
   */
  opinionQuestions: Array<AnyQuestionVariant>;
  /**
   * The `Id`s of the opinion `QuestionCategory`s the user has selected for answering.
   */
  selectedQuestionCategoryIds: Array<Id>;
  /**
   * The first question id if not the default one. This may be set by a query parameter on the `.../[questionId]/` route.
   */
  firstQuestionId: Id | null;
  /**
   * The `Question`s in the selected `QuestionCategory`s as well as some utility methods.
   */
  selectedQuestionBlocks: QuestionBlocks;
  /**
   * Reset all saved voter data, except privacy preferences and survey status.
   */
  resetVoterData: () => void;
};
