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
 * A Svelte 5 class implementation of the candidate's composite user-data store
 * (v2.13 context-as-class migration, CLASS-06). Holds all data owned by the user;
 * when reading `current`, it returns a composite of the initial data and any
 * unsaved `Answer`s and properties. The edited `Answer`s are stored in
 * `localStorage` for persistence (the persistence + version bridge is INHERITED
 * from `localStorageState`/`PersistedStateImpl` unchanged, §22 — this class does
 * NOT own a `#version`; the `{ version, data }` payload lives in
 * `persistedState.svelte.ts`).
 *
 * Per the D2 type-name-clash landmine, the public surface is the TYPE
 * `CandidateUserDataStore` that this class `implements`, so the class is named
 * `CandidateUserDataStoreImpl` (Phase-110 `AnswerStoreImpl` precedent) and the
 * factory `candidateUserDataStore(...)` stays byte-identical.
 *
 * The 12 public methods are ARROW-FUNCTION FIELDS (§18) so they survive being
 * held as `userData.X` on the candidate context and called detached. The
 * reactive members (`current`/`hasUnsaved`/`savedCandidateData`/`unsavedQuestionIds`/
 * `unsavedProperties`) are prototype getters read in-place (§17 — this store is
 * NOT spread by any consumer, so prototype getters are safe).
 *
 * @internal Construct via the `candidateUserDataStore(...)` factory at component
 * init. The constructor installs an `$effect` (reacting to `answersLocked` to
 * clear unsaved edits), so constructing outside an effect context throws
 * `effect_orphan`.
 */
class CandidateUserDataStoreImpl implements CandidateUserDataStore {
  #answersLocked: () => boolean;
  #dataWriterPromise: Promise<UniversalDataWriter>;
  #locale: () => string;

  ////////////////////////////////////////////////////////////////////
  // Internals
  ////////////////////////////////////////////////////////////////////

  // An internal $state for holding the user data loaded from the backend
  #savedData = $state<CandidateUserData<true> | undefined>(undefined);

