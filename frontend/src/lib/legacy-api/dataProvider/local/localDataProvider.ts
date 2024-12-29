/**
 * This is a severely limited implementation of the `DataProvider` that connects to locally stored JSON files.
 */

import { error } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';
import { locales } from '$lib/i18n';
import { ensureColors } from '$lib/utils/color/ensureColors';
import { logDebugError } from '$lib/utils/logger';
import { DataFolder } from './dataFolder';
import { setFeedback } from './setFeedback';
import { filterById } from './utils/filterById';
import type { AppCustomization } from '$lib/contexts/app';
import type {
  DataProvider,
  GetAllPartiesOptions,
  GetAnyQuestionsOptions,
  GetDataOptionsBase,
  GetElectionOptions,
  GetNominatedCandidatesOptions,
  GetNominatingPartiesOptions,
  GetQuestionsOptionsBase
} from '../dataProvider';
import type { LocalQuestionCategoryProps, LocalQuestionProps } from './localDataProvider.type';

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
    logDebugError('[localDataProvider] The current implementation fully supports only one locale.');
  }
  for (const key in options) {
    if (CRITICAL_UNSUPPORTED_OPTIONS.includes(key))
      error(500, `[localDataProvider] Unsupported get data option (critical): ${key}`);
    if (UNSUPPORTED_OPTIONS.includes(key)) logDebugError(`[localDataProvider] Unsupported get data option: ${key}`);
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
 * Parse a list of `LegacyQuestionProps` objects from a promised list of `LocalQuestionProps` objects.
 */
function parseQuestions(questions: Promise<Array<LocalQuestionProps>>): Promise<Array<LegacyQuestionProps>> {
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
function getAllQuestionCategories(): Promise<Record<string, LegacyQuestionCategoryProps>> {
  return readFile<Array<LocalQuestionCategoryProps>>('questionCategories.json').then((categories) =>
    Object.fromEntries(categories.map((c) => [c.id, { ...c, questions: [] }]))
  );
}

/**
 * Parse a `LegacyQuestionProps` object from a `LocalQuestionProps` object, mainly by filling in the `category` property.
 * @param questionCategories All question categories
 * @param question The `LocalQuestionProps` object
 */
function parseQuestion(
  questionCategories: Record<string, LegacyQuestionCategoryProps>,
  question: LocalQuestionProps
): LegacyQuestionProps {
  const { categoryId, ...rest } = question;
  const category = questionCategories[categoryId];
  if (category == null) {
    error(500, `No question category found with id ${question.categoryId} for question ${JSON.stringify(question)}`);
  }
  return { ...rest, category };
}

///////////////////////////////////////////////////////
// DATAPROVIDER IMPLEMENTATION
///////////////////////////////////////////////////////

/**
 * Get app settings.
 * @returns The app settings or an empty object if the file does not exist.
 */
function getAppSettings(options?: GetDataOptionsBase): Promise<Partial<AppSettings>> {
  warnOnUnsupportedOptions(options);
  return readFile<Partial<AppSettings>>('appSettings.json').catch(() => ({}));
}

/**
 * Get app customization.
 * @returns The app customization or an empty object if the file does not exist.
 */
function getAppCustomization(options?: GetDataOptionsBase): Promise<Partial<AppCustomization>> {
  warnOnUnsupportedOptions(options);
  return readFile<Partial<AppCustomization>>('appCustomization.json').catch(() => ({}));
}

/**
 * Get the default `Election` object or one matching the `id`.
 * @returns A Promise with `LegacyElectionProps`
 */
function getElection(options?: GetElectionOptions): Promise<LegacyElectionProps> {
  warnOnUnsupportedOptions(options);
  return readFile<LegacyElectionProps>('election.json').then((election) => {
    if (options?.id == null) return election;
    if (election.id === options.id) return election;
    error(500, `No election found with id ${options.id}`);
  });
}

/**
 * This is a redundant and will likely be made obsolete. Use the other question getters instead.
 * NB. The implementation is also inefficient when getting all questions, bc `getAllQuestionCategories` is called twice.
 */
function getQuestions(options?: GetAnyQuestionsOptions): Promise<Array<LegacyQuestionProps>> {
  warnOnUnsupportedOptions(options);
  if (options?.categoryType == null || options?.categoryType === 'all')
    return Promise.all([getInfoQuestions(options), getOpinionQuestions(options)]).then(([iQ, oQ]) => [...iQ, ...oQ]);
  if (options?.categoryType === 'info') return getInfoQuestions(options);
  if (options?.categoryType === 'opinion') return getOpinionQuestions(options);
  error(500, `No questions found with categoryType ${options?.categoryType}`);
}

/**
 * Get all the info questions.
 * @returns A Promise with an array of `LegacyQuestionProps`
 */
function getInfoQuestions(options?: GetQuestionsOptionsBase): Promise<Array<LegacyQuestionProps>> {
  warnOnUnsupportedOptions(options);
  return parseQuestions(readFile<Array<LocalQuestionProps>>('infoQuestions.json'));
}

/**
 * Get all the opinion questions.
 * @returns A Promise with an array of `LegacyQuestionProps`
 */
function getOpinionQuestions(options?: GetQuestionsOptionsBase): Promise<Array<LegacyQuestionProps>> {
  warnOnUnsupportedOptions(options);
  return parseQuestions(readFile<Array<LocalQuestionProps>>('opinionQuestions.json'));
}

/**
 * Get all the parties, regardless whether they are nominated, have nominations or not.
 * @returns A Promise with an array of `LegacyPartyProps`
 */
function getAllParties(options?: GetAllPartiesOptions): Promise<Array<LegacyPartyProps>> {
  warnOnUnsupportedOptions(options);
  return readFile<Array<LegacyPartyProps>>('parties.json')
    .then((parties) => filterById(parties, options))
    .then((parties) =>
      parties.map((p) => ({
        ...p,
        ...ensureColors({ normal: p.color, dark: p.colorDark })
      }))
    );
}

/**
 * Get all the nominated parties or parties nominating candidates.
 * @returns A Promise with an array of `LegacyPartyProps`
 */
function getNominatingParties(options?: GetNominatingPartiesOptions): Promise<Array<LegacyPartyProps>> {
  warnOnUnsupportedOptions(options);
  return getAllParties(options);
}

/**
 * Get all the nominated candidates.
 * @returns A Promise with an array of `LegacyCandidateProps`
 */
function getNominatedCandidates(options?: GetNominatedCandidatesOptions): Promise<Array<LegacyCandidateProps>> {
  warnOnUnsupportedOptions(options);
  return readFile<Array<LegacyCandidateProps>>('candidates.json').then((candidates) => filterById(candidates, options));
}

///////////////////////////////////////////////////////
// EXPORT
///////////////////////////////////////////////////////

export const dataProvider: DataProvider = {
  getAppSettings,
  getAppCustomization,
  getElection,
  getQuestions,
  getInfoQuestions,
  getOpinionQuestions,
  getAllParties,
  getNominatingParties,
  getNominatedCandidates,
  setFeedback
};
