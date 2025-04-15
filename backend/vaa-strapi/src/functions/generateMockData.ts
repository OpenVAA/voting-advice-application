/**
 * Generate mock data using faker.js
 *
 * Fake data can be generated if env variable GENERATE_MOCK_DATA_ON_INITIALISE=true is set.
 * Additionally, GENERATE_MOCK_DATA_ON_RESTART can be used in dev environment for
 * debugging & developing mock data generation functionality.
 */

import { type Faker, faker, fakerFI, fakerSV } from '@faker-js/faker';
import {
  type AnswerValue,
  dynamicSettings,
  type LocalizedAnswer,
  type LocalizedString,
  type QuestionTypeSettings
} from '@openvaa/app-shared';
import { LLMResponse, OpenAIProvider } from '@openvaa/llm';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { loadDefaultAppSettings } from './loadDefaultAppSettings';
import mockCandidateForTesting from './mockData/mockCandidateForTesting.json';
import mockCategories from './mockData/mockCategories.json';
import mockInfoQuestions from './mockData/mockInfoQuestions.json';
import mockQuestions from './mockData/mockQuestions.json';
import mockQuestionTypes from './mockData/mockQuestionTypes.json';
import mockUsers from './mockData/mockUsers.json';
import {
  generateAiMockData,
  generateMockDataOnInitialise,
  generateMockDataOnRestart,
  LLM_OPENAI_API_KEY
} from '../constants';
import { API } from '../util/api';
import { getDynamicTranslations } from '../util/appCustomization';
import { dropAllCollections } from '../util/drop';
import type { Data } from '@strapi/strapi';

/**
 * Used as a prefix for externalIds for generated mock data.
 */
const MOCK_EXTERNAL_ID_PREFIX = 'mock-';
const N_ELECTIONS = 4;
// Make the fourth election a single constituency one
const N_CONSTITUENCIES_PER_ELECTION = Array.from({ length: N_ELECTIONS }, (_, i) => (i === 3 ? 1 : 10 + i * 20));
/**
 * If true and N_ELECTIONS >= 2, the constituencies in the second constituency group will be children of the first constituency group.
 */
const DO_LINK_CONSTITUENCIES = true;
const N_CONSTITUENCIES = N_CONSTITUENCIES_PER_ELECTION.reduce((a, b) => a + b, 0);
const N_CANDIDATES_PER_CONSTITUENCY = 10;
const N_PARTIES = 10;
const N_PARTIES_WITH_CLOSED_LISTS = 2;
const F_DUPLICATE_NOMINATIONS = 0.2;

const locales: Array<Locale> = [
  {
    code: 'en',
    name: 'English (en)',
    localeObject: undefined,
    faker: faker
  },
  {
    code: 'fi',
    name: 'Finnish (fi)',
    localeObject: undefined,
    faker: fakerFI
  },
  {
    code: 'sv',
    name: 'Swedish (sv)',
    localeObject: undefined,
    faker: fakerSV
  }
];

/**
 * Simple CSV reader with no additional dependencies
 */
function readCsv(): Array<Record<string, string>> {
  try {
    // Try multiple paths like in createCandidates
    let csvPath = './data.csv'; // relative path
    if (!fs.existsSync(csvPath)) {
      csvPath = path.resolve(__dirname, './data.csv'); // try with __dirname
    }
    if (!fs.existsSync(csvPath)) {
      csvPath = '/Users/daniel/sp-dev/voting-advice-application/backend/vaa-strapi/src/functions/data.csv'; // absolute path as fallback
    }

    console.info(`Looking for CSV file at ${csvPath}`);

    // Check if file exists
    if (!fs.existsSync(csvPath)) {
      console.warn(`CSV file not found at ${csvPath}`);
      return [];
    }

    const data = fs.readFileSync(csvPath, 'utf-8');
    console.info(`CSV file loaded, size: ${data.length} bytes`);

    // Special handling for quoted CSV - use a proper parser
    const rows = parseCSV(data);

    if (rows.length === 0) {
      console.warn('CSV has no rows');
      return [];
    }

    console.info(`CSV parsed: ${rows.length} rows`);

    // The first row contains headers
    const headers = rows[0];

    // Create records from the data rows
    const records = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const record: Record<string, string> = {};

      // Only process rows that have enough columns
      if (row.length >= 3) {
        for (let j = 0; j < headers.length; j++) {
          record[headers[j]] = j < row.length ? row[j] : '';
        }
        records.push(record);
      }
    }

    console.info(`Created ${records.length} data records from CSV`);

    // Print a sample record for debugging
    if (records.length > 0) {
      console.info('Sample record (first 5 fields):');
      const sample = records[0];
      const sampleKeys = Object.keys(sample).slice(0, 5);
      for (const key of sampleKeys) {
        console.info(`  ${key}: "${sample[key]}"`);
      }
    }

    return records;
  } catch (error) {
    console.error('CSV import failed:', error);
    return [];
  }
}

/**
 * Parse CSV text into a 2D array, properly handling quoted values
 */
function parseCSV(text: string): Array<Array<string>> {
  // Remove BOM if present
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }

  const result: Array<Array<string>> = [];
  const rows = text.split(/\r?\n/);

  for (const row of rows) {
    if (!row.trim()) continue; // Skip empty rows

    const fields: Array<string> = [];
    let fieldValue = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      const nextChar = i < row.length - 1 ? row[i + 1] : null;

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Double quote inside quotes - add a single quote
          fieldValue += '"';
          i++; // Skip the next quote
        } else {
          // Toggle quote mode
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        fields.push(fieldValue);
        fieldValue = '';
      } else {
        // Normal character - add to field
        fieldValue += char;
      }
    }

    // Add the last field
    fields.push(fieldValue);
    result.push(fields);
  }

  return result;
}

