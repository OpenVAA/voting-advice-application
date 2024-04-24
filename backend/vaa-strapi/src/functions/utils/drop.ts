import {API} from './api';

/**
 * Drops all data in the collections
 */
export async function dropAllCollections() {
  let count = 0;
  for (const api of Object.values(API)) {
    count += (await strapi.db.query(api).deleteMany({})).count;
  }
  return count;
}

/**
 * Deletes all files in the media library.
 * @returns The number of files deleted
 */
export async function deleteAllMedia() {
  const files = await strapi.plugins.upload.services.upload.findMany({});
  for (const file of files) {
    await strapi.plugins.upload.services.upload.remove(file);
  }
  return files.length;
}
