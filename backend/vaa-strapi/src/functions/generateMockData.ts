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

import crypto from 'crypto';
import {faker, fakerES, fakerFI} from '@faker-js/faker';
import {generateMockDataOnInitialise, generateMockDataOnRestart} from '../constants';
import mockQuestions from './mockQuestions.json';
import mockCategories from './mockCategories.json';

const ELECTION_API = 'api::election.election';
const ELECTION_APP_LABEL_API = 'api::election-app-label.election-app-label';
const CONSTITUENCY_API = 'api::constituency.constituency';
const PARTY_API = 'api::party.party';
const CANDIDATE_API = 'api::candidate.candidate';
const NOMINATION_API = 'api::nomination.nomination';
const LANGUAGE_API = 'api::language.language';
const QUESTION_API = 'api::question.question';
const QUESTION_TYPE_API = 'api::question-type.question-type';
const QUESTION_CATEGORY_API = 'api::question-category.question-category';
const ANSWER_API = 'api::answer.answer';
const USER_API = 'plugin::users-permissions.user';

let mainLocale;
let secondLocale;
let thirdLocale;

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
  console.info('inserting languages ...');
  await createLanguages();
  console.info('Done!');
  console.info('#######################################');
  console.info('inserting election app labels...');
  await createElectionAppLabel();
  console.info('Done!');
  console.info('#######################################');
  console.info('inserting elections');
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
  await createQuestionTypes();
  console.info('Done!');
  console.info('#######################################');
  console.info('inserting questions');
  await createQuestions();
  console.info('Done!');
  console.info('#######################################');
  console.info('inserting candidate answers');
  await createCandidateAnswers();
  console.info('Done!');
  console.info('#######################################');
  console.info('inserting party answers');
  await createPartyAnswers();
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
  await strapi.db.query(LANGUAGE_API).deleteMany({});
  await strapi.db.query(QUESTION_API).deleteMany({});
  await strapi.db.query(QUESTION_TYPE_API).deleteMany({});
  await strapi.db.query(USER_API).deleteMany({});
}

async function createLanguages() {
  await strapi.db.query(LANGUAGE_API).createMany({
    data: [
      {
        name: 'English',
        localisationCode: mainLocale.code,
        locale: mainLocale.code,
        publishedAt: new Date()
      },
      {
        name: 'Finnish',
        localisationCode: secondLocale.code,
        locale: mainLocale.code,
        publishedAt: new Date()
      },
      {
        name: 'Spanish',
        localisationCode: thirdLocale.code,
        locale: mainLocale.code,
        publishedAt: new Date()
      }
    ]
  });
  await strapi.db.query(LANGUAGE_API).createMany({
    data: [
      {
        name: 'Englanti',
        localisationCode: mainLocale.code,
        locale: secondLocale.code,
        publishedAt: new Date()
      },
      {
        name: 'Suomi',
        localisationCode: secondLocale.code,
        locale: secondLocale.code,
        publishedAt: new Date()
      },
      {
        name: 'Espanja',
        localisationCode: thirdLocale.code,
        locale: secondLocale.code,
        publishedAt: new Date()
      }
    ]
  });

  await strapi.db.query(LANGUAGE_API).createMany({
    data: [
      {
        name: 'Ingles',
        localisationCode: mainLocale.code,
        locale: thirdLocale.code,
        publishedAt: new Date()
      },
      {
        name: 'Finlandes',
        localisationCode: secondLocale.code,
        locale: thirdLocale.code,
        publishedAt: new Date()
      },
      {
        name: 'Español',
        localisationCode: thirdLocale.code,
        locale: thirdLocale.code,
        publishedAt: new Date()
      }
    ]
  });

  const languagesMainLocale = await strapi.entityService.findMany(LANGUAGE_API, {
    locale: mainLocale.code
  });
  const languagesSecondLocale = await strapi.entityService.findMany(LANGUAGE_API, {
    locale: secondLocale.code
  });

  const languagesThirdLocale = await strapi.entityService.findMany(LANGUAGE_API, {
    locale: thirdLocale.code
  });

  languagesMainLocale.forEach(async (mainLocale, index) => {
    await createRelationsForAvailableLocales(LANGUAGE_API, mainLocale, [
      languagesSecondLocale[index],
      languagesThirdLocale[index]
    ]);
  });
}

