import {API} from './utils/api';
import questionTypes from './defaultData/questionTypes.json';

/**
 * Load default data into Strapi.
 * NB. Currently, only creates default question types.
 */
export async function loadDefaultData() {
  if ((await strapi.entityService.findMany(API.QuestionType)).length > 0) {
    console.info(
      '[loadDefaultData] Question types found - skipping loading of default question types.'
    );
  } else {
    for (const data of questionTypes) await strapi.db.query(API.QuestionType).create({data});
  }
}
