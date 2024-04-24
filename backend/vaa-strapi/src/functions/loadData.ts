import fs from 'fs';
import mime from 'mime-types';
import Path from 'path';
import type {Common} from '@strapi/strapi';
import {API} from './utils/api';
import {deleteAllMedia, dropAllCollections} from './utils/drop';
import {createRelationsForAvailableLocales} from './utils/i18n';
import type {HasId} from './utils/data.type';

/**
 * Load data from `folder`, if the database does not contain an Election. Warning! This will delete all existing data, including media files.
 * The data folder must contain separate json files for each data type: `answers.json `, `appLabels.json `, `appSettings.json `, `candidates.json `, `constituencies.json `, `elections.json `, `infoQuestions.json `, `locales.json `, `nominations.json `, `opinionQuestions.json `, `parties.json `, `questionCategories.json `, `questionTypes.json`.
 * Possible images should be placed in the same folder and referenced by a relative path.
 * @param folder The folder to load data from (relative to `/backend/vaa-strapi`)
 * @param force Load and clear data even if the database already contains an Election
 * @returns
 */
export async function loadData(folder: string, force = false) {
  console.info('##########################################');
  console.info('Starting data loading...');

  if (!folder.startsWith('./')) {
    folder = Path.resolve('.', folder);
    console.warn(`Folder doesn't start with './', converted to: ${folder}`);
  }

  if ((await strapi.entityService.findMany(API.Election)).length) {
    if (force) {
      console.warn('Warning! The database has one or more Elections but the force flag is used.');
    } else {
      console.info(
        'The database has one or more Elections and data will not be loaded. Use the force flag to overwrite existing data.'
      );
      console.info('##########################################');
      return;
    }
  } else {
    console.info('No existing elections found.');
  }

  console.warn('Warning! Deleting all existing collections...');
  await dropAllCollections();
  console.warn('Warning! Deleting all existing  media files...');
  await deleteAllMedia();

  console.info('Creating Locales...');
  await createLocales((await loadFile(folder, 'locales')) as {name: string; code: string}[]);

  console.info('Creating AppSettings...');
  if (
    !(await createFromFile(folder, 'appSettings', API.AppSettings, [
      'publisherLogo',
      'publisherLogoDark',
      'poster',
      'posterCandidateApp'
    ]))
  )
    return false;

  console.info('Creating AppLabels...');
  const appLabels = await createFromFile(folder, 'appLabels', API.AppLabel);
  if (!appLabels) return false;
  await createRelationsForAvailableLocales(API.AppLabel, appLabels as HasId[]);

  console.info('Creating Elections...');
  if (!(await createFromFile(folder, 'elections', API.Election))) return false;

  console.info('Creating Constituencies...');
  if (!(await createFromFile(folder, 'constituencies', API.Constituency))) return false;

  console.info('Creating Question Categories...');
  if (!(await createFromFile(folder, 'questionCategories', API.QuestionCategory))) return false;

  console.info('Creating Question Types...');
  if (!(await createFromFile(folder, 'questionTypes', API.QuestionType))) return false;

  console.info('Creating Info Questions...');
  if (!(await createFromFile(folder, 'infoQuestions', API.Question))) return false;

  console.info('Creating Opinion Questions...');
  if (!(await createFromFile(folder, 'opinionQuestions', API.Question))) return false;

  console.info('Creating Parties...');
  if (!(await createFromFile(folder, 'parties', API.Party, ['logo']))) return false;

  console.info('Creating Candidates...');
  if (!(await createFromFile(folder, 'candidates', API.Candidate, ['photo']))) return false;

  console.info('Creating Nominations...');
  if (!(await createFromFile(folder, 'nominations', API.Nomination))) return false;

  console.info('Creating Answers...');
  if (!(await createFromFile(folder, 'answers', API.Answer))) return false;

  console.info('Data loading done!');
  console.info('##########################################');

  return true;
}

////////////////////////////////////////////////////////////////////////
// FUNCTIONS
////////////////////////////////////////////////////////////////////////

async function createLocales(locales: {code: string; name: string}[]) {
  const strapiLocales = await strapi.plugins.i18n.services.locales.find();
  for (const {code, name} of locales) {
    if (strapiLocales.find((l) => l.code === code)) return;
    await strapi.plugins.i18n.services.locales.create({code, name});
    console.info(`Created locale '${code}'`);
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
          `createFromFile: Error creating '${api}' from file ${name} when reading file`
        );
        resolve();
      })
      .then((data) => {
        create(folder, api, data as object[], mediaFields, publish)
          .catch((e) => {
            console.error(
              `createFromFile: Error creating '${api}' from file ${name} when creating objects`
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
    import(Path.resolve(folder, `${name}.json`))
      .catch((e) => {
        console.error(`loadFile: Error loading file with name '${name}'`, e);
        throw e;
      })
      .then((res) => resolve(res.default));
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
            console.error(`create: Error reading media file '${itemData[key]}'`, e);
            throw e;
          }
        }
        delete itemData[key];
      }
    }
    // Create the object
    // Due to a bug in Strapi, we need to await the creation of at least the first object with media files. See: https://github.com/strapi/strapi/issues/16071#issuecomment-1613334063
    const obj = await strapi.entityService
      .create(api, {
        data: {...itemData, publishedAt: publish ? new Date() : undefined} as object,
        files
      })
      .catch((e) => {
        console.error(`create: Error creating '${api}'`, ...(e.details?.errors ?? []), itemData);
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