async function createElectionAppLabel() {
  const name = faker.music.songName();
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
    viewTexts
  };

  const electionAppLabelsMainLocale = await strapi.entityService.create(ELECTION_APP_LABEL_API, {
    data: {
      ...electionAppLabelObject,
      locale: mainLocale.code,
      publishedAt: new Date()
    }
  });

  const electionAppLabelsSecondLocaleObject = {
    ...electionAppLabelObject,
    name: fakerFI.music.songName(),
    info: faker.lorem.sentences(3)
  };

  const electionAppLabelsSecondLocale = await strapi.entityService.create(ELECTION_APP_LABEL_API, {
    data: {
      ...electionAppLabelsSecondLocaleObject,
      locale: secondLocale.code,
      publishedAt: new Date()
    }
  });

  const electionAppLabelThirdLocaleObject = {
    ...electionAppLabelObject,
    name: fakerES.music.songName(),
    info: faker.lorem.sentences(3)
  };

  const electionAppLabelsThirdLocale = await strapi.entityService.create(ELECTION_APP_LABEL_API, {
    data: {
      ...electionAppLabelThirdLocaleObject,
      locale: thirdLocale.code,
      publishedAt: new Date()
    }
  });

  await createRelationsForAvailableLocales(ELECTION_APP_LABEL_API, electionAppLabelsMainLocale, [
    electionAppLabelsSecondLocale,
    electionAppLabelsThirdLocale
  ]);
}

async function createElection() {
  let AppLabel = await strapi.db.query(ELECTION_APP_LABEL_API).findOne({
    where: {
      locale: mainLocale.code
    }
  });

  const date = faker.date.future();
  const organiser = faker.location.country();
  const types = ['local', 'presidential', 'congress'];
  const electionType = types[Math.floor(Math.random() * types.length)];
  const name = `${date.getFullYear()}  ${faker.location.country()} ${electionType} election`;
  const shortName = name;
  const info = faker.lorem.paragraph(3);
  const electionStartDate = date.toISOString().split('T')[0];
  const electionDate = date.toISOString().split('T')[0];
  const electionObject = {
    name,
    shortName,
    organiser,
    electionStartDate,
    electionDate,
    electionType,
    info,
    electionAppLabel: AppLabel.id
  };

  const electionMainLocale = await strapi.entityService.create(ELECTION_API, {
    data: {
      ...electionObject,
      locale: mainLocale.code,
      publishedAt: new Date()
    }
  });

  AppLabel = await strapi.db.query(ELECTION_APP_LABEL_API).findOne({
    where: {
      locale: secondLocale.code
    }
  });

  const electionSecondObject = {
    ...electionObject,
    organiser: fakerFI.location.country(),
    info: faker.lorem.sentences(3)
  };

  const electionSecondLocale = await strapi.entityService.create(ELECTION_API, {
    data: {
      ...electionSecondObject,
      electionAppLabel: AppLabel.id,
      locale: secondLocale.code,
      publishedAt: new Date()
    }
  });

  AppLabel = await strapi.db.query(ELECTION_APP_LABEL_API).findOne({
    where: {
      locale: thirdLocale.code
    }
  });

  const electionThridLocale = {
    ...electionObject,
    organiser: fakerES.location.country(),
    info: faker.lorem.sentences(3)
  };

  const electionThirdLocale = await strapi.entityService.create(ELECTION_API, {
    data: {
      ...electionThridLocale,
      electionAppLabel: AppLabel.id,
      locale: thirdLocale.code,
      publishedAt: new Date()
    }
  });

  await createRelationsForAvailableLocales(ELECTION_API, electionMainLocale, [
    electionSecondLocale,
    electionThirdLocale
  ]);
}

