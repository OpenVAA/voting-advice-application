/**
 * Generate mock data using faker.js
 *
 * Fake data can be generated if env variable GENERATE_MOCK_DATA_ON_INITIALISE=true is set.
 * Additionally, GENERATE_MOCK_DATA_ON_RESTART can be used in dev environment for
 * debugging & developing mock data generation functionality.
 *
 * IMPORTANT: As today, 29th of August of 2023, most of the fake data needs to be created using
 * the method `strapi.entityService.create()` as the bulk insert does not support relations,
 * and also it is not possible to create localizations using the bulk insert.
 */

import { type Faker, faker, fakerFI, fakerSV } from '@faker-js/faker';
import { dynamicSettings } from '@openvaa/app-shared';
import { LLMResponse, OpenAIProvider, Role } from '@openvaa/llm';
import mockCandidateForTesting from './mockData/mockCandidateForTesting.json';
import mockCategories from './mockData/mockCategories.json';
import mockInfoQuestions from './mockData/mockInfoQuestions.json';
import mockQuestions from './mockData/mockQuestions.json';
import mockQuestionTypes from './mockData/mockQuestionTypes.json';
import mockUser from './mockData/mockUser.json';
import mockAnswers from './mockData/mockAnswers.json';
import { API } from './utils/api';
import { getDynamicTranslations } from './utils/appCustomization';
import { getCardContentsFromFile } from './utils/appSettings';
import { dropAllCollections } from './utils/drop';
import { generateAiMockData, generateMockDataOnInitialise, generateMockDataOnRestart } from '../constants';
import type { AnswerValue, EntityType, LocalizedString, QuestionTypeSettings } from './utils/data.type';

interface MockAnswer {
  questionId: string;
  questionText: string;
  value: string;
  openAnswer: { fi: string };
  party_id: string;
  constituency_id: string;
  answer_id: string;
}

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
          await strapi.db
            .query(collection)
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
      await dropAllCollections();
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
    await createAppSettings();
    console.info('#######################################');
    console.info('inserting app customization...');
    await createAppCustomization();
    console.info('#######################################');
    console.info('inserting languages');
    await createLanguages();
    console.info('Done!');
    console.info('#######################################');
    console.info('inserting strapi admin');
    await createStrapiAdmin();
    console.info('Done!');
    console.info('#######################################');
    console.info('inserting constituencies and constituency groups');
    await createConstituenciesAndGroups(15);
    console.info('Done!');
    console.info('#######################################');
    console.info('inserting question types');
    await createQuestionTypes();
    console.info('Done!');
    console.info('#######################################');
    console.info('inserting one election');
    await createElection();
    console.info('Done!');
    console.info('#######################################');
    console.info('inserting parties');
    await createParties(10);
    console.info('Done!');
    console.info('#######################################');
    console.info('inserting candidates');
    await createCandidates(15 * 50);
    console.info('Done!');
    console.info('#######################################');
    console.info('inserting question categories');
    await createQuestionCategories();
    console.info('Done!');
    console.info('#######################################');
    console.info('inserting questions');
    await createQuestions();
    console.info('Done!');
    console.info('#######################################');
    console.info('inserting candidate answers');
    await createAnswers('candidate');
    console.info('Done!');
    console.info('#######################################');
    console.info('inserting candidate nominations');
    await createCandidateNominations(15 * 50);
    console.info('Done!');
    console.info('#######################################');
    console.info('inserting closed list parties');
    await createParties(2);
    console.info('Done!');
    console.info('#######################################');
    console.info('inserting party nominations');
    await createPartyNominations(2);
    console.info('Done!');
    console.info('#######################################');
    console.info('inserting candidate users');
    await createCandidateUsers();
    console.info('Done!');
    console.info('#######################################');
    if (generateAiMockData) {
      console.info('generating LLM summaries');
      await generateMockLLMSummaries();
      console.info('Done!');
      console.info('#######################################');
    }
    console.info('Done!');
    console.info('#######################################');
  } catch (e) {
    console.error('Mock data generation failed because of error ', e);
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

async function createAppSettings() {
  const cardContents = getCardContentsFromFile();

  await strapi.entityService.create(API.AppSettings, {
    data: {
      ...dynamicSettings,
      results: { ...dynamicSettings.results, ...cardContents }
    }
  });
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

  await strapi.entityService.create(API.AppCustomization, {
    data: {
      publisherName: fakeLocalized((faker) => faker.company.name()),
      translationOverrides: getDynamicTranslations(),
      candidateAppFAQ: faqs
    }
  });
}

async function createLanguages() {
  await strapi.db.query(API.Language).createMany({
    data: [
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
    ]
  });
}

/**
 * @param numberPerGroup - An Array of numbers representing the number of constituencies per constituency group.
 */
async function createConstituenciesAndGroups(...numberPerGroup: Array<number>) {
  for (let i = 0; i < numberPerGroup.length; i++) {
    // Create Constituencies
    const constituencies = new Array<number>();
    for (let j = 0; j < numberPerGroup[i]; j++) {
      const name = fakeLocalized((faker) => faker.location.state());
      const shortName = fakeLocalized((faker) => faker.location.state({ abbreviated: true }));
      const info = fakeLocalized((faker) => faker.lorem.paragraph(3));
      const { id } = await strapi.db.query(API.Constituency).create({
        data: {
          name,
          shortName,
          info
        }
      });
      constituencies.push(id);
    }
    // Create Constituency Group
    const subtype = i % 2 ? 'ethnic' : 'geographic';
    await strapi.db.query(API.ConstituencyGroup).create({
      data: {
        name: fakeLocalized(() => `${capitaliseFirstLetter(subtype)} constituency group`),
        subtype,
        info: fakeLocalized((faker) => faker.lorem.paragraph(3)),
        constituencies
      }
    });
  }
}

async function createElection() {
  const constituencyGroups = await strapi.db
    .query(API.ConstituencyGroup)
    .findMany({})
    .then((res) => res.map((g) => g.id));
  const date = faker.date.future();
  const types = ['local', 'presidential', 'congress'];
  const electionType = types[Math.floor(Math.random() * types.length)];
  const name = fakeLocalized(
    (faker, locale) => `${date.getFullYear()} ${faker.location.country()} ${electionType} (${locale.code})`
  );
  const shortName = name;
  const info = fakeLocalized((faker) => faker.lorem.paragraph(3));
  const electionStartDate = date.toISOString().split('T')[0];
  const electionDate = date.toISOString().split('T')[0];
  await strapi.db.query(API.Election).create({
    data: {
      name,
      shortName,
      electionStartDate,
      electionDate,
      electionType,
      info,
      publishedAt: new Date(),
      answersLocked: false,
      constituencyGroups
    }
  });
}

async function createParties(length: number) {
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
    await strapi.db.query(API.Party).create({
      data: {
        name,
        shortName,
        color,
        info,
        publishedAt: new Date()
      }
    });
  }
}

