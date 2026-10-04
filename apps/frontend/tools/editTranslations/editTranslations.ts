import fs from 'fs';
import { readdir } from 'fs/promises';
import path, { resolve } from 'path';
import { fileURLToPath } from 'url';

/**
 * Export the Paraglide message catalogs (`apps/frontend/messages/{locale}/*.json`) to a TSV file where you can easily reorganise translations under new keys and into new files as well as edit translations for all locales. Import the TSV back to generate message files in the same format.
 *
 * ### Message format
 *
 * Each message file holds a single top-level key equal to its namespace, the filename without `.json`, so `messages/en/adminApp.common.json` is `{ "adminApp.common": { … } }`. The keys in the TSV are the full dotted paths including that namespace. Inlang variant messages (arrays, or objects carrying `declarations`, `selectors` or `match`) are single leaves: their whole JSON value is one cell.
 *
 * ### NB
 *
 * `replaceKeys` will only replace old translation keys with new ones in Svelte files in the frontend src folder. This could be easily extended to also cover keys used in the e2e tests in /tests.
 *
 * ### TSV Format
 *
 * The file must have a header row. Every cell is JSON-encoded; a cell that is not valid JSON is read as plain text with any surrounding double quotes removed.
 * Columns:
 * - `key`: Current translation key
 * - `new_key`: New translation key
 * - `new_file`: Optional filename without suffix to store the key in. The filename must match the start of the key. This will default to the first part of `new_key`. Define this only if the filename contains a dot.
 * - [locales]: The JSON-encoded translations for each locale
 *
 * ### Usage
 *
 * - Export current translations to a TSV file:
 *   `tsx ./editTranslations.ts --export path/to/file.tsv`
 * - Import translations from a TSV file and output JSON message files into the `output/import` folder next to this script. Copy the files into `messages/` yourself, and add a `pathPattern` entry to `project.inlang/settings.json` for any new file; the script lists the missing entries.
 *   `tsx ./editTranslations.ts --import path/to/file.tsv`
 * - Import translations from a TSV file and replace old translation keys with new ones in Svelte files in the frontend src folder. Note that the regexes used will not find dynamically constructed keys, and you should thus check the results manually. The script will output a list of all of the old keys that were not replaced even a single time.
 *   `tsx ./editTranslations.ts --replaceKeys path/to/file.tsv`
 */

