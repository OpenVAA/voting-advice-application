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
import mockQuestions from './mockQuestions.json';
import mockCategories from './mockCategories.json';

const ELECTION_API = 'api::election.election';
const ELECTION_APP_LABEL_API = 'api::election-app-label.election-app-label';
const CONSTITUENCY_API = 'api::constituency.constituency';
const PARTY_API = 'api::party.party';
const CANDIDATE_API = 'api::candidate.candidate';
const CANDIDATE_ATTRIBUTE_API = 'api::candidate-attribute.candidate-attribute';
const NOMINATION_API = 'api::nomination.nomination';
const QUESTION_API = 'api::question.question';
const QUESTION_TYPE_API = 'api::question-type.question-type';
const QUESTION_CATEGORY_API = 'api::question-category.question-category';
const ANSWER_API = 'api::answer.answer';
const USER_API = 'plugin::users-permissions.user';
const LANGUAGE_API = 'api::language.language';

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
        .query(ELECTION_API)
        .count({})
        .then((number) => number);
      countOfObjects += await strapi.db
        .query(ELECTION_APP_LABEL_API)
        .count({})
        .then((number) => number);
      countOfObjects += await strapi.db
        .query(PARTY_API)
        .count({})
        .then((number) => number);
      countOfObjects += await strapi.db
        .query(CANDIDATE_API)
        .count({})
        .then((number) => number);
      countOfObjects += await strapi.db
        .query(NOMINATION_API)
        .count({})
        .then((number) => number);
      countOfObjects += await strapi.db
        .query(CONSTITUENCY_API)
        .count({})
        .then((number) => number);
      countOfObjects += await strapi.db
        .query(QUESTION_CATEGORY_API)
        .count({})
        .then((number) => number);
      countOfObjects += await strapi.db
        .query(QUESTION_TYPE_API)
        .count({})
        .then((number) => number);
      countOfObjects += await strapi.db
        .query(QUESTION_API)
        .count({})
        .then((number) => number);
      countOfObjects += await strapi.db
        .query(ANSWER_API)
        .count({})
        .then((number) => number);
      countOfObjects += await strapi.db
        .query(LANGUAGE_API)
        .count({})
        .then((number) => number);
      countOfObjects += await strapi.db
        .query(USER_API)
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

  if (generateMockDataOnRestart) {
    console.info('#######################################');
    await dropCollections();
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
  console.info('inserting languages ...');
  await createLanguages();
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
}

/**
 * Drops all data in the collections
 */
async function dropCollections() {
  await strapi.db.query(CANDIDATE_API).deleteMany({});
  await strapi.db.query(PARTY_API).deleteMany({});
  await strapi.db.query(NOMINATION_API).deleteMany({});
  await strapi.db.query(ANSWER_API).deleteMany({});
  await strapi.db.query(QUESTION_CATEGORY_API).deleteMany({});
  await strapi.db.query(CONSTITUENCY_API).deleteMany({});
  await strapi.db.query(ELECTION_APP_LABEL_API).deleteMany({});
  await strapi.db.query(ELECTION_API).deleteMany({});
  await strapi.db.query(QUESTION_API).deleteMany({});
  await strapi.db.query(QUESTION_TYPE_API).deleteMany({});
  await strapi.db.query(USER_API).deleteMany({});
  await strapi.db.query(LANGUAGE_API).deleteMany({});
}

