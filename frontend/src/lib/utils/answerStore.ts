import {getExistingAnswers} from '$lib/api/candidate';
import {getLikertQuestions} from '$lib/api/candidate';
import {writable, type Writable} from 'svelte/store';

export interface AnswerContext {
  answers: Writable<Record<string, Answer> | undefined>;
  questions: Writable<Record<string, Question> | undefined>;
  loadAnswerData: () => Promise<void>;
  loadQuestionData: () => Promise<void>;
}

export interface Answer {
  id: string; // Id of the answer in the database
  key: AnswerOption['key']; // Selected answer option
  openAnswer: LocalizedString | null; // Optional free-form answer
}

export interface Question {
  id: string; // Id of the question in the database
  text: LocalizedString; //text of the question
}

const answerStore = writable<Record<string, Answer> | undefined>(undefined);
const questionStore = writable<Record<string, Question> | undefined>(undefined);

export const loadAnswerData = async () => {
  const answers = await getExistingAnswers();

  if (!answers) return;

  answerStore.set(answers);
};

export const loadQuestionData = async () => {
  const questions = await getLikertQuestions();

  if (!questions) return;

  questionStore.set(questions);
};

export const answerContext: AnswerContext = {
  answers: answerStore,
  questions: questionStore,
  loadAnswerData,
  loadQuestionData
};
