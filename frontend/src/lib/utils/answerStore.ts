import {getExistingAnswers} from '$lib/api/candidate';
import {writable, type Writable} from 'svelte/store';

export interface Question {
  id: number;
  question: string;
}

export interface Answer {
  id: number;
  key: string;
  question: Question;
}

export interface AnswerContext {
  answers: Writable<unknown | null>;
  loadAnswerData: () => Promise<void>;
}

const answerStore = writable<unknown | null>(null);

export const loadAnswerData = async () => {
  const answers = await getExistingAnswers();
  if (!answers) return;

  answerStore.set(answers);
};

export const answerContext: AnswerContext = {
  answers: answerStore,
  loadAnswerData
};
