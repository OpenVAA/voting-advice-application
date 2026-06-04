import { ENTITY_TYPE } from '@openvaa/data';
import { localStorageState } from '../utils/persistedState.svelte';
import { prepareDataWriter } from '../utils/prepareDataWriter';
import type { LocalizedAnswer } from '@openvaa/app-shared';
import type { Id } from '@openvaa/core';
import type { Image } from '@openvaa/data';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';
import type { CandidateUserData, LocalizedAnswers, LocalizedCandidateData } from '$lib/api/base/dataWriter.type';
import type { UniversalDataWriter } from '$lib/api/base/universalDataWriter';
import type { CandidateUserDataStore } from './candidateUserDataStore.type';

/**
 * Create an extended reactive object that holds all data owned by the user. When reading `current`, it returns a composite of the initial data and any unsaved `Answer`s and properties. The edited `Answer`s are stored in `localStorage` for persistence.
 * The saved data is cleared if answers become locked.
 * Dedicated methods are provided for loading, saving, setting or resetting data.
 * @param answersLocked - A getter that indicates whether answers are locked.
 * @param dataWriterPromise - A `Promise` resolving to `UniversalDataWriter` for saving data.
 * @param locale - The current locale string, used for translating some data when it's fetched.
 */
export function candidateUserDataStore({
  answersLocked,
  dataWriterPromise,
  locale
}: {
  answersLocked: () => boolean;
  dataWriterPromise: Promise<UniversalDataWriter>;
  locale: () => string;
}): CandidateUserDataStore {
  ////////////////////////////////////////////////////////////////////
  // Internals
  ////////////////////////////////////////////////////////////////////

  // An internal $state for holding the user data loaded from the backend
  let savedData = $state<CandidateUserData<true> | undefined>(undefined);

  // An internal persisted store for holding edited answers
  const _editedAnswersStore = localStorageState(
    'CandidateContext-candidateUserDataStore-editedAnswers',
    {} as LocalizedAnswers
  );

  // An internal $state for holding the edited image
  let editedImage = $state<ImageWithFile | undefined>(undefined);

  // An internal $state for holding the edited `termsOfUseAccepted` property
  let editedTermsOfUseAccepted = $state<string | null | undefined>(undefined);

  // React to `answersLocked` to clear edited data
  $effect(() => {
    if (answersLocked()) resetUnsaved();
  });

  // A derived value holding the effective user data, including unsaved data
  const _current = $derived.by(() => {
    const editedAnswers = _editedAnswersStore.current;
    if (!savedData) return undefined;
    const {
      user,
      candidate: { answers = {}, image, termsOfUseAccepted, ...rest },
      nominations
    } = savedData;
    // Return clone to prevent mutation of saved data.
    // Use JSON round-trip instead of structuredClone because Svelte 5's
    // $state proxy objects cannot be structurally cloned.
    return JSON.parse(JSON.stringify({
      candidate: {
        answers: { ...answers, ...editedAnswers },
        image: editedImage ?? image,
        termsOfUseAccepted: editedTermsOfUseAccepted ?? termsOfUseAccepted,
        ...rest
      },
      user,
      nominations
    })) as CandidateUserData<true>;
  });

  /**
   * A utility for only updating the `candidate` part of the user data.
   */
  function updateCandidateData(data: LocalizedCandidateData): void {
    if (!savedData) throw new Error('Cannot update candidate data before user data is loaded');
    savedData = {
      ...savedData,
      candidate: data
    };
  }

  /**
   * A utility for merging updated `answers` into the existing `candidate` without
   * replacing the whole candidate. This preserves the candidate's `id` and all
   * static fields (`firstName`, `image`, `termsOfUseAccepted`, etc.), which the
   * answer setters do NOT return — they return only the updated `LocalizedAnswers`.
   */
  function mergeCandidateAnswers(answers: LocalizedAnswers): void {
    if (!savedData) throw new Error('Cannot update candidate data before user data is loaded');
    const mergedAnswers = {
      ...(savedData.candidate.answers ?? {}),
      ...answers
      // `LocalizedCandidateData.answers` resolves to `Answers & LocalizedAnswers`
      // (the CandidateData/EntityData base intersected with the LocalizedAnswers
      // override). The merge yields a valid `LocalizedAnswers`; cast to the field type.
    } as LocalizedCandidateData['answers'];
    updateCandidateData({
      ...savedData.candidate,
      answers: mergedAnswers
    });
  }

  ////////////////////////////////////////////////////////////////////
  // Exported reactive values
  ////////////////////////////////////////////////////////////////////

  const _savedCandidateData = $derived(savedData?.candidate);

  const _unsavedQuestionIds = $derived.by(() => {
    const editedAnswers = _editedAnswersStore.current;
    return editedAnswers ? Object.keys(editedAnswers) : [];
  });

  const _unsavedProperties = $derived.by(
    () =>
      [editedImage ? 'image' : undefined, editedTermsOfUseAccepted ? 'termsOfUseAccepted' : undefined].filter(
        (p) => p !== undefined
      ) as Array<keyof LocalizedCandidateData>
  );

  const _hasUnsaved = $derived(_unsavedQuestionIds.length > 0 || _unsavedProperties.length > 0);

  ////////////////////////////////////////////////////////////////////
  // Exported methods
  ////////////////////////////////////////////////////////////////////

  function init(data: CandidateUserData<true>): void {
    savedData = data;
  }

  function reset(): void {
    savedData = undefined;
    resetUnsaved();
  }

  function resetUnsaved(): void {
    resetAnswers();
    resetImage();
    resetTermsOfUseAccepted();
  }

  function setAnswer(questionId: Id, answer: LocalizedAnswer | null): void {
    _editedAnswersStore.update(({ ...answers }) => {
      answers[questionId] = answer;
      return answers;
    });
  }

  function resetAnswer(questionId: Id): void {
    _editedAnswersStore.update(({ ...answers }) => {
      delete answers[questionId];
      return answers;
    });
  }

  function resetAnswers(): void {
    _editedAnswersStore.set({});
  }

  function setImage(image: Image): void {
    editedImage = image;
  }

  function resetImage(): void {
    editedImage = undefined;
  }

  function setTermsOfUseAccepted(value: string | null): void {
    editedTermsOfUseAccepted = value;
  }

  function resetTermsOfUseAccepted(): void {
    editedTermsOfUseAccepted = undefined;
  }

  async function reloadCandidateData(): Promise<LocalizedCandidateData> {
    const dataWriter = await prepareDataWriter(dataWriterPromise);
    const userData = await dataWriter.getCandidateUserData({
      authToken: '',
      loadNominations: false,
      locale: locale()
    });
    if (!userData) throw new Error('Failed to load user data');
    updateCandidateData(userData.candidate);
    return userData.candidate;
  }

  async function save(): Promise<DataApiActionResult> {
    // Get the initial data to get target entity
    if (!savedData) throw new Error('Save called before user data loaded');

    const answers = _editedAnswersStore.current;
    const image = editedImage;
    const termsOfUseAccepted = editedTermsOfUseAccepted;
    const updateArgs = {
      authToken: '',
      target: {
        type: ENTITY_TYPE.Candidate,
        id: savedData.candidate.id
      }
    };

    const dataWriter = await prepareDataWriter(dataWriterPromise);

    // The answer setters return only the updated `LocalizedAnswers` map, while
    // the property setter returns the whole updated `LocalizedCandidateData`.
    // These two shapes MUST be handled distinctly so the answers-only path does
    // not replace the candidate (which would drop its `id` and static fields).
    let updatedAnswers: LocalizedAnswers | undefined;
    let updatedCandidate: LocalizedCandidateData | undefined;

    if (answers && Object.keys(answers).length > 0) {
      updatedAnswers = await dataWriter.updateAnswers({
        ...updateArgs,
        answers
      });
      if (!updatedAnswers) throw new Error('Failed to update answers');
      // Merge the updated answers into the existing candidate, preserving id + static fields.
      mergeCandidateAnswers(updatedAnswers);
    }

    if (image || termsOfUseAccepted) {
      updatedCandidate = await dataWriter.updateEntityProperties({
        ...updateArgs,
        properties: { image, termsOfUseAccepted }
      });
      if (!updatedCandidate) throw new Error('Failed to update image or termsOfUseAccepted');
      // The property setter returns ONLY the changed properties (`termsOfUseAccepted`,
      // `image`) — NOT the whole candidate. Merge them into the existing candidate so
      // `id` and the other static fields (and any just-merged answers) survive; a
      // wholesale replace here would drop `id` and break the next save's RPC call.
      updateCandidateData({ ...savedData.candidate, ...updatedCandidate });
    }
    // Only reset the answers after successful save
    resetAnswers();
    resetImage();
    resetTermsOfUseAccepted();

    return { type: 'success' };
  }

  return {
    get current() {
      return _current;
    },
    get hasUnsaved() {
      return _hasUnsaved;
    },
    get savedCandidateData() {
      return _savedCandidateData;
    },
    get unsavedQuestionIds() {
      return _unsavedQuestionIds;
    },
    get unsavedProperties() {
      return _unsavedProperties;
    },
    init,
    reloadCandidateData,
    reset,
    resetAnswer,
    resetAnswers,
    resetImage,
    resetTermsOfUseAccepted,
    resetUnsaved,
    save,
    setAnswer,
    setImage,
    setTermsOfUseAccepted
  };
}