async function createCandidates(length: number) {
  const parties = await strapi.db.query(API.Party).findMany({});
  for (let i = 0; i <= length; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const party: HasId = faker.helpers.arrayElement(parties);
    const email = `${firstName}.${lastName}@example.com`;
    await strapi.db.query(API.Candidate).create({
      data: {
        firstName,
        lastName,
        email,
        party: party.id,
        publishedAt: new Date()
      }
    });
  }
}

/**
 * Create a candidate for testing purposes with the specified data.
 * NB. Do this after generating answers but before generating nominations, so that the profile will not be complete.
 */
async function createCandidateForTesting() {
  const parties = await strapi.db.query(API.Party).findMany({});
  const { firstName, lastName, email } = mockCandidateForTesting;
  const party: HasId = faker.helpers.arrayElement(parties);
  await strapi.db.query(API.Candidate).create({
    data: {
      firstName,
      lastName,
      email,
      party: party.id,
      publishedAt: new Date()
    }
  });
}

async function createCandidateNominations(length: number) {
  const elections: Array<HasId> = await strapi.db.query(API.Election).findMany({});
  const constituencies: Array<HasId> = await strapi.db.query(API.Constituency).findMany({});
  const candidates: Array<{ id: string | number; party: HasId }> = await strapi.db.query(API.Candidate).findMany({
    populate: ['party']
  });

  for (let i = 0; i <= length; i++) {
    const candidate = faker.helpers.arrayElement(candidates);
    // Remove from list to prevent duplicates
    candidates.splice(candidates.indexOf(candidate), 1);
    const electionSymbol = faker.number.int({ min: 2, max: length + 2 }).toString();
    const electionRound = 1; // faker.number.int(1);
    const constituency = faker.helpers.arrayElement(constituencies);
    const electionId = elections[0].id;
    await strapi.db.query(API.Nomination).create({
      data: {
        electionSymbol,
        electionRound,
        candidate: candidate.id,
        party: candidate.party.id,
        election: electionId,
        constituency: constituency.id
      }
    });
  }
}

