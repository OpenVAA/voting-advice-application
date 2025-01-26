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
import { loadDefaultAppSettings } from './loadDefaultAppSettings';
import mockCandidateForTesting from './mockData/mockCandidateForTesting.json';
import mockCategories from './mockData/mockCategories.json';
import mockInfoQuestions from './mockData/mockInfoQuestions.json';
import mockQuestions from './mockData/mockQuestions.json';
import mockQuestionTypes from './mockData/mockQuestionTypes.json';
import mockUsers from './mockData/mockUsers.json';
import { API } from './utils/api';
import { getDynamicTranslations } from './utils/appCustomization';
import { dropAllCollections } from './utils/drop';
import { generateMockDataOnInitialise, generateMockDataOnRestart } from '../constants';
import type { AnswerValue, LocalizedAnswer, LocalizedString, QuestionTypeSettings } from '@openvaa/app-shared';
import type { Data } from '@strapi/strapi';

const N_CONSTITUENCIES = 15;
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
    await loadDefaultAppSettings();
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
    await createConstituenciesAndGroups(N_CONSTITUENCIES);
    console.info('Done!');
    console.info('#######################################');
    console.info('inserting one election');
    await createElection();
    console.info('Done!');
    console.info('#######################################');
    console.info('inserting question types');
    await createQuestionTypes();
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
    console.info('inserting parties');
    await createParties(N_PARTIES);
    console.info('Done!');
    console.info('#######################################');
    console.info('inserting candidates');
    await createCandidates(N_CONSTITUENCIES * N_CANDIDATES_PER_CONSTITUENCY);
    console.info('Done!');
    console.info('#######################################');
    console.info('inserting candidate without answers for testing');
    await createCandidateForTesting();
    console.info('Done!');
    console.info('#######################################');
    console.info('inserting candidate nominations');
    await createCandidateNominations(F_DUPLICATE_NOMINATIONS);
    console.info('Done!');
    console.info('#######################################');
    console.info('inserting closed list parties');
    await createParties(N_PARTIES_WITH_CLOSED_LISTS);
    console.info('Done!');
    console.info('#######################################');
    console.info('inserting party nominations');
    await createPartyNominations(N_PARTIES_WITH_CLOSED_LISTS);
    console.info('Done!');
    console.info('#######################################');
    console.info('inserting candidate users');
    await createCandidateUsers();
    console.info('Done!');
    console.info('#######################################');
    console.info('Mock data generation completed successfully!');
    console.info('#######################################');
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
 * @param numberPerGroup - An Array of numbers representing the number of constituencies per constituency group.
 */
async function createConstituenciesAndGroups(...numberPerGroup: Array<number>) {
  for (let i = 0; i < numberPerGroup.length; i++) {
    // Create Constituencies
    const constituencies = new Array<string>();
    for (let j = 0; j < numberPerGroup[i]; j++) {
      const name = fakeLocalized((faker) => faker.location.state());
      const shortName = fakeLocalized((faker) => faker.location.state({ abbreviated: true }));
      const info = fakeLocalized((faker) => faker.lorem.paragraph(3));
      const { documentId } = await strapi.documents('api::constituency.constituency').create({
        data: {
          name,
          shortName,
          info
        },
        status: 'published'
      });
      constituencies.push(documentId);
    }
    // Create Constituency Group
    const subtype = i % 2 ? 'ethnic' : 'geographic';
    await strapi.documents('api::constituency-group.constituency-group').create({
      data: {
        name: fakeLocalized(() => `${capitaliseFirstLetter(subtype)} constituency group`),
        subtype,
        info: fakeLocalized((faker) => faker.lorem.paragraph(3)),
        constituencies
      },
      status: 'published'
    });
  }
}