export async function generateMockData() {
  if (!(generateMockDataOnInitialise || generateMockDataOnRestart)) {
    return;
  }

  // Add logging to diagnose CSV structure
  try {
    const csvData = readCsv();
    if (csvData.length > 0) {
      console.info('=== CSV DIAGNOSTIC INFO ===');
      console.info(`CSV has ${csvData.length} rows`);
      console.info(`Headers: ${Object.keys(csvData[0]).join(', ')}`);
      console.info(`First row values: ${Object.values(csvData[0]).join(', ')}`);
      console.info('========================');
    }
  } catch (error) {
    console.warn('CSV diagnosis failed:', error);
  }

  try {
    if (generateMockDataOnInitialise && !generateMockDataOnRestart) {
      for (const collection of Object.values(API)) {
        if (
          await strapi
            .documents(collection)
            .count({})
            .then((number) => number)
        ) {
          console.error(
            'Database is not empty and mock data generation is set to be only on initialisation - skipping mock data generation for now.'
          );
          return;
        }
      }
    }
  } catch (error) {
    console.error(
      'Error while checking if database is empty for mock data generation. Skipping mock data generation for now.'
    );
    console.error('Source error: ', error);
    return;
  }
  try {
    if (generateMockDataOnRestart) {
      console.info('#######################################');
      await dropAllCollections().catch((e) => {
        throw e;
      });
      console.info('dropped collections');
    }

    const strapiLocales = await strapi.plugins.i18n.services.locales.find();

    for (const locale of locales) {
      const { code, name } = locale;
      const found = strapiLocales.find((l) => l.code === code);
      if (found) {
        locale.localeObject = found;
      } else {
        console.info('#######################################');
        console.info(`creating locale '${name}'`);
        locale.localeObject = await strapi.plugins.i18n.services.locales.create({ code, name });
      }
    }

    console.info('#######################################');
    console.info('inserting app settings...');
    await loadDefaultAppSettings().catch((e) => {
      throw e;
    });
    console.info('#######################################');
    console.info('inserting app customization...');
    await createAppCustomization().catch((e) => {
      throw e;
    });
    console.info('#######################################');
    console.info('inserting languages');
    await createLanguages().catch((e) => {
      throw e;
    });
    console.info('Done!');
    console.info('#######################################');
    console.info('inserting strapi admin');
    await createStrapiAdmin().catch((e) => {
      throw e;
    });
    console.info('Done!');
    console.info('#######################################');
    console.info('inserting constituencies and constituency groups');
    await createConstituenciesAndGroups({
      numberPerGroup: N_CONSTITUENCIES_PER_ELECTION,
      linkConstituencies: DO_LINK_CONSTITUENCIES
    }).catch((e) => {
      throw e;
    });
    console.info('Done!');
    console.info('#######################################');
    console.info('inserting one election');
    await createElections(N_ELECTIONS).catch((e) => {
      throw e;
    });
    console.info('Done!');
    console.info('#######################################');
    console.info('inserting question types');
    await createQuestionTypes().catch((e) => {
      throw e;
    });
    console.info('Done!');
    console.info('#######################################');
    console.info('inserting question categories');
    await createQuestionCategories().catch((e) => {
      throw e;
    });
    console.info('Done!');
    console.info('#######################################');
    console.info('inserting questions');
    await createQuestions().catch((e) => {
      throw e;
    });
    console.info('Done!');
    console.info('#######################################');
    console.info('inserting parties');
    await createParties(N_PARTIES).catch((e) => {
      throw e;
    });
    console.info('Done!');
    console.info('#######################################');
    console.info('inserting candidates');
    await createCandidates(N_CONSTITUENCIES * N_CANDIDATES_PER_CONSTITUENCY).catch((e) => {
      throw e;
    });
    console.info('Done!');
    console.info('#######################################');
    console.info('inserting candidate without answers for testing');
    await createCandidateForTesting().catch((e) => {
      throw e;
    });
    console.info('Done!');
    console.info('#######################################');
    console.info('inserting candidate nominations');
    await createCandidateNominations(F_DUPLICATE_NOMINATIONS).catch((e) => {
      throw e;
    });
    console.info('Done!');
    console.info('#######################################');
    console.info('inserting closed list parties');
    await createParties(N_PARTIES_WITH_CLOSED_LISTS).catch((e) => {
      throw e;
    });
    console.info('Done!');
    console.info('#######################################');
    console.info('inserting party nominations');
    await createPartyNominations(N_PARTIES_WITH_CLOSED_LISTS).catch((e) => {
      throw e;
    });
    console.info('Done!');
    console.info('#######################################');
    console.info('inserting candidate users');
    await createCandidateUsers().catch((e) => {
      throw e;
    });
    console.info('Done!');
    console.info('#######################################');
    if (generateAiMockData) {
      console.info('generating LLM summaries');
      await generateMockLLMSummaries();
    }
    console.info('Done!');
    console.info('#######################################');
    console.info('Mock data generation completed successfully!');
  } catch (e) {
    console.error('Mock data generation failed because of error ', JSON.stringify(e));
  }
}

async function createStrapiAdmin() {
  if (process.env.NODE_ENV === 'development') {
    const hasAdmin = await strapi.service('admin::user').exists();
    const superAdminRole = await strapi.service('admin::role').getSuperAdmin();

    if (hasAdmin || !superAdminRole) {
      return;
    }

    const params = {
      username: process.env.DEV_USERNAME ?? 'admin',
      password: process.env.DEV_PASSWORD ?? 'admin',
      firstname: process.env.DEV_USERNAME ?? 'Admin',
      lastname: process.env.DEV_USERNAME ?? 'Admin',
      email: process.env.DEV_EMAIL ?? 'admin@example.com',
      blocked: false,
      isActive: true,
      registrationToken: null,
      roles: superAdminRole ? [superAdminRole.id] : []
    };

    await strapi.service('admin::user').create(params);
  }
}

async function createAppCustomization() {
  const faqs = [];
  locales.forEach(({ code }) => {
    for (let i = 0; i < 5; i++) {
      faqs.push({
        locale: code,
        question: faker.lorem.sentence(),
        answer: faker.lorem.paragraph()
      });
    }
  });

  await strapi.documents('api::app-customization.app-customization').create({
    data: {
      publisherName: fakeLocalized((faker) => faker.company.name()),
      translationOverrides: getDynamicTranslations(),
      candidateAppFAQ: faqs
    },
    status: 'published'
  });
}

async function createLanguages() {
  const locales = [
    {
      name: 'English',
      localisationCode: 'en',
      publishedAt: new Date()
    },
    {
      name: 'Finnish',
      localisationCode: 'fi',
      publishedAt: new Date()
    },
    {
      name: 'Swedish',
      localisationCode: 'sv',
      publishedAt: new Date()
    }
  ];
  for (const data of locales) {
    await strapi.documents('api::language.language').create({ data, status: 'published' });
  }
}