async function createPartyNominations(length: number) {
  const elections: Array<HasId> = await strapi.db.query(API.Election).findMany({});
  const constituencies: Array<HasId> = await strapi.db.query(API.Constituency).findMany({});
  const parties: Array<HasId> = await strapi.db.query(API.Party).findMany({});

  for (let i = 0; i <= length; i++) {
    const party = faker.helpers.arrayElement(parties);
    // Remove from list to prevent duplicates
    parties.splice(parties.indexOf(party), 1);
    const electionSymbol = faker.number.int({ min: 2, max: length + 2 }).toString();
    const electionRound = faker.number.int(1);
    const constituency = faker.helpers.arrayElement(constituencies);
    const electionId = elections[0].id;
    await strapi.db.query(API.Nomination).create({
      data: {
        electionSymbol,
        electionRound,
        party: party.id,
        election: electionId,
        constituency: constituency.id
      }
    });
  }
}

async function createQuestionCategories() {
  const elections: Array<HasId> = await strapi.db.query(API.Election).findMany({});
  for (const category of mockCategories) {
    const name = fakeLocalized((faker) => faker.word.sample(15).toLocaleUpperCase(), category);
    const shortName = abbreviate(name, { type: 'truncate' });
    const order = mockCategories.indexOf(category);
    const info = fakeLocalized((faker) => faker.lorem.paragraph(3));
    const color = faker.color.rgb();
    await strapi.db.query(API.QuestionCategory).create({
      data: {
        name,
        shortName,
        order,
        info,
        type: 'opinion',
        color,
        election: elections[0].id
      }
    });
  }
  // Category for basic info
  const name = fakeLocalized((_, l) => fakeTranslate(l, 'Basic information'));
  const shortName = abbreviate(name, { type: 'truncate' });
  const order = 0;
  const info = fakeLocalized((faker) => faker.lorem.paragraph(3));
  await strapi.db.query(API.QuestionCategory).create({
    data: {
      name,
      shortName,
      order,
      info,
      type: 'info',
      election: elections[0].id
    }
  });
}

async function createQuestionTypes() {
  for (const questionType of mockQuestionTypes as Array<{
    name: string;
    info: string;
    settings: QuestionTypeSettings;
  }>) {
    await strapi.db.query(API.QuestionType).create({
      data: {
        ...questionType
      }
    });
  }
}

/**
 * Create questions
 * @param options.constituencyPctg The fraction of Likert questions that will
 *   have their `constituency` relation set to a random constituency.
 */
async function createQuestions(options: { constituencyPctg?: number } = {}) {
  const questionTypes: Array<HasId & { name: string; settings: QuestionTypeSettings }> = await strapi.db
    .query(API.QuestionType)
    .findMany({});
  const likertTypes = questionTypes.filter((questionType) => questionType.settings.type === 'singleChoiceOrdinal');

  const questionCategories: Array<HasId & { type: 'opinion' | 'info' }> = await strapi.db
    .query(API.QuestionCategory)
    .findMany({});

  const opinionCategories = questionCategories.filter((cat) => cat.type === 'opinion');
  const constituencies: Array<HasId> = await strapi.db.query(API.Constituency).findMany({});

  const constituencyPctg = options.constituencyPctg ?? 0.1;
  // Create Opinion questions
  mockQuestions.forEach(async (question, index) => {
    const text = fakeLocalized((faker) => faker.lorem.sentence(), question);
    const questionType = faker.helpers.arrayElement(likertTypes);
    const info = fakeLocalized((faker) => faker.lorem.sentences(3));
    const category = opinionCategories[index % opinionCategories.length];
    // const category = faker.helpers.arrayElement(opinionCategories);
    const constituency = Math.random() < constituencyPctg ? faker.helpers.arrayElement(constituencies) : null;
    await strapi.db.query(API.Question).create({
      data: {
        text,
        info,
        order: index,
        allowOpen: true,
        questionType: questionType.id,
        category: category.id,
        constituencies: constituency ? [constituency.id] : [],
        publishedAt: new Date()
      }
    });
  });
  // Create other questions:
  // Languages, gender, election manifesto, unaffiliated
  const infoCategoryId = questionCategories.filter((cat) => cat.type === 'info')[0]?.id;
  for (const { text, info, type, order, required, entityType } of mockInfoQuestions) {
    const typeId = questionTypes.filter((qt) => qt.name === type)[0]?.id;
    await strapi.db.query(API.Question).create({
      data: {
        text,
        info,
        allowOpen: false,
        questionType: typeId,
        category: infoCategoryId,
        order,
        required,
        entityType,
        publishedAt: new Date()
      }
    });
  }
}

