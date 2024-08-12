/**
 * This is a severely limited implementation of the `DataProvider` that connects to locally stored JSON files.
 */

import fs from 'fs';
import path from 'path';
import {error} from '@sveltejs/kit';
import {locales} from '$lib/i18n';
import {logDebugError} from '$lib/utils/logger';
import type {
  GetAllPartiesOptions,
  GetAnyQuestionsOptions,
  GetDataOptionsBase,
  GetElectionOptions,
  GetNominatedCandidatesOptions,
  GetNominatingPartiesOptions,
  GetQuestionsOptionsBase,
  DataProvider
} from '../dataProvider';
import {filterById} from './utils/filterById';
import {DataFolder} from './dataFolder';
import {setFeedback} from './setFeedback';
import {ensureColors} from '$lib/utils/color/ensureColors';
import type {LocalQuestionCategoryProps, LocalQuestionProps} from './localDataProvider.type';

///////////////////////////////////////////////////////
// LIMITED SUPPORT
///////////////////////////////////////////////////////

/**
 * Unsupported options that are resolved to a default
 */
const UNSUPPORTED_OPTIONS = ['loadAnswers', 'locale'];

/**
 * Unsupported options that throw if present
 */
const CRITICAL_UNSUPPORTED_OPTIONS = ['constituencyId', 'electionId', 'loadMembers'];

/**
 * Warn or throw if some of the options are not supported.
 * @param options
 */
function warnOnUnsupportedOptions(options: GetDataOptionsBase = {}) {
  // This would be better to check at initialization, but having it at the top of the module produces a Vite compilation error
  if (locales.get().length !== 1) {
    error(500, '[localDataProvider] The current implementation fully supports only one locale.');
  }
  for (const key in options) {
    if (CRITICAL_UNSUPPORTED_OPTIONS.includes(key))
      error(500, `[localDataProvider] Unsupported get data option (critical): ${key}`);
    if (UNSUPPORTED_OPTIONS.includes(key))
      logDebugError(`[localDataProvider] Unsupported get data option: ${key}`);
  }
}

///////////////////////////////////////////////////////
// INTERNAL GETTERS AND UTILITIES
///////////////////////////////////////////////////////

function readFile<TType>(filename: string): Promise<TType> {
  const fp = path.join(process.cwd(), DataFolder.Root, filename);
  logDebugError(`[localDataProvider] readFile: ${fp}`);
  return fs.promises
    .readFile(fp)
    .then((data) => JSON.parse(data.toString()) as TType)
    .catch((e) => error(500, `Error reading file ${filename}: ${'message' in e ? e.message : e}`));
}

/**
 * Parse a list of `QuestionProps` objects from a promised list of `LocalQuestionProps` objects.
 */
function parseQuestions(questions: Promise<LocalQuestionProps[]>): Promise<QuestionProps[]> {
  return Promise.all([questions, getAllQuestionCategories()]).then(([qsts, cats]) => {
    const qstProps = qsts.map((q) => parseQuestion(cats, q));
    // Link the questions to the categories
    for (const cat of Object.values(cats)) {
      cat.questions = qstProps.filter((q) => q.category === cat);
    }
    return qstProps;
  });
}

/**
 * Get all question categories as a dictionary.
 * NB. The categories do not contain questions yet and must be supplied with those later.
 */
function getAllQuestionCategories(): Promise<Record<string, QuestionCategoryProps>> {
  return readFile<LocalQuestionCategoryProps[]>('questionCategories.json').then((categories) =>
    Object.fromEntries(categories.map((c) => [c.id, {...c, questions: []}]))
  );
}

/**
 * Parse a `QuestionProps` object from a `LocalQuestionProps` object, mainly by filling in the `category` property.
 * @param questionCategories All question categories
 * @param question The `LocalQuestionProps` object
 */
function parseQuestion(
  questionCategories: Record<string, QuestionCategoryProps>,
  question: LocalQuestionProps
): QuestionProps {
  const {categoryId, ...rest} = question;
  const category = questionCategories[categoryId];
  if (category == null) {
    error(
      500,
      `No question category found with id ${question.categoryId} for question ${JSON.stringify(question)}`
    );
  }
  return {...rest, category};
}

