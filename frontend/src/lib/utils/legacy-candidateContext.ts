import { derived, type Readable, type Writable, writable } from 'svelte/store';
import {
  getInfoAnswers,
  getInfoQuestions,
  getLanguages,
  getOpinionAnswers,
  getOpinionQuestions,
  getParties,
  me
} from '$lib/legacy-api/candidate';
import { answerIsEmpty } from './legacy-answers';
import type { StrapiLanguageData } from '$lib/legacy-api/dataProvider/strapi';
import type { CandidateAnswer, User } from '$types/legacy-candidateAttributes';

export interface CandidateContext {
  // Authentication
  user: Writable<User | null>;
  token: Writable<string | undefined>;
  loadUserData: () => Promise<void>;
  newUserEmail: Writable<string | null | undefined>;
  // Answers
  opinionAnswers: Writable<Record<string, CandidateAnswer> | undefined>;
  loadOpinionAnswerData: () => Promise<void>;
  infoAnswers: Writable<Record<string, CandidateAnswer> | undefined>;
  loadInfoAnswerData: () => Promise<void>;
  // Languages
  allLanguages: Writable<Array<StrapiLanguageData> | undefined>;
  loadAllLanguages: () => Promise<void>;
  // Questions
  opinionQuestions: Writable<Array<LegacyQuestionProps> | undefined>;
  loadOpinionQuestionData: () => Promise<void>;
  infoQuestions: Writable<Array<LegacyQuestionProps> | undefined>;
  loadInfoQuestionData: () => Promise<void>;
  // Parties
  parties: Writable<Array<LegacyPartyProps> | undefined>;
  loadPartyData: () => Promise<void>;
  // Custom utility
  unansweredRequiredInfoQuestions: Readable<Array<LegacyQuestionProps> | undefined>;
  unansweredOpinionQuestions: Readable<Array<LegacyQuestionProps> | undefined>;
  answersLocked: Writable<boolean | undefined>;
}

const user = writable<User | null>(null);
const token = writable<string | undefined>(undefined);
const newUserEmail = writable<string | undefined>(undefined);
const allLanguages = writable<Array<StrapiLanguageData> | undefined>(undefined);
const opinionAnswers = writable<Record<string, CandidateAnswer> | undefined>(undefined);
const infoAnswers = writable<Record<string, CandidateAnswer> | undefined>(undefined);
const opinionQuestions = writable<Array<LegacyQuestionProps> | undefined>(undefined);
const infoQuestions = writable<Array<LegacyQuestionProps> | undefined>(undefined);
const parties = writable<Array<LegacyPartyProps> | undefined>(undefined);

const answersLocked = writable<boolean | undefined>(undefined);

const unansweredRequiredInfoQuestions = derived([infoQuestions, infoAnswers], ([$infoQuestions, $infoAnswers]) => {
  if (!$infoQuestions || !$infoAnswers) return;
  const requiredQuestions = $infoQuestions.filter((question) => question.required);
  return requiredQuestions.filter((question) => answerIsEmpty(question, { value: $infoAnswers?.[question.id]?.value }));
});

const unansweredOpinionQuestions = derived(
  [opinionQuestions, opinionAnswers],
  ([$opinionQuestions, $opinionAnswers]) => {
    if (!$opinionAnswers || !$opinionQuestions) return;
    return $opinionQuestions.filter(
      (question) => $opinionAnswers && !Object.keys($opinionAnswers).includes(question.id)
    );
  }
);

async function loadUserData() {
  const currentUser = await me();
  answersLocked.set(!!currentUser?.candidate?.nomination?.election?.answersLocked);
  user.set(currentUser || null);
}

async function loadAllLanguages() {
  const languages = await getLanguages();
  if (!languages) throw new Error('Could not find langugages');
  allLanguages.set(languages);
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
  loadUserData,
  newUserEmail,
  opinionAnswers,
  loadOpinionAnswerData,
  infoAnswers,
  loadInfoAnswerData,
  allLanguages,
  loadAllLanguages,
  opinionQuestions,
  loadOpinionQuestionData,
  infoQuestions,
  loadInfoQuestionData,
  unansweredRequiredInfoQuestions,
  unansweredOpinionQuestions,
  answersLocked,
  parties,
  loadPartyData
};
