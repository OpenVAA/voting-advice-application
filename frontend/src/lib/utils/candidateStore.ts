import {authenticate, me} from '$lib/api/candidate';
import type {Answer, User} from '$lib/types/candidateAttributes';
import {writable, type Writable} from 'svelte/store';
import {getExistingAnswers} from '$lib/api/candidate';
import {getLikertQuestions} from '$lib/api/candidate';

export interface CandidateContext {
  // Authentication
  userStore: Writable<User | null>;
  tokenStore: Writable<string | null | undefined>;
  logIn: (email: string, password: string) => Promise<boolean>;
  loadUserData: () => Promise<void>;
  logOut: () => Promise<void>;
  loadLocalStorage: () => void;
  emailOfNewUserStore: Writable<string | null | undefined>;
  // Answers
  answersStore: Writable<Record<string, Answer> | undefined>;
  loadAnswerData: () => Promise<void>;
  // Questions
  questionsStore: Writable<Record<string, QuestionProps> | undefined>;
  loadQuestionData: () => Promise<void>;
  // Custom util
  basicInfoFilledStore: Writable<boolean | undefined>;
  nofUnasweredBasicInfoQuestionsStore: Writable<number | undefined>;
  opinionQuestionsFilledStore: Writable<boolean | undefined>;
  nofUnansweredOpinionQuestionsStore: Writable<number | undefined>;
}

const userStore = writable<User | null>(null);
const tokenStore = writable<string | null | undefined>(undefined);
const emailOfNewUserStore = writable<string | undefined>(undefined);
const answersStore = writable<Record<string, Answer> | undefined>(undefined);
const questionsStore = writable<Record<string, QuestionProps> | undefined>(undefined);
const basicInfoFilledStore = writable<boolean | undefined>(undefined);
const nofUnansweredBasicInfoQuestionsStore = writable<number | undefined>(undefined);
const opinionQuestionsFilledStore = writable<boolean | undefined>(undefined);
const nofUnansweredOpinionQuestionsStore = writable<number | undefined>(undefined);

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
  localStorage.clear();
};

const loadAnswerData = async () => {
  const answers = await getExistingAnswers();

  if (!answers) return;

  answersStore.set(answers);
};

const loadQuestionData = async () => {
  const questions = await getLikertQuestions();

  if (!questions) return;

  questionsStore.set(questions);
};

export const candidateContext: CandidateContext = {
  userStore,
  tokenStore,
  logIn,
  loadUserData,
  logOut,
  emailOfNewUserStore,
  answersStore,
  loadAnswerData,
  questionsStore,
  loadQuestionData,
  loadLocalStorage,
  basicInfoFilledStore,
  nofUnansweredOpinionQuestionsStore: nofUnansweredOpinionQuestionsStore,
  opinionQuestionsFilledStore,
  nofUnasweredBasicInfoQuestionsStore: nofUnansweredBasicInfoQuestionsStore
};