///////////////////////////////////////////////////////
// DATAPROVIDER IMPLEMENTATION
///////////////////////////////////////////////////////

/**
 * Get app settings.
 * @returns The app settings or `undefined` if there was an error
 */
function getAppSettings(options?: GetDataOptionsBase): Promise<Partial<AppSettings> | undefined> {
  warnOnUnsupportedOptions(options);
  return readFile<Partial<AppSettings>>('appSettings.json');
}

/**
 * Get the default `Election` object or one matching the `id`.
 * @returns A Promise with `ElectionProps`
 */
function getElection(options?: GetElectionOptions): Promise<ElectionProps> {
  warnOnUnsupportedOptions(options);
  return readFile<ElectionProps>('election.json').then((election) => {
    if (options?.id == null) return election;
    if (election.id === options.id) return election;
    error(500, `No election found with id ${options.id}`);
  });
}

/**
 * This is a redundant and will likely be made obsolete. Use the other question getters instead.
 * NB. The implementation is also inefficient when getting all questions, bc `getAllQuestionCategories` is called twice.
 */
function getQuestions(options?: GetAnyQuestionsOptions): Promise<QuestionProps[]> {
  warnOnUnsupportedOptions(options);
  if (options?.categoryType == null || options?.categoryType === 'all')
    return Promise.all([getInfoQuestions(options), getOpinionQuestions(options)]).then(
      ([iQ, oQ]) => [...iQ, ...oQ]
    );
  if (options?.categoryType === 'info') return getInfoQuestions(options);
  if (options?.categoryType === 'opinion') return getOpinionQuestions(options);
  error(500, `No questions found with categoryType ${options?.categoryType}`);
}

/**
 * Get all the info questions.
 * @returns A Promise with an array of `QuestionProps`
 */
function getInfoQuestions(options?: GetQuestionsOptionsBase): Promise<QuestionProps[]> {
  warnOnUnsupportedOptions(options);
  return parseQuestions(readFile<LocalQuestionProps[]>('infoQuestions.json'));
}

/**
 * Get all the opinion questions.
 * @returns A Promise with an array of `QuestionProps`
 */
function getOpinionQuestions(options?: GetQuestionsOptionsBase): Promise<QuestionProps[]> {
  warnOnUnsupportedOptions(options);
  return parseQuestions(readFile<LocalQuestionProps[]>('opinionQuestions.json'));
}

/**
 * Get all the parties, regardless whether they are nominated, have nominations or not.
 * @returns A Promise with an array of `PartyProps`
 */
function getAllParties(options?: GetAllPartiesOptions): Promise<PartyProps[]> {
  warnOnUnsupportedOptions(options);
  return readFile<PartyProps[]>('parties.json')
    .then((parties) => filterById(parties, options))
    .then((parties) =>
      parties.map((p) => ({
        ...p,
        ...ensureColors(p.color, p.colorDark)
      }))
    );
}

/**
 * Get all the nominated parties or parties nominating candidates.
 * @returns A Promise with an array of `PartyProps`
 */
function getNominatingParties(options?: GetNominatingPartiesOptions): Promise<PartyProps[]> {
  warnOnUnsupportedOptions(options);
  return getAllParties(options);
}

/**
 * Get all the nominated candidates.
 * @returns A Promise with an array of `CandidateProps`
 */
function getNominatedCandidates(
  options?: GetNominatedCandidatesOptions
): Promise<CandidateProps[]> {
  warnOnUnsupportedOptions(options);
  return readFile<CandidateProps[]>('candidates.json').then((candidates) =>
    filterById(candidates, options)
  );
}

///////////////////////////////////////////////////////
// EXPORT
///////////////////////////////////////////////////////

export const dataProvider: DataProvider = {
  getAppSettings,
  getElection,
  getQuestions,
  getInfoQuestions,
  getOpinionQuestions,
  getAllParties,
  getNominatingParties,
  getNominatedCandidates,
  setFeedback
};
