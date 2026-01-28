/**
 * Script to transform raw comment data into pure data format.
 *
 * NOTE: This script unifies two different data formats: rawQuestionsData.json and rawCommentData.json.
 * Question data is dispersed.
 *
 * This script:
 * 1. Extracts political questions from rawQuestionsData.json (only opinion questions = questions with "opinion" in externalId, because we don't care about personal questions)
 * 2. For each political question, collects all candidate answers from rawCommentData.json
 * 3. Transforms the structure:
 *    - Groups by question (not candidate)
 *    - Each question has topic, id, and answers array
 *    - Each answer has candidate name, candidate ID, value, and optional comments
 *    - Removes empty locale fields
 * 4. Writes the transformed data to pureCommentData.json
 */

import fs from 'fs';
import path from 'path';

// File paths
const DATA_DIR = path.join(__dirname, '../../data/comments');
const QUESTIONS_FILE = path.join(DATA_DIR, 'rawQuestionsData.json');
const COMMENTS_FILE = path.join(DATA_DIR, 'rawCommentData.json');
const OUTPUT_FILE = path.join(DATA_DIR, 'pureCommentData.json');

interface LocaleText {
  en?: string;
  fi?: string;
  sv?: string;
}

interface RawQuestion {
  id: number;
  documentId: string;
  externalId: string;
  text: LocaleText;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface RawAnswer {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  info?: LocaleText;
}

interface Candidate {
  id: number;
  documentId: string;
  email: string;
  firstName: string;
  lastName: string;
  answers: Record<string, RawAnswer>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

// Output types
interface PureQuestion {
  topic: LocaleText;
  id: string;
  questionType: string;
  answers: Array<PureAnswer>;
}

interface PureAnswer {
  candidate: string;
  candidateId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  comments?: LocaleText;
}

type PureCommentData = Array<PureQuestion>;

/**
 * Extract political questions from questions data
 */
function extractPoliticalQuestions(questions: Array<RawQuestion>): Map<string, RawQuestion> {
  const politicalQuestions = new Map<string, RawQuestion>();

  for (const question of questions) {
    if (question.externalId && question.externalId.includes('opinion')) {
      politicalQuestions.set(question.documentId, question);
    }
  }

  console.info(`Found ${politicalQuestions.size} political questions`);
  return politicalQuestions;
}

/**
 * Remove empty locale fields from an object
 */
function cleanLocaleObject(localeObj: LocaleText | undefined): LocaleText | undefined {
  if (!localeObj) return undefined;

  const cleaned: LocaleText = {};
  let hasAnyValue = false;

  for (const locale of ['en', 'fi', 'sv'] as const) {
    if (localeObj[locale] != null && localeObj[locale] !== '') {
      cleaned[locale] = localeObj[locale];
      hasAnyValue = true;
    }
  }

  return hasAnyValue ? cleaned : undefined;
}

/**
 * Main function
 */
async function main() {
  console.info('Starting data transformation...');

  // Load questions data
  console.info(`Reading questions from ${QUESTIONS_FILE}...`);
  const questionsData = JSON.parse(fs.readFileSync(QUESTIONS_FILE, 'utf-8')) as Array<RawQuestion>;
  console.info(`Loaded ${questionsData.length} questions`);

  // Extract political questions
  const politicalQuestions = extractPoliticalQuestions(questionsData);

  // Load raw comment data
  console.info(`Reading candidate data from ${COMMENTS_FILE}...`);
  const candidatesData = JSON.parse(fs.readFileSync(COMMENTS_FILE, 'utf-8')) as Array<Candidate>;
  console.info(`Loaded ${candidatesData.length} candidates`);

  // Build output structure: array of questions with their answers
  console.info('Transforming data to question-centric structure...');
  const pureData: PureCommentData = [];

  for (const [questionId, question] of politicalQuestions) {
    const questionAnswers: Array<PureAnswer> = [];

    // Collect all candidate answers for this question
    for (const candidate of candidatesData) {
      const rawAnswer = candidate.answers[questionId];

      if (rawAnswer) {
        const pureAnswer: PureAnswer = {
          candidate: `${candidate.firstName} ${candidate.lastName}`,
          candidateId: candidate.documentId,
          value: rawAnswer.value
        };

        // Clean and add comments if they exist
        const cleanedComments = cleanLocaleObject(rawAnswer.info);
        if (cleanedComments) {
          pureAnswer.comments = cleanedComments;
        }

        questionAnswers.push(pureAnswer);
      }
    }

    // Only include questions that have at least one answer
    if (questionAnswers.length > 0) {
      pureData.push({
        topic: question.text,
        id: questionId,
        questionType: question.questionType.settings.type,
        answers: questionAnswers
      });
    }
  }

  // Calculate statistics
  const totalAnswers = pureData.reduce((sum, q) => sum + q.answers.length, 0);
  const answersWithComments = pureData.reduce((sum, q) => sum + q.answers.filter((a) => a.comments).length, 0);
  const questionsWithAnswers = pureData.length;

  console.info(`Transformed ${questionsWithAnswers} questions with answers`);
  console.info(`Total answers: ${totalAnswers}`);
  console.info(
    `Answers with comments: ${answersWithComments} (${((answersWithComments / totalAnswers) * 100).toFixed(1)}%)`
  );

  // Write output
  console.info(`Writing output to ${OUTPUT_FILE}...`);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(pureData, null, 2));

  console.info('✓ Transformation complete!');
}

// Run the script
main().catch((error) => {
  console.error('Error during transformation:', error);
  process.exit(1);
});