async function createAnswers(entityType: Omit<EntityType, 'all'>) {
  // Create a mock entity
  const entity = await strapi.db.query(entityType === 'candidate' ? API.Candidate : API.Party).create({
    data: {
      firstName: 'Mock',
      lastName: 'Entity',
      email: 'mock@example.com',
      publishedAt: new Date(),
      // Add party relation for candidates
      ...(entityType === 'candidate'
        ? {
            party: (await strapi.db.query(API.Party).findOne())?.id
          }
        : {})
    }
  });

  const questions = await strapi.db.query(API.Question).findMany({
    populate: ['questionType']
  });

  // Track unique answers
  const processedAnswers = new Set<string>();

  for (const mockAnswer of mockAnswers as MockAnswer[]) {
    // Skip if we've already processed this answer
    if (processedAnswers.has(mockAnswer.answer_id)) continue;

    const question = questions.find((q) => q.text.fi === mockAnswer.questionText);
    if (!question) {
      console.log(`No matching question found for: "${mockAnswer.questionText}"`);
      continue;
    }

    try {
      await strapi.db.query(API.Answer).create({
        data: {
          value: mockAnswer.value,
          openAnswer: mockAnswer.openAnswer,
          question: question.id,
          ...(entityType === 'candidate' ? { candidate: entity.id } : { party: entity.id })
        }
      });
      processedAnswers.add(mockAnswer.answer_id);
    } catch (error) {
      console.error(`Failed to create answer for question "${mockAnswer.questionText}":`, error);
    }
  }

  console.log(`Created ${processedAnswers.size} unique answers for mock ${entityType}`);
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

  const candidates = await strapi.db.query(API.Candidate).findMany({});
  await strapi.entityService.create(API.User, {
    data: {
      username: mockUser[0].username,
      email: mockUser[0].email,
      password: mockUser[0].password,
      provider: 'local',
      confirmed: true,
      blocked: false,
      role: authenticated.id,
      candidate: candidates[0].id
    }
  });

  await strapi.entityService.create(API.User, {
    data: {
      username: mockUser[1].username,
      email: mockUser[1].email,
      password: mockUser[1].password,
      provider: 'local',
      confirmed: true,
      blocked: false,
      role: authenticated.id,
      candidate: candidates[1].id
    }
  });

  // Disable registration key for the candidate we chose as they're already registered
  await strapi.query(API.User).update({
    where: { id: candidates[0].id },
    data: {
      registrationKey: null
    }
  });

  await strapi.query(API.User).update({
    where: { id: candidates[1].id },
    data: {
      registrationKey: null
    }
  });
}

async function generateMockLLMSummaries() {
  const OPEN_AI_API_KEY = process.env.OPEN_AI_API_KEY;
  try {
    const res: LLMResponse = await new OpenAIProvider({ apiKey: OPEN_AI_API_KEY })
      .generate([
        {
          role: Role.SYSTEM,
          content: 'message.content'
        },
        {
          role: Role.USER,
          content: `Write a lorem ipsum summary of this sentence: Taxes should be increased before cutting public spending
          Generate it in this format and change only the text part:
          {
          "infoSections": {
            "background": {
              "text": {
                "en": "Generated background here",
                "fi": "Generated background here suomeksi",
                "sv": "Generated background here in swedish"
              },
              "title": {
                "en": "Background"
              },
              "visible": true
            }
          }
        }`
        }
      ])
      .then((r) => r);
    // Api response with LLMResponse parameters
    // TODO: Type for this? Also handle error-responses
    const generatedCustomData = JSON.parse(res.content);
    // Use the same response for all candidates
    await strapi.db.query(API.Question).updateMany({
      where: {
        // Get all
      },
      data: {
        customData: generatedCustomData
      }
    });
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
            .map((w) => (w === '' || w === ' ' ? '' : w.substring(0, 1).toLocaleUpperCase(key)))
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

interface AbbreviationOptions {
  type: 'acronym' | 'truncate';
  length?: number;
}

function capitaliseFirstLetter(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

interface HasId {
  id: number | string;
}

interface Locale {
  code: string;
  name: string;
  localeObject: unknown;
  faker: Faker;
}
