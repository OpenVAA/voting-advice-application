/**
 * Generate mock data using faker.js
 *
 * Fake data can be generated if env variable GENERATE_MOCK_DATA_ON_INITIALISE=true is set.
 * Additionally, GENERATE_MOCK_DATA_ON_RESTART can be used in dev environment for
 * debugging & developing mock data generation functionality.
 */

import {el, faker} from '@faker-js/faker';
import {generateMockDataOnInitialise, generateMockDataOnRestart} from '../constants';
import mockQuestions from './mockQuestions.json';
import {join} from 'path';
import {statSync} from 'fs';

let mainLocale;
let secondLocale;
let thirdLocale;

export async function generateMockData() {
  console.info('env.GENERATE_MOCK_DATA_ON_INITIALISE: ', generateMockDataOnInitialise);
  console.info('env.GENERATE_MOCK_DATA_ON_RESTART: ', generateMockDataOnInitialise);

  if (!(generateMockDataOnInitialise || generateMockDataOnRestart)) {
    return;
  }
  try {
    // Give warning if database is not empty and restart mock data is not enabled
    if (generateMockDataOnInitialise && !generateMockDataOnRestart) {
      let countOfObjects = 0;
      countOfObjects += await strapi.db
        .query('api::election.election')
        .count({})
        .then((number) => number);
      countOfObjects += await strapi.db
        .query('api::election-app-label.election-app-label')
        .count({})
        .then((number) => number);
      countOfObjects += await strapi.db
        .query('api::party.party')
        .count({})
        .then((number) => number);
      countOfObjects += await strapi.db
        .query('api::candidate.candidate')
        .count({})
        .then((number) => number);
      countOfObjects += await strapi.db
        .query('api::constituency.constituency')
        .count({})
        .then((number) => number);
      countOfObjects += await strapi.db
        .query('api::category.category')
        .count({})
        .then((number) => number);
      countOfObjects += await strapi.db
        .query('api::question-type.question-type')
        .count({})
        .then((number) => number);
      countOfObjects += await strapi.db
        .query('api::question.question')
        .count({})
        .then((number) => number);
      countOfObjects += await strapi.db
        .query('api::answer.answer')
        .count({})
        .then((number) => number);
      countOfObjects += await strapi.db
        .query('api::language.language')
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
  const locales = await strapi.plugins.i18n.services.locales.find();

  const englishLocale = locales.find((locale) => locale.code === 'en');
  const finnishLocale = locales.find((locale) => locale.code === 'fi');
  const spanishLocale = locales.find((locale) => locale.code === 'es-CO');

  if (englishLocale) {
    mainLocale = englishLocale;
  } else {
    console.info('#######################################');
    console.info('creating english locale');
    mainLocale = await strapi.plugins.i18n.services.locales.create({
      code: 'en',
      name: 'English (en)'
    });
  }

  if (finnishLocale) {
    secondLocale = finnishLocale;
  } else {
    console.info('#######################################');
    console.info('creating finnish locale');
    secondLocale = await strapi.plugins.i18n.services.locales.create({
      code: 'fi',
      name: 'Finnish (fi)'
    });
  }

  if (spanishLocale) {
    thirdLocale = spanishLocale;
  } else {
    console.info('#######################################');
    console.info('creating spanish locale');
    thirdLocale = await strapi.plugins.i18n.services.locales.create({
      code: 'es-CO',
      name: 'Spanish (Colombia) (es-CO)'
    });
  }

  console.info('#######################################');
  const languages = await createLanguages();
  console.info('inserted languages');
  console.info('#######################################');
  const electionAppLabel = await createElectionAppLabel();
  console.info('inserted election app labels');
  console.info('#######################################');
  const election = await createElection(electionAppLabel);
  console.info('inserted elections');
  console.info('#######################################');
  const parties = await createParties(10, election);
  console.info('inserted parties');
  console.info('#######################################');
  const candidates = await createCandidates(languages, parties, election, 25);
  console.info('inserted candidates');
  console.info('#######################################');
  await createConstituencies(20, [election]);
  console.info('inserted constituencies');
  console.info('#######################################');
  await createCategories(6, [election]);
  console.info('inserted categories');
  console.info('#######################################');
  await createQuestionTypes();
  console.info('inserted question types');
  console.info('#######################################');
  const questions = await createQuestions(election.id);
  console.info('inserted questions');
  console.info('#######################################');
  await createAnswers(questions, candidates);
  console.info('inserted answers');
  console.info('#######################################');
}

/**
 * Drops all data in the collections
 */
async function dropCollections() {
  await strapi.db.query('api::candidate.candidate').deleteMany({});
  await strapi.db.query('api::answer.answer').deleteMany({});
  await strapi.db.query('api::category.category').deleteMany({});
  await strapi.db.query('api::constituency.constituency').deleteMany({});
  await strapi.db.query('api::election-app-label.election-app-label').deleteMany({});
  await strapi.db.query('api::election.election').deleteMany({});
  await strapi.db.query('api::language.language').deleteMany({});
  await strapi.db.query('api::party.party').deleteMany({});
  await strapi.db.query('api::question.question').deleteMany({});
  await strapi.db.query('api::question-type.question-type').deleteMany({});
}

async function createLanguages(): Promise<any[]> {
  await strapi.db.query('api::language.language').createMany({
    data: [
      {
        name: 'English',
        localisationCode: 'en',
        locale: mainLocale.code,
        publishedAt: new Date()
      },
      {
        name: 'Finnish',
        localisationCode: 'fi',
        locale: mainLocale.code,
        publishedAt: new Date()
      },
      {
        name: 'Spanish',
        localisationCode: 'es-CO',
        locale: mainLocale.code,
        publishedAt: new Date()
      }
    ]
  });

  if (secondLocale) {
    await strapi.db.query('api::language.language').createMany({
      data: [
        {
          name: 'Ingles',
          locale: secondLocale.code,
          publishedAt: new Date()
        },
        {
          name: 'Finnish',
          locale: secondLocale.code,
          publishedAt: new Date()
        },
        {
          name: 'Español',
          locale: secondLocale.code,
          publishedAt: new Date()
        }
      ]
    });

    const languagesMainLocale = await strapi.entityService.findMany('api::language.language', {
      locale: mainLocale.code
    });
    const languagesSecondLocale = await strapi.entityService.findMany('api::language.language', {
      locale: secondLocale.code
    });

    languagesMainLocale.forEach(async (language, index) => {
      await createRelationsForLocales(
        'api::language.language',
        languagesSecondLocale[index],
        language
      );
    });
  }

  return await strapi.entityService.findMany('api::language.language', {
    locale: mainLocale.code
  });
}

async function createElectionAppLabel() {
  const name = faker.database.engine();
  const appTitle = 'Election App';
  const actionLabels = {
    startButton: 'Start Finding The Best Candidates!',
    electionInfo: 'Information about the elections',
    howItWorks: 'How does this app work?',
    help: 'Help',
    searchMunicipality: 'Your Municipality or Town',
    startQuestions: 'Start the Questionnaire',
    selectCategories: 'Select Categories',
    previous: 'Previous',
    answerCategoryQuestions: 'Answer {{NUMBERQUESTIONS}} Questions',
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
  const viewTexts = {};
  const electionAppLabelObject = {
    name,
    appTitle,
    actionLabels,
    viewTexts,
    locale: mainLocale.code
  };

  return await strapi.entityService.create('api::election-app-label.election-app-label', {
    data: {
      ...electionAppLabelObject,
      publishedAt: new Date()
    }
  });
}

async function createElection(AppLabel: any) {
  const date = faker.date.future();
  const organiser = faker.location.country();
  const types = ['local', 'presidential', 'congress'];
  const electionType = types[Math.floor(Math.random() * types.length)];
  const name = `${date.getFullYear()}  ${faker.location.country()} ${electionType} election`;
  const info = faker.lorem.paragraph(3);
  const electionStartDate = date.toISOString().split('T')[0];
  const electionDate = date.toISOString().split('T')[0];
  const electionObject = {
    name,
    organiser,
    electionStartDate,
    electionDate,
    electionType,
    info,
    locale: mainLocale.code,
    electionAppLabel: AppLabel.id
  };

  return await strapi.entityService.create('api::election.election', {
    data: {
      ...electionObject,
      publishedAt: new Date()
    }
  });
}

async function createParties(length: number, election: any): Promise<any[]> {
  let parties: Object[] = [];
  let partiesSecondLocale: Object[] = [];

  for (let i = 0; i <= length; i++) {
    const name = `${capitaliseFirstLetter(faker.word.adjective())} ${capitaliseFirstLetter(
      faker.word.noun()
    )} ${capitaliseFirstLetter(faker.word.noun())}`;
    const matches = name.match(/\b(\w)/g);
    const shortName = matches.join('');
    const mainColor = faker.helpers.arrayElement([
      'Red',
      'Orange',
      'Yellow',
      'Green',
      'Blue',
      'Purple'
    ]);
    const info = faker.lorem.sentences(3);
    const elections = [election.id];

    const partyObj = {
      name,
      shortName,
      mainColor,
      info,
      locale: mainLocale.code,
      elections,
      publishedAt: new Date()
    };
    await strapi.db.query('api::party.party').create({
      data: partyObj
    });
    parties.push(partyObj);
  }

  //Create translations
  parties.forEach((party) => {
    const partySecondLocaleObj = {
      ...party,
      info: faker.lorem.sentences(3),
      locale: secondLocale.code,
      publishedAt: new Date()
    };
    partiesSecondLocale.push(partySecondLocaleObj);
  });

  await strapi.db.query('api::party.party').createMany({
    data: partiesSecondLocale
  });

  const publishedPartiesEn = await strapi.entityService.findMany('api::party.party', {
    locale: mainLocale.code
  });
  const publishedPartiesSecondLocale = await strapi.entityService.findMany('api::party.party', {
    locale: secondLocale.code
  });

  await publishedPartiesSecondLocale.forEach(async (party, index) => {
    await createRelationsForLocales('api::party.party', publishedPartiesEn[index], party);
  });

  return await strapi.entityService.findMany('api::party.party', {});
}

async function createCandidates(languages: any[], parties: any[], election: any, length: number) {
  for (let i = 0; i <= length; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const politicalExperience = faker.lorem.paragraph(3);
    const candidateNumber = faker.number.int(9999).toString();
    const motherTongues = [faker.helpers.arrayElement(languages).id];
    const otherLanguages = [faker.helpers.arrayElement(languages).id];
    const party = faker.helpers.arrayElement(parties).id;
    const elections = [election.id];

    const candidateObj = {
      firstName,
      lastName,
      politicalExperience,
      candidateNumber,
      motherTongues,
      otherLanguages,
      party,
      elections,
      locale: mainLocale.code
    };

    // Need to insert candidates one by one as the bulk insert does not support relations
    const candidateMainLocale = await strapi.entityService.create('api::candidate.candidate', {
      data: {
        ...candidateObj,
        locale: mainLocale.code,
        publishedAt: new Date()
      }
    });

    if (secondLocale) {
      // Create second localisation as an example
      const candidateSecondLocale = await strapi.entityService.create('api::candidate.candidate', {
        data: {
          ...candidateObj,
          // Insert some new lorem ipsum to make it look like translated
          politicalExperience: faker.lorem.paragraph(3),
          locale: secondLocale.code,
          publishedAt: new Date()
        }
      });

      // Update localisation relations
      await createRelationsForLocales(
        'api::candidate.candidate',
        candidateMainLocale,
        candidateSecondLocale
      );
    }
  }
  return await strapi.entityService.findMany('api::candidate.candidate', {locale: mainLocale.code});
}

async function createConstituencies(numberOfConstituencies: number, fakeElections: any[]) {
  for (let i = 0; i <= numberOfConstituencies; i++) {
    const name = faker.location.state();
    const shortName = faker.location.state({abbreviated: true});
    const type = i < 2 ? 'ethnic' : 'geographic';
    const info = faker.lorem.paragraph(3);
    const elections = [faker.helpers.arrayElement(fakeElections).id];
    const constituencyObj = {
      name,
      shortName,
      type,
      info,
      elections,
      locale: mainLocale.code,
      publishedAt: new Date()
    };
    await strapi.entityService.create('api::constituency.constituency', {
      data: {...constituencyObj}
    });
  }
}

async function createCategories(numberOfCategories: number, fakeElections: any[]) {
  for (let i = 0; i <= numberOfCategories; i++) {
    const name = faker.word.sample(15);
    const shortName = name.substring(0, 3);
    const order = i;
    const info = faker.lorem.paragraph(3);
    const elections = [faker.helpers.arrayElement(fakeElections).id];
    const categoryObj = {
      name,
      shortName,
      order,
      info,
      elections,
      locale: mainLocale.code,
      publishedAt: new Date()
    };
    await strapi.entityService.create('api::category.category', {
      data: {...categoryObj}
    });
  }
}

async function createQuestionTypes() {
  const questionTypes = [
    {
      name: '4-likert scale',
      info: faker.lorem.paragraph(1),
      settings: {
        data: [
          {
            key: 1,
            label: 'Disagree strongly'
          },
          {
            key: 2,
            label: 'Disagree'
          },
          {
            key: 3,
            label: 'Agree'
          },
          {
            key: 4,
            label: 'Agree strongly'
          }
        ]
      },
      locale: mainLocale.code,
      publishedAt: new Date()
    },
    {
      name: '5-likert scale',
      info: faker.lorem.paragraph(1),
      settings: {
        data: [
          {
            key: 1,
            label: 'Disagree strongly'
          },
          {
            key: 2,
            label: 'Disagree'
          },
          {
            key: 3,
            label: 'Neutral'
          },
          {
            key: 4,
            label: 'Agree'
          },
          {
            key: 5,
            label: 'Agree strongly'
          }
        ]
      },
      locale: mainLocale.code,
      publishedAt: new Date()
    },
    {
      name: '6-likert scale',
      info: faker.lorem.paragraph(1),
      settings: {
        data: [
          {
            key: 1,
            label: 'Disagree very strongly'
          },
          {
            key: 2,
            label: 'Disagree strongly'
          },
          {
            key: 3,
            label: 'Disagree'
          },
          {
            key: 4,
            label: 'Agree'
          },
          {
            key: 4,
            label: 'Agree strongly'
          },
          {
            key: 5,
            label: 'Agree very strongly'
          }
        ]
      },
      locale: mainLocale.code,
      publishedAt: new Date()
    }
  ];
  await strapi.db.query('api::question-type.question-type').createMany({
    data: questionTypes
  });
}

/**
 * Returns a single question in the correct requested language.
 * If no language match is found generates a lipsum sentence.
 * @param index
 * @param locale
 */
function getSingleQuestion(index: number, locale: {name: string; code: string}) {
  if (locale.code === 'en') {
    return mockQuestions[index].en;
  } else if (locale.code === 'fi') {
    return mockQuestions[index].fi;
  } else if (locale.code === 'es-CO') {
    return mockQuestions[index]['es-CO'];
  } else {
    return faker.lorem.sentence();
  }
}

async function createQuestions(electionId: any) {
  let questions = [];
  let questionsSecondLocale = [];

  const questionTypes: any[] = await strapi.entityService.findMany(
    'api::question-type.question-type',
    {
      locale: mainLocale.code
    }
  );

  const categories: any[] = await strapi.entityService.findMany('api::category.category', {
    locale: mainLocale.code
  });

  let questionObj = {};
  let questionFiObj = {};

  // Example questions sourced from Yle 2023 Election Compass
  for (let index = 0; index < mockQuestions.length; index++) {
    // mockQuestions.forEach(async (question, index) => {
    const text = getSingleQuestion(index, mainLocale);
    const questionType = faker.helpers.arrayElement(questionTypes).id;
    const info = faker.lorem.sentences(3);
    const category = faker.helpers.arrayElement(categories).id;
    const election = electionId;
    const locale = mainLocale.code;
    const publishedAt = new Date();

    questionObj = {
      text,
      questionType,
      info,
      category,
      election,
      locale,
      publishedAt
    };

    questions.push(questionObj);

    if (secondLocale) {
      questionFiObj = {
        text: getSingleQuestion(index, secondLocale),
        category,
        election,
        questionType,
        info: faker.lorem.sentences(3),
        locale: secondLocale.code,
        publishedAt: new Date()
      };
      questionsSecondLocale.push(questionFiObj);
    }

    // Need to insert candidates one by one as the bulk insert does not support relations
    const questionMainLocale = await strapi.entityService.create('api::question.question', {
      data: {
        ...questionObj
      }
    });

    if (secondLocale) {
      // Create second localisation as an example
      const questionSecondLocale = await strapi.entityService.create('api::question.question', {
        data: {
          ...questionFiObj,
          // Insert some new lorem ipsum to make it look like translated
          politicalExperience: faker.lorem.paragraph(3),
          locale: secondLocale.code,
          publishedAt: new Date()
        }
      });

      // Update localisation relations
      await createRelationsForLocales(
        'api::candidate.candidate',
        questionMainLocale,
        questionSecondLocale
      );
    }
  }
  return await strapi.entityService.findMany('api::question.question', {
    locale: mainLocale.code,
    populate: {questionType: true}
  });
}

async function createAnswers(questions: any[], candidates: any[]) {
  for (const c of candidates) {
    const candidateId = c.id;
    for (const q of questions) {
      const questionTypeSettings: any[] = q.questionType.settings.data;
      const answer = {data: {key: faker.helpers.arrayElement(questionTypeSettings).key}};
      const candidate = candidateId;
      const question = q.id;
      const locale = mainLocale.code;
      const publishedAt = new Date();

      const answerObj = {
        answer,
        candidate,
        question,
        locale,
        publishedAt
      };

      await strapi.entityService.create('api::answer.answer', {
        data: {...answerObj}
      });
    }
  }
}

function capitaliseFirstLetter(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// Creates relations between original entity and its translation
async function createRelationsForLocales(
  query: string,
  originalObject: any,
  translatedObject: any
) {
  // Update localisation relations
  await strapi.query(query).update({
    where: {id: originalObject.id},
    data: {
      localizations: [translatedObject]
    }
  });

  await strapi.query(query).update({
    where: {id: translatedObject.id},
    data: {
      localizations: [originalObject]
    }
  });
}