/**
 * Creates a constituency group for each election.
 * @param numberPerGroup - An Array of numbers representing the number of constituencies per constituency group.
 * @param linkConstituencies - If true, there are at least two groups and the first one is smaller than the second one, the constituencies in the second constituency group will be children of the first constituency group.
 */
async function createConstituenciesAndGroups({
  numberPerGroup,
  linkConstituencies = false
}: {
  numberPerGroup: Array<number>;
  linkConstituencies: boolean;
}) {
  /**
   * Save the previous group's constituency IDs to be used as parent IDs for the next group.
   */
  let previousConstituencies = new Array<string>();
  for (let i = 0; i < numberPerGroup.length; i++) {
    // Create Constituencies
    const constituencies = new Array<string>();
    const numConstituencies = numberPerGroup[i];
    const type = numConstituencies === 1 ? 'country' : numConstituencies > 10 ? 'city' : 'state';
    // Possibly define parent constituency
    const doLink = linkConstituencies && i === 1;
    if (doLink && numConstituencies < previousConstituencies.length)
      throw new Error('Not enough constituencies to link');
    for (let j = 0; j < numConstituencies; j++) {
      const name = fakeLocalized((faker) =>
        type === 'country' ? 'Whole country' : type === 'city' ? faker.location.city() : faker.location.state()
      );
      const shortName = abbreviate(name);
      const info = fakeLocalized((faker) => faker.lorem.paragraph(3));
      const parent = doLink ? previousConstituencies[j % previousConstituencies.length] : null;
      const { documentId } = await strapi
        .documents('api::constituency.constituency')
        .create({
          data: {
            name,
            shortName,
            info,
            parent,
            ...addMockId()
          }
        })
        .catch((err) => {
          throw err;
        });
      constituencies.push(documentId);
    }
    // Save for possible use
    previousConstituencies = [...constituencies];
    // Create Constituency Group
    // const subtype = i % 2 ? 'ethnic' : 'geographic';
    await strapi
      .documents('api::constituency-group.constituency-group')
      .create({
        data: {
          name: fakeLocalized(() => `${capitaliseFirstLetter(type)} constituency group ${doLink ? '- linked' : ''}`),
          info: fakeLocalized((faker) => faker.lorem.paragraph(3)),
          constituencies,
          ...addMockId()
        }
      })
      .catch((err) => {
        throw err;
      });
  }
}

async function createElections(numElections = 1) {
  const constituencyGroups = await strapi
    .documents('api::constituency-group.constituency-group')
    .findMany({})
    .then((res) => res.map((g) => g.documentId));
  const date = faker.date.future();

  for (let i = 0; i < numElections; i++) {
    const types = ['local', 'presidential', 'congress'] as const;
    const electionType = types[Math.floor(Math.random() * types.length)];
    const name = fakeLocalized((faker, locale) => `${faker.location.country()} ${electionType} (${locale.code})`);
    const shortName = fakeLocalized(() => capitaliseFirstLetter(electionType));
    const info = fakeLocalized((faker) => faker.lorem.paragraph(3));
    const electionStartDate = date.toISOString().split('T')[0];
    const electionDate = date.toISOString().split('T')[0];
    await strapi.documents('api::election.election').create({
      data: {
        name,
        shortName,
        electionStartDate,
        electionDate,
        electionType,
        info,
        constituencyGroups: [constituencyGroups[i % constituencyGroups.length]],
        ...addMockId()
      }
    });
  }
}

async function createParties(length: number) {
  const questions = await strapi.documents('api::question.question').findMany({
    populate: ['questionType']
  });
  for (let i = 0; i <= length; i++) {
    const name = fakeLocalized(
      (faker) =>
        `${capitaliseFirstLetter(faker.word.adjective())} ${capitaliseFirstLetter(
          faker.word.noun()
        )} ${capitaliseFirstLetter(faker.word.noun())}`
    );
    const shortName = abbreviate(name);
    const info = fakeLocalized((faker) => faker.lorem.sentences(3));
    const color = faker.color.rgb();
    await strapi.documents('api::party.party').create({
      data: {
        name,
        shortName,
        color,
        info,
        answers: generateAnswers(questions, 'party'),
        ...addMockId()
      }
    });
  }
}

/**
 * Extract candidate data from CSV lines
 */
