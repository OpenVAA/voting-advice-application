import {authenticate, getInfoAnswers, getInfoQuestions, me} from '$lib/api/candidate';
import type {User, Progress, CandidateAnswer} from '$lib/types/candidateAttributes';
import {derived, writable, type Writable, type Readable} from 'svelte/store';
import {getOpinionAnswers} from '$lib/api/candidate';
import {getOpinionQuestions} from '$lib/api/candidate';
import {answerIsEmpty} from './answers';

export interface CandidateContext {
  // Authentication
  user: Writable<User | null>;
  token: Writable<string | null | undefined>;
  logIn: (email: string, password: string) => Promise<boolean>;
  loadUserData: () => Promise<void>;
  logOut: () => Promise<void>;
  loadLocalStorage: () => void;
  newUserEmail: Writable<string | null | undefined>;
  // Answers
  opinionAnswers: Writable<Record<string, CandidateAnswer> | undefined>;
  loadOpinionAnswerData: () => Promise<void>;
  infoAnswers: Writable<Record<string, CandidateAnswer> | undefined>;
  loadInfoAnswerData: () => Promise<void>;
  // Questions
  opinionQuestions: Writable<QuestionProps[] | undefined>;
  loadOpinionQuestionData: () => Promise<void>;
  infoQuestions: Writable<QuestionProps[] | undefined>;
  loadInfoQuestionData: () => Promise<void>;
  // Custom utility
  unansweredRequiredInfoQuestions: Readable<QuestionProps[] | undefined>;
  unansweredOpinionQuestions: Readable<QuestionProps[] | undefined>;
  progress: Readable<Progress | undefined>;
  questionsLocked: Writable<boolean | undefined>;
}

const user = writable<User | null>(null);
const token = writable<string | null | undefined>(undefined);
const newUserEmail = writable<string | undefined>(undefined);
const opinionAnswers = writable<Record<string, CandidateAnswer> | undefined>(undefined);
const infoAnswers = writable<Record<string, CandidateAnswer> | undefined>(undefined);
const opinionQuestions = writable<QuestionProps[] | undefined>(undefined);
const infoQuestions = writable<QuestionProps[] | undefined>(undefined);

const questionsLocked = writable<boolean | undefined>(undefined);

const unansweredRequiredInfoQuestions = derived(
  [infoQuestions, infoAnswers],
  ([$infoQuestions, $infoAnswers]) => {
    if (!$infoQuestions || !$infoAnswers) return;
    const requiredQuestions = $infoQuestions.filter((question) => question.required);
    return requiredQuestions.filter((question) => {
      if (!$infoAnswers?.[question.id]) return true;
      const answer = $infoAnswers[question.id];
      return answerIsEmpty(question, {value: answer.value});
    });
  }
);

const unansweredOpinionQuestions = derived(
  [opinionQuestions, opinionAnswers],
  ([$opinionQuestions, $opinionAnswers]) => {
    if (!$opinionAnswers || !$opinionQuestions) return;
    return $opinionQuestions.filter((question) => {
      return $opinionAnswers && !Object.keys($opinionAnswers).includes(question.id);
    });
  }
);

const progress = derived(
  [opinionAnswers, opinionQuestions],
  ([$opinionAnswers, $opinionQuestions]) => {
    if ($opinionAnswers && $opinionQuestions) {
      return {
        progress: Object.entries($opinionAnswers).length,
        max: $opinionQuestions.length
      };
    }
  }
);

const logIn = async (email: string, password: string) => {
  const response = await authenticate(email, password);
  if (!response.ok) return false;

  const data = await response.json();
  token.set(data.jwt);
  localStorage.setItem('token', data.jwt);

  await loadUserData();

  return true;
};

const loadLocalStorage = () => {
  token.set(localStorage.getItem('token'));
};

const loadUserData = async () => {
  const currentUser = await me();
  if (!currentUser) {
    await logOut();
    return;
  }

  const canEditQuestions = currentUser.candidate?.nomination?.election?.canEditQuestions;

  questionsLocked.set(!canEditQuestions);
  user.set(currentUser);
};

const logOut = async () => {
  user.set(null);
  token.set(null);
  localStorage.clear();
};

const loadOpinionAnswerData = async () => {
  const answers = await getOpinionAnswers();

  if (!answers) {
    throw new Error('Could not find opinion answer data');
  }
  opinionAnswers.set(answers);
};

const loadInfoAnswerData = async () => {
  const answers = await getInfoAnswers();

  if (!answers) {
    throw new Error('Could not find info answer data');
  }

  infoAnswers.set(answers);
};

const loadOpinionQuestionData = async () => {
  const questions = await getOpinionQuestions();

  if (!questions) {
    throw new Error('Could not find opinion question data');
  }

  opinionQuestions.set(questions);
};

const loadInfoQuestionData = async () => {
  const questions = await getInfoQuestions();

  if (!questions) {
    throw new Error('Could not find info question data');
  }

  infoQuestions.set(questions);
};

export const candidateContext: CandidateContext = {
  user,
  token,
  logIn,
  loadUserData,
  logOut,
  newUserEmail,
  opinionAnswers,
  loadOpinionAnswerData,
  infoAnswers,
  loadInfoAnswerData,
  opinionQuestions,
  loadOpinionQuestionData,
  infoQuestions,
  loadInfoQuestionData,
  loadLocalStorage,
  unansweredRequiredInfoQuestions,
  unansweredOpinionQuestions,
  progress,
  questionsLocked
};
