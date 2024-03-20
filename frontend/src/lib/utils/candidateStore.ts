import {authenticate, me} from '$lib/api/candidate';
import type {Answer, Question, User} from '$lib/types/candidateAttributes';
import {writable, type Writable} from 'svelte/store';
import {getExistingAnswers} from '$lib/api/candidate';
import {getLikertQuestions} from '$lib/api/candidate';

export interface CandidateContext {
  // Authentication
  user: Writable<User | null>;
  token: Writable<string | null | undefined>;
  logIn: (email: string, password: string) => Promise<boolean>;
  loadUserData: () => Promise<void>;
  logOut: () => Promise<void>;
  loadLocalStorage: () => void;
  emailOfNewUser: Writable<string | null | undefined>;
  // Answers
  answers: Writable<Record<string, Answer> | undefined>;
  loadAnswerData: () => Promise<void>;
  // Questions
  questions: Writable<Record<string, Question> | undefined>;
  loadQuestionData: () => Promise<void>;
  // Custom util
  basicInfoFilled: Writable<boolean | undefined>;
  nofUnansweredQuestions: Writable<number | undefined>;
}

const userStore = writable<User | null>(null);
const tokenStore = writable<string | null | undefined>(undefined);
const emailOfNewUserStore = writable<string | undefined>(undefined);
const answerStore = writable<Record<string, Answer> | undefined>(undefined);
const questionStore = writable<Record<string, Question> | undefined>(undefined);
const basicInfoFilled = writable<boolean | undefined>(undefined);
const nofUnansweredQuestionsStore = writable<number | undefined>(undefined);

const logIn = async (email: string, password: string) => {
  const response = await authenticate(email, password);
  if (!response.ok) return false;

  const data = await response.json();
  tokenStore.set(data.jwt);
  localStorage.setItem('token', data.jwt);

  await loadUserData();

  return true;
};

const loadLocalStorage = () => {
  tokenStore.set(localStorage.getItem('token'));
};

const loadUserData = async () => {
  const user = await me();
  if (!user) {
    await logOut();
    return;
  }

  userStore.set(user);
};

const logOut = async () => {
  userStore.set(null);
  tokenStore.set(null);
  localStorage.removeItem('token');
};

const loadAnswerData = async () => {
  const answers = await getExistingAnswers();

  if (!answers) return;

  answerStore.set(answers);
};

const loadQuestionData = async () => {
  const questions = await getLikertQuestions();

  if (!questions) return;

  questionStore.set(questions);
};

export const candidateContext: CandidateContext = {
  user: userStore,
  token: tokenStore,
  logIn,
  loadUserData,
  logOut,
  emailOfNewUser: emailOfNewUserStore,
  answers: answerStore,
  loadAnswerData,
  questions: questionStore,
  loadQuestionData,
  loadLocalStorage,
  basicInfoFilled,
  nofUnansweredQuestions: nofUnansweredQuestionsStore
};