function extractCandidateData(
  lines: Array<string>
): Array<{ district: string; party: string; answers: Array<{ numericalAnswer: string; openEndedAnswer: string }> }> {
  try {
    console.info('Starting extractCandidateData');
    const results: Array<{
      district: string;
      party: string;
      answers: Array<{ numericalAnswer: string; openEndedAnswer: string }>;
    }> = [];

    // Constants based on the CSV structure
    const DISTRICT_INDEX = 0;
    const PARTY_INDEX = 1;
    const NUMERIC_START = 3; // Usually starts at column 3
    const NUMERIC_END = 31; // Numerical answers end around column 31
    const EXPLANATION_START = 32; // Explanations start after numerical answers

    // Get header row to help with debugging
    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine);
    console.info(`Header has ${headers.length} columns`);

    // Skip header row
    for (let lineIndex = 1; lineIndex < lines.length; lineIndex++) {
      try {
        const line = lines[lineIndex].trim();
        if (!line) continue;

        // Parse the row
        const values = parseCSVLine(line);

        // Check if this is a candidate row
        // Typically a candidate row starts with district name
        if (
          values[DISTRICT_INDEX] &&
          (values[DISTRICT_INDEX].toLowerCase().includes('vaalipiiri') || values[DISTRICT_INDEX].includes('piiri'))
        ) {
          console.info(`Found candidate row at line ${lineIndex}: ${values[DISTRICT_INDEX]} / ${values[PARTY_INDEX]}`);

          const district = values[DISTRICT_INDEX];
          const party = values[PARTY_INDEX] || '';

          // Extract numerical answers
          const numericalAnswers: Array<string> = [];
          for (let i = NUMERIC_START; i <= Math.min(NUMERIC_END, values.length - 1); i++) {
            numericalAnswers.push(values[i] || '');
          }

          console.info(`Extracted ${numericalAnswers.length} numerical answers`);

          // Look for explanation answers - they should follow numerical ones
          const explanationAnswers: Array<string> = [];
          const explanationStartIndex = Math.min(EXPLANATION_START, values.length);

          if (explanationStartIndex < values.length) {
            console.info(`Looking for explanations starting at index ${explanationStartIndex}`);
            for (let i = explanationStartIndex; i < values.length; i++) {
              if (values[i] && values[i].trim() !== '-') {
                explanationAnswers.push(values[i]);
              } else {
                explanationAnswers.push('');
              }
            }
          } else {
            console.info(`No room for explanations in this row (length: ${values.length})`);
          }

          // Ensure both arrays have same length
          while (explanationAnswers.length < numericalAnswers.length) {
            explanationAnswers.push('');
          }

          console.info(`Extracted ${explanationAnswers.filter((a) => a.trim().length > 0).length} explanations`);

          // Pair answers with explanations
          const pairedAnswers = numericalAnswers.map((num, idx) => ({
            numericalAnswer: num,
            openEndedAnswer: idx < explanationAnswers.length ? explanationAnswers[idx] : ''
          }));

          // Check next lines for additional explanations
          let nextLine = lineIndex + 1;
          let foundMoreExplanations = false;

          // Try to find more explanations in next lines
          console.info('Looking for additional explanations in following lines');
          while (nextLine < lines.length) {
            const nextLineText = lines[nextLine].trim();
            if (!nextLineText) {
              nextLine++;
              continue;
            }

            const nextValues = parseCSVLine(nextLineText);

            // If this looks like a start of another candidate, stop
            if (
              nextValues[DISTRICT_INDEX] &&
              (nextValues[DISTRICT_INDEX].toLowerCase().includes('vaalipiiri') ||
                nextValues[DISTRICT_INDEX].includes('piiri'))
            ) {
              console.info(`Found next candidate at line ${nextLine}, stopping explanation search`);
              break;
            }

            // Look for explanations in this line
            let hasExplanationText = false;
            for (let i = 0; i < nextValues.length; i++) {
              if (nextValues[i] && nextValues[i].trim().length > 10) {
                // This looks like explanation text - find index to place it
                const explanationIdx = i % pairedAnswers.length;

                if (explanationIdx < pairedAnswers.length && !pairedAnswers[explanationIdx].openEndedAnswer) {
                  pairedAnswers[explanationIdx].openEndedAnswer = nextValues[i];
                  hasExplanationText = true;
                  console.info(`Found explanation at line ${nextLine}, col ${i} for question ${explanationIdx}`);
                }
              }
            }

            if (hasExplanationText) {
              foundMoreExplanations = true;
            }

            nextLine++;
          }

          if (foundMoreExplanations) {
            console.info(`Found additional explanations for candidate at line ${lineIndex}`);
          }

          results.push({
            district,
            party,
            answers: pairedAnswers
          });

          // Skip processed lines
          if (foundMoreExplanations) {
            lineIndex = nextLine - 1;
          }
        }
      } catch (lineError) {
        console.error(`Error processing line ${lineIndex}:`, lineError);
        // Continue with next line instead of stopping the whole process
      }
    }

    // Log some stats
    const answersWithExplanations = results.reduce((count, candidate) => {
      return count + candidate.answers.filter((a) => a.openEndedAnswer && a.openEndedAnswer.length > 5).length;
    }, 0);

    console.info(
      `Successfully extracted ${results.length} candidates with ${answersWithExplanations} total explanations`
    );

    return results;
  } catch (error) {
    console.error('ERROR in extractCandidateData:', error);
    // Return empty array instead of crashing
    return [];
  }
}

// Helper function to parse a single CSV line properly with more error handling
function parseCSVLine(line: string): Array<string> {
  try {
    const result: Array<string> = [];
    let inQuotes = false;
    let currentValue = '';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = i < line.length - 1 ? line[i + 1] : null;

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Double quote inside quotes - add a single quote
          currentValue += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote mode
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(currentValue);
        currentValue = '';
      } else {
        // Regular character
        currentValue += char;
      }
    }

    // Don't forget the last field
    result.push(currentValue);

    return result;
  } catch (error) {
    console.error('Error parsing CSV line:', error);
    console.error('Problematic line:', line.substring(0, 100) + '...');
    // Return empty array in case of error
    return [];
  }
}

/**
 * Helper function to safely extract text from a localized text object
 */
function getLocalizedText(textObj: any): string {
  if (!textObj) return '';

  if (typeof textObj === 'string') return textObj;

  // Try to access common locale properties
  if (textObj.fi) return textObj.fi;
  if (textObj.en) return textObj.en;
  if (textObj.sv) return textObj.sv;

  // If it's an object, try the first value
  if (typeof textObj === 'object') {
    const values = Object.values(textObj);
    if (values.length > 0 && typeof values[0] === 'string') {
      return values[0];
    }
  }

  // Fallback
  return String(textObj);
}

