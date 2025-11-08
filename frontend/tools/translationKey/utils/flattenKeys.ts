import fs from 'fs';
import path from 'path';

// Next check that all of the translations are present for all locales
type Translations = {
  [key: string]: Translations | string;
};
/**
 * Recursive function which returns sorted array of flattened keys.
 *
 * For example `{a: 'abc', b: {c: 'def'}}` is returned as `['<prefix>.a', '<prefix>.b.c']`
 */
function flattenKeys(obj: Translations, prefix: string): Array<string> {
  const res = Array<string>();
  for (const key in obj) {
    if (typeof obj[key] !== 'object') {
      res.push(`${prefix}.${key}`);
    } else {
      res.push(...flattenKeys(obj[key], `${prefix}.${key}`));
    }
  }
  return res;
}
/**
 * Reads contents of translation file and returns array of flattened keys.
 */
export function getFlattenedTranslationKeys({
  locale,
  dirPath,
  filename
}: {
  locale: string;
  dirPath: string;
  filename: string;
}): Array<string> {
  const filePath = path.join(dirPath, locale, filename);
  const fileContentString = fs.readFileSync(filePath).toString();
  const fileContentJSON: Translations = JSON.parse(fileContentString);
  return flattenKeys(fileContentJSON, filename.replace('.json', ''));
}
