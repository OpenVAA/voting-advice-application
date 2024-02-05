import {getExistingAnswers} from '$lib/api/candidate';
import {writable, type Writable} from 'svelte/store';

export interface AnswerContext {
  answers: Writable<Record<string, Answer>>;
  loadAnswerData: () => Promise<void>;
}

export interface Answer {
  id: string; // Id of the answer in the database
  key: AnswerOption['key']; // Selected answer option
  openAnswer: string; // Optional free-forn answer
}

// Interfaces for data returned from the API
interface AnswerAttributes {
  answer: {key: string};
  question: {data: {id: string}};
  openAnswer?: string;
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

  // Parse the data into a more usable format where the question ID is the key
  const answers: Record<string, Answer> = {};

  answerData.data.forEach((answer: AnswerData) => {
    const openAnswer = answer.attributes.openAnswer || '';
    answers[answer.attributes.question.data.id] = {
      id: answer.id,
      key: parseInt(answer.attributes.answer.key),
      openAnswer: openAnswer
    };
  });

  answerStore.set(answers);
};

export const answerContext: AnswerContext = {
  answers: answerStore,
  loadAnswerData
};