async function createCandidates(length: number) {
  console.info('=== STARTING CANDIDATE CREATION ===');

  try {
    // Step 1: Load and verify the CSV file
    console.info('STEP 1: Loading CSV file');

    // Try both absolute and relative paths
    let csvPath = './data.csv'; // relative path
    if (!fs.existsSync(csvPath)) {
      csvPath = path.resolve(__dirname, './data.csv'); // try with __dirname
    }
    if (!fs.existsSync(csvPath)) {
      csvPath = '/Users/daniel/sp-dev/voting-advice-application/backend/vaa-strapi/src/functions/data.csv'; // absolute path as fallback
    }

    if (!fs.existsSync(csvPath)) {
      console.error('CSV file not found at any of the attempted paths!');
      throw new Error('CSV file not found');
    }

    console.info(`Found CSV file at: ${csvPath}`);
    const rawContent = fs.readFileSync(csvPath, 'utf-8');
    console.info(`CSV file loaded successfully, size: ${rawContent.length} bytes`);

    // Step 2: Parse the CSV rows
    console.info('STEP 2: Parsing CSV rows');
    const lines = rawContent.split('\n');
    console.info(`CSV split into ${lines.length} raw lines`);

    // Step 3: Extract candidate data
    console.info('STEP 3: Extracting candidate data');
    const candidatesData = extractCandidateData(lines);
    console.info(`Successfully extracted data for ${candidatesData.length} candidates`);

    // Step 4: Load questions from database
    console.info('STEP 4: Loading questions from database');
    const questions = await strapi.documents('api::question.question').findMany({
      populate: ['questionType']
    });
    console.info(`Loaded ${questions.length} questions from database`);

    // Step 5: Filter for Likert questions
    console.info('STEP 5: Filtering for Likert questions');
    const likertQuestions = questions.filter(
      (q) => (q.questionType?.settings as QuestionTypeSettings)?.type === 'singleChoiceOrdinal'
    );
    console.info(`Found ${likertQuestions.length} Likert questions`);

    // Step 6: Handle case with no candidates
    if (candidatesData.length === 0) {
      console.warn('No candidate data extracted from CSV - creating random candidates');
      await createRandomCandidates(length, questions);
      return;
    }

    // Step 7: Load parties from database
    console.info('STEP 7: Loading parties from database');
    const parties = await strapi.documents('api::party.party').findMany({});
    console.info(`Loaded ${parties.length} parties from database`);

    // Step 8: Process and create candidates
    console.info('STEP 8: Processing and creating candidates');
    const candidateCount = Math.min(candidatesData.length, length, 100);
    console.info(`Will create ${candidateCount} candidates in database`);

    let totalWithAnswers = 0;
    let totalWithExplanations = 0;
    let totalAnswers = 0;
    let totalExplanations = 0;

    // Process candidates in batches to avoid potential memory issues
    const BATCH_SIZE = 10;
    for (let batchStart = 0; batchStart < candidateCount; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, candidateCount);
      console.info(`Processing batch of candidates ${batchStart + 1} to ${batchEnd}`);

      for (let i = batchStart; i < batchEnd; i++) {
        console.info(`Processing candidate ${i + 1}/${candidateCount}`);

        try {
          const candidateData = candidatesData[i];

          // Find matching party
          console.info(`Finding matching party for: ${candidateData.party}`);
          const party =
            parties.find((p) => {
              const pName = getLocalizedText(p.name).toLowerCase();
              return (
                pName.includes(candidateData.party.toLowerCase()) || candidateData.party.toLowerCase().includes(pName)
              );
            }) || parties[0];
          console.info(`Matched with party: ${getLocalizedText(party.name)}`);

          // Build answers object
          console.info(`Building answers object for candidate ${i + 1}`);
          const formattedAnswers: Record<string, LocalizedAnswer> = {};
          let answersFound = 0;
          let explanationsFound = 0;

          // Match answers to questions
          for (let j = 0; j < Math.min(candidateData.answers.length, likertQuestions.length); j++) {
            const questionId = likertQuestions[j].documentId;
            const answerData = candidateData.answers[j];

            // Only process valid numerical answers (1-5)
            if (answerData.numericalAnswer && /^[1-5]$/.test(answerData.numericalAnswer.trim())) {
              const value = parseInt(answerData.numericalAnswer.trim(), 10);
              answersFound++;

              // Add explanation if available
              let info = null;
              if (
                answerData.openEndedAnswer &&
                answerData.openEndedAnswer.trim() !== '-' &&
                answerData.openEndedAnswer.trim().length > 5
              ) {
                info = {
                  fi: answerData.openEndedAnswer.trim(),
                  en: answerData.openEndedAnswer.trim(),
                  sv: answerData.openEndedAnswer.trim()
                };
                explanationsFound++;
              }

              formattedAnswers[questionId] = { value, info };
            }
          }

          // Update statistics
          if (answersFound > 0) {
            totalWithAnswers++;
            totalAnswers += answersFound;

            if (explanationsFound > 0) {
              totalWithExplanations++;
              totalExplanations += explanationsFound;
            }
          }

          // Debug the first candidate's answers
          if (i === 0) {
            console.info('=== FIRST CANDIDATE ANSWERS DETAILS ===');
            console.info(`Found ${answersFound} answers with ${explanationsFound} explanations`);

            // Sample some answers
            const answerKeys = Object.keys(formattedAnswers);
            for (let j = 0; j < Math.min(5, answerKeys.length); j++) {
              if (j >= answerKeys.length) break;

              const key = answerKeys[j];
              const ans = formattedAnswers[key];
              console.info(`Answer ${j + 1} (question ID: ${key}):`);
              console.info(`  Value: ${ans.value}`);
              console.info(`  Has explanation: ${ans.info !== null}`);
              if (ans.info) {
                console.info(`  Explanation: ${ans.info.fi.substring(0, 50)}...`);
              }
            }
          }

          // Use the answers we found or set empty answers if none were found
          console.info(`Finalizing answers for candidate ${i + 1} (found: ${answersFound})`);
          const finalAnswers = answersFound > 0 ? (formattedAnswers as unknown as JSONValue) : {}; // Empty object instead of generating random answers

          // Create the candidate
          console.info(`Creating candidate ${i + 1} in database`);
          await strapi.documents('api::candidate.candidate').create({
            data: {
              firstName: 'Candidate',
              lastName: `${i + 1}`,
              email: `candidate${i + 1}@example.com`,
              party: party.documentId,
              answers: finalAnswers,
              ...addMockId()
            }
          });

          console.info(
            `Successfully created candidate ${i + 1} with ${answersFound} answers and ${explanationsFound} explanations`
          );
        } catch (error) {
          console.error(`Error processing candidate ${i + 1}:`, error);
          // Continue with next candidate instead of stopping the whole process
        }
      }

      console.info(`Completed batch ${batchStart + 1} to ${batchEnd}`);
    }

    // Final statistics
    console.info('=== CANDIDATE CREATION STATISTICS ===');
    console.info(`Total candidates created: ${totalWithAnswers}`);
    console.info(
      `Candidates with CSV answers: ${totalWithAnswers} (${Math.round((totalWithAnswers / candidateCount) * 100)}%)`
    );
    console.info(
      `Candidates with explanations: ${totalWithExplanations} (${Math.round((totalWithExplanations / candidateCount) * 100)}%)`
    );
    console.info(
      `Total answers populated: ${totalAnswers} (avg ${totalWithAnswers > 0 ? Math.round(totalAnswers / totalWithAnswers) : 0} per candidate)`
    );
    console.info(
      `Total explanations populated: ${totalExplanations} (avg ${totalWithExplanations > 0 ? Math.round(totalExplanations / totalWithExplanations) : 0} per candidate)`
    );
    console.info('=== CANDIDATE CREATION COMPLETED ===');
  } catch (error) {
    console.error('ERROR in createCandidates:', error);
    // Re-throw to ensure the error is properly reported
    throw error;
  }
}