async function createParties(length: number) {
  for (let i = 0; i <= length; i++) {
    let name = `${capitaliseFirstLetter(faker.word.adjective())} ${capitaliseFirstLetter(
      faker.word.noun()
    )} ${capitaliseFirstLetter(faker.word.noun())}`;
    const matches = name.match(/\b(\w)/g);
    const shortName = matches.join('');
    const partyColor = faker.helpers.arrayElement([
      'Red',
      'Orange',
      'Yellow',
      'Green',
      'Blue',
      'Purple'
    ]);

    const partyObj = {
      name,
      shortName,
      partyColor,
      info: faker.lorem.sentences(3),
      locale: mainLocale.code,
      publishedAt: new Date()
    };
    const partyMainLocale = await strapi.entityService.create(PARTY_API, {
      data: partyObj
    });

    const partySecondLocaleObj = {
      ...partyObj,
      info: faker.lorem.sentences(3),
      locale: secondLocale.code,
      publishedAt: new Date()
    };

    const partySecondLocale = await strapi.entityService.create(PARTY_API, {
      data: partySecondLocaleObj
    });

    const partyThirdLocaleObj = {
      ...partyObj,
      info: faker.lorem.sentences(3),
      locale: thirdLocale.code,
      publishedAt: new Date()
    };

    const partyThrdLocale = await strapi.entityService.create(PARTY_API, {
      data: partyThirdLocaleObj
    });

    await createRelationsForAvailableLocales(PARTY_API, partyMainLocale, [
      partySecondLocale,
      partyThrdLocale
    ]);
  }
}

async function createCandidates(length: number) {
  const languages = await strapi.entityService.findMany(LANGUAGE_API, {
    filters: {
      locale: mainLocale.code
    },
    populate: ['localizations']
  });

  const partiesMainLocale = await strapi.entityService.findMany(PARTY_API, {
    filters: {
      locale: mainLocale.code
    },
    populate: ['localizations']
  });

  for (let i = 0; i <= length; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const politicalExperience = faker.lorem.paragraph(3);
    const motherTongue: any = faker.helpers.arrayElement(languages);
    const otherLanguage: any = faker.helpers.arrayElement(languages);
    let party: any = faker.helpers.arrayElement(partiesMainLocale);

    const candidateObj = {
      firstName,
      lastName,
      politicalExperience,
      motherTongues: [motherTongue.id],
      otherLanguages: [otherLanguage.id],
      party: party.id
    };

    // Need to insert candidates one by one as the bulk insert does not support relations
    const candidateMainLocale = await strapi.entityService.create(CANDIDATE_API, {
      data: {
        ...candidateObj,
        email: faker.internet.exampleEmail(),
        registrationKey: crypto.randomUUID(),
        locale: mainLocale.code,
        publishedAt: new Date()
      }
    });

    const partyLocalizations = party.localizations;
    const motherTongueLocalizations = motherTongue.localizations;
    const otherLanguageLocalizations = otherLanguage.localizations;

    const candidateSecondLocale = await strapi.entityService.create(CANDIDATE_API, {
      data: {
        ...candidateObj,
        firstName: fakerFI.person.firstName(),
        lastName: fakerFI.person.lastName(),
        party: partyLocalizations.find((localization) => localization.locale === secondLocale.code)
          .id,
        politicalExperience: faker.lorem.paragraph(3),
        motherTongues: [
          motherTongueLocalizations.find(
            (localization) => localization.locale === secondLocale.code
          ).id
        ],
        otherLanguages: [
          otherLanguageLocalizations.find(
            (localization) => localization.locale === secondLocale.code
          ).id
        ],
        locale: secondLocale.code,
        publishedAt: new Date()
      }
    });

    const candidateThirdLocale = await strapi.entityService.create(CANDIDATE_API, {
      data: {
        ...candidateObj,
        firstName: fakerES.person.firstName(),
        lastName: fakerES.person.lastName(),
        party: partyLocalizations.find((localization) => localization.locale === thirdLocale.code)
          .id,
        politicalExperience: faker.lorem.paragraph(3),
        motherTongues: [
          motherTongueLocalizations.find((localization) => localization.locale === thirdLocale.code)
            .id
        ],
        otherLanguages: [
          otherLanguageLocalizations.find(
            (localization) => localization.locale === thirdLocale.code
          ).id
        ],
        locale: thirdLocale.code,
        publishedAt: new Date()
      }
    });

    await createRelationsForAvailableLocales(CANDIDATE_API, candidateMainLocale, [
      candidateSecondLocale,
      candidateThirdLocale
    ]);
  }
}

