import {writable} from 'svelte/store';
import {createStoreValueAndSubscribeToLocalStorage} from './utils/storeHelper';

// ----- Actual Svelte Store values below -----

// Values for language support
export const supportedLanguagesLoadedFromBackend = writable(false);

// Values for Questions
export const currentQuestionId = createStoreValueAndSubscribeToLocalStorage('currentQuestionId', 1);
export const answeredQuestions = createStoreValueAndSubscribeToLocalStorage('answeredQuestions', 1);
export const candidateRankings = createStoreValueAndSubscribeToLocalStorage('candidateRankings', 1);
export const questionsLoaded = writable(false);
export const errorInGettingQuestion = writable(false);
