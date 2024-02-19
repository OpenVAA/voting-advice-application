import {getExistingAnswers} from '$lib/api/candidate';
import {writable, type Writable} from 'svelte/store';

export interface AnswerContext {
  answers: Writable<Record<string, Answer> | undefined>;
  loadAnswerData: () => Promise<void>;
}

export interface Answer {
  id: string; // Id of the answer in the database
  key: AnswerOption['key']; // Selected answer option
  openAnswer: LocalizedString | null; // Optional free-form answer
}

const answerStore = writable<Record<string, Answer> | undefined>(undefined);

export const loadAnswerData = async () => {
  const answers = await getExistingAnswers();

  if (!answers) return;

  answerStore.set(answers);
};

export const answerContext: AnswerContext = {
  answers: answerStore,
  loadAnswerData
};
