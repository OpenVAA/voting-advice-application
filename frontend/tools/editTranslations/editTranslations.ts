import path, {resolve} from 'path';
import fs from 'fs';
import {readdir} from 'fs/promises';

/**
 * Export current translations to a TSV file where you can easily reorganise translations under new keys and into new files as well as edit translations for all languages. Import the TSV back to generate the JSON translation files.
 *
 * ### NB
 *
 * `replaceKeys` will only replace old translation keys with new ones in Svelte files in the frontend src folder. This could be easily extended to also cover keys used in the e2e tests in /tests.
 *
 * ### TSV Format
 *
 * The file must have a header row.
 * Columns:
 * - `key`: Current translation key
 * - `new_key`: New translation key
 * - `new_file`: Optional filename without suffix to store the key in. The filename must match the start of the key. This will default to the first part of `new_key`. Define this only if the filename contains a dot.
 * - [locales]: The JSON-encoded translations for each locale
 *
 * ### Usage
 *
 * - Export current translations to a TSV file:
 *   `node --no-warnings=ExperimentalWarning --loader ts-node/esm ./editTranslations.ts --export path/to/file.tsv`
 * - Import translations from a TSV file and output JSON translation files into the `OUTPUT_JSON` folder:
 *   `node --no-warnings=ExperimentalWarning --loader ts-node/esm ./editTranslations.ts --import path/to/file.tsv`
 * - Import translations from a TSV file and replace old translation keys with new ones in Svelte files in the frontend src folder. Note that the regexes used will not find dynamically constructed keys, and you should thus check the results manually. The script will output a list of all of the old keys that were not replaced even a single time.
 *   `node --no-warnings=ExperimentalWarning --loader ts-node/esm ./editTranslations.ts --replaceKeys path/to/file.tsv`
 */

const TRANSL_DIR = path.join('..', '..', 'src', 'lib', 'i18n', 'translations');
const OUTPUT_DIR = path.join('.', 'output');
const OUTPUT_TRANS = path.join(OUTPUT_DIR, 'translations.tsv');
const OUTPUT_JSON = path.join(OUTPUT_DIR, 'import');
const INPUT_DIR = path.join('..', '..', 'src');
const COL_SEP = '\t';
const MISSING_VALUE = 'MISSING';
const TRANSL_FUNCTION = 't';
const ENCODING = 'utf8';

await main();

async function main() {
  console.info('Starting translation utility');

  const exportIndex = process.argv.indexOf('--export');
  const importIndex = process.argv.indexOf('--import');
  const replaceIndex = process.argv.indexOf('--replaceKeys');
  if (exportIndex > -1) {
    const exportPath = process.argv[exportIndex + 1] ?? OUTPUT_TRANS;
    exportCurrentTranslations(exportPath);
  } else if (importIndex > -1) {
    const importPath = process.argv[importIndex + 1] ?? OUTPUT_TRANS;
    importTranslations(importPath);
  } else if (replaceIndex > -1) {
    const importPath = process.argv[replaceIndex + 1] ?? OUTPUT_TRANS;
    await replaceKeys(importPath);
  } else {
    console.error('Please provide a valid flag. See the source for details.');
    process.exit(1);
  }
  process.exit(0);
}

/**
 * Try to replace old translation keys with new ones in Svelte files in the frontend src folder.
 * @returns A promise with a list of the old-new key pairs that were not found
 */
async function replaceKeys(file: string): Promise<void> {
  console.info(`Importing translations from ${file} for replacing keys`);
  const {translations} = readTsvTranslations(file, true);

  const keyPairs: {[oldKey: string]: string} = {};
  for (const keys of Object.values(translations)) {
    for (const {newKey, oldKeys} of Object.values(keys)) {
      for (const oldKey of oldKeys) {
        if (newKey === oldKey) continue;
        keyPairs[oldKey] = newKey;
      }
    }
  }

  /** A map of old key regexes to new keys */
  const replacements: Array<{regex: RegExp; newKey: string}> = Object.entries(keyPairs).map(
    ([oldKey, newKey]) => ({
      regex: new RegExp(
        `(?<=(?:\\$|\\b)${TRANSL_FUNCTION}\\s*\\(\\s*(['"]))${escapeRegExp(oldKey)}(?=\\1)`,
        'gm'
      ),
      newKey
    })
  );

  const found = new Set<string>();
  let changed = 0;
  // These nested for loops could perhaps be parallelized by using Promises
  for await (const file of getFiles(INPUT_DIR)) {
    if (!file.endsWith('.svelte')) continue;
    const content = fs.readFileSync(file, ENCODING);
    let updated = content;
    for (const {regex, newKey} of replacements) {
      // This is a bit of a clunky way to check if a replacement was made. We only make the copy if the key hasn't been found yet
      let current: string | undefined;
      if (!found.has(newKey)) current = updated;
      updated = updated.replace(regex, newKey);
      if (current != null && updated !== current) found.add(newKey);
    }
    if (updated !== content) {
      fs.writeFileSync(file, updated, ENCODING);
      changed++;
    }
  }
  Object.entries(keyPairs)
    .filter(([, newKey]) => !found.has(newKey))
    .forEach(([oldKey, newKey]) => console.info(`No matches found for: ${oldKey} => ${newKey}`));
  console.info(`Replacing keys done. Rewrote ${changed} files`);
}

