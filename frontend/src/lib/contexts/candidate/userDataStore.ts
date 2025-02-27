import { type Id } from '@openvaa/core';
import { type CandidateData, ENTITY_TYPE, type Image } from '@openvaa/data';
import { derived, get, type Readable, writable } from 'svelte/store';
import { prepareDataWriter } from './prepareDataWriter';
import { localStorageWritable } from '../utils/storageStore';
import type { LocalizedAnswer } from '@openvaa/app-shared';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';
import type { CandidateUserData, LocalizedAnswers, LocalizedCandidateData } from '$lib/api/base/dataWriter.type';
import type { UniversalDataWriter } from '$lib/api/base/universalDataWriter';
import type { UserDataStore } from './userDataStore.type';

/**
 * Create an extended store that holds all data owned by the user. When subscribed to, it returns a composite of the initial data and any unsaved `Answer`s and properties. The edited `Answer`s are stored in `localStorage` for persistence.
 * The saved data is cleared if answers become locked.
 * Dedicated methods are provided for loading, saving, setting or resetting data.
 * @param answersLocked - A read-only store that indicates whether answers are locked.
 * @param authToken - The auth token, needed for saving data.
 * @param dataWriterPromise - A `Promise` resolving to `UniversalDataWriter` for saving data.
 * @param locale - A read-only store that indicates the current locale, used for translating some data when it's fetched.
 */
export function userDataStore({
  answersLocked,
  authToken,
  dataWriterPromise,
  locale
}: {
  answersLocked: Readable<boolean>;
  authToken: Readable<string>;
  dataWriterPromise: Promise<UniversalDataWriter>;
  locale: Readable<string>;
}): UserDataStore {
  ////////////////////////////////////////////////////////////////////
  // Internals
  ////////////////////////////////////////////////////////////////////

  // An internal store for holding the user data loaded from the backend
  const savedData = writable<CandidateUserData<true> | undefined>();

  // An internal store for holding edited answers
  const editedAnswers = localStorageWritable('CandidateContext-userDataStore-editedAnswers', {} as LocalizedAnswers);

  // An internal store for holding the edited image
  const editedImage = writable<ImageWithFile | undefined>();

  // Subscribe to `answersLocked` to clear edited data
  answersLocked.subscribe((locked) => {
    if (locked) resetUnsaved();
  });

  // A derived internal store holding the effective user data, including unsaved data. Only its subsribe method will be exposed
  const { subscribe } = derived([savedData, editedAnswers, editedImage], ([savedData, editedAnswers, editedImage]) => {
    if (!savedData) return undefined;
    const {
      user,
      candidate: { answers = {}, image, ...rest },
      nominations
    } = savedData;
    // Return clone to prevent mutation of saved data
    return structuredClone({
      candidate: {
        answers: { ...answers, ...editedAnswers },
        image: editedImage ?? image,
        ...rest
      },
      user,
      nominations
    }) as CandidateUserData<true>;
  });

  /**
   * A utility for only updating the `candidate` part of the user data.
   */
  function updateCandidateData(data: LocalizedCandidateData): void {
    savedData.update((saved) => {
      if (!saved) throw new Error('Cannot update candidate data before user data is loaded');
      return {
        ...saved,
        candidate: data
      };
    });
  }

  ////////////////////////////////////////////////////////////////////
  // Exported stores
  ////////////////////////////////////////////////////////////////////

  const savedCandidateData = derived(savedData, (savedData) => savedData?.candidate);

  const unsavedQuestionIds = derived(editedAnswers, (editedAnswers) =>
    editedAnswers ? Object.keys(editedAnswers) : []
  );

  const unsavedProperties = derived(
    editedImage,
    (editedImage) => (editedImage ? ['image'] : []) as Array<keyof CandidateData>
  );

  const hasUnsaved = derived(
    [unsavedQuestionIds, unsavedProperties],
    ([unsavedQuestionIds, unsavedProperties]) => unsavedQuestionIds.length > 0 || unsavedProperties.length > 0
  );

  ////////////////////////////////////////////////////////////////////
  // Exported methods
  ////////////////////////////////////////////////////////////////////

  function init(data: CandidateUserData<true>): void {
    savedData.set(data);
  }

  function reset(): void {
    savedData.set(undefined);
    resetUnsaved();
  }

  function resetUnsaved(): void {
    resetAnswers();
    resetImage();
  }

  function setAnswer(questionId: Id, answer: LocalizedAnswer | null): void {
    editedAnswers.update(({ ...answers }) => {
      answers[questionId] = answer;
      return answers;
    });
  }

  function resetAnswer(questionId: Id): void {
    editedAnswers.update(({ ...answers }) => {
      delete answers[questionId];
      return answers;
    });
  }

  function resetAnswers(): void {
    editedAnswers.set({});
  }

  function setImage(image: Image): void {
    editedImage.set(image);
  }

  function resetImage(): void {
    editedImage.set(undefined);
  }

  async function reloadCandidateData(): Promise<LocalizedCandidateData> {
    const dataWriter = await prepareDataWriter(dataWriterPromise);
    const userData = await dataWriter.getCandidateUserData({
      authToken: get(authToken),
      loadNominations: false,
      locale: get(locale)
    });
    if (!userData) throw new Error('Failed to load user data');
    updateCandidateData(userData.candidate);
    return userData.candidate;
  }

  async function save(): Promise<DataApiActionResult> {
    // Get the initial data to get target entity
    const saved = get(savedData);
    if (!saved) throw new Error('Save called before user data loaded');

    const token = get(authToken);
    if (!token) throw new Error('No authentication token provided');

    const answers = get(editedAnswers);
    const image = get(editedImage);
    const updateArgs = {
      authToken: token,
      target: {
        type: ENTITY_TYPE.Candidate,
        id: saved.candidate.id
      }
    };

    const dataWriter = await prepareDataWriter(dataWriterPromise);

    // Updated data will be returned by the update methods
    let updated: LocalizedCandidateData | undefined;

    if (answers && Object.keys(answers).length > 0) {
      updated = await dataWriter.updateAnswers({
        ...updateArgs,
        answers
      });
      if (!updated) throw new Error('Failed to update answers');
    }

    if (image) {
      updated = await dataWriter.updateEntityProperties({
        ...updateArgs,
        properties: { image }
      });
      if (!updated) throw new Error('Failed to update image');
    }

    // Update the user data
    if (updated) updateCandidateData(updated);
    // Only reset the answers after successful save
    resetAnswers();
    resetImage();

    return { type: 'success' };
  }

  return {
    hasUnsaved,
    init,
    reloadCandidateData,
    reset,
    resetAnswer,
    resetAnswers,
    resetImage,
    resetUnsaved,
    save,
    savedCandidateData,
    setAnswer,
    setImage,
    subscribe,
    unsavedProperties,
    unsavedQuestionIds
  };
}