async function createConstituencies(numberOfConstituencies: number) {
  const electionsMainLocale = await strapi.entityService.findMany(ELECTION_API, {
    filters: {
      locale: mainLocale.code
    },
    populate: ['localizations']
  });

  for (let i = 0; i <= numberOfConstituencies; i++) {
    const name = faker.location.state();
    const shortName = faker.location.state({abbreviated: true});
    const type = i < 2 ? 'ethnic' : 'geographic';
    const info = faker.lorem.paragraph(3);
    const election: any = faker.helpers.arrayElement(electionsMainLocale);

    const constituencyObj = {
      name,
      shortName,
      type,
      info,
      elections: [election.id],
      locale: mainLocale.code,
      publishedAt: new Date()
    };
    const constituencyMainLocale = await strapi.entityService.create(CONSTITUENCY_API, {
      data: {...constituencyObj}
    });

    const localizations = election.localizations;

    const cnstituencySecondLocale = await strapi.entityService.create(CONSTITUENCY_API, {
      data: {
        ...constituencyObj,
        name: fakerFI.location.state(),
        shortName: fakerFI.location.state({abbreviated: true}),
        elections: [
          localizations.find((localization) => localization.locale === secondLocale.code).id
        ],
        locale: secondLocale.code,
        publishedAt: new Date()
      }
    });

    const constituencyThirdLocale = await strapi.entityService.create(CONSTITUENCY_API, {
      data: {
        ...constituencyObj,
        name: fakerES.location.state(),
        shortName: fakerES.location.state({abbreviated: true}),
        elections: [
          localizations.find((localization) => localization.locale === thirdLocale.code).id
        ],
        locale: thirdLocale.code,
        publishedAt: new Date()
      }
    });

    await createRelationsForAvailableLocales(CONSTITUENCY_API, constituencyMainLocale, [
      cnstituencySecondLocale,
      constituencyThirdLocale
    ]);
  }
}

