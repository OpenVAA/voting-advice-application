/**
 * Generate mock data using faker
 * Will only run if env variable GENERATE_MOCK_DATA=true is set and
 * NODE_ENV is development
 */

import {faker} from '@faker-js/faker';
import {generateMockDataOnInitialise, generateMockDataOnRestart} from '../constants';

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

  console.info('#######################################');
  const languages = await createLanguages();
  console.info('inserted languages');
  console.info('#######################################');
  const parties = await createParties(10);
  console.info('inserted parties');
  console.info('#######################################');
  await createCandidates(languages, parties, 25);
  console.info('inserted candidates');
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
        locale: 'en'
      },
      {
        language: 'es',
        locale: 'en'
      }
    ]
  });

  return await strapi.entityService.findMany('api::language.language', {});
}

async function createParties(length: number): Promise<any[]> {
  let parties: Object[] = [];
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
      locale: 'en',
      publishedAt: new Date()
    };
    parties.push(partyObj);
  }
  await strapi.db.query('api::party.party').createMany({
    data: parties
  });

  return await strapi.entityService.findMany('api::party.party', {});
}

async function createCandidates(languages: any[], parties: any[], length: number) {
  for (let i = 0; i <= length; i++) {
    const firstName = faker.name.firstName();
    const lastName = faker.name.lastName();
    const politicalExperience = faker.lorem.paragraph(3);
    const candidateId = faker.random.alphaNumeric(10);
    const motherTongue = faker.helpers.arrayElement(languages).id;
    const otherLanguages = [faker.helpers.arrayElement(languages).id];
    const party = faker.helpers.arrayElement(parties).id;

    const candidateObj = {
      firstName,
      lastName,
      politicalExperience,
      candidateId,
      motherTongue,
      otherLanguages,
      party,
      locale: 'en'
    };

    // Need to insert candidates one by one as the bulk insert does not support relations
    await strapi.entityService.create('api::candidate.candidate', {
      data: {
        ...candidateObj,
        publishedAt: new Date()
      }
    });
  }
}

function capitaliseFirstLetter(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
