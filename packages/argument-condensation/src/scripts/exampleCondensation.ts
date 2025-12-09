/**
 * Example script: Run argument condensation on one question from pure comment data
 *
 * This script demonstrates how to:
 * 1. Load comment data from pureCommentData.json
 * 2. Transform it into the format required by the argument condensation API
 * 3. Run condensation on a single question
 * 4. View the results and generate visualization data
 *
 * Usage: bun run src/scripts/exampleCondensation.ts
 */

// Load environment variables
import 'dotenv/config';
import { QUESTION_TYPE, SingleChoiceOrdinalQuestion } from '@openvaa/data';
import { LLMProvider } from '@openvaa/llm-refactor';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { handleQuestion } from '../api';
import type { HasAnswers } from '@openvaa/core';
import type { DataRoot } from '@openvaa/data';

config({ path: path.join(__dirname, '../../../../.env') });

// File paths
const DATA_DIR = path.join(__dirname, '../../data/comments');
const PURE_DATA_FILE = path.join(DATA_DIR, 'pureCommentData.json');

interface LocaleText {
  en?: string;
  fi?: string;
  sv?: string;
}

interface PureAnswer {
  candidate: string;
  candidateId: string;
  value: string | number;
  comments?: LocaleText;
}

interface PureQuestion {
  topic: LocaleText;
  id: string;
  questionType: string;
  answers: Array<PureAnswer>;
}

/**
 * Main function
 */
async function main() {
  console.info('Starting example argument condensation...\n');

  // Check for API key
  if (!process.env.OPENAI_API_KEY && !process.env.LLM_OPENAI_API_KEY) {
    throw new Error('Missing API key. Please set OPENAI_API_KEY or LLM_OPENAI_API_KEY in your .env file');
  }

  // Load pure comment data
  console.info(`Reading data from ${PURE_DATA_FILE}...`);
  const pureData = JSON.parse(fs.readFileSync(PURE_DATA_FILE, 'utf-8')) as Array<PureQuestion>;
  console.info(`Loaded ${pureData.length} questions`);

  // Find the question with the most English comments
  console.info('\nFinding question with most English comments...');
  let maxEnglishComments = 0;
  let selectedQuestionIndex = 0;

  pureData.forEach((question, index) => {
    const englishCommentCount = question.answers.filter(
      (answer) => answer.comments?.en && answer.comments.en.trim() !== ''
    ).length;

    if (englishCommentCount > maxEnglishComments) {
      maxEnglishComments = englishCommentCount;
      selectedQuestionIndex = index;
    }
  });

  const selectedQuestion = pureData[selectedQuestionIndex];
  console.info(`\nSelected question (index ${selectedQuestionIndex}): "${selectedQuestion.topic.en}"`);
  console.info(`Question ID: ${selectedQuestion.id}`);
  console.info(`Question type: ${selectedQuestion.questionType}`);
  console.info(`Total answers: ${selectedQuestion.answers.length}`);

  // Filter to only answers with English comments
  const answersWithEnglishComments = selectedQuestion.answers.filter(
    (answer) => answer.comments?.en && answer.comments.en.trim() !== ''
  );
  console.info(`Answers with English comments: ${answersWithEnglishComments.length}`);

  // Use all available comments (no limit)
  const limitedAnswers = answersWithEnglishComments;
  console.info(`Using all ${limitedAnswers.length} comments for condensation\n`);

  // Create a minimal DataRoot for the question
  // We need to provide question text and choice definitions
  const dataRoot = {
    checkId: () => true,
    data: {
      questions: {
        text: {
          [selectedQuestion.id]: selectedQuestion.topic
        }
      },
      choices: {
        text: {
          // Create choice labels for ordinal scale (1-5 Likert scale)
          '1': { en: 'Strongly disagree' },
          '2': { en: 'Disagree' },
          '3': { en: 'Neutral' },
          '4': { en: 'Agree' },
          '5': { en: 'Strongly agree' }
        }
      }
    }
  } as unknown as DataRoot;

  // Create the question object
  const question = new SingleChoiceOrdinalQuestion({
    data: {
      id: selectedQuestion.id,
      type: QUESTION_TYPE.SingleChoiceOrdinal,
      name: selectedQuestion.topic.en || 'Question',
      customData: {},
      categoryId: 'cat1',
      choices: [
        { id: '1', normalizableValue: 1, label: 'Strongly disagree' },
        { id: '2', normalizableValue: 2, label: 'Disagree' },
        { id: '3', normalizableValue: 3, label: 'Neutral' },
        { id: '4', normalizableValue: 4, label: 'Agree' },
        { id: '5', normalizableValue: 5, label: 'Strongly agree' }
      ]
    },
    root: dataRoot
  });

  // Create entities (candidates) with answers
  // The HasAnswers interface expects answers to be in format: { [questionId]: { value, comment } }
  const entities: Array<HasAnswers> = limitedAnswers.map((answer) => ({
    id: answer.candidateId,
    answers: {
      [selectedQuestion.id]: {
        value: typeof answer.value === 'string' ? parseInt(answer.value) : answer.value,
        info: answer.comments?.en || ''
      }
    }
  }));

  console.info('Creating LLM provider...');
  const apiKey = process.env.OPENAI_API_KEY || process.env.LLM_OPENAI_API_KEY || '';
  const llmProvider = new LLMProvider({
    provider: 'openai',
    apiKey,
    modelConfig: {
      primary: 'gpt-4o', 
      tpmLimit: 200000
    }
  });

  console.info('Running argument condensation...\n');
  console.info('This may take a few minutes depending on the number of comments...\n');

  const startTime = Date.now();

  try {
    const results = await handleQuestion({
      question,
      entities,
      options: {
        llmProvider,
        language: 'en',
        runId: `example-run-${Date.now()}`,
        maxCommentsPerGroup: 1000,
        invertProsAndCons: false,
        createVisualizationData: true
      }
    });

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.info('\n=== CONDENSATION COMPLETE ===\n');
    console.info(`Total processing time: ${duration}s\n`);

    // Display results for each condensation run (pros and cons separately)
    for (const result of results) {
      console.info(`--- ${result.condensationType.toUpperCase()} ---`);
      console.info(`Success: ${result.success}`);
      console.info(`Arguments found: ${result.data.arguments.length}`);

      if (result.llmMetrics) {
        console.info('\nLLM Metrics:');
        console.info(`  Processing time: ${result.llmMetrics.processingTimeMs}ms`);
        console.info(`  LLM calls: ${result.llmMetrics.nLlmCalls}`);
        console.info(`  Total tokens: ${result.llmMetrics.tokens.totalTokens}`);
        console.info(`  Input tokens: ${result.llmMetrics.tokens.inputTokens}`);
        console.info(`  Output tokens: ${result.llmMetrics.tokens.outputTokens}`);
        console.info(`  Total cost: $${result.llmMetrics.costs.total.toFixed(4)}`);
      }

      console.info('\nCondensed Arguments:');
      result.data.arguments.forEach((arg, index) => {
        console.info(`  ${index + 1}. ${arg.text}`);
      });

      console.info('');
    }

    console.info('\nVisualization data saved to data/operationTrees/');
    console.info('Run "yarn dev:vis" to view the operation tree visualization\n');
  } catch (error) {
    console.error('\n❌ Error during condensation:', error);
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