async function createCandidateNominations(length: number) {
  const electionsMainLocale = await strapi.entityService.findMany(ELECTION_API, {
    filters: {
      locale: mainLocale.code
    },
    populate: ['localizations']
  });

  const constituenciesMainLocale = await strapi.entityService.findMany(CONSTITUENCY_API, {
    filters: {
      locale: mainLocale.code
    },
    populate: ['localizations']
  });

  const candidatesMainLocale = await strapi.entityService.findMany(CANDIDATE_API, {
    filters: {
      locale: mainLocale.code
    },
    populate: ['localizations', 'party']
  });

  for (let i = 0; i <= length; i++) {
    const c: any = faker.helpers.arrayElement(candidatesMainLocale);
    candidatesMainLocale.splice(candidatesMainLocale.indexOf(c), 1);
    const electionSymbol = faker.number.int(9999).toString();
    const electionRound = faker.number.int(1);
    const candidateId = c.id;
    const constituency: any = faker.helpers.arrayElement(constituenciesMainLocale);
    const electionId = electionsMainLocale[0].id;

    const partymainLocale = await strapi.db.query(PARTY_API).findOne({
      where: {
        id: c.party.id,
        locale: mainLocale.code
      },
      populate: ['localizations']
    });

    const nominationObj = {
      electionSymbol,
      electionRound,
      candidate: candidateId,
      party: c.party.id,
      election: electionId,
      constituency: constituency.id,
      locale: mainLocale.code
    };

    const nominationMainLocale = await strapi.entityService.create(NOMINATION_API, {
      data: {
        ...nominationObj,
        locale: mainLocale.code,
        publishedAt: new Date()
      }
    });

    const electionLocalizations = electionsMainLocale[0].localizations;
    const candidateLocalizations = c.localizations;
    const partyLocalizations = partymainLocale.localizations;
    const constituencyLocalizations = constituency.localizations;

    const nominationSecondLocale = await strapi.entityService.create(NOMINATION_API, {
      data: {
        ...nominationObj,
        election: electionLocalizations.find(
          (localization) => localization.locale === secondLocale.code
        ).id,
        candidate: candidateLocalizations.find(
          (localization) => localization.locale === secondLocale.code
        ).id,
        party: partyLocalizations.find((localization) => localization.locale === secondLocale.code)
          .id,
        constituency: constituencyLocalizations.find(
          (localization) => localization.locale === secondLocale.code
        ).id,
        locale: secondLocale.code,
        publishedAt: new Date()
      }
    });

    const nominationThirdLocale = await strapi.entityService.create(NOMINATION_API, {
      data: {
        ...nominationObj,
        election: electionLocalizations.find(
          (localization) => localization.locale === thirdLocale.code
        ).id,
        candidate: candidateLocalizations.find(
          (localization) => localization.locale === thirdLocale.code
        ).id,
        party: partyLocalizations.find((localization) => localization.locale === thirdLocale.code)
          .id,
        constituency: constituencyLocalizations.find(
          (localization) => localization.locale === thirdLocale.code
        ).id,
        locale: thirdLocale.code,
        publishedAt: new Date()
      }
    });

    await createRelationsForAvailableLocales(NOMINATION_API, nominationMainLocale, [
      nominationSecondLocale,
      nominationThirdLocale
    ]);
  }
}

async function createPartyNominations(length: number) {
  const electionsMainLocale = await strapi.entityService.findMany(ELECTION_API, {
    filters: {
      locale: mainLocale.code
    },
    populate: ['localizations']
  });

  const constituenciesMainLocale = await strapi.entityService.findMany(CONSTITUENCY_API, {
    filters: {
      locale: mainLocale.code
    },
    populate: ['localizations']
  });

  const partyMainLocale = await strapi.entityService.findMany(PARTY_API, {
    filters: {
      locale: mainLocale.code
    },
    populate: ['localizations']
  });

  for (let i = 0; i <= length; i++) {
    const electionSymbol = faker.number.int(9999).toString();
    const electionRound = faker.number.int(1);
    const party: any = faker.helpers.arrayElement(partyMainLocale);
    const constituency: any = faker.helpers.arrayElement(constituenciesMainLocale);
    const electionId = electionsMainLocale[0].id;

    const nominationObj = {
      electionSymbol,
      electionRound,
      party: party.id,
      election: electionId,
      constituency: constituency.id
    };

    // Need to insert candidates one by one as the bulk insert does not support relations
    const nominationMainLocale = await strapi.entityService.create(NOMINATION_API, {
      data: {
        ...nominationObj,
        locale: mainLocale.code,
        publishedAt: new Date()
      }
    });

    const electionLocalizations = electionsMainLocale[0].localizations;
    const partyLocalizations = party.localizations;
    const constituencyLocalizations = constituency.localizations;

    const nominationSecondLocale = await strapi.entityService.create(NOMINATION_API, {
      data: {
        ...nominationObj,
        election: electionLocalizations.find(
          (localization) => localization.locale === secondLocale.code
        ).id,
        party: partyLocalizations.find((localization) => localization.locale === secondLocale.code)
          .id,
        constituency: constituencyLocalizations.find(
          (localization) => localization.locale === secondLocale.code
        ).id,
        locale: secondLocale.code,
        publishedAt: new Date()
      }
    });

    const nominationThirdLocale = await strapi.entityService.create(NOMINATION_API, {
      data: {
        ...nominationObj,
        election: electionLocalizations.find(
          (localization) => localization.locale === thirdLocale.code
        ).id,
        party: partyLocalizations.find((localization) => localization.locale === thirdLocale.code)
          .id,
        constituency: constituencyLocalizations.find(
          (localization) => localization.locale === thirdLocale.code
        ).id,
        locale: thirdLocale.code,
        publishedAt: new Date()
      }
    });

    await createRelationsForAvailableLocales(NOMINATION_API, nominationMainLocale, [
      nominationSecondLocale,
      nominationThirdLocale
    ]);
  }
}