const TOOL_DIR = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIR = path.resolve(TOOL_DIR, '..', '..');
const MESSAGES_DIR = path.join(FRONTEND_DIR, 'messages');
const INLANG_SETTINGS = path.join(FRONTEND_DIR, 'project.inlang', 'settings.json');
const OUTPUT_DIR = path.join(TOOL_DIR, 'output');
const OUTPUT_TRANS = path.join(OUTPUT_DIR, 'translations.tsv');
const OUTPUT_JSON = path.join(OUTPUT_DIR, 'import');
const INPUT_DIR = path.join(FRONTEND_DIR, 'src');
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
  const { translations } = readTsvTranslations(file, true);

  const keyPairs: { [oldKey: string]: string } = {};
  for (const keys of Object.values(translations)) {
    for (const { newKey, oldKeys } of Object.values(keys)) {
      for (const oldKey of oldKeys) {
        if (newKey === oldKey) continue;
        keyPairs[oldKey] = newKey;
      }
    }
  }

  /** A map of old key regexes to new keys */
  const replacements: Array<{ regex: RegExp; newKey: string }> = Object.entries(keyPairs).map(([oldKey, newKey]) => ({
    regex: new RegExp(`(?<=\\b${TRANSL_FUNCTION}\\s*\\(\\s*(['"]))${escapeRegExp(oldKey)}(?=\\1)`, 'gm'),
    newKey
  }));

  const found = new Set<string>();
  let changed = 0;
  // These nested for loops could perhaps be parallelized by using Promises
  for await (const file of getFiles(INPUT_DIR)) {
    if (!file.endsWith('.svelte')) continue;
    const content = fs.readFileSync(file, ENCODING);
    let updated = content;
    for (const { regex, newKey } of replacements) {
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
 * Import translations and output new message files, each wrapped in its namespace key.
 */
function importTranslations(file: string): void {
  console.info(`Importing translations from ${file}`);
  const { locales, translations } = readTsvTranslations(file);

  /** Stored contents to write so that the whole transaction can be cancelled by errors */
  const fileContents: { [path: string]: string } = {};

  for (const locale of locales) {
    for (const [file, keys] of Object.entries(translations)) {
      const output: MessageTree = {};
      for (const [key, data] of Object.entries(keys)) {
        let current: MessageTree = output;
        const keyParts = key.split('.');
        const { values } = data;
        for (let i = 0; i < keyParts.length; i++) {
          const part = keyParts[i];
          if (i === keyParts.length - 1) {
            if (part in current)
              throw new Error(
                `Error storing ${file}.${key} for locale ${locale}: does this key have both a value and subkeys?`
              );
            current[part] = values[locale] ?? MISSING_VALUE;
            break;
          }
          current[part] ??= {};
          const next = current[part];
          if (!isBranch(next))
            throw new Error(
              `Error storing ${file}.${key} for locale ${locale}: does the parent of this key have a value?`
            );
          current = next;
        }
      }
      const outputPath = path.join(OUTPUT_JSON, locale, `${file}.json`);
      fileContents[outputPath] = `${JSON.stringify({ [file]: output }, null, 2)}\n`;
    }
  }

  // Write the files
  for (const [outputPath, content] of Object.entries(fileContents)) writeFile(outputPath, content);
  console.info(`Wrote ${Object.keys(fileContents).length} translation files to folder ${OUTPUT_JSON}`);

  // List the files Paraglide would not compile until they are added to the inlang settings
  const listed = new Set(readPathPatterns());
  const missing = Object.keys(translations)
    .map((f) => `./messages/{locale}/${f}.json`)
    .filter((pattern) => !listed.has(pattern));
  if (missing.length) {
    console.info(`Add these lines to plugin.inlang.messageFormat.pathPattern in ${INLANG_SETTINGS}:`);
    for (const pattern of missing) console.info(`  "${pattern}",`);
  }
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
      .replace(/\r/g, '')
      .split(COL_SEP)
      .map((s) => decodeCell(s));
    const [oldKey, newKey, newFileCell] = items.slice(0, 3).map((s) => (typeof s === 'string' ? s : JSON.stringify(s)));
    if (!locales) {
      if (oldKey !== 'key' || newKey !== 'new_key' || newFileCell !== 'new_file')
        throw new Error(`Invalid header row: ${row}`);
      locales = items.slice(3).map((s) => String(s));
      continue;
    }
    if ([oldKey, newKey].some((s) => !s)) throw new Error(`Invalid row: ${row}`);

    const newFile = newFileCell || newKey.split('.')[0];
    if (!newKey.startsWith(`${newFile}.`)) throw new Error(`New_key does not start with new_file: ${row}`);

    const subkey = newKey.slice(newFile.length + 1);
    const values = Object.fromEntries(locales.map((l, i) => [l, items[i + 3]]));

    translations[newFile] ??= {};
    if (subkey in translations[newFile]) {
      if (!silent) console.warn(`Merging duplicate key ${newKey}, using the first encountered values`);
      translations[newFile][subkey].oldKeys.push(oldKey);
      continue;
    }
    translations[newFile][subkey] = { newKey, oldKeys: [oldKey], values };
  }

  if (!locales) throw new Error('No locales found in TSV file. Maybe it was empty?');

  return { locales, translations };
}

/**
 * Decode a JSON-encoded TSV cell. A string, array or object is returned as is; anything else, including text that is not valid JSON, is returned as plain text with any surrounding double quotes removed.
 */
function decodeCell(cell: string): MessageValue {
  try {
    const decoded: unknown = JSON.parse(cell);
    if (typeof decoded === 'string' || (typeof decoded === 'object' && decoded !== null))
      return decoded as MessageValue;
  } catch {
    // Not JSON, so a hand-edited cell
  }
  return cell.replace(/^"|"$/g, '');
}

/**
 * Export current translations into a TSV file with columns for: `key`, `new_key`, `new_file`, and each locale.
 * The `new_key` and `new_file` columns are used when importing the translations back.
 * @param file
 */
function exportCurrentTranslations(file: string): void {
  const { primaryLocale, filePrefixes, translations } = readAllTranslations();
  const multiPartPrefixes = filePrefixes.filter((p) => p.includes('.')).sort((a, b) => b.length - a.length);
  const locales = Object.keys(translations);
  const flatTranslations = Object.fromEntries(
    locales.map((l) => [l, Object.fromEntries(flattenKeys(translations[l]))])
  );
  let tsv = ['key', 'new_key', 'new_file', ...locales].map((s) => JSON.stringify(s)).join(COL_SEP) + '\n';
  const primaryTranslations = flatTranslations[primaryLocale];
  for (const key in primaryTranslations) {
    tsv +=
      [key, key, findFilePrefix(key), ...locales.map((l) => flatTranslations[l][key] ?? MISSING_VALUE)]
        .map((s) => JSON.stringify(s))
        .join(COL_SEP) + '\n';
  }
  writeFile(file, tsv);
  console.info(`Wrote translations to ${file}`);

  /** Finds the file prefix for the key if the prefix is a multi-part prefix */
  function findFilePrefix(key: string): string {
    for (const prefix of multiPartPrefixes) {
      if (key.startsWith(`${prefix}.`)) return prefix;
    }
    return '';
  }
}

/**
 * Read all message files and return them in an object with locales as the top keys. Each locale holds the files' namespace keys, so its flattened keys are the full translation keys.
 */
function readAllTranslations(): {
  primaryLocale: string;
  filePrefixes: Array<string>;
  translations: { [locale: string]: MessageTree };
} {
  const primaryLocale = readBaseLocale();
  const filePrefixes = new Array<string>();
  const translations: { [locale: string]: MessageTree } = {};
  const locales = fs
    .readdirSync(MESSAGES_DIR)
    .filter((name) => fs.lstatSync(path.join(MESSAGES_DIR, name)).isDirectory());
  if (!locales.includes(primaryLocale))
    throw new Error(`Base locale '${primaryLocale}' not found in the messages folder ${MESSAGES_DIR}`);
  for (const locale of [primaryLocale, ...locales.filter((l) => l !== primaryLocale)]) {
    const localeTranslations: MessageTree = {};
    const files = fs.readdirSync(path.join(MESSAGES_DIR, locale)).filter((f) => f.endsWith('.json'));
    for (const file of files) {
      const prefix = file.replace(/\.json$/, '');
      if (locale === primaryLocale) filePrefixes.push(prefix);
      localeTranslations[prefix] = readMessageFile(locale, file);
    }
    translations[locale] = localeTranslations;
  }
  return { primaryLocale, filePrefixes, translations };
}

/**
 * A recursive function which returns an array of flattened keys with their associated values. Strings, inlang variant arrays and bare variant objects are leaves.
 * @example `{a: 'abc', b: {c: 'def'}}` becomes `[['a', 'abc'], ['b.c', 'def']]`
 */
function flattenKeys(obj: MessageTree, prefix?: string): Array<[string, MessageValue]> {
  const res = Array<[string, MessageValue]>();
  prefix = prefix ? `${prefix}.` : '';
  for (const [key, value] of Object.entries(obj)) {
    const newKey = `${prefix}${key}`;
    if (isBranch(value)) res.push(...flattenKeys(value, newKey));
    else res.push([newKey, value]);
  }
  return res;
}

/**
 * Reads a message file and returns the messages inside its namespace key.
 * @throws If the file does not hold exactly one top-level key equal to its filename without `.json`.
 */
function readMessageFile(locale: string, filename: string): MessageTree {
  const fp = path.join(MESSAGES_DIR, locale, filename);
  const namespace = filename.replace(/\.json$/, '');
  const content: unknown = JSON.parse(fs.readFileSync(fp, ENCODING).toString());
  const topKeys = isBranch(content) ? Object.keys(content) : [];
  if (topKeys.length !== 1 || topKeys[0] !== namespace)
    throw new Error(`Message file ${fp} must have exactly one top-level key '${namespace}'`);
  const messages = (content as MessageTree)[namespace];
  if (!isBranch(messages)) throw new Error(`The '${namespace}' value in ${fp} must be an object of messages`);
  return messages;
}

function readInlangSettings(): { baseLocale?: unknown; 'plugin.inlang.messageFormat'?: { pathPattern?: unknown } } {
  return JSON.parse(fs.readFileSync(INLANG_SETTINGS, ENCODING));
}

function readBaseLocale(): string {
  const { baseLocale } = readInlangSettings();
  if (typeof baseLocale !== 'string' || !baseLocale) throw new Error(`No baseLocale in ${INLANG_SETTINGS}`);
  return baseLocale;
}

function readPathPatterns(): Array<string> {
  const patterns = readInlangSettings()['plugin.inlang.messageFormat']?.pathPattern;
  if (typeof patterns === 'string') return [patterns];
  return Array.isArray(patterns) ? patterns.filter((p): p is string => typeof p === 'string') : [];
}

/**
 * True for an object of nested messages, false for a leaf: a string, an inlang variant array or a bare variant object.
 */
function isBranch(value: unknown): value is MessageTree {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    !('declarations' in value || 'selectors' in value || 'match' in value)
  );
}

/**
 * Return a recursive async generator yielding file paths in @param {string} - dir.
 * (By qwtel)[https://stackoverflow.com/a/45130990/13409631]
 */
async function* getFiles(dir: string): AsyncGenerator<string> {
  const dirents = await readdir(dir, { withFileTypes: true });
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
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, ENCODING);
}

/**
 * Escape regex special characters in a string.
 * Source: https://stackoverflow.com/a/6969486/13409631
 */
function escapeRegExp(regex: string): string {
  return regex.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

/**
 * A single message: a plain string, an inlang variant array or a bare variant object.
 */
type MessageValue = string | Array<unknown> | { [key: string]: unknown };

type MessageTree = {
  [key: string]: MessageTree | MessageValue;
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
      /** The decoded translations for each locale */
      values: {
        [locale: string]: MessageValue;
      };
    };
  };
};