async function createRandomCandidates(length: number, questions: Array<any>) {
  try {
    console.info(`Starting to create ${length} random candidates`);
    const parties = await strapi.documents('api::party.party').findMany({});
    console.info(`Loaded ${parties.length} parties for random candidates`);

    for (let i = 0; i < length; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const email = faker.internet.email({ firstName, lastName });
      const party = faker.helpers.arrayElement(parties);

      await strapi.documents('api::candidate.candidate').create({
        data: {
          firstName,
          lastName,
          email,
          party: party.documentId,
          answers: generateAnswers(questions, 'candidate'),
          ...addMockId()
        }
      });

      if (i % 10 === 0) {
        console.info(`Created random candidate ${i + 1}/${length}`);
      }
    }

    console.info(`Successfully created ${length} random candidates`);
  } catch (error) {
    console.error('ERROR in createRandomCandidates:', error);
    throw error;
  }
}

/**
 * Create a candidate for testing purposes with the specified data.
 * NB. Do this after generating answers but before generating nominations, so that the profile will not be complete.
 */
async function createCandidateForTesting() {
  const parties = await strapi.documents('api::party.party').findMany({});
  const { firstName, lastName, email } = mockCandidateForTesting;
  const party = faker.helpers.arrayElement(parties);
  await strapi.documents('api::candidate.candidate').create({
    data: {
      firstName,
      lastName,
      email,
      party: party.documentId,
      ...addMockId()
    }
  });
}

/**
 * Create nominations for all candidates with possible duplicates.
 * @param duplicateFraction - Approximate fraction of candidates to nominate in multiple elections. This will have no effect if there is only one election.
 */
async function createCandidateNominations(duplicateFraction = 0.0) {
  const elections = await strapi.documents('api::election.election').findMany({
    populate: {
      constituencyGroups: {
        populate: ['constituencies']
      }
    }
  });
  const candidates = await strapi.documents('api::candidate.candidate').findMany({
    populate: ['party']
  });

  // Split candidates into groups for each election
  const candidatesByElection = new Array<typeof candidates>();
  const allCandidates = [...candidates];
  const numPerElection = Math.floor(candidates.length / elections.length);
  for (let i = 0; i < elections.length; i++) {
    // Ensure that all candidates are accounted for by assigning the rest to the last election
    const electionCandidates = i < elections.length - 1 ? allCandidates.splice(0, numPerElection) : [...allCandidates];
    // Insert some extra candidates if duplicateFraction > 0
    if (duplicateFraction > 0) {
      const availableCandidates = candidates.filter((c) => !electionCandidates.includes(c));
      const numDuplicates = Math.min(availableCandidates.length, Math.floor(numPerElection * duplicateFraction));
      if (numDuplicates) electionCandidates.push(...faker.helpers.arrayElements(availableCandidates, numDuplicates));
    }
    candidatesByElection.push(electionCandidates);
  }

  // Create nominations for each election
  for (let i = 0; i < elections.length; i++) {
    const election = elections[i];
    const constituencies = election.constituencyGroups[0].constituencies;
    const electionCandidates = candidatesByElection[i];
    for (const candidate of electionCandidates) {
      const electionRound = 1; // faker.number.int(1);
      // If duplicate create two nominations, otherwise one
      const constituency = faker.helpers.arrayElement(constituencies);
      const electionSymbol = faker.number
        .int({ min: 2, max: Math.ceil(candidates.length * (1 + duplicateFraction)) + 2 })
        .toString();
      await strapi.documents('api::nomination.nomination').create({
        data: {
          electionSymbol,
          electionRound,
          candidate: candidate.documentId,
          party: candidate.party.documentId,
          election: election.documentId,
          constituency: constituency.documentId,
          ...addMockId()
        }
      });
    }
  }
}

async function createPartyNominations(length: number) {
  const elections = await strapi.documents('api::election.election').findMany({
    populate: {
      constituencyGroups: {
        populate: ['constituencies']
      }
    }
  });
  const parties = await strapi.documents('api::party.party').findMany({});

  for (let i = 0; i <= length; i++) {
    const election = faker.helpers.arrayElement(elections);
    const constituencies = election.constituencyGroups[0].constituencies;
    const party = faker.helpers.arrayElement(parties);
    // Remove from list to prevent duplicates
    parties.splice(parties.indexOf(party), 1);
    const electionSymbol = faker.number.int({ min: 2, max: length + 2 }).toString();
    const electionRound = faker.number.int(1);
    const constituency = faker.helpers.arrayElement(constituencies);
    const electionId = elections[0].documentId;
    await strapi.documents('api::nomination.nomination').create({
      data: {
        electionSymbol,
        electionRound,
        party: party.documentId,
        election: electionId,
        constituency: constituency.documentId,
        ...addMockId()
      }
    });
  }
}

/**
 * Create questions
 * @param options.electionPctg The fraction of opinion questions categories that will have their `election` relation set to a random election.
 */
async function createQuestionCategories({ electionPctg = 0.2 }: { electionPctg?: number } = {}) {
  const elections = await strapi.documents('api::election.election').findMany({});
  for (let i = 0; i < mockCategories.length; i++) {
    const category = mockCategories[i];
    const name = fakeLocalized((faker) => faker.word.sample(15).toLocaleUpperCase(), category);
    const shortName = abbreviate(name, { type: 'truncate' });
    const order = mockCategories.indexOf(category);
    const info = fakeLocalized((faker) => faker.lorem.paragraph(3));
    const color = faker.color.rgb();
    let election: string | undefined;
    if (i < mockCategories.length * electionPctg && elections.length > 0)
      election = faker.helpers.arrayElement(elections).documentId;
    await strapi.documents('api::question-category.question-category').create({
      data: {
        name,
        shortName,
        order,
        info,
        type: 'opinion',
        color,
        elections: election ? [election] : undefined,
        ...addMockId()
      }
    });
  }
  // Category for basic info
  const name = fakeLocalized((_, l) => fakeTranslate(l, 'Basic information'));
  const shortName = abbreviate(name, { type: 'truncate' });
  const order = 0;
  const info = fakeLocalized((faker) => faker.lorem.paragraph(3));
  await strapi.documents('api::question-category.question-category').create({
    data: {
      name,
      shortName,
      order,
      info,
      type: 'info',
      ...addMockId()
    }
  });
}

async function createQuestionTypes() {
  for (const questionType of mockQuestionTypes as Array<{
    name: string;
    info: string;
    settings: QuestionTypeSettings;
  }>) {
    // We need explicit typing bc of Strapi's buggy JSON type definition
    const create = strapi['documents']('api::question-type.question-type').create;
    type Data = Parameters<typeof create>[0];
    await create({ data: questionType } as Data);
  }
}

