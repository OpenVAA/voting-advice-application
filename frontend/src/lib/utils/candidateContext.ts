import {
  authenticate,
  getInfoAnswers,
  getInfoQuestions,
  getOpinionAnswers,
  getOpinionQuestions,
  getParties,
  me
} from '$lib/api/candidate';
import type {User, Progress, CandidateAnswer} from '$lib/types/candidateAttributes';
import {derived, writable, type Writable, type Readable} from 'svelte/store';
import {answerIsEmpty} from './answers';

export interface CandidateContext {
  // Authentication
  user: Writable<User | null>;
  token: Writable<string | null | undefined>;
  logIn: (email: string, password: string) => Promise<boolean>;
  loadUserData: () => Promise<void>;
  logOut: () => void;
  loadLocalStorage: () => void;
  newUserEmail: Writable<string | null | undefined>;
  // Answers
  opinionAnswers: Writable<Record<string, CandidateAnswer> | undefined>;
  loadOpinionAnswerData: () => Promise<void>;
  infoAnswers: Writable<Record<string, CandidateAnswer> | undefined>;
  loadInfoAnswerData: () => Promise<void>;
  // Questions
  opinionQuestions: Writable<Array<QuestionProps> | undefined>;
  loadOpinionQuestionData: () => Promise<void>;
  infoQuestions: Writable<Array<QuestionProps> | undefined>;
  loadInfoQuestionData: () => Promise<void>;
  // Parties
  parties: Writable<Array<PartyProps> | undefined>;
  loadPartyData: () => Promise<void>;
  // Custom utility
  unansweredRequiredInfoQuestions: Readable<Array<QuestionProps> | undefined>;
  unansweredOpinionQuestions: Readable<Array<QuestionProps> | undefined>;
  progress: Readable<Progress | undefined>;
  answersLocked: Writable<boolean | undefined>;
}

const user = writable<User | null>(null);
const token = writable<string | null | undefined>(undefined);
const newUserEmail = writable<string | undefined>(undefined);
const opinionAnswers = writable<Record<string, CandidateAnswer> | undefined>(undefined);
const infoAnswers = writable<Record<string, CandidateAnswer> | undefined>(undefined);
const opinionQuestions = writable<Array<QuestionProps> | undefined>(undefined);
const infoQuestions = writable<Array<QuestionProps> | undefined>(undefined);
const parties = writable<Array<PartyProps> | undefined>(undefined);

const answersLocked = writable<boolean | undefined>(undefined);

const unansweredRequiredInfoQuestions = derived(
  [infoQuestions, infoAnswers],
  ([$infoQuestions, $infoAnswers]) => {
    if (!$infoQuestions || !$infoAnswers) return;
    const requiredQuestions = $infoQuestions.filter((question) => question.required);
    return requiredQuestions.filter((question) =>
      answerIsEmpty(question, {value: $infoAnswers?.[question.id]?.value})
    );
  }
);

const unansweredOpinionQuestions = derived(
  [opinionQuestions, opinionAnswers],
  ([$opinionQuestions, $opinionAnswers]) => {
    if (!$opinionAnswers || !$opinionQuestions) return;
    return $opinionQuestions.filter(
      (question) => $opinionAnswers && !Object.keys($opinionAnswers).includes(question.id)
    );
  }
);

const progress = derived(
  [opinionAnswers, opinionQuestions],
  ([$opinionAnswers, $opinionQuestions]) => {
    if ($opinionAnswers && $opinionQuestions) {
      return {
        progress: Object.keys($opinionAnswers).length,
        max: $opinionQuestions.length
      };
    }
  }
);

async function logIn(email: string, password: string) {
  const response = await authenticate(email, password);
  if (!response.ok) return false;
  const data = await response.json();
  token.set(data.jwt);
  localStorage.setItem('token', data.jwt);
  await loadUserData();
  return true;
}

function loadLocalStorage() {
  token.set(localStorage.getItem('token'));
}

async function loadUserData() {
  const currentUser = await me();
  if (!currentUser) {
    logOut();
    return;
  }
  answersLocked.set(!!currentUser.candidate?.nomination?.election?.answersLocked);
  user.set(currentUser);
}

function logOut() {
  user.set(null);
  token.set(null);
  localStorage.clear();
}

async function loadOpinionAnswerData() {
  const answers = await getOpinionAnswers();
  if (!answers) throw new Error('Could not find opinion answer data');
  opinionAnswers.set(answers);
}

async function loadInfoAnswerData() {
  const answers = await getInfoAnswers();
  if (!answers) throw new Error('Could not find info answer data');
  infoAnswers.set(answers);
}

async function loadOpinionQuestionData() {
  const questions = await getOpinionQuestions();
  opinionQuestions.set(questions);
}

async function loadInfoQuestionData() {
  const questions = await getInfoQuestions();
  infoQuestions.set(questions);
}

async function loadPartyData() {
  const partyProps = await getParties();
  parties.set(partyProps);
}

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
  answersLocked,
  parties,
  loadPartyData
};
