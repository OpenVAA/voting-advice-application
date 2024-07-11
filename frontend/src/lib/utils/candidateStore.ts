import {authenticate, getExistingInfoAnswers, getInfoQuestions, me} from '$lib/api/candidate';
import type {
  Question,
  Answer,
  User,
  Progress,
  CandidateAnswer
} from '$lib/types/candidateAttributes';
import {writable, type Writable} from 'svelte/store';
import {getExistingOpinionAnswers} from '$lib/api/candidate';
import {getOpinionQuestions} from '$lib/api/candidate';

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
  opinionAnswerStore: Writable<Record<string, Answer> | undefined>;
  loadOpinionAnswerData: () => Promise<void>;
  infoAnswerStore: Writable<Record<string, CandidateAnswer> | undefined>;
  loadInfoAnswerData: () => Promise<void>;
  // Questions
  opinionQuestionsStore: Writable<Record<string, Question> | undefined>;
  loadOpinionQuestionData: () => Promise<void>;
  infoQuestionsStore: Writable<QuestionProps[] | undefined>;
  loadInfoQuestionData: () => Promise<void>;
  // Custom util
  basicInfoFilledStore: Writable<boolean | undefined>;
  nofUnansweredInfoQuestionsStore: Writable<number | undefined>;
  opinionQuestionsFilledStore: Writable<boolean | undefined>;
  nofUnansweredOpinionQuestionsStore: Writable<number | undefined>;
  progressStore: Writable<Progress | undefined>;
  questionsLockedStore: Writable<boolean | undefined>;
}

const userStore = writable<User | null>(null);
const tokenStore = writable<string | null | undefined>(undefined);
const emailOfNewUserStore = writable<string | undefined>(undefined);
const opinionAnswerStore = writable<Record<string, Answer> | undefined>(undefined);
const infoAnswerStore = writable<Record<string, CandidateAnswer> | undefined>(undefined);
const opinionQuestionsStore = writable<Record<string, Question> | undefined>(undefined);
const infoQuestionsStore = writable<QuestionProps[] | undefined>(undefined);
const basicInfoFilledStore = writable<boolean | undefined>(undefined);
const nofUnansweredInfoQuestionsStore = writable<number | undefined>(undefined);
const opinionQuestionsFilledStore = writable<boolean | undefined>(undefined);
const nofUnansweredOpinionQuestionsStore = writable<number | undefined>(undefined);
const progressStore = writable<Progress | undefined>(undefined);
const questionsLockedStore = writable<boolean | undefined>(undefined);

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

  const canEditQuestions = user.candidate?.nomination?.election?.canEditQuestions;

  questionsLockedStore.set(!canEditQuestions);
  userStore.set(user);
};

const logOut = async () => {
  userStore.set(null);
  tokenStore.set(null);
  localStorage.clear();
};

const loadOpinionAnswerData = async () => {
  const answers = await getExistingOpinionAnswers();

  if (!answers) return;

  opinionAnswerStore.set(answers);
};

const loadInfoAnswerData = async () => {
  const answers = await getExistingInfoAnswers();

  if (!answers) return;

  infoAnswerStore.set(answers);
};

const loadOpinionQuestionData = async () => {
  const questions = await getOpinionQuestions();

  if (!questions) return;

  opinionQuestionsStore.set(questions);
};

const loadInfoQuestionData = async () => {
  const questions = await getInfoQuestions();

  if (!questions) return;

  infoQuestionsStore.set(questions);
};

export const candidateContext: CandidateContext = {
  userStore,
  tokenStore,
  logIn,
  loadUserData,
  logOut,
  emailOfNewUserStore,
  opinionAnswerStore,
  loadOpinionAnswerData,
  infoAnswerStore,
  loadInfoAnswerData,
  opinionQuestionsStore,
  loadOpinionQuestionData,
  infoQuestionsStore,
  loadInfoQuestionData,
  loadLocalStorage,
  basicInfoFilledStore,
  nofUnansweredOpinionQuestionsStore,
  opinionQuestionsFilledStore,
  nofUnansweredInfoQuestionsStore,
  progressStore,
  questionsLockedStore
};
