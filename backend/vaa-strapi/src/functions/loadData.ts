/**
 * A quick-and-dirty tool for loading data into Strapi.
 * NB. This should be refactored and packaged into a function that can be invoked from the Strapi admin UI instead of on restart.
 */

import fs from 'fs';
import mime from 'mime-types';
import Path from 'path';
import type {Common} from '@strapi/strapi';
import {API} from './utils/api';
import {deleteMedia, dropAllCollections, getAllMedia} from './utils/drop';

/**
 * Load data from `folder`, if `AppSettings` do not exist or their `allowOverwrite` property is true. Warning! This will delete all existing data, including media files.
 * The data folder must contain separate json files for each data type: `answers.json`, `appSettings.json`, `candidates.json`, `constituencies.json`, `elections.json`, `infoQuestions.json`, `locales.json`, `nominations.json`, `opinionQuestions.json`, `parties.json`, `questionCategories.json`, `questionTypes.json`.
 * Possible images should be placed in the same folder and referenced by a relative path.
 * The data folder is set by the env variable `LOAD_DATA_ON_INITIALISE_FOLDER` by default.
 * @param folder The folder to load data from
 * @param force Load and clear data regardless of `AppSettings.allowOverwrite`
 */
export async function loadData(folder: string, force = false) {
  console.info(
    '[loadData] ##########################################\n[loadData] Starting data loading...'
  );

  folder = Path.resolve('.', folder);
  console.info(`[loadData] - Path resolved to: ${folder}`);

  if (force) {
    console.info('[loadData] - The force argument is true. Continuing with data loading...');
  } else {
    console.info('[loadData] Getting current AppSettings...');
    const currentSettings = await strapi.entityService.findMany(API.AppSettings);
    if (!currentSettings?.length) {
      console.info('[loadData] - No AppSettings found. Continuing with data loading...');
    } else if (currentSettings.length > 1) {
      console.info(
        `[loadData] - Found more than one AppSettings (${currentSettings.length}). Please remove all but one. Data loading aborted.\n[loadData] ##########################################`
      );
      return false;
    } else if (!currentSettings[0].allowOverwrite) {
      console.info(
        '[loadData] - AppSettings.allowOverwrite is false. Data loading aborted.\n[loadData] ##########################################'
      );
      return false;
    } else {
      console.info(
        '[loadData] - AppSettings.allowOverwrite is true. Continuing with data loading...'
      );
    }
  }

  await strapi.db.transaction(async ({rollback, commit}) => {
    console.info('[loadData] Starting transaction...');

    // Get a list of all media files in the media library which will be deleted at the end of the transaction
    const mediaFiles = await getAllMedia();

    try {
      // Due to a bug in Strapi, we need to ensure this. See: https://github.com/strapi/strapi/issues/16071#issuecomment-1613334063
      console.info('[loadData] Ensuring we have an upload folder...');
      if (!(await strapi.plugin('upload').service('api-upload-folder').getAPIUploadFolder()))
        throw new Error();

      console.info('[loadData] Warning! Deleting all existing collections...');
      await dropAllCollections();

      // TODO: We probably don't need this anymore
      console.info('[loadData] Creating Locales...');
      await createLocales((await loadFile(folder, 'locales')) as {name: string; code: string}[]);

      console.info('[loadData] Creating AppSettings...');
      if (
        !(await createFromFile(folder, 'appSettings', API.AppSettings, [
          'publisherLogo',
          'publisherLogoDark',
          'poster',
          'posterCandidateApp'
        ]))
      )
        throw new Error();

      console.info('[loadData] Creating Elections...');
      if (!(await createFromFile(folder, 'elections', API.Election))) throw new Error();

      console.info('[loadData] Creating Constituencies...');
      if (!(await createFromFile(folder, 'constituencies', API.Constituency))) throw new Error();

      console.info('[loadData] Creating Question Categories...');
      if (!(await createFromFile(folder, 'questionCategories', API.QuestionCategory)))
        throw new Error();

      console.info('[loadData] Creating Question Types...');
      if (!(await createFromFile(folder, 'questionTypes', API.QuestionType))) throw new Error();

      console.info('[loadData] Creating Info Questions...');
      if (!(await createFromFile(folder, 'infoQuestions', API.Question))) throw new Error();

      console.info('[loadData] Creating Opinion Questions...');
      if (!(await createFromFile(folder, 'opinionQuestions', API.Question))) throw new Error();

      console.info('[loadData] Creating Parties...');
      if (!(await createFromFile(folder, 'parties', API.Party, ['logo']))) throw new Error();

      console.info('[loadData] Creating Candidates...');
      if (!(await createFromFile(folder, 'candidates', API.Candidate, ['photo'])))
        throw new Error();

      console.info('[loadData] Creating Nominations...');
      if (!(await createFromFile(folder, 'nominations', API.Nomination))) throw new Error();

      console.info('[loadData] Creating Answers...');
      if (!(await createFromFile(folder, 'answers', API.Answer))) throw new Error();
    } catch (error) {
      console.info('[loadData] - There was an error. Rolling back transaction...');
      await rollback();
      console.info('[loadData] Data loading aborted');
      return;
    }

    console.info('[loadData] - Committing transaction...');
    commit();

    console.info(
      '[loadData] Warning! Deleting all media files that existed before loading data...'
    );
    await deleteMedia(mediaFiles);

    console.info('[loadData] Data loading done!');
  });

  console.info('[loadData] ##########################################');
}