/**
- * Create questions
- * @param options.constituencyPctg The fraction of Likert questions that will
- *   have their `constituency` relation set to a random constituency.
- */
async function createQuestions({ constituencyPctg = 0.1 } = {}) {
  const csvData = readCsv();
  // If we have CSV data, use it to create questions
  if (csvData.length > 0) {
    const questionTypes = await strapi.documents('api::question-type.question-type').findMany({});

    // Find the Likert scale question type
    const likertType = questionTypes.find((qt) => (qt.settings as QuestionTypeSettings).type === 'singleChoiceOrdinal');

    // Check if we found the Likert type and log its settings
    if (likertType) {
      console.info(`Found Likert question type with ID: ${likertType.documentId}`);
      console.info(`Likert type settings: ${JSON.stringify(likertType.settings)}`);
    } else {
      console.warn('Could not find singleChoiceOrdinal question type!');
    }

    const categories = await strapi.documents('api::question-category.question-category').findMany({});
    const opinionCategory = categories.find((c) => c.type === 'opinion');

    const elections = await strapi.documents('api::election.election').findMany({});
    const electionIds = elections.map((e) => e.documentId);

    // Extract first record to analyze headers
    const firstRecord = csvData[0];

    // Process headers to find questions
    const headers = Object.keys(firstRecord);

    // Find metadata columns
    const metadataColumns = ['vaalipiiri', 'puolue', 'valintatieto'];
    const metadataIndices: Array<number> = [];

    headers.forEach((header, index) => {
      for (const col of metadataColumns) {
        if (header.toLowerCase().includes(col.toLowerCase())) {
          metadataIndices.push(index);
          break;
        }
      }
    });

    console.info(`Found ${metadataIndices.length} metadata columns`);

    // Find the position where questions start
    const startIndex = Math.max(...metadataIndices, 0) + 1;

    // Find complete questions with pattern recognition
    let currentQuestion = '';
    const rawQuestions: Array<string> = [];

    for (let i = startIndex; i < headers.length; i++) {
      const header = headers[i];

      // Skip headers that are clearly not part of questions
      if (
        header.trim() === '' ||
        header.includes('vaalilupaus') ||
        header.includes('ikä') ||
        header.toLowerCase().includes('sukupuoli')
      ) {
        if (currentQuestion) {
          rawQuestions.push(currentQuestion);
          currentQuestion = '';
        }
        continue;
      }

      // Add this part to the current question
      if (currentQuestion) currentQuestion += ' ';
      currentQuestion += header;

      // If this header ends with period or question mark, it's likely the end of a question
      if (header.trim().endsWith('.') || header.trim().endsWith('?')) {
        rawQuestions.push(currentQuestion);
        currentQuestion = '';
      }
    }

    // Add any remaining question
    if (currentQuestion) {
      rawQuestions.push(currentQuestion);
    }

    // Clean up questions
    const cleanQuestions = rawQuestions
      .filter(
        (q) =>
          q.length > 10 && // Minimum length for a question
          !q.toLowerCase().includes('vaalilupaus') &&
          !q.toLowerCase().includes('koulutus') &&
          !q.toLowerCase().includes('ammatti') &&
          !q.toLowerCase().includes('kielitaito')
      )
      .map((q) => q.trim())
      .slice(0, 30); // Take max 30 questions

    console.info(`Identified ${cleanQuestions.length} complete questions`);
    console.info('Sample questions:');
    cleanQuestions.slice(0, 5).forEach((q) => console.info(`- ${q}`));

    // Create custom settings to ensure Likert-5 scale
    const likertSettings = likertType?.settings
      ? { ...(likertType.settings as Record<string, any>) }
      : {
          type: 'singleChoiceOrdinal',
          notLocalizable: false,
          choices: [
            { id: 1, label: { fi: 'Täysin eri mieltä', en: 'Strongly disagree', sv: 'Helt av annan åsikt' } },
            { id: 2, label: { fi: 'Jokseenkin eri mieltä', en: 'Somewhat disagree', sv: 'Delvis av annan åsikt' } },
            {
              id: 3,
              label: {
                fi: 'Ei samaa eikä eri mieltä',
                en: 'Neither agree nor disagree',
                sv: 'Varken av samma eller annan åsikt'
              }
            },
            { id: 4, label: { fi: 'Jokseenkin samaa mieltä', en: 'Somewhat agree', sv: 'Delvis av samma åsikt' } },
            { id: 5, label: { fi: 'Täysin samaa mieltä', en: 'Strongly agree', sv: 'Helt av samma åsikt' } }
          ],
          min: 1,
          max: 5
        };

    console.info(`Using Likert settings: ${JSON.stringify(likertSettings)}`);

    // Create questions
    for (let i = 0; i < cleanQuestions.length; i++) {
      try {
        console.info(`Creating question ${i + 1}/${cleanQuestions.length}: "${cleanQuestions[i].substring(0, 50)}..."`);

        await strapi.documents('api::question.question').create({
          data: {
            text: fakeLocalized(() => cleanQuestions[i]),
            info: fakeLocalized((faker) => faker.lorem.sentence()),
            order: i,
            allowOpen: true,
            questionType: likertType?.documentId,
            category: opinionCategory?.documentId,
            elections: electionIds,
            customSettings: {
              likertScale: {
                min: 1,
                max: 5
              }
            },
            ...addMockId()
          }
        });

        console.info(`Successfully created question ${i + 1}`);
      } catch (error) {
        console.error(`Error creating question ${i + 1}:`, error);
      }
    }

    console.info('All questions created successfully');

    // Reload questions to get their IDs
    return await strapi.documents('api::question.question').findMany({
      populate: ['questionType']
    });
  }
}

async function createCandidateUsers() {
  if (process.env.NODE_ENV === 'production') {
    console.warn('Skipped - running in production mode.');
    return;
  }

  console.warn(
    'The application is running in development mode - creating a default user for the first candidate and a user for testing'
  );

  const authenticated = await strapi.query('plugin::users-permissions.role').findOne({
    where: {
      type: 'authenticated'
    }
  });

  const candidates = await strapi.documents('api::candidate.candidate').findMany({});

  for (let i = 0; i < mockUsers.length; i++) {
    const { email, username, password } = mockUsers[i];
    const candidateId = candidates[i].documentId;

    await strapi.documents('plugin::users-permissions.user').create({
      data: {
        username,
        email,
        password,
        provider: 'local',
        confirmed: true,
        blocked: false,
        role: authenticated.id,
        candidate: candidateId
      }
    });

    // Disable registration key for the candidate we chose as they're already registered
    await strapi.documents('api::candidate.candidate').update({
      documentId: candidateId,
      data: {
        registrationKey: null,
        ...addMockId()
      }
    });
  }
}

