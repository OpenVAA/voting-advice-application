import type { LocalizedAnswer } from '@openvaa/app-shared';
import type { Id } from '@openvaa/core';
import type { Readable } from 'svelte/store';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';
import type { CandidateUserData, LocalizedCandidateData } from '$lib/api/base/dataWriter.type';

/**
 * An extended store that holds all data owned by the user. When subscribed to, it returns a composite of the initial data and any unsaved `Answer`s and properties. Dedicated methods are provided for loading, saving, setting or resetting data.
 *
 * NB. Before using the store, its `init` method must be called with the initial `CandidateUserData`.
 */
export type CandidateUserDataStore = Readable<CandidateUserData<true> | undefined> & {
  /**
   * Initialize the store with the full `CandidateUserData`.
   */
  init: (data: CandidateUserData<true>) => void;
  /**
   * Reset all data, including saved data. Call this when the user logs out.
   */
  reset: () => void;
  /**
   * Reset all unsaved data. Call this when exiting the view where set data has been modified but not saved.
   */
  resetUnsaved: () => void;

  ////////////////////////////////////////////////////////////
  // Synchronization with backend
  ////////////////////////////////////////////////////////////

  /**
   * Reload the `Candidate` data from the backend into the store and return it.
   * NB. This does not reload the `User` or `Nomination`s data, they must be included in the data passed to `init`.
   * @returns A `Promise` resolving to `LocalizedCandidateData`.
   * @throws An error if the data cannot be loaded.
   */
  reloadCandidateData: () => Promise<LocalizedCandidateData>;
  /**
   * Save all unsaved data.
   * @returns A `Promise` resolving to `DataApiActionResult`.
   * @throws An error if the data cannot be saved.
   */
  save: () => Promise<DataApiActionResult>;

  ////////////////////////////////////////////////////////////
  // Answers
  ////////////////////////////////////////////////////////////

  /**
   * Set an answer to a specific question.
   */
  setAnswer: (questionId: Id, answer: LocalizedAnswer) => void;
  /**
   * Delete an unsaved answer to a specific question.
   * NB. This does not intend to delete the answer in the backend. Use `setAnswer(questionId, { value: null })` for that.
   */
  resetAnswer: (questionId: Id) => void;
  /**
   * Reset all unsaved answers.
   */
  resetAnswers: () => void;

  ////////////////////////////////////////////////////////////
  // Properties
  ////////////////////////////////////////////////////////////

  /**
   * Set the `Candidate`’s image.
   */
  setImage: (image: ImageWithFile) => void;
  /**
   * Delete the unsaved `Candidate`’s image.
   * NB. This does not intend to delete the image in the backend.
   */
  resetImage: () => void;
  /**
   * Set the `Candidate`’s image.
   */
  setTermsOfUseAccepted: (value: string | null) => void;
  /**
   * Delete the unsaved `Candidate`’s image.
   * NB. This does not intend to delete the image in the backend.
   */
  resetTermsOfUseAccepted: () => void;

  ////////////////////////////////////////////////////////////
  // Substores
  ////////////////////////////////////////////////////////////

  /**
   * A substore resolving to an `Array` of question ids for which there are unsaved answers.
   */
  unsavedQuestionIds: Readable<Array<Id>>;
  /**
   * A substore resolving to an `Array` of names of unsaved properties.
   */
  unsavedProperties: Readable<Array<keyof LocalizedCandidateData>>;
  /**
   * A substore which is `true` if there are any unsaved data.
   */
  hasUnsaved: Readable<boolean>;
  /**
   * A substore holding the saved `LocalizedCandidateData`.
   */
  savedCandidateData: Readable<LocalizedCandidateData | undefined>;
};