////////////////////////////////////////////////////////////////////////
// FUNCTIONS
////////////////////////////////////////////////////////////////////////

async function createLocales(locales: {code: string; name: string}[]) {
  const strapiLocales = await strapi.plugins.i18n.services.locales.find();
  for (const {code, name} of locales) {
    if (strapiLocales.find((l) => l.code === code)) return;
    await strapi.plugins.i18n.services.locales.create({code, name});
    console.info(`[loadData] Created locale '${code}'`);
  }
}

/**
 * Load a JSON file from disk and create Strapi objects from it.
 * @param folder The import folder
 * @param name The name of the file without extension
 * @param api The api name
 * @param mediaFields The names of the fields that contain media files. These are defined as paths (relative to the import folder) to the corresponding media file.
 * @param publish If `true` the objects will be published with the current time
 * @returns The created Strapi objects if succesfull
 * @throws Never
 */
async function createFromFile(
  folder: string,
  name: string,
  api: Common.UID.ContentType,
  mediaFields?: string[],
  publish = true
): Promise<void | object[]> {
  return new Promise((resolve) => {
    loadFile(folder, name)
      .catch(() => {
        console.error(
          `[loadData] [createFromFile] Error creating '${api}' from file ${name} when reading file`
        );
        resolve();
      })
      .then((data) => {
        if (!data) {
          resolve(undefined);
          return;
        }
        create(folder, api, data as object[], mediaFields, publish)
          .catch((e) => {
            console.error(
              `[loadData] [createFromFile] Error creating '${api}' from file ${name} when creating objects`,
              e
            );
            resolve(undefined);
          })
          .then((result) => resolve(result));
      });
  });
}

/**
 * Load a JSON file from disk.
 * @param folder The import folder
 * @param name The name of the file without extension
 * @returns The JSON data
 * @throws Error
 */
async function loadFile(folder: string, name: string): Promise<object[]> {
  return new Promise((resolve) => {
    const fp = Path.resolve(folder, `${name}.json`);
    if (!fs.existsSync(fp)) {
      console.error(`[loadData] [loadFile] No file such exists: ${fp}`);
      resolve(undefined);
      return;
    }
    try {
      const data = fs.readFileSync(fp);
      resolve(JSON.parse(data.toString()) as object[]);
    } catch (e) {
      console.error(`[loadData] [loadFile] Error loading file: ${fp}`, e);
      resolve(undefined);
    }
  });
}

/**
 * Create Strapi objects from JSON data.
 * @param folder The import folder
 * @param api The api name
 * @param data An array of JSON objects
 * @param mediaFields The names of the fields that contain media files. These are defined as paths (relative to the import folder) to the corresponding media file.
 * @param publish If `true` the objects will be published with the current time
 * @returns The created objects
 * @throws Error
 */
async function create<T extends object>(
  folder,
  api: Common.UID.ContentType,
  data: T[],
  mediaFields?: string[],
  publish = true
): Promise<object[]> {
  const res = [];
  for (const item of data) {
    // Make a copy of item data for file upload purposes
    let itemData = {...item};
    const files = {} as Record<keyof T, FileUploadProps>;
    if (mediaFields?.length) {
      for (const key of mediaFields) {
        if (itemData[key]) {
          try {
            const path = `${itemData[key]}`;
            const name = Path.parse(path).name;
            const fullPath = Path.resolve(folder, path);
            const size = fs.statSync(fullPath).size;
            const type = mime.lookup(fullPath);
            files[key] = {name, path: fullPath, size, type};
          } catch (e) {
            console.error(`[loadData] [create] Error reading media file '${itemData[key]}'`, e);
            throw e;
          }
        }
        delete itemData[key];
      }
    }
    // Create the object
    const obj = await strapi.entityService
      .create(api, {
        data: {...itemData, publishedAt: publish ? new Date() : undefined} as object,
        files
      })
      .catch((e) => {
        console.error(
          `[loadData] [create] Error creating '${api}'`,
          ...(e.details?.errors ?? []),
          itemData
        );
        throw e;
      });
    res.push(obj);
  }
  return res;
}

interface FileUploadProps {
  name: string;
  path: string;
  size: number;
  type: string;
}