/**
 * Create the `answers` json object for the given questions and the entity type.
 * @param questions - The questions for which the answers should be created.
 * @param entityType - The type of the entity for which the answers should be created. The questions will be filtered to those applicable to the given entity type.
 * @returns The answers forcibly typed as `object` because of Strapi's buggy `JSONValue` type.
 */
function generateAnswers(
  questions: Array<Data.ContentType<'api::question.question'>>,
  entityType: EntityType = 'all'
): JSONValue {
  const answers: Record<string, LocalizedAnswer> = {};

  for (const question of questions) {
    if (question.entityType && question.entityType !== 'all' && question.entityType !== entityType) continue;
    const settings = question.questionType.settings as QuestionTypeSettings;
    let value: AnswerValue[keyof AnswerValue];
    switch (settings.type) {
      case 'text':
        value = settings.notLocalizable ? faker.lorem.sentence() : fakeLocalized((faker) => faker.lorem.sentence());
        break;
      case 'boolean':
        value = faker.helpers.arrayElement([true, false]);
        break;
      case 'number':
        value = faker.number.int({ min: settings.min, max: settings.max });
        break;
      case 'date':
        if (settings.min) {
          if (settings.max) {
            value = faker.date.between({ from: settings.min, to: settings.max }).toISOString().split('T')[0];
          } else {
            value = faker.date.future({ refDate: settings.min }).toISOString().split('T')[0];
          }
        } else {
          value = faker.date.past({ refDate: settings.max }).toISOString().split('T')[0];
        }
        break;
      case 'singleChoiceCategorical':
      case 'singleChoiceOrdinal':
        value = faker.helpers.arrayElement(settings.choices).id;
        break;
      case 'multipleChoiceCategorical':
        // case 'preferenceOrder':
        value = faker.helpers
          .arrayElements(settings.choices, {
            min: settings.min ?? 1,
            max: settings.max ?? settings.choices.length
          })
          .map((v) => v.id);
        break;
      default:
        throw new Error(`Unsupported question type: ${settings.type}`);
    }
    const info = question.allowOpen ? fakeLocalized((faker) => faker.lorem.sentence()) : null;
    answers[question.documentId] = { value, info };
  }
  return answers as JSONValue;
}

/**
 * Generates a single llm-response that will be used for every answer.
 */
async function generateMockLLMSummaries() {
  if (!LLM_OPENAI_API_KEY) {
    throw new Error('LLM_OPENAI_API_KEY is required for generating mock LLM summaries');
  }

  try {
    const res: LLMResponse = await new OpenAIProvider({ apiKey: LLM_OPENAI_API_KEY }).generate({
      messages: [
        {
          role: 'system',
          content: 'message.content'
        },
        {
          role: 'user',
          content: dynamicSettings.llm.prompt + dynamicSettings.llm.answerFormat
        }
      ]
    });
    // Api response with LLMResponse parameters
    // TODO: Type for this? Also handle error-responses
    const generatedCustomData = JSON.parse(res.content);

    // Get all questions with their existing customData
    const questions = await strapi.db.query(API.Question).findMany({});

    // Update each question, merging the new data with existing customData
    for (const question of questions) {
      const existingCustomData = question.customData || {};
      const mergedCustomData = {
        ...existingCustomData,
        infoSections: [...(existingCustomData.infoSections || []), ...(generatedCustomData.infoSections || [])]
      };

      await strapi.db.query(API.Question).update({
        where: { id: question.id },
        data: {
          customData: mergedCustomData
        }
      });
    }
  } catch (error) {
    console.error('Failed to generate LLM summary, ', error);
  }
}

/**
 * Adds the locale code to any strings unless the locale is the default one.
 * Used to mark strings as translated if no proper translations are available.
 */
function fakeTranslate<TTranslation extends string | Record<string, string>>(
  locale: Locale,
  target: TTranslation
): TTranslation {
  if (locale.code === locales[0].code) return target;
  function translate(s: string) {
    return `${locale.code.toUpperCase()} ${s}`;
  }
  if (typeof target === 'string') return translate(target) as TTranslation;
  return Object.fromEntries(Object.entries(target).map(([key, value]) => [key, translate(value)])) as TTranslation;
}

/**
 * Uses faker to create a localized string json with the callback
 * @param callback The function to call for each translation
 * @param template Optional template object to which translations will only be added
 *   if they don't already exist in it
 */
function fakeLocalized(
  callback: (faker: Faker, locale: Locale) => string,
  template: LocalizedString = {}
): LocalizedString {
  return { ...Object.fromEntries(locales.map((l) => [l.code, callback(l.faker, l)])), ...template };
}

/**
 * Converts a localized string json to an abbreviation of its values
 * @values The localized string json to translate
 * @options Optional settings for abbreviation
 */
function abbreviate(values: LocalizedString, options: AbbreviationOptions = { type: 'acronym' }): LocalizedString {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => {
      switch (options.type) {
        case 'acronym':
          value = value
            .split(/(\s|-)+/)
            .map((w) => {
              if (w.trim() === '') return '';
              if (w.startsWith('(')) return '';
              if (w.match(/^\d+$/)) return w;
              return w.substring(0, 1).toLocaleUpperCase(key);
            })
            .join('');
          break;
        case 'truncate':
          value = `${value.substring(0, options.length ?? 5)}.`;
          break;
        default:
          throw new Error(`Unsupported abbreviation type: ${options.type}`);
      }
      return [key, value];
    })
  );
}

/**
 * Add a mock external ID to the object data.
 */
function addMockId(): { externalId: string } {
  const externalId = `${MOCK_EXTERNAL_ID_PREFIX}${crypto.randomUUID()}`;
  return { externalId };
}

interface AbbreviationOptions {
  type: 'acronym' | 'truncate';
  length?: number;
}

function capitaliseFirstLetter(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

interface Locale {
  code: string;
  name: string;
  localeObject: unknown;
  faker: Faker;
}

type EntityType = 'candidate' | 'party' | 'all';

/** We need this for explicit typing */
type JSONValue = Data.ContentType<'api::candidate.candidate'>['answers'];