/**
 * Import translations and output new json files
 */
function importTranslations(file: string): void {
  console.info(`Importing translations from ${file}`);
  const {locales, translations} = readTsvTranslations(file);

  /** Stored contents to write so that the whole transaction can be cancelled by errors */
  const fileContents: {[path: string]: string} = {};

  for (const locale of locales) {
    for (const [file, keys] of Object.entries(translations)) {
      const output: Translations = {};
      for (const [key, data] of Object.entries(keys)) {
        let current: Translations = output;
        const keyParts = key.split('.');
        const {values} = data;
        for (let i = 0; i < keyParts.length; i++) {
          const part = keyParts[i];
          if (i === keyParts.length - 1) {
            if (part in current)
              throw new Error(
                `Error storing ${file}.${key} for locale ${locale}: does this key have both a value and subkeys?`
              );
            current[part] = values[locale as keyof typeof values] ?? MISSING_VALUE;
            break;
          }
          current[part] ??= {};
          if (typeof current[part] !== 'object')
            throw new Error(
              `Error storing ${file}.${key} for locale ${locale}: does the parent of this key have a value?`
            );
          current = current[part];
        }
      }
      const outputPath = path.join(OUTPUT_JSON, locale, `${file}.json`);
      fileContents[outputPath] = JSON.stringify(output, null, 2);
    }
  }

  // Write the files
  for (const [outputPath, content] of Object.entries(fileContents)) writeFile(outputPath, content);
  console.info(
    `Wrote ${Object.keys(fileContents).length} translation files to folder ${OUTPUT_JSON}`
  );

  // Write the index listing the keys
  const files = Object.keys(translations).map((f) => `  '${f}',`);
  const keyList = `export const keys = [\n${files.join('\n')}\n];`;
  writeFile(path.join(OUTPUT_JSON, 'keysForIndex.ts'), keyList);
}

/**
 * Read the translations stored in a TSV file and return an object with translations.
 * @param file
 */
function readTsvTranslations(
  file: string,
  silent = false
): {
  locales: Array<string>;
  translations: ImportedTranslations;
} {
  const translations: ImportedTranslations = {};
  const tsv = fs.readFileSync(file, ENCODING).toString();

  let locales: Array<string> | undefined;

  for (const row of tsv.split('\n')) {
    if (row.trim() === '') continue;
    const items = row
      .split(COL_SEP)
      .map((s) => s.replace(/^"|"$/g, ''))
      .map((s) => s.replace(/\r/g, ''));
    if (!locales) {
      if (items[0] !== 'key' || items[1] !== 'new_key' || items[2] !== 'new_file')
        throw new Error(`Invalid header row: ${row}`);
      locales = items.slice(3);
      continue;
    }
    const oldKey = items[0];
    const newKey = items[1];
    if ([oldKey, newKey].some((s) => !s)) throw new Error(`Invalid row: ${row}`);

    const newFile = items[2] || newKey.split('.')[0];
    if (!newKey.startsWith(`${newFile}.`))
      throw new Error(`New_key does not start with new_file: ${row}`);

    const subkey = newKey.slice(newFile.length + 1);
    const values = Object.fromEntries(locales.map((l, i) => [l, items[i + 3]]));

    translations[newFile] ??= {};
    if (subkey in translations[newFile]) {
      if (!silent)
        console.warn(`Merging duplicate key ${newKey}, using the first encountered values`);
      translations[newFile][subkey].oldKeys.push(oldKey);
      continue;
    }
    translations[newFile][subkey] = {newKey, oldKeys: [oldKey], values};
  }

  if (!locales) throw new Error('No locales found in TSV file. Maybe it was empty?');

  return {locales, translations};
}

