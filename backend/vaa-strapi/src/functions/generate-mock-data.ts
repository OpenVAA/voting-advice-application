/**
 * Generate mock data using faker
 * Will only run if env variable GENERATE_MOCK_DATA=true is set and
 * NODE_ENV is development
 */

import {faker} from '@faker-js/faker';
import {generateMockDataOnInitialise, generateMockDataOnRestart} from '../constants';
import mockQuestions from './mockQuestions.json';

let mainLocale = 'en';
let secondLocale;

export async function generateMockData() {
  if (!(generateMockDataOnInitialise || generateMockDataOnRestart)) {
    return;
  }
  try {
    // Give warning if database is not empty and restart mock data is not enabled
    if (generateMockDataOnInitialise && !generateMockDataOnRestart) {
      let countOfObjects = 0;
      countOfObjects += await strapi.db
        .query('api::candidate.candidate')
        .count({})
        .then((number) => number);
      countOfObjects += await strapi.db
        .query('api::candidate-answer.candidate-answer')
        .count({})
        .then((number) => number);
      countOfObjects += await strapi.db
        .query('api::constituency.constituency')
        .count({})
        .then((number) => number);
      countOfObjects += await strapi.db
        .query('api::election.election')
        .count({})
        .then((number) => number);
      countOfObjects += await strapi.db
        .query('api::language.language')
        .count({})
        .then((number) => number);
      countOfObjects += await strapi.db
        .query('api::party.party')
        .count({})
        .then((number) => number);
      countOfObjects += await strapi.db
        .query('api::question.question')
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
  if (locales.length > 1) {
    mainLocale = locales[0].code; // If main locale is not English, change it here
    secondLocale = locales[1].code;
  }

  console.info('#######################################');
  const languages = await createLanguages();
  console.info('inserted languages');
  console.info('#######################################');
  const election = await createElection();
  console.info('inserted election');
  console.info('#######################################');
  const parties = await createParties(10);
  console.info('inserted parties');
  console.info('#######################################');
  await createCandidates(languages, parties, election, 25);
  console.info('inserted candidates');
  console.info('#######################################');
  await createQuestions();
  console.info('inserted questions');
  console.info('#######################################');
}

/**
 * Drops all data in the collections
 */
async function dropCollections() {
  await strapi.db.query('api::candidate.candidate').deleteMany({});
  await strapi.db.query('api::candidate-answer.candidate-answer').deleteMany({});
  await strapi.db.query('api::constituency.constituency').deleteMany({});
  await strapi.db.query('api::election.election').deleteMany({});
  await strapi.db.query('api::language.language').deleteMany({});
  await strapi.db.query('api::party.party').deleteMany({});
  await strapi.db.query('api::question.question').deleteMany({});
}

async function createLanguages(): Promise<any[]> {
  await strapi.db.query('api::language.language').createMany({
    data: [
      {
        language: 'en',
        locale: mainLocale,
        publishedAt: new Date()
      },
      {
        language: 'es',
        locale: mainLocale,
        publishedAt: new Date()
      }
    ]
  });

  if (secondLocale) {
    await strapi.db.query('api::language.language').createMany({
      data: [
        {
          language: 'en',
          locale: secondLocale,
          publishedAt: new Date()
        },
        {
          language: 'es',
          locale: secondLocale,
          publishedAt: new Date()
        }
      ]
    });

    const languagesMainLocale = await strapi.entityService.findMany('api::language.language', {
      locale: mainLocale
    });
    const languagesSecondLocale = await strapi.entityService.findMany('api::language.language', {
      locale: secondLocale
    });

    languagesMainLocale.forEach(async (language, index) => {
      await createRelationsForLocales(
        'api::language.language',
        languagesSecondLocale[index],
        language
      );
    });
  }

  return await strapi.entityService.findMany('api::language.language', {});
}

async function createElection() {
  const date = faker.date.future();
  const types = ['local', 'presidential', 'congress'];
  const electionType = types[Math.floor(Math.random() * types.length)];
  const electionName = `${date.getFullYear()}  ${faker.address.country()} ${electionType} election`;
  const electionDescription = faker.lorem.paragraph(3);
  const electionDate = date.toISOString().split('T')[0];
  const electionObject = {
    electionName,
    electionDate,
    electionType,
    electionDescription,
    locale: mainLocale
  };

  return await strapi.entityService.create('api::election.election', {
    data: {
      ...electionObject,
      publishedAt: new Date()
    }
  });
}

async function createParties(length: number): Promise<any[]> {
  let parties: Object[] = [];
  let partiesSecondLocale: Object[] = [];

  for (let i = 0; i <= length; i++) {
    const party = `${capitaliseFirstLetter(faker.word.adjective())} ${capitaliseFirstLetter(
      faker.word.noun()
    )} ${capitaliseFirstLetter(faker.word.noun())}`;
    const matches = party.match(/\b(\w)/g);
    const partyAbbreviation = matches.join('');
    const mainColor = faker.helpers.arrayElement([
      'Red',
      'Orange',
      'Yellow',
      'Green',
      'Blue',
      'Purple'
    ]);
    const partyDescription = faker.lorem.sentences(3);
    const partyObj = {
      party,
      partyAbbreviation,
      mainColor,
      partyDescription,
      locale: mainLocale,
      publishedAt: new Date()
    };
    parties.push(partyObj);
  }
  await strapi.db.query('api::party.party').createMany({
    data: parties
  });

  //Create translations
  parties.forEach((party) => {
    const partySecondLocaleObj = {
      ...party,
      partyDescription: faker.lorem.sentences(3),
      locale: secondLocale,
      publishedAt: new Date()
    };
    partiesSecondLocale.push(partySecondLocaleObj);
  });

  await strapi.db.query('api::party.party').createMany({
    data: partiesSecondLocale
  });

  const publishedPartiesEn = await strapi.entityService.findMany('api::party.party', {
    locale: mainLocale
  });
  const publishedPartiesSecondLocale = await strapi.entityService.findMany('api::party.party', {
    locale: secondLocale
  });

  await publishedPartiesSecondLocale.forEach(async (party, index) => {
    await createRelationsForLocales('api::party.party', publishedPartiesEn[index], party);
  });

  return await strapi.entityService.findMany('api::party.party', {});
}

async function createCandidates(languages: any[], parties: any[], election: any, length: number) {
  for (let i = 0; i <= length; i++) {
    const firstName = faker.name.firstName();
    const lastName = faker.name.lastName();
    const politicalExperience = faker.lorem.paragraph(3);
    const candidateId = faker.random.alphaNumeric(10);
    const motherTongues = [faker.helpers.arrayElement(languages).id];
    const otherLanguages = [faker.helpers.arrayElement(languages).id];
    const party = faker.helpers.arrayElement(parties).id;
    const elections = [election.id];

    const candidateObj = {
      firstName,
      lastName,
      politicalExperience,
      candidateId,
      motherTongues,
      otherLanguages,
      party,
      elections,
      locale: mainLocale
    };

    // Need to insert candidates one by one as the bulk insert does not support relations
    const candidateMainLocale = await strapi.entityService.create('api::candidate.candidate', {
      data: {
        ...candidateObj,
        locale: mainLocale,
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
          locale: secondLocale,
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
}

async function createQuestions() {
  // Example questions sourced from Yle 2023 Election Compass

  let questions = [];
  let questionsSecondLocale = [];

  mockQuestions.forEach((question, index) => {
    const questionObj = {
      question: mockQuestions[index].en,
      questionDescription: faker.lorem.sentences(3),
      locale: mainLocale,
      publishedAt: new Date()
    };
    questions.push(questionObj);

    if (secondLocale) {
      const questionFiObj = {
        question: mockQuestions[index].fi,
        questionDescription: faker.lorem.sentences(3),
        locale: secondLocale,
        publishedAt: new Date()
      };
      questionsSecondLocale.push(questionFiObj);
    }
  });

  await strapi.db.query('api::question.question').createMany({
    data: questions
  });

  if (secondLocale) {
    await strapi.db.query('api::question.question').createMany({
      data: questionsSecondLocale
    });

    const publishedQuestions = await strapi.entityService.findMany('api::question.question', {
      locale: mainLocale
    });
    const publishedQuestionsSecondLocale = await strapi.entityService.findMany(
      'api::question.question',
      {
        locale: secondLocale
      }
    );

    await publishedQuestionsSecondLocale.forEach(async (party, index) => {
      await createRelationsForLocales('api::question.question', publishedQuestions[index], party);
    });
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
