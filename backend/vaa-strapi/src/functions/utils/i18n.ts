import { HasId } from './data.type';
import type { Common } from '@strapi/strapi';

/** Creates relations between original entity and its translations */
export async function createRelationsForAvailableLocales(endpoint: Common.UID.Schema, objects: Array<HasId>) {
  if (objects.length < 2) {
    console.warn(
      `Not enough objects (${objects.length}) passed to createRelationsForAvailableLocales. Skipping localization linking.`
    );
    return;
  }
  const updatedObj = await strapi.db.query(endpoint).update({
    where: { id: objects[0].id },
    data: {
      localizations: objects.slice(1).map((entry) => entry.id)
    },
    populate: ['localizations']
  });
  await strapi.plugins.i18n.services.localizations.syncLocalizations(updatedObj, {
    model: strapi.getModel(endpoint)
  });
}