async function createQuestionCategories() {
  const electionsMainLocale = await strapi.entityService.findMany(ELECTION_API, {
    filters: {
      locale: mainLocale.code
    },
    populate: ['localizations']
  });

  let numberOfCategories = mockCategories.length;
  for (let i = 0; i < numberOfCategories; i++) {
    const name = mockCategories[i][mainLocale.code]
      ? mockCategories[i][mainLocale.code]
      : faker.word.sample(15);
    const shortName = name.substring(0, 3);
    const order = i;
    const info = faker.lorem.paragraph(3);
    const categoryObj = {
      name,
      shortName,
      order,
      info,
      elections: [electionsMainLocale[0].id]
    };
    const questionCategoryMainLocale = await strapi.entityService.create(QUESTION_CATEGORY_API, {
      data: {...categoryObj, locale: mainLocale.code, publishedAt: new Date()}
    });

    const electionLocalizations = electionsMainLocale[0].localizations;

    const secondLocaleCategoryName = mockCategories[i][secondLocale.code]
      ? mockCategories[i][secondLocale.code]
      : faker.word.sample(15);
    const questionCategorySecondLocale = await strapi.entityService.create(QUESTION_CATEGORY_API, {
      data: {
        ...categoryObj,
        name: secondLocaleCategoryName,
        shortName: secondLocaleCategoryName.substring(0, 3),
        elections: [
          electionLocalizations.find((localization) => localization.locale === secondLocale.code).id
        ],
        locale: secondLocale.code,
        publishedAt: new Date()
      }
    });
    const thirdLocaleCategoryName = mockCategories[i][thirdLocale.code]
      ? mockCategories[i][thirdLocale.code]
      : faker.word.sample(15);
    const questionCategoryThirdLocale = await strapi.entityService.create(QUESTION_CATEGORY_API, {
      data: {
        ...categoryObj,
        name: thirdLocaleCategoryName,
        shortName: thirdLocaleCategoryName.substring(0, 3),
        elections: [
          electionLocalizations.find((localization) => localization.locale === thirdLocale.code).id
        ],
        locale: thirdLocale.code,
        publishedAt: new Date()
      }
    });

    await createRelationsForAvailableLocales(QUESTION_CATEGORY_API, questionCategoryMainLocale, [
      questionCategorySecondLocale,
      questionCategoryThirdLocale
    ]);
  }
}