/**
 * Export current translations into a TSV file with columns for: `key`, `new_key`, `new_file`, and each locale.
 * The `new_key` and `new_file` columns are used when importing the translations back.
 * @param file
 */
function exportCurrentTranslations(file: string): void {
  const {filePrefixes, translations} = readAllTranslations();
  const multiPartPrefixes = filePrefixes.filter((p) => p.includes('.'));
  const locales = Object.keys(translations);
  const flatTranslations = Object.fromEntries(
    locales.map((l) => [l, Object.fromEntries(flattenKeys(translations[l]))])
  );
  let tsv =
    ['key', 'new_key', 'new_file', ...locales].map((s) => JSON.stringify(s)).join(COL_SEP) + '\n';
  for (const key in flatTranslations[locales[0]]) {
    tsv +=
      [
        key,
        key,
        findFilePrefix(key),
        ...locales.map((l) => flatTranslations[l][key] ?? MISSING_VALUE)
      ]
        .map((s) => JSON.stringify(s))
        .join(COL_SEP) + '\n';
  }
  writeFile(file, tsv);
  console.info(`Wrote translations to ${file}`);

  /** Finds the file prefix for the key if the prefix is a multi-part prefix */
  function findFilePrefix(key: string): string {
    for (const prefix of multiPartPrefixes) {
      if (key.startsWith(prefix)) return prefix;
    }
    return '';
  }
}

/**
 * Read all translation files and return them in an object with locales as the top keys.
 */
function readAllTranslations(): {
  filePrefixes: Array<string>;
  translations: Translations;
} {
  const filePrefixes = new Array<string>();
  const translations: Translations = {};
  const locales = fs
    .readdirSync(TRANSL_DIR)
    .filter((name) => fs.lstatSync(path.join(TRANSL_DIR, name)).isDirectory());
  for (const locale of locales) {
    const localeTranslations: Translations = {};
    const files = fs.readdirSync(path.join(TRANSL_DIR, locale));
    for (const file of files) {
      const prefix = file.replace(/\.json$/, '');
      if (locale === locales[0]) filePrefixes.push(prefix);
      localeTranslations[prefix] = readJsonTranslations(locale, file);
    }
    translations[locale] = localeTranslations;
  }
  return {filePrefixes, translations};
}

/**
 * A recursive function which returns sorted array of flattened keys with their associated values.
 * @example `{a: 'abc', b: {c: 'def'}}` becomes `[['a', 'abc'], ['b.c', 'def']]`
 */
function flattenKeys(obj: Translations | string, prefix?: string): Array<[string, string]> {
  const res = Array<[string, string]>();
  prefix = prefix ? `${prefix}.` : '';
  for (const [key, value] of Object.entries(obj)) {
    const newKey = `${prefix}${key}`;
    if (typeof value === 'object') res.push(...flattenKeys(value, newKey));
    else res.push([newKey, value]);
  }
  return res;
}

/**
 * Reads contents of translation file
 */
function readJsonTranslations(locale: string, filename: string): Translations {
  const fp = path.join(TRANSL_DIR, locale, filename);
  return JSON.parse(fs.readFileSync(fp, ENCODING).toString());
}

/**
 * Return a recursive async generator yielding file paths in @param {string} dir.
 * (By qwtel)[https://stackoverflow.com/a/45130990/13409631]
 */
async function* getFiles(dir: string): AsyncGenerator<string> {
  const dirents = await readdir(dir, {withFileTypes: true});
  for (const dirent of dirents) {
    const res = resolve(dir, dirent.name);
    if (dirent.isDirectory()) {
      yield* getFiles(res);
    } else {
      yield res;
    }
  }
}

/**
 * Write contents to file and create any missing directories.
 */
function writeFile(file: string, content: string): void {
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, content, ENCODING);
}

/**
 * Escape regex special characters in a string.
 * Source: https://stackoverflow.com/a/6969486/13409631
 */
function escapeRegExp(regex: string): string {
  return regex.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

type Translations = {
  [key: string]: Translations | string;
};

type ImportedTranslations = {
  /**
   * The name of the file without suffix in which to save the translation.
   */
  [filename: string]: {
    /** The new translation key, without the filename */
    [key: string]: {
      /** The new key with the filename */
      newKey: string;
      /** The old key with the filename */
      oldKeys: Array<string>;
      /** The translated strings for each locale */
      values: {
        [locale: string]: string;
      };
    };
  };
};
