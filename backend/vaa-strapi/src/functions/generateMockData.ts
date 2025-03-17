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

export async function generateMockData() {
  if (!(generateMockDataOnInitialise || generateMockDataOnRestart)) {
    return;
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
    console.info('inserting admin user for frontend');
    await createAdminUser().catch((e) => {
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

async function createAdminUser() {
  if (process.env.NODE_ENV === 'development') {
    // Create admin user for frontend
    const admin = await strapi.query('plugin::users-permissions.role').findOne({
      where: {
        type: 'admin'
      }
    });

    await strapi.documents('plugin::users-permissions.user').create({
      data: {
        username: process.env.DEV_USERNAME ?? 'admin',
        password: 'admin1', // Min length of a password is 6
        email: process.env.DEV_EMAIL ?? 'admin@example.com',
        provider: 'local',
        confirmed: true,
        blocked: false,
        role: admin.id
      }
    });
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
   * Save the previous group’s constituency IDs to be used as parent IDs for the next group.
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

async function createCandidates(length: number) {
  const parties = await strapi.documents('api::party.party').findMany({});
  const questions = await strapi.documents('api::question.question').findMany({
    populate: ['questionType']
  });
  for (let i = 0; i <= length; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const party = faker.helpers.arrayElement(parties);
    const email = `${firstName}.${lastName}@example.com`;
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
 * Create questions
 * @param options.constituencyPctg The fraction of Likert questions that will
 *   have their `constituency` relation set to a random constituency.
 */
async function createQuestions({ constituencyPctg = 0.1 }: { constituencyPctg?: number } = {}) {
  const questionTypes = await strapi.documents('api::question-type.question-type').findMany({});
  const likertTypes = questionTypes.filter(
    (questionType) => (questionType.settings as QuestionTypeSettings).type === 'singleChoiceOrdinal'
  );

  const questionCategories = await strapi.documents('api::question-category.question-category').findMany({});

  const opinionCategories = questionCategories.filter((cat) => cat.type === 'opinion');
  const constituencies = await strapi.documents('api::constituency.constituency').findMany({});

  // Create Opinion questions
  mockQuestions.forEach(async (question, index) => {
    const text = fakeLocalized((faker) => faker.lorem.sentence(), question);
    const questionType = faker.helpers.arrayElement(likertTypes);
    const info = fakeLocalized((faker) => faker.lorem.sentences(3));
    const category = opinionCategories[index % opinionCategories.length];
    // const category = faker.helpers.arrayElement(opinionCategories);
    const constituency = Math.random() < constituencyPctg ? faker.helpers.arrayElement(constituencies) : null;
    await strapi.documents('api::question.question').create({
      data: {
        text,
        info,
        order: index,
        allowOpen: true,
        questionType: questionType.documentId,
        category: category.documentId,
        constituencies: constituency ? [constituency.documentId] : [],
        ...addMockId()
      }
    });
  });
  // Create other questions:
  // Languages, gender, election manifesto, unaffiliated
  const infoCategoryId = questionCategories.filter((cat) => cat.type === 'info')[0]?.documentId;
  for (const { text, info, type, order, required, entityType } of mockInfoQuestions) {
    const typeId = questionTypes.filter((qt) => qt.name === type)[0]?.documentId;
    await strapi.documents('api::question.question').create({
      data: {
        text,
        info,
        allowOpen: false,
        questionType: typeId,
        category: infoCategoryId,
        order,
        required,
        entityType: entityType as EntityType,
        ...addMockId()
      }
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
        infoSections: [...(existingCustomData.infoSections || []), ...(generatedCustomData.infoSections || [])],
        terms: [...(existingCustomData.termsn || []), ...(generatedCustomData.terms || [])]
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