async function createQuestionTypes() {
  const questionTypes = [
    {
      name: '4-likert scale',
      info: faker.lorem.paragraph(1),
      settings: {
        type: 'Likert',
        values: [
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
      }
    },
    {
      name: '5-likert scale',
      info: faker.lorem.paragraph(1),
      settings: {
        type: 'Likert',
        values: [
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
      }
    },
    {
      name: '6-likert scale',
      info: faker.lorem.paragraph(1),
      settings: {
        type: 'Likert',
        values: [
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
            key: 5,
            label: 'Agree strongly'
          },
          {
            key: 6,
            label: 'Agree very strongly'
          }
        ]
      }
    }
  ];

  for (const questionType of questionTypes) {
    const questionTypeMainLocale = await strapi.entityService.create(QUESTION_TYPE_API, {
      data: {
        ...questionType,
        locale: mainLocale.code,
        publishedAt: new Date()
      }
    });

    const questionTypeSecondLocale = await strapi.entityService.create(QUESTION_TYPE_API, {
      data: {
        ...questionType,
        locale: secondLocale.code,
        publishedAt: new Date()
      }
    });
    const questionTypeThirdLocale = await strapi.entityService.create(QUESTION_TYPE_API, {
      data: {
        ...questionType,
        locale: thirdLocale.code,
        publishedAt: new Date()
      }
    });

    await createRelationsForAvailableLocales(QUESTION_TYPE_API, questionTypeMainLocale, [
      questionTypeSecondLocale,
      questionTypeThirdLocale
    ]);
  }
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

async function createQuestions() {
  let questions = [];
  let questionsSecondLocale = [];

  const questionTypes = await strapi.entityService.findMany(QUESTION_TYPE_API, {
    filters: {
      locale: mainLocale.code
    },
    populate: ['localizations']
  });

  const questionCategories = await strapi.entityService.findMany(QUESTION_CATEGORY_API, {
    filters: {
      locale: mainLocale.code
    },
    populate: ['localizations']
  });

  // Example questions sourced from Yle 2023 Election Compass
  for (let index = 0; index < mockQuestions.length; index++) {
    const text = getSingleQuestion(index, mainLocale);
    const questionType: any = faker.helpers.arrayElement(questionTypes);
    const info = faker.lorem.sentences(3);
    const questionCategory: any = faker.helpers.arrayElement(questionCategories);

    const questionEn = {
      text,
      info,
      questionType: questionType.id,
      questionCategory: questionCategory.id
    };

    const questionMainLocale = await strapi.entityService.create(QUESTION_API, {
      data: {
        ...questionEn,
        locale: mainLocale.code,
        publishedAt: new Date()
      }
    });

    questions.push(questionEn);

    const questionFi = {
      text: getSingleQuestion(index, secondLocale),
      questionCategory: questionCategory.localizations.find(
        (localization) => localization.locale === secondLocale.code
      ).id,
      questionType: questionType.localizations.find(
        (localization) => localization.locale === secondLocale.code
      ).id,
      info: faker.lorem.sentences(3)
    };
    questionsSecondLocale.push(questionFi);

    // Create second localisation as an example
    const questionSecondLocale = await strapi.entityService.create(QUESTION_API, {
      data: {
        ...questionFi,
        locale: secondLocale.code,
        publishedAt: new Date()
      }
    });

    const questionEs = {
      text: getSingleQuestion(index, thirdLocale),
      questionCategory: questionCategory.localizations.find(
        (localization) => localization.locale === thirdLocale.code
      ).id,
      questionType: questionType.localizations.find(
        (localization) => localization.locale === thirdLocale.code
      ).id,
      info: faker.lorem.sentences(3)
    };

    const questionThirdLocale = await strapi.entityService.create(QUESTION_API, {
      data: {
        ...questionEs,
        locale: thirdLocale.code,
        publishedAt: new Date()
      }
    });

    await createRelationsForAvailableLocales(QUESTION_API, questionMainLocale, [
      questionSecondLocale,
      questionThirdLocale
    ]);
  }
}

async function createCandidateAnswers() {
  const candidates = await strapi.entityService.findMany(CANDIDATE_API, {
    filters: {
      locale: mainLocale.code
    },
    populate: ['localizations']
  });

  const questions = await strapi.entityService.findMany(QUESTION_API, {
    filters: {
      locale: mainLocale.code
    },
    populate: ['localizations', 'questionType']
  });

  for (const candidate of candidates) {
    for (const question of questions) {
      const questionTypeSettings: any[] = question.questionType.settings.values;
      const answer = {key: faker.helpers.arrayElement(questionTypeSettings).key};
      const openAnswer = faker.lorem.sentence();

      const answerObj = {
        answer,
        openAnswer,
        candidate: candidate.id,
        question: question.id
      };

      const answerMainLocale = await strapi.entityService.create(ANSWER_API, {
        data: {
          ...answerObj,
          locale: mainLocale.code,
          publishedAt: new Date()
        }
      });

      const candidateLocalizations = candidate.localizations;
      const questionLocalizations = question.localizations;

      const answerSecondLocale = await strapi.entityService.create(ANSWER_API, {
        data: {
          ...answerObj,
          candidate: candidateLocalizations.find(
            (localization) => localization.locale === secondLocale.code
          ).id,
          question: questionLocalizations.find(
            (localization) => localization.locale === secondLocale.code
          ).id,
          locale: secondLocale.code,
          publishedAt: new Date()
        }
      });

      const answerThirdLocale = await strapi.entityService.create(ANSWER_API, {
        data: {
          ...answerObj,
          candidate: candidateLocalizations.find(
            (localization) => localization.locale === thirdLocale.code
          ).id,
          question: questionLocalizations.find(
            (localization) => localization.locale === thirdLocale.code
          ).id,
          locale: thirdLocale.code,
          publishedAt: new Date()
        }
      });

      await createRelationsForAvailableLocales(ANSWER_API, answerMainLocale, [
        answerSecondLocale,
        answerThirdLocale
      ]);
    }
  }
}

async function createPartyAnswers() {
  const parties = await strapi.entityService.findMany(PARTY_API, {
    filters: {
      locale: mainLocale.code
    },
    populate: ['localizations']
  });

  const questions = await strapi.entityService.findMany(QUESTION_API, {
    filters: {
      locale: mainLocale.code
    },
    populate: ['localizations', 'questionType']
  });

  for (const party of parties) {
    for (const question of questions) {
      const questionTypeSettings: any[] = question.questionType.settings.values;
      const answer = {key: faker.helpers.arrayElement(questionTypeSettings).key};
      const openAnswer = faker.lorem.sentence();

      const answerObj = {
        answer,
        openAnswer,
        party: party.id,
        question: question.id
      };

      const answerMainLocale = await strapi.entityService.create(ANSWER_API, {
        data: {
          ...answerObj,
          locale: mainLocale.code,
          publishedAt: new Date()
        }
      });

      const partyLocalizations = party.localizations;
      const questionLocalizations = question.localizations;

      const answerSecondLocale = await strapi.entityService.create(ANSWER_API, {
        data: {
          ...answerObj,
          party: partyLocalizations.find(
            (localization) => localization.locale === secondLocale.code
          ).id,
          question: questionLocalizations.find(
            (localization) => localization.locale === secondLocale.code
          ).id,
          locale: secondLocale.code,
          publishedAt: new Date()
        }
      });

      const answerThirdLocale = await strapi.entityService.create(ANSWER_API, {
        data: {
          ...answerObj,
          party: partyLocalizations.find((localization) => localization.locale === thirdLocale.code)
            .id,
          question: questionLocalizations.find(
            (localization) => localization.locale === thirdLocale.code
          ).id,
          locale: thirdLocale.code,
          publishedAt: new Date()
        }
      });

      await createRelationsForAvailableLocales(ANSWER_API, answerMainLocale, [
        answerSecondLocale,
        answerThirdLocale
      ]);
    }
  }
}

function capitaliseFirstLetter(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// Creates relations between original entity and its translations
async function createRelationsForAvailableLocales(
  endpoint: string,
  originalObject: any,
  translatedObject: any[]
) {
  const updatedObj = await strapi.query(endpoint).update({
    where: {id: originalObject.id},
    data: {
      localizations: translatedObject.map((entry) => entry.id)
    },
    populate: ['localizations']
  });

  await strapi.plugins.i18n.services.localizations.syncLocalizations(updatedObj, {
    model: strapi.getModel(endpoint)
  });
}
