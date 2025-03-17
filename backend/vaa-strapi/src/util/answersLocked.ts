/**
 * Check whether editing of answers is forbidden.
 */
export async function isAnswersLocked(): Promise<boolean> {
  const appSettings = await strapi.documents('api::app-setting.app-setting').findFirst({
    populate: ['access']
  });
  return !!appSettings.access?.answersLocked;
}
