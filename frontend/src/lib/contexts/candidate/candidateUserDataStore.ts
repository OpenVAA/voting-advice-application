import { type Id } from '@openvaa/core';
import { ENTITY_TYPE, type Image } from '@openvaa/data';
import { derived, get, type Readable, writable } from 'svelte/store';
import { prepareDataWriter } from '../utils/prepareDataWriter';
import { localStorageWritable } from '../utils/storageStore';
import type { LocalizedAnswer } from '@openvaa/app-shared';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';
import type { CandidateUserData, LocalizedAnswers, LocalizedCandidateData } from '$lib/api/base/dataWriter.type';
import type { UniversalDataWriter } from '$lib/api/base/universalDataWriter';
import type { CandidateUserDataStore } from './candidateUserDataStore.type';

/**
 * Create an extended store that holds all data owned by the user. When subscribed to, it returns a composite of the initial data and any unsaved `Answer`s and properties. The edited `Answer`s are stored in `localStorage` for persistence.
 * The saved data is cleared if answers become locked.
 * Dedicated methods are provided for loading, saving, setting or resetting data.
 * @param answersLocked - A read-only store that indicates whether answers are locked.
 * @param authToken - The auth token, needed for saving data.
 * @param dataWriterPromise - A `Promise` resolving to `UniversalDataWriter` for saving data.
 * @param locale - A read-only store that indicates the current locale, used for translating some data when it's fetched.
 */
export function candidateUserDataStore({
  answersLocked,
  authToken,
  dataWriterPromise,
  locale
}: {
  answersLocked: Readable<boolean>;
  authToken: Readable<string | undefined>;
  dataWriterPromise: Promise<UniversalDataWriter>;
  locale: Readable<string>;
}): CandidateUserDataStore {
  ////////////////////////////////////////////////////////////////////
  // Internals
  ////////////////////////////////////////////////////////////////////

  // An internal store for holding the user data loaded from the backend
  const savedData = writable<CandidateUserData<true> | undefined>();

  // An internal store for holding edited answers
  const editedAnswers = localStorageWritable(
    'CandidateContext-candidateUserDataStore-editedAnswers',
    {} as LocalizedAnswers
  );

  // An internal store for holding the edited image
  const editedImage = writable<ImageWithFile | undefined>();

  // An internal store for holding the edited `termsOfUseAccepted` property
  const editedTermsOfUseAccepted = writable<string | null | undefined>();

  // Subscribe to `answersLocked` to clear edited data
  answersLocked.subscribe((locked) => {
    if (locked) resetUnsaved();
  });

  // A derived internal store holding the effective user data, including unsaved data. Only its subsribe method will be exposed
  const { subscribe } = derived(
    [savedData, editedAnswers, editedImage, editedTermsOfUseAccepted],
    ([savedData, editedAnswers, editedImage, editedTermsOfUseAccepted]) => {
      if (!savedData) return undefined;
      const {
        user,
        candidate: { answers = {}, image, termsOfUseAccepted, ...rest },
        nominations
      } = savedData;
      // Return clone to prevent mutation of saved data
      return structuredClone({
        candidate: {
          answers: { ...answers, ...editedAnswers },
          image: editedImage ?? image,
          termsOfUseAccepted: editedTermsOfUseAccepted ?? termsOfUseAccepted,
          ...rest
        },
        user,
        nominations
      }) as CandidateUserData<true>;
    }
  );

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
    [editedImage, editedTermsOfUseAccepted],
    ([editedImage, editedTermsOfUseAccepted]) =>
      [editedImage ? 'image' : undefined, editedTermsOfUseAccepted ? 'termsOfUseAccepted' : undefined].filter(
        (p) => p !== undefined
      ) as Array<keyof LocalizedCandidateData>
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
    resetTermsOfUseAccepted();
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

  function setTermsOfUseAccepted(value: string | null): void {
    editedTermsOfUseAccepted.set(value);
  }

  function resetTermsOfUseAccepted(): void {
    editedTermsOfUseAccepted.set(undefined);
  }

  async function reloadCandidateData(): Promise<LocalizedCandidateData> {
    const token = get(authToken);
    if (!token) throw new Error('No authentication token provided');

    const dataWriter = await prepareDataWriter(dataWriterPromise);
    const userData = await dataWriter.getCandidateUserData({
      authToken: token,
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
    const termsOfUseAccepted = get(editedTermsOfUseAccepted);
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

    if (image || termsOfUseAccepted) {
      updated = await dataWriter.updateEntityProperties({
        ...updateArgs,
        properties: { image, termsOfUseAccepted }
      });
      if (!updated) throw new Error('Failed to update image or termsOfUseAccepted');
    }

    // Update the user data
    if (updated) updateCandidateData(updated);
    // Only reset the answers after successful save
    resetAnswers();
    resetImage();
    resetTermsOfUseAccepted();

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
    resetTermsOfUseAccepted,
    resetUnsaved,
    save,
    savedCandidateData,
    setAnswer,
    setImage,
    setTermsOfUseAccepted,
    subscribe,
    unsavedProperties,
    unsavedQuestionIds
  };
}
