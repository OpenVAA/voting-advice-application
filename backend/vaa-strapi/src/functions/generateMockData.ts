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

import {type Faker, faker, fakerES, fakerFI} from '@faker-js/faker';
import {generateMockDataOnInitialise, generateMockDataOnRestart} from '../constants';
import {API} from './utils/api';
import type {
  AnswerValue,
  EntityType,
  LocalizedString,
  QuestionTypeSettings
} from './utils/data.type';
import {dropAllCollections} from './utils/drop';
import {createRelationsForAvailableLocales} from './utils/i18n';
import mockQuestions from './mockData/mockQuestions.json';
import mockCategories from './mockData/mockCategories.json';
import mockUser from './mockData/mockUser.json';

const locales: Locale[] = [
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
    code: 'es-CO',
    name: 'Spanish (Colombia) (es-CO)',
    localeObject: undefined,
    faker: fakerES
  }
];

export async function generateMockData() {
  if (!(generateMockDataOnInitialise || generateMockDataOnRestart)) {
    return;
  }
  try {
    if (generateMockDataOnInitialise && !generateMockDataOnRestart) {
      let countOfObjects = 0;
      countOfObjects += await strapi.db
        .query(API.AppSettings)
        .count({})
        .then((number) => number);
      countOfObjects += await strapi.db
        .query(API.Election)
        .count({})
        .then((number) => number);
      countOfObjects += await strapi.db
        .query(API.AppLabel)
        .count({})
        .then((number) => number);
      countOfObjects += await strapi.db
        .query(API.Party)
        .count({})
        .then((number) => number);
      countOfObjects += await strapi.db
        .query(API.Candidate)
        .count({})
        .then((number) => number);
      countOfObjects += await strapi.db
        .query(API.Nomination)
        .count({})
        .then((number) => number);
      countOfObjects += await strapi.db
        .query(API.Constituency)
        .count({})
        .then((number) => number);
      countOfObjects += await strapi.db
        .query(API.QuestionCategory)
        .count({})
        .then((number) => number);
      countOfObjects += await strapi.db
        .query(API.QuestionType)
        .count({})
        .then((number) => number);
      countOfObjects += await strapi.db
        .query(API.Question)
        .count({})
        .then((number) => number);
      countOfObjects += await strapi.db
        .query(API.Answer)
        .count({})
        .then((number) => number);
      countOfObjects += await strapi.db
        .query(API.Language)
        .count({})
        .then((number) => number);
      countOfObjects += await strapi.db
        .query(API.User)
        .count({})
        .then((number) => number);

      if (countOfObjects > 0) {
        console.error(
          'Database is not empty and mock data generation is set to be only on initialisation - skipping mock data generation for now.'
        );
        return;
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
      const {code, name} = locale;
      const found = strapiLocales.find((l) => l.code === code);
      if (found) {
        locale.localeObject = found;
      } else {
        console.info('#######################################');
        console.info(`creating locale '${name}'`);
        locale.localeObject = await strapi.plugins.i18n.services.locales.create({code, name});
      }
    }

    console.info('#######################################');
    console.info('inserting app settings...');
    await createAppSettings();
    console.info('#######################################');
    console.info('inserting languages ...');
    await createLanguages();
    console.info('Done!');
    console.info('#######################################');
    console.info('inserting strapi admin');
    await createStrapiAdmin();
    console.info('Done!');
    console.info('#######################################');
    console.info('inserting election app labels...');
    await createElectionAppLabel();
    console.info('Done!');
    console.info('#######################################');
    console.info('inserting elections');
    await createQuestionTypes();
    console.info('Done!');
    console.info('#######################################');
    console.info('inserting questions');
    await createElection();
    console.info('Done!');
    console.info('#######################################');
    console.info('inserting parties');
    await createParties(10);
    console.info('Done!');
    console.info('#######################################');
    console.info('inserting candidates');
    await createCandidates(25);
    console.info('Done!');
    console.info('#######################################');
    console.info('inserting constituencies');
    await createConstituencies(20);
    console.info('Done!');
    console.info('#######################################');
    console.info('inserting candidate nominations');
    await createCandidateNominations(25);
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
    console.info('inserting question categories');
    await createQuestionCategories();
    console.info('Done!');
    console.info('#######################################');
    console.info('inserting question types');
    await createQuestions();
    console.info('Done!');
    console.info('#######################################');
    console.info('inserting candidate answers');
    await createAnswers('candidate');
    console.info('Done!');
    console.info('#######################################');
    console.info('inserting party answers');
    await createAnswers('party');
    console.info('Done!');
    console.info('#######################################');
    console.info('inserting candidate users');
    await createCandidateUsers();
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
  await strapi.db.query(API.AppSettings).create({
    data: {
      publisherName: fakeLocalized((faker) => faker.company.name())
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
        name: 'Spanish',
        localisationCode: 'es',
        publishedAt: new Date()
      }
    ]
  });
}

async function createElectionAppLabel() {
  // This should create labels dynamically so that they match the translation files either completely or at least the most often modified parts
  // Before this is done, it's better not to create labels at all
  // const actionLabels = {
  //   electionInfo: 'Information About the Elections',
  //   help: 'Help',
  //   home: 'home',
  //   howItWorks: 'How Does This App Work?',
  //   opinions: 'Opinions',
  //   results: 'Results',
  //   startButton: 'Start Finding The Best Candidates!',
  //   startQuestions: 'Start the Questionnaire',
  //   yourList: 'Your List'
  // };
  // const viewTexts = {
  //   appTitle: 'Election Compass',
  //   frontpageIngress:
  //     'With this application you can compare candidates in the elections on {electionDate, date, ::yyyyMMdd} based on their opinions, parties and other data.',
  //   madeWith: 'Made with',
  //   publishedBy: 'Published by {publisher}',
  //   questionsTip: 'Tip: If you don’t care about an issue, you can skip it.',
  //   yourOpinionsIngress:
  //     'Next, the app will ask your opinions on {numStatements} statements about political issues and values, which the candidates have also answered. After you’ve answered them, the app will find the candidates that best agree with your opinions. The statements are grouped into {numCategories} categories. You can answer all of them or only select those you find important.',
  //   yourOpinionsTitle: 'Tell Your Opinions'
  // };
  // const strapiObjects: HasId[] = await Promise.all(
  //   locales.map(
  //     async (l) =>
  //       await strapi.entityService.create(API.AppLabel, {
  //         data: {
  //           actionLabels: fakeTranslate(l, actionLabels),
  //           viewTexts: fakeTranslate(l, viewTexts),
  //           locale: l.code,
  //           publishedAt: new Date()
  //         }
  //       })
  //   )
  // );
  // await createRelationsForAvailableLocales(API.AppLabel, strapiObjects);
}

async function createElection() {
  let appLabel = await strapi.db.query(API.AppLabel).findOne({
    where: {
      locale: locales[0].code
    }
  });

  const date = faker.date.future();
  const organiser = faker.location.country();
  const types = ['local', 'presidential', 'congress'];
  const electionType = types[Math.floor(Math.random() * types.length)];
  const name = fakeLocalized(
    (faker, locale) =>
      `${date.getFullYear()} ${faker.location.country()} ${electionType} (${locale.code})`
  );
  const shortName = name;
  const info = fakeLocalized((faker) => faker.lorem.paragraph(3));
  const electionStartDate = date.toISOString().split('T')[0];
  const electionDate = date.toISOString().split('T')[0];

  await strapi.db.query(API.Election).create({
    data: {
      name,
      shortName,
      organiser,
      electionStartDate,
      electionDate,
      electionType,
      info,
      electionAppLabel: appLabel ? appLabel.id : null,
      publishedAt: new Date(),
      canEditQuestions: true
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

async function createConstituencies(numberOfConstituencies: number) {
  const elections = await strapi.db.query(API.Election).findMany({});

  for (let i = 0; i <= numberOfConstituencies; i++) {
    const name = fakeLocalized((faker) => faker.location.state());
    const shortName = fakeLocalized((faker) => faker.location.state({abbreviated: true}));
    const type = i < 2 ? 'ethnic' : 'geographic';
    const info = fakeLocalized((faker) => faker.lorem.paragraph(3));
    const election: HasId = faker.helpers.arrayElement(elections);
    await strapi.db.query(API.Constituency).create({
      data: {
        name,
        shortName,
        type,
        info,
        elections: [election.id],
        publishedAt: new Date()
      }
    });
  }
}

async function createCandidateNominations(length: number) {
  const elections: HasId[] = await strapi.db.query(API.Election).findMany({});
  const constituencies: HasId[] = await strapi.db.query(API.Constituency).findMany({});
  const candidates: {id: string | number; party: HasId}[] = await strapi.db
    .query(API.Candidate)
    .findMany({
      populate: ['party']
    });

  for (let i = 0; i <= length; i++) {
    const candidate = faker.helpers.arrayElement(candidates);
    // Remove from list to prevent duplicates
    candidates.splice(candidates.indexOf(candidate), 1);
    const electionSymbol = faker.number.int({min: 2, max: length + 2}).toString();
    const electionRound = faker.number.int(1);
    const constituency = faker.helpers.arrayElement(constituencies);
    const electionId = elections[0].id;
    await strapi.db.query(API.Nomination).create({
      data: {
        electionSymbol,
        electionRound,
        candidate: candidate.id,
        party: candidate.party.id,
        election: electionId,
        constituency: constituency.id,
        publishedAt: new Date()
      }
    });
  }
}

async function createPartyNominations(length: number) {
  const elections: HasId[] = await strapi.db.query(API.Election).findMany({});
  const constituencies: HasId[] = await strapi.db.query(API.Constituency).findMany({});
  const parties: HasId[] = await strapi.db.query(API.Party).findMany({});

  for (let i = 0; i <= length; i++) {
    const party = faker.helpers.arrayElement(parties);
    // Remove from list to prevent duplicates
    parties.splice(parties.indexOf(party), 1);
    const electionSymbol = faker.number.int({min: 2, max: length + 2}).toString();
    const electionRound = faker.number.int(1);
    const constituency = faker.helpers.arrayElement(constituencies);
    const electionId = elections[0].id;
    await strapi.db.query(API.Nomination).create({
      data: {
        electionSymbol,
        electionRound,
        party: party.id,
        election: electionId,
        constituency: constituency.id,
        publishedAt: new Date()
      }
    });
  }
}

async function createQuestionCategories() {
  const elections: HasId[] = await strapi.db.query(API.Election).findMany({});
  for (const category of mockCategories) {
    const name = fakeLocalized((faker) => faker.word.sample(15).toLocaleUpperCase(), category);
    const shortName = abbreviate(name, {type: 'truncate'});
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
        election: elections[0].id,
        publishedAt: new Date()
      }
    });
  }
  // Category for basic info
  const name = fakeLocalized((_, l) => fakeTranslate(l, 'Basic information'));
  const shortName = abbreviate(name, {type: 'truncate'});
  const order = 0;
  const info = fakeLocalized((faker) => faker.lorem.paragraph(3));
  await strapi.db.query(API.QuestionCategory).create({
    data: {
      name,
      shortName,
      order,
      info,
      type: 'info',
      election: elections[0].id,
      publishedAt: new Date()
    }
  });
}

async function createQuestionTypes() {
  const questionTypes: {
    name: string;
    info: string;
    settings: QuestionTypeSettings;
  }[] = [
    {
      name: 'Likert-4',
      info: 'A Likert question with 4 options.',
      settings: {
        type: 'singleChoiceOrdinal',
        values: [
          {
            key: 1,
            label: fakeLocalized((_, l) => fakeTranslate(l, 'Fully disagree'))
          },
          {
            key: 2,
            label: fakeLocalized((_, l) => fakeTranslate(l, 'Disagree'))
          },
          {
            key: 3,
            label: fakeLocalized((_, l) => fakeTranslate(l, 'Agree'))
          },
          {
            key: 4,
            label: fakeLocalized((_, l) => fakeTranslate(l, 'Fully agree'))
          }
        ]
      }
    },
    {
      name: 'Likert-5',
      info: 'A Likert question with 5 options.',
      settings: {
        type: 'singleChoiceOrdinal',
        values: [
          {
            key: 1,
            label: fakeLocalized((_, l) => fakeTranslate(l, 'Fully disagree'))
          },
          {
            key: 2,
            label: fakeLocalized((_, l) => fakeTranslate(l, 'Somewhat disagree'))
          },
          {
            key: 3,
            label: fakeLocalized((_, l) => fakeTranslate(l, 'Neither agree nor disagree'))
          },
          {
            key: 4,
            label: fakeLocalized((_, l) => fakeTranslate(l, 'Somewhat agree'))
          },
          {
            key: 5,
            label: fakeLocalized((_, l) => fakeTranslate(l, 'Fully agree'))
          }
        ]
      }
    },
    {
      name: 'Text',
      info: 'A basic text question.',
      settings: {
        type: 'text'
      }
    },
    {
      name: 'Date',
      info: 'A date which is displayed without the year.',
      settings: {
        type: 'date',
        dateType: 'monthDay'
      }
    },
    {
      name: 'Boolean',
      info: 'A yes/no question.',
      settings: {
        type: 'boolean'
      }
    },
    {
      name: 'Gender',
      info: 'A list of genders.',
      settings: {
        type: 'singleChoiceCategorical',
        values: [
          {
            key: 1,
            label: fakeLocalized((_, l) => fakeTranslate(l, 'Female'))
          },
          {
            key: 2,
            label: fakeLocalized((_, l) => fakeTranslate(l, 'Male'))
          },
          {
            key: 3,
            label: fakeLocalized((_, l) => fakeTranslate(l, 'Non-binary'))
          },
          {
            key: 4,
            label: fakeLocalized((_, l) => fakeTranslate(l, 'Prefer not to answer'))
          }
        ]
      }
    },
    {
      name: 'Language',
      info: 'A single language choice question.',
      settings: {
        type: 'singleChoiceCategorical',
        values: [
          {
            key: 0,
            label: fakeLocalized((_, l) => fakeTranslate(l, 'English'))
          },
          {
            key: 1,
            label: fakeLocalized((_, l) => fakeTranslate(l, 'Finnish'))
          },
          {
            key: 2,
            label: fakeLocalized((_, l) => fakeTranslate(l, 'Spanish'))
          },
          {
            key: 3,
            label: fakeLocalized((_, l) => fakeTranslate(l, 'Volapük'))
          },
          {
            key: 4,
            label: fakeLocalized((_, l) => fakeTranslate(l, 'Finnish sign language'))
          }
        ]
      }
    },
    {
      name: 'MultiLanguage',
      info: 'A multiple language choice question.',
      settings: {
        type: 'multipleChoiceCategorical',
        values: [
          {
            key: 0,
            label: fakeLocalized((_, l) => fakeTranslate(l, 'English'))
          },
          {
            key: 1,
            label: fakeLocalized((_, l) => fakeTranslate(l, 'Finnish'))
          },
          {
            key: 2,
            label: fakeLocalized((_, l) => fakeTranslate(l, 'Spanish'))
          },
          {
            key: 3,
            label: fakeLocalized((_, l) => fakeTranslate(l, 'Volapük'))
          },
          {
            key: 4,
            label: fakeLocalized((_, l) => fakeTranslate(l, 'Finnish sign language'))
          }
        ]
      }
    }
  ];

  for (const questionType of questionTypes) {
    await strapi.db.query(API.QuestionType).create({
      data: {
        ...questionType,
        publishedAt: new Date()
      }
    });
  }
}

/**
 * Create questions
 * @param options.constituencyPctg The fraction of Likert questions that will
 *   have their `constituency` relation set to a random constituency.
 */
async function createQuestions(options: {constituencyPctg?: number} = {}) {
  const questionTypes: (HasId & {name: string; settings: QuestionTypeSettings})[] = await strapi.db
    .query(API.QuestionType)
    .findMany({});
  const likertTypes = questionTypes.filter(
    (questionType) => questionType.settings.type === 'singleChoiceOrdinal'
  );

  const questionCategories: (HasId & {type: 'opinion' | 'info'})[] = await strapi.db
    .query(API.QuestionCategory)
    .findMany({});

  const opinionCategories = questionCategories.filter((cat) => cat.type === 'opinion');
  const constituencies: HasId[] = await strapi.db.query(API.Constituency).findMany({});

  const constituencyPctg = options.constituencyPctg ?? 0.1;
  // Create Opinion questions
  for (const question of mockQuestions) {
    const text = fakeLocalized((faker) => faker.lorem.sentence(), question);
    const questionType = faker.helpers.arrayElement(likertTypes);
    const info = fakeLocalized((faker) => faker.lorem.sentences(3));
    const category = faker.helpers.arrayElement(opinionCategories);
    const constituency =
      Math.random() < constituencyPctg ? faker.helpers.arrayElement(constituencies) : null;
    await strapi.db.query(API.Question).create({
      data: {
        text,
        info,
        allowOpen: true,
        questionType: questionType.id,
        category: category.id,
        constituency: constituency ? [constituency.id] : [],
        publishedAt: new Date()
      }
    });
  }
  // Create other questions:
  // Languages, gender, election manifesto, unaffiliated
  const infoCategoryId = questionCategories.filter((cat) => cat.type === 'info')[0]?.id;
  const infoQuestions = [
    {
      text: 'Mother tongue',
      type: 'Language',
      order: 2,
      required: true
    },
    {
      text: 'Other languages',
      type: 'MultiLanguage',
      order: 3,
      required: false
    },
    {
      text: 'Gender',
      type: 'Gender',
      order: 1,
      required: true
    },
    {
      text: 'Unaffiliated',
      type: 'Boolean',
      order: 4,
      required: true
    },
    {
      text: 'Election manifesto',
      type: 'Text',
      order: 5,
      required: true
    },
    {
      text: 'Birthday',
      type: 'Date',
      order: 0,
      required: true
    }
  ];
  for (const question of infoQuestions) {
    const typeId = questionTypes.filter((qt) => qt.name === question.type)[0]?.id;
    const text = fakeLocalized((_, l) => fakeTranslate(l, question.text));
    const info = fakeLocalized((faker) => faker.lorem.sentences(3));
    await strapi.db.query(API.Question).create({
      data: {
        text,
        info,
        allowOpen: false,
        questionType: typeId,
        category: infoCategoryId,
        order: question.order,
        required: question.required,
        entityType: 'candidate',
        publishedAt: new Date()
      }
    });
  }
}

async function createAnswers(entityType: Omit<EntityType, 'all'>) {
  const entities: HasId[] = await strapi.db
    .query(entityType === 'candidate' ? API.Candidate : API.Party)
    .findMany({});

  const questions: (HasId & {
    allowOpen: boolean;
    entityType?: EntityType;
    questionType: {settings: QuestionTypeSettings};
  })[] = await strapi.db.query(API.Question).findMany({
    populate: ['questionType']
  });

  for (const entity of entities) {
    for (const question of questions) {
      if (
        question.entityType &&
        question.entityType !== 'all' &&
        question.entityType !== entityType
      )
        continue;
      const settings = question.questionType.settings;
      let value: AnswerValue[keyof AnswerValue];
      switch (settings.type) {
        case 'text':
          value = settings.notLocalizable
            ? faker.lorem.sentence()
            : fakeLocalized((faker) => faker.lorem.sentence());
          break;
        case 'boolean':
          value = faker.helpers.arrayElement([true, false]);
          break;
        case 'number':
          value = faker.number.int({min: settings.min, max: settings.max});
          break;
        case 'date':
          if (settings.min) {
            if (settings.max) {
              value = faker.date
                .between({from: settings.min, to: settings.max})
                .toISOString()
                .split('T')[0];
            } else {
              value = faker.date.future({refDate: settings.min}).toISOString().split('T')[0];
            }
          } else {
            value = faker.date.past({refDate: settings.max}).toISOString().split('T')[0];
          }
          break;
        case 'singleChoiceCategorical':
        case 'singleChoiceOrdinal':
          value = faker.helpers.arrayElement(settings.values).key;
          break;
        case 'multipleChoiceCategorical':
        case 'preferenceOrder':
          value = faker.helpers
            .arrayElements(settings.values, {
              min: settings.min ?? 1,
              max: settings.max ?? settings.values.length
            })
            .map((v) => v.key);
          break;
        default:
          throw new Error(`Unsupported question type: ${settings.type}`);
      }
      const openAnswer = question.allowOpen
        ? fakeLocalized((faker) => faker.lorem.sentence())
        : null;
      const entityRelation =
        entityType === 'candidate' ? {candidate: entity.id} : {party: entity.id};
      await strapi.db.query(API.Answer).create({
        data: {
          value,
          openAnswer,
          question: question.id,
          publishedAt: new Date(),
          ...entityRelation
        }
      });
    }
  }
}

async function createCandidateUsers() {
  if (process.env.NODE_ENV === 'production') {
    console.warn('Skipped - running in production mode.');
    return;
  }

  console.warn(
    'The application is running in development mode - creating a default user for the first candidate'
  );

  const authenticated = await strapi.query('plugin::users-permissions.role').findOne({
    where: {
      type: 'authenticated'
    }
  });

  const candidate = await strapi.db.query(API.Candidate).findOne({});
  await strapi.entityService.create(API.User, {
    data: {
      username: mockUser.username,
      email: mockUser.email,
      password: mockUser.password,
      provider: 'local',
      confirmed: true,
      blocked: false,
      role: authenticated.id,
      candidate: candidate.id
    }
  });

  // Disable registration key for the candidate we chose as they're already registered
  await strapi.query(API.User).update({
    where: {id: candidate.id},
    data: {
      registrationKey: null
    }
  });
}

/**
 * Adds the locale code to any strings unless the locale is the default one.
 * Used to mark strings as translated if no proper translations are available.
 */
function fakeTranslate<T extends string | Record<string, string>>(locale: Locale, target: T): T {
  if (locale.code === locales[0].code) return target;
  const translate = (s: string) => `${locale.code.toUpperCase()} ${s}`;
  if (typeof target === 'string') return translate(target) as T;
  return Object.fromEntries(
    Object.entries(target).map(([key, value]) => [key, translate(value)])
  ) as T;
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
  return {...Object.fromEntries(locales.map((l) => [l.code, callback(l.faker, l)])), ...template};
}

/**
 * Converts a localized string json to an abbreviation of its values
 * @values The localized string json to translate
 * @options Optional settings for abbreviation
 */
function abbreviate(
  values: LocalizedString,
  options: AbbreviationOptions = {type: 'acronym'}
): LocalizedString {
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
