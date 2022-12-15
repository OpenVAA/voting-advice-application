/**
 * Generate mock data using faker
 * Will only run if env variable GENERATE_MOCK_DATA=true is set and
 * NODE_ENV is development
 */

import {faker} from "@faker-js/faker";

export const generateMockData = async () => {
  const isGenerateData = process.env.GENERATE_MOCK_DATA;
  const nodeEnv = process.env.NODE_ENV;
  if (isGenerateData !== 'true' && nodeEnv !== 'development') return;

  console.log('#######################################')
  await dropCollections();
  console.log('dropped collections')
  console.log('#######################################')
  const languages = await createLanguages();
  console.log('inserted languages')
  console.log('#######################################')
  const parties = await createParties(10)
  console.log('inserted parties')
  console.log('#######################################')
  const candidates = await createCandidates(languages, parties, 25)
  console.log('inserted candidates')
  console.log('#######################################')

  // await strapi.entityService.create('api:')

  return '';
}

/**
 * Drops all data in the collections
 */
const dropCollections = async () => {
  await strapi.db.query('api::candidate.candidate').deleteMany({});
  await strapi.db.query('api::candidate-answer.candidate-answer').deleteMany({});
  await strapi.db.query('api::constituency.constituency').deleteMany({});
  await strapi.db.query('api::election.election').deleteMany({});
  await strapi.db.query('api::language.language').deleteMany({});
  await strapi.db.query('api::party.party').deleteMany({});
  await strapi.db.query('api::question.question').deleteMany({});
  // await strapi.db.query('api::topic.topic').deleteMany({});
}

const createLanguages = async (): Promise<any[]> => {
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

const createParties = async (length: number): Promise<any[]> => {
  let parties: Object[] = [];
  for (let i = 0; i <= length; i++) {
    const party = `${capitaliseFirstLetter(faker.word.adjective())} ${capitaliseFirstLetter(faker.word.noun())} ${capitaliseFirstLetter(faker.word.noun())}`
    const matches = party.match(/\b(\w)/g);
    const partyAbbreviation =  matches.join('')
    const mainColor = faker.helpers.arrayElement(['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple'])
    const partyDescription = faker.lorem.sentences(3)
    const partyObj = {
      party,
      partyAbbreviation,
      mainColor,
      partyDescription,
      locale: 'en'
    }
    parties.push(partyObj);
  }
  await strapi.db.query('api::party.party').createMany({
    data: parties
  });

  return await strapi.entityService.findMany('api::party.party', {});
}

const createCandidates = async (languages: any[], parties: any[], length: number) => {
  for (let i = 0; i <= length; i++) {
    const firstName = faker.name.firstName();
    const lastName = faker.name.lastName();
    const politicalExperience = faker.lorem.paragraph(3);
    const candidateId = faker.random.alphaNumeric(10);
    const motherTongue = faker.helpers.arrayElement(languages).id
    const otherLanguages = [faker.helpers.arrayElement(languages).id]
    const mainParty = faker.helpers.arrayElement(parties).id

    const candidateObj = {
      firstName,
      lastName,
      politicalExperience,
      candidateId,
      motherTongue,
      otherLanguages,
      mainParty,
      locale: 'en'
    }

    // Need to insert candidates one by one as the bulk insert does not support relations
    await strapi.entityService.create('api::candidate.candidate', {
      data: candidateObj
    });
  }
}

const capitaliseFirstLetter = (word: string) => {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