  // An internal persisted store for holding edited answers
  #editedAnswersStore = localStorageState(
    'CandidateContext-candidateUserDataStore-editedAnswers',
    {} as LocalizedAnswers
  );

  // An internal $state for holding the edited image
  #editedImage = $state<ImageWithFile | undefined>(undefined);

  // An internal $state for holding the edited `termsOfUseAccepted` property
  #editedTermsOfUseAccepted = $state<string | null | undefined>(undefined);

  // A derived value holding the effective user data, including unsaved data
  #current = $derived.by(() => {
    const editedAnswers = this.#editedAnswersStore.current;
    if (!this.#savedData) return undefined;
    const {
      user,
      candidate: { answers = {}, image, termsOfUseAccepted, ...rest },
      nominations
    } = this.#savedData;
    // Return clone to prevent mutation of saved data.
    // Use JSON round-trip instead of structuredClone because Svelte 5's
    // $state proxy objects cannot be structurally cloned.
    return JSON.parse(JSON.stringify({
      candidate: {
        answers: { ...answers, ...editedAnswers },
        image: this.#editedImage ?? image,
        termsOfUseAccepted: this.#editedTermsOfUseAccepted ?? termsOfUseAccepted,
        ...rest
      },
      user,
      nominations
    })) as CandidateUserData<true>;
  });

  constructor({
    answersLocked,
    dataWriterPromise,
    locale
  }: {
    answersLocked: () => boolean;
    dataWriterPromise: Promise<UniversalDataWriter>;
    locale: () => string;
  }) {
    this.#answersLocked = answersLocked;
    this.#dataWriterPromise = dataWriterPromise;
    this.#locale = locale;

    // React to `answersLocked` to clear edited data
    $effect(() => {
      if (this.#answersLocked()) this.resetUnsaved();
    });
  }

  /**
   * A utility for only updating the `candidate` part of the user data.
   */
  #updateCandidateData(data: LocalizedCandidateData): void {
    if (!this.#savedData) throw new Error('Cannot update candidate data before user data is loaded');
    this.#savedData = {
      ...this.#savedData,
      candidate: data
    };
  }

  /**
   * A utility for merging updated `answers` into the existing `candidate` without
   * replacing the whole candidate. This preserves the candidate's `id` and all
   * static fields (`firstName`, `image`, `termsOfUseAccepted`, etc.), which the
   * answer setters do NOT return — they return only the updated `LocalizedAnswers`.
   */
  #mergeCandidateAnswers(answers: LocalizedAnswers): void {
    if (!this.#savedData) throw new Error('Cannot update candidate data before user data is loaded');
    const mergedAnswers = {
      ...(this.#savedData.candidate.answers ?? {}),
      ...answers
      // `LocalizedCandidateData.answers` resolves to `Answers & LocalizedAnswers`
      // (the CandidateData/EntityData base intersected with the LocalizedAnswers
      // override). The merge yields a valid `LocalizedAnswers`; cast to the field type.
    } as LocalizedCandidateData['answers'];
    this.#updateCandidateData({
      ...this.#savedData.candidate,
      answers: mergedAnswers
    });
  }

  ////////////////////////////////////////////////////////////////////
  // Exported reactive values
  ////////////////////////////////////////////////////////////////////

  #savedCandidateData = $derived(this.#savedData?.candidate);

  #unsavedQuestionIds = $derived.by(() => {
    const editedAnswers = this.#editedAnswersStore.current;
    return editedAnswers ? Object.keys(editedAnswers) : [];
  });

  #unsavedProperties = $derived.by(
    () =>
      [this.#editedImage ? 'image' : undefined, this.#editedTermsOfUseAccepted ? 'termsOfUseAccepted' : undefined].filter(
        (p) => p !== undefined
      ) as Array<keyof LocalizedCandidateData>
  );

  #hasUnsaved = $derived(this.#unsavedQuestionIds.length > 0 || this.#unsavedProperties.length > 0);

  get current(): CandidateUserData<true> | undefined {
    return this.#current;
  }

  get hasUnsaved(): boolean {
    return this.#hasUnsaved;
  }

  get savedCandidateData(): LocalizedCandidateData | undefined {
    return this.#savedCandidateData;
  }

  get unsavedQuestionIds(): Array<Id> {
    return this.#unsavedQuestionIds;
  }

  get unsavedProperties(): Array<keyof LocalizedCandidateData> {
    return this.#unsavedProperties;
  }

  ////////////////////////////////////////////////////////////////////
  // Exported methods
  ////////////////////////////////////////////////////////////////////

  init = (data: CandidateUserData<true>): void => {
    this.#savedData = data;
  };

  reset = (): void => {
    this.#savedData = undefined;
    this.resetUnsaved();
  };

  resetUnsaved = (): void => {
    this.resetAnswers();
    this.resetImage();
    this.resetTermsOfUseAccepted();
  };

  setAnswer = (questionId: Id, answer: LocalizedAnswer | null): void => {
    this.#editedAnswersStore.update(({ ...answers }) => {
      answers[questionId] = answer;
      return answers;
    });
  };

  resetAnswer = (questionId: Id): void => {
    this.#editedAnswersStore.update(({ ...answers }) => {
      delete answers[questionId];
      return answers;
    });
  };

  resetAnswers = (): void => {
    this.#editedAnswersStore.set({});
  };

  setImage = (image: Image): void => {
    this.#editedImage = image;
  };

  resetImage = (): void => {
    this.#editedImage = undefined;
  };

  setTermsOfUseAccepted = (value: string | null): void => {
    this.#editedTermsOfUseAccepted = value;
  };

  resetTermsOfUseAccepted = (): void => {
    this.#editedTermsOfUseAccepted = undefined;
  };

  reloadCandidateData = async (): Promise<LocalizedCandidateData> => {
    const dataWriter = await prepareDataWriter(this.#dataWriterPromise);
    const userData = await dataWriter.getCandidateUserData({
      authToken: '',
      loadNominations: false,
      locale: this.#locale()
    });
    if (!userData) throw new Error('Failed to load user data');
    this.#updateCandidateData(userData.candidate);
    return userData.candidate;
  };

  save = async (): Promise<DataApiActionResult> => {
    // Get the initial data to get target entity
    if (!this.#savedData) throw new Error('Save called before user data loaded');

    const answers = this.#editedAnswersStore.current;
    const image = this.#editedImage;
    const termsOfUseAccepted = this.#editedTermsOfUseAccepted;
    const updateArgs = {
      authToken: '',
      target: {
        type: ENTITY_TYPE.Candidate,
        id: this.#savedData.candidate.id
      }
    };

    const dataWriter = await prepareDataWriter(this.#dataWriterPromise);

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
      this.#mergeCandidateAnswers(updatedAnswers);
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
      this.#updateCandidateData({ ...this.#savedData.candidate, ...updatedCandidate });
    }
    // Only reset the answers after successful save
    this.resetAnswers();
    this.resetImage();
    this.resetTermsOfUseAccepted();

    return { type: 'success' };
  };
}

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
  return new CandidateUserDataStoreImpl({ answersLocked, dataWriterPromise, locale });
}
