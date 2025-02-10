import questionTypes from './defaultData/questionTypes.json';

/**
 * Load default data into Strapi.
 * NB. Currently, only creates default question types.
 */
export async function loadDefaultData() {
  if ((await strapi.documents('api::question-type.question-type').findMany()).length > 0) {
    console.info('[loadDefaultData] Question types found - skipping loading of default question types.');
  } else {
    for (const data of questionTypes) await strapi.documents('api::question-type.question-type').create({ data });
  }
}