async function createElection() {
  const constituencyGroups = await strapi
    .documents('api::constituency-group.constituency-group')
    .findMany({})
    .then((res) => res.map((g) => g.documentId));
  const date = faker.date.future();
  const types = ['local', 'presidential', 'congress'] as const;
  const electionType = types[Math.floor(Math.random() * types.length)];
  const name = fakeLocalized(
    (faker, locale) => `${date.getFullYear()} ${faker.location.country()} ${electionType} (${locale.code})`
  );
  const shortName = name;
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
      publishedAt: new Date(),
      answersLocked: false,
      constituencyGroups
    },
    status: 'published'
  });
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
        publishedAt: new Date()
      },
      status: 'published'
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
        answers: generateAnswers(questions, 'candidate')
      },
      status: 'published'
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
      publishedAt: new Date()
    },
    status: 'published'
  });
}

/**
 * Create nominations for all candidates with possible duplicates.
 * @param duplicateFraction - Approximate fraction of candidates to nominate in two constituencies.
 */
async function createCandidateNominations(duplicateFraction = 0.0) {
  const elections = await strapi.documents('api::election.election').findMany({});
  const constituencies = await strapi.documents('api::constituency.constituency').findMany({});
  const candidates = await strapi.documents('api::candidate.candidate').findMany({
    populate: ['party']
  });

  for (const candidate of candidates) {
    const duplicate = Math.random() < duplicateFraction;
    const electionSymbol = faker.number
      .int({ min: 2, max: Math.ceil(candidates.length * (1 + duplicateFraction)) + 2 })
      .toString();
    const electionRound = 1; // faker.number.int(1);
    const electionId = elections[0].documentId;
    // If duplicate create two nominations, otherwise one
    for (const constituency of faker.helpers.arrayElements(constituencies, duplicate ? 2 : 1)) {
      await strapi.documents('api::nomination.nomination').create({
        data: {
          electionSymbol,
          electionRound,
          candidate: candidate.documentId,
          party: candidate.party.documentId,
          election: electionId,
          constituency: constituency.documentId
        },
        status: 'published'
      });
    }
  }
}

async function createPartyNominations(length: number) {
  const elections = await strapi.documents('api::election.election').findMany({});
  const constituencies = await strapi.documents('api::constituency.constituency').findMany({});
  const parties = await strapi.documents('api::party.party').findMany({});

  for (let i = 0; i <= length; i++) {
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
        constituency: constituency.documentId
      },
      status: 'published'
    });
  }
}

async function createQuestionCategories() {
  const elections = await strapi.documents('api::election.election').findMany({});
  for (const category of mockCategories) {
    const name = fakeLocalized((faker) => faker.word.sample(15).toLocaleUpperCase(), category);
    const shortName = abbreviate(name, { type: 'truncate' });
    const order = mockCategories.indexOf(category);
    const info = fakeLocalized((faker) => faker.lorem.paragraph(3));
    const color = faker.color.rgb();
    await strapi.documents('api::question-category.question-category').create({
      data: {
        name,
        shortName,
        order,
        info,
        type: 'opinion',
        color,
        election: elections[0].documentId
      },
      status: 'published'
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
      election: elections[0].documentId
    },
    status: 'published'
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
async function createQuestions(options: { constituencyPctg?: number } = {}) {
  const questionTypes = await strapi.documents('api::question-type.question-type').findMany({});
  const likertTypes = questionTypes.filter(
    (questionType) => (questionType.settings as QuestionTypeSettings).type === 'singleChoiceOrdinal'
  );

  const questionCategories = await strapi.documents('api::question-category.question-category').findMany({});

  const opinionCategories = questionCategories.filter((cat) => cat.type === 'opinion');
  const constituencies = await strapi.documents('api::constituency.constituency').findMany({});

  const constituencyPctg = options.constituencyPctg ?? 0.1;
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
        publishedAt: new Date()
      },
      status: 'published'
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
        publishedAt: new Date()
      },
      status: 'published'
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
        registrationKey: null
      },
      status: 'published'
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

interface Locale {
  code: string;
  name: string;
  localeObject: unknown;
  faker: Faker;
}

type EntityType = 'candidate' | 'party' | 'all';

/** We need this for explicit typing */
type JSONValue = Data.ContentType<'api::candidate.candidate'>['answers'];