async function createLanguages() {
  await strapi.db.query(LANGUAGE_API).createMany({
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
  const actionLabels = {
    startButton: 'Start Finding The Best Candidates!',
    electionInfo: 'Information about the elections',
    howItWorks: 'How does this app work?',
    help: 'Help',
    searchMunicipality: 'Your Municipality or Town',
    startQuestions: 'Start the Questionnaire',
    selectCategories: 'Select Categories',
    previous: 'Previous',
    answerCategoryQuestions: 'Answer {numQuestions} Questions',
    readMore: 'Read More',
    skip: 'Skip',
    filter: 'Filter Results',
    alphaOrder: 'A-Z',
    bestMatchOrder: 'Best Match',
    addToList: 'Add to List',
    candidateBasicInfo: 'Basic Info',
    candidateOpinions: 'Opinions',
    home: 'home',
    constituency: 'Constituency',
    opinions: 'Opinions',
    results: 'Results',
    yourList: 'Your List'
  };
  const viewTexts = {
    appTitle: 'Election Compass',
    toolTitle: 'Election Compass',
    toolDescription:
      'With this application you can compare candidates in the elections on {electionDate, date, ::yyyyMMdd} based on their opinions, parties and other data.',
    publishedBy: 'Published by {publisher}',
    madeWith: 'Made with',
    selectMunicipalityTitle: 'Select Your Municipality',
    selectMunicipalityDescription:
      'In these elections, you can only vote for candidates in your own constituency. Select your municipality and the app will find it for you.',
    yourConstituency: 'Your constituency is {constituency}',
    yourOpinionsTitle: 'Tell Your Opinions',
    yourOpinionsDescription:
      'Next, the app will ask your opinions on {numStatements} statements about political issues and values, which the candidates have also answered. After you’ve answered them, the app will find the candidates that best agree with your opinions. The statements are grouped into {numCategories} categories. You can answer all of them or only select those you find important.',
    questionsTip:
      'Tip: If you don’t care about a single issue or a category of them, you can skip it later.',
    yourCandidatesTitle: 'Your Candidates',
    yourCandidatesDescription:
      'These are the candidates in your constituency. The best matches are first on the list. You can also see which {numCandidates} best match your opinions. To narrow down the results, you can also use {filters}.',
    yourPartiesTitle: 'Your Parties',
    yourPartiesDescription:
      'These are the parties in your constituency. The best matches are first on the list. You can also see which individual {partiesTerm} best match your opinions. To narrow down the results, you can also use {filters}.'
  };

  const strapiObjects: HasId[] = await Promise.all(
    locales.map(
      async (l) =>
        await strapi.entityService.create(ELECTION_APP_LABEL_API, {
          data: {
            info: l.faker.lorem.sentences(3),
            actionLabels: fakeTranslate(l, actionLabels),
            viewTexts: fakeTranslate(l, viewTexts),
            locale: l.code,
            publishedAt: new Date()
          }
        })
    )
  );

  await createRelationsForAvailableLocales(ELECTION_APP_LABEL_API, strapiObjects);
}

async function createElection() {
  let AppLabel = await strapi.db.query(ELECTION_APP_LABEL_API).findOne({
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

  await strapi.entityService.create(ELECTION_API, {
    data: {
      name,
      shortName,
      organiser,
      electionStartDate,
      electionDate,
      electionType,
      info,
      electionAppLabel: AppLabel.id,
      publishedAt: new Date()
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
    const color = faker.helpers.arrayElement([
      'Red',
      'Orange',
      'Yellow',
      'Green',
      'Blue',
      'Purple'
    ]);
    await strapi.entityService.create(PARTY_API, {
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
  const parties = await strapi.entityService.findMany(PARTY_API);
  // TODO: Remove languages later
  const languages = await strapi.entityService.findMany(LANGUAGE_API);
  for (let i = 0; i <= length; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const party: HasId = faker.helpers.arrayElement(parties);
    // TODO: Remove these attrs later
    const politicalExperience = faker.lorem.paragraph(3);
    const motherTongue: any = faker.helpers.arrayElement(languages);
    const otherLanguage: any = faker.helpers.arrayElement(languages);
    await strapi.entityService.create(CANDIDATE_API, {
      data: {
        firstName,
        lastName,
        party: party.id,
        publishedAt: new Date(),
        politicalExperience,
        unaffiliated: false,
        motherTongues: [motherTongue.id],
        otherLanguages: [otherLanguage.id]
      }
    });

    // TODO: Remove when custom basic info questions are online
    //
    // // Political experience attribute
    // const textQuestionType = await strapi.db.query(QUESTION_TYPE_API).findOne({
    //   where: {
    //     name: 'Text answer'
    //   }
    // });

    // const politicalExperienceData = {
    //   displayName: 'Political experience',
    //   questionType: textQuestionType.id,
    //   candidate: candidate.id,
    //   publishedAt: new Date(),
    //   key: 'politicalExperience',
    //   value: politicalExperience
    // };

    // const politicalExperienceMainLocale = await strapi.entityService.create(
    //   CANDIDATE_ATTRIBUTE_API,
    //   {
    //     data: politicalExperienceData
    //   }
    // );

    // // Gender attribute

    // const genderQuestionType = await strapi.db.query(QUESTION_TYPE_API).findOne({
    //   where: {
    //     name: 'Gender'
    //   }
    // });

    // const genderTypeValues: {key: number}[] = genderQuestionType.settings.values;
    // const answer = faker.helpers.arrayElement(genderTypeValues).key;

    // const genderData = {
    //   displayName: 'Gender',
    //   questionType: genderQuestionType.id,
    //   candidate: candidateMainLocale.id,
    //   locale: mainLocale.code,
    //   publishedAt: new Date(),
    //   key: 'gender',
    //   value: answer.toString()
    // };

    // /**
    //  * TODO: In theory, this doesn't need localization because the label is
    //  * obtained from the question type settings. However, for consistency with
    //  * other attributes, it is localized.
    //  **/
    // const genderMainLocale = await strapi.entityService.create(CANDIDATE_ATTRIBUTE_API, {
    //   data: genderData
    // });
  }
}

async function createConstituencies(numberOfConstituencies: number) {
  const elections = await strapi.entityService.findMany(ELECTION_API);
  for (let i = 0; i <= numberOfConstituencies; i++) {
    const name = fakeLocalized((faker) => faker.location.state());
    const shortName = fakeLocalized((faker) => faker.location.state({abbreviated: true}));
    const type = i < 2 ? 'ethnic' : 'geographic';
    const info = fakeLocalized((faker) => faker.lorem.paragraph(3));
    const election: HasId = faker.helpers.arrayElement(elections);
    await strapi.entityService.create(CONSTITUENCY_API, {
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
  const elections: HasId[] = await strapi.entityService.findMany(ELECTION_API);
  const constituencies: HasId[] = await strapi.entityService.findMany(CONSTITUENCY_API);
  const candidates: {id: string | number; party: HasId}[] = await strapi.entityService.findMany(
    CANDIDATE_API,
    {
      populate: ['party']
    }
  );
  for (let i = 0; i <= length; i++) {
    const candidate = faker.helpers.arrayElement(candidates);
    // Remove from list to prevent duplicates
    candidates.splice(candidates.indexOf(candidate), 1);
    const electionSymbol = faker.number.int({min: 2, max: length + 2}).toString();
    const electionRound = faker.number.int(1);
    const constituency = faker.helpers.arrayElement(constituencies);
    const electionId = elections[0].id;
    await strapi.entityService.create(NOMINATION_API, {
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
  const elections: HasId[] = await strapi.entityService.findMany(ELECTION_API);
  const constituencies: HasId[] = await strapi.entityService.findMany(CONSTITUENCY_API);
  const parties: HasId[] = await strapi.entityService.findMany(PARTY_API);
  for (let i = 0; i <= length; i++) {
    const party = faker.helpers.arrayElement(parties);
    // Remove from list to prevent duplicates
    parties.splice(parties.indexOf(party), 1);
    const electionSymbol = faker.number.int({min: 2, max: length + 2}).toString();
    const electionRound = faker.number.int(1);
    const constituency = faker.helpers.arrayElement(constituencies);
    const electionId = elections[0].id;
    await strapi.entityService.create(NOMINATION_API, {
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
  const elections: HasId[] = await strapi.entityService.findMany(ELECTION_API);
  for (const category of mockCategories) {
    const name = fakeLocalized((faker) => faker.word.sample(15).toLocaleUpperCase(), category);
    const shortName = abbreviate(name, {type: 'truncate'});
    const order = mockCategories.indexOf(category);
    const info = fakeLocalized((faker) => faker.lorem.paragraph(3));
    await strapi.entityService.create(QUESTION_CATEGORY_API, {
      data: {
        name,
        shortName,
        order,
        info,
        type: 'opinion',
        elections: [elections[0].id],
        publishedAt: new Date()
      }
    });
  }
  // Category for basic info
  const name = fakeLocalized((_, l) => fakeTranslate(l, 'Basic information'));
  const shortName = abbreviate(name, {type: 'truncate'});
  const order = 0;
  const info = fakeLocalized((faker) => faker.lorem.paragraph(3));
  await strapi.entityService.create(QUESTION_CATEGORY_API, {
    data: {
      name,
      shortName,
      order,
      info,
      type: 'info',
      elections: [elections[0].id],
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
      info: faker.lorem.paragraph(1),
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
      info: faker.lorem.paragraph(1),
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
      info: faker.lorem.paragraph(1),
      settings: {
        type: 'text'
      }
    },
    {
      name: 'Date',
      info: faker.lorem.paragraph(1),
      settings: {
        type: 'date'
      }
    },
    {
      name: 'Boolean',
      info: faker.lorem.paragraph(1),
      settings: {
        type: 'boolean'
      }
    },
    {
      name: 'Gender',
      info: faker.lorem.paragraph(1),
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
      info: faker.lorem.paragraph(1),
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
    }
  ];

  for (const questionType of questionTypes) {
    await strapi.entityService.create(QUESTION_TYPE_API, {
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
  const questionTypes: (HasId & {name: string; settings: QuestionTypeSettings})[] =
    await strapi.entityService.findMany(QUESTION_TYPE_API);
  const likertTypes = questionTypes.filter(
    (questionType) => questionType.settings.type === 'singleChoiceOrdinal'
  );
  const questionCategories: (HasId & {type: 'opinion' | 'info'})[] =
    await strapi.entityService.findMany(QUESTION_CATEGORY_API);
  const opinionCategories = questionCategories.filter((cat) => cat.type === 'opinion');
  const constituencies: HasId[] = await strapi.entityService.findMany(CONSTITUENCY_API);
  const constituencyPctg = options.constituencyPctg ?? 0.1;
  // Create Opinion questions
  for (const question of mockQuestions) {
    const text = fakeLocalized((faker) => faker.lorem.sentence(), question);
    const questionType = faker.helpers.arrayElement(likertTypes);
    const info = fakeLocalized((faker) => faker.lorem.sentences(3));
    const category = faker.helpers.arrayElement(opinionCategories);
    const constituency =
      Math.random() < constituencyPctg ? faker.helpers.arrayElement(constituencies) : null;
    await strapi.entityService.create(QUESTION_API, {
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
      text: 'Mother tongues',
      type: 'Language'
    },
    {
      text: 'Gender',
      type: 'Gender'
    },
    {
      text: 'Unaffiliated',
      type: 'Boolean'
    },
    {
      text: 'Election manifesto',
      type: 'Text'
    }
  ];
  for (const question of infoQuestions) {
    const typeId = questionTypes.filter((qt) => qt.name === question.type)[0]?.id;
    const text = fakeLocalized((_, l) => fakeTranslate(l, question.text));
    const info = fakeLocalized((faker) => faker.lorem.sentences(3));
    await strapi.entityService.create(QUESTION_API, {
      data: {
        text,
        info,
        allowOpen: false,
        questionType: typeId,
        category: infoCategoryId,
        entityType: 'candidate',
        publishedAt: new Date()
      }
    });
  }
}

async function createAnswers(entityType: Omit<EntityType, 'all'>) {
  const entities: HasId[] = await strapi.entityService.findMany(
    entityType === 'candidate' ? CANDIDATE_API : PARTY_API
  );
  const questions: (HasId & {
    allowOpen: boolean;
    entityType?: EntityType;
    questionType: {settings: QuestionTypeSettings};
  })[] = await strapi.entityService.findMany(QUESTION_API, {
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
              value = faker.date.between({from: settings.min, to: settings.max});
            } else {
              value = faker.date.future({refDate: settings.min});
            }
          } else {
            value = faker.date.past({refDate: settings.max});
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
      await strapi.entityService.create(ANSWER_API, {
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
  const authenticated = await strapi.query('plugin::users-permissions.role').findOne({
    where: {
      type: 'authenticated'
    }
  });
  const candidate = await strapi.entityService.findOne(CANDIDATE_API, {});

  await strapi.entityService.create(USER_API, {
    data: {
      username: 'first.last',
      email: 'first.last@example.com',
      password: 'password',
      provider: 'local',
      confirmed: true,
      blocked: false,
      role: authenticated.id,
      candidate: candidate.id
    }
  });

  // Disable registration key for the candidate we chose as they're already registered
  await strapi.query(USER_API).update({
    where: {id: candidate.id},
    data: {
      registrationKey: null
    }
  });
}

function capitaliseFirstLetter(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// Creates relations between original entity and its translations
async function createRelationsForAvailableLocales(endpoint: string, objects: HasId[]) {
  if (objects.length < 2) {
    console.warn(
      `Not enough objects (${objects.length}) passed to createRelationsForAvailableLocales. Skipping localization linking.`
    );
    return;
  }
  const updatedObj = await strapi.query(endpoint).update({
    where: {id: objects[0].id},
    data: {
      localizations: objects.slice(1).map((entry) => entry.id)
    },
    populate: ['localizations']
  });
  await strapi.plugins.i18n.services.localizations.syncLocalizations(updatedObj, {
    model: strapi.getModel(endpoint)
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
            .map((w) => (w === '' ? '' : w.substring(0)))
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

interface HasId {
  id: number | string;
}

interface Locale {
  code: string;
  name: string;
  localeObject: unknown;
  faker: Faker;
}

type LocalizedString = {
  [locale: string]: string;
};

type QuestionTypeSettings =
  | {
      type: 'text';
      notLocalizable?: boolean;
    }
  | {
      type: 'boolean';
    }
  | {
      type: 'number';
      min?: number;
      max?: number;
    }
  | {
      type: 'photo';
    }
  | {
      type: 'date';
      dateType?: 'yearMonthDay' | 'yearMonth' | 'monthDay' | 'month' | 'weekday' | 'hourMinute';
      min?: Date;
      max?: Date;
    }
  | {
      type: 'singleChoiceOrdinal';
      values: Choice[];
    }
  | {
      type: 'singleChoiceCategorical';
      values: Choice[];
    }
  | {
      type: 'multipleChoiceCategorical';
      values: Choice[];
      min?: number;
      max?: number;
    }
  | {
      type: 'preferenceOrder';
      values: Choice[];
      min?: number;
      max?: number;
    };

type Choice = {
  key: number;
  label: LocalizedString;
};

/**
 * The allowed `Answer` values for different `QuestionType`s based on their
 * `settings.type`.
 */
type AnswerValue = {
  text: string | LocalizedString;
  boolean: boolean;
  number: number;
  photo: string;
  date: Date;
  singleChoiceOrdinal: Choice['key'];
  singleChoiceCategorical: Choice['key'];
  multipleChoiceCategorical: Choice['key'][];
  preferenceOrder: Choice['key'][];
};

type EntityType = 'all' | 'candidate' | 'party';
