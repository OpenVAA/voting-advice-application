import {getExistingAnswers} from '$lib/api/candidate';
import {writable, type Writable} from 'svelte/store';

export interface AnswerContext {
  answers: Writable<Record<string, Answer>>;
  loadAnswerData: () => Promise<void>;
}

export interface Answer {
  key: string;
  id: string;
}

interface AnswerAttributes {
  answer: {key: string};
  question: {data: {id: string}};
}

interface AnswerData {
  id: string;
  attributes: AnswerAttributes;
}

const answerStore = writable<Record<string, Answer>>({});

export const loadAnswerData = async () => {
  const response = await getExistingAnswers();

  if (!response) return;

  const answerData = await response.json();
  const answers: Record<string, Answer> = {};

  answerData.data.forEach((answer: AnswerData) => {
    answers[answer.attributes.question.data.id] = {
      key: answer.attributes.answer.key,
      id: answer.id
    };
  });

  answerStore.set(answers);
};

export const answerContext: AnswerContext = {
  answers: answerStore,
  loadAnswerData
};
