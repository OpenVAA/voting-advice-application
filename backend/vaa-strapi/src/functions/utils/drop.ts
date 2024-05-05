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
 * NB. This cannot be rolled back within a transaction! To do that, use `getAllMedia` and `deleteMedia` in succession.
 * @returns The number of files deleted
 */
export async function deleteAllMedia() {
  return await deleteMedia(await getAllMedia());
}

/**
 * @returns A list of all the media files in the media library.
 */
export async function getAllMedia() {
  return await strapi.plugins.upload.services.upload.findMany({});
}

/**
 * Deletes a list of media files in the media library.
 */
export async function deleteMedia(files: unknown[]) {
  for (const file of files) {
    await strapi.plugins.upload.services.upload.remove(file);
  }
  return files.length;
}
