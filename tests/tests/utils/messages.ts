import fs from 'fs';
import path from 'path';
import { TESTS_DIR } from './testsDir';
import { MESSAGES_RELATIVE_PATH } from '../support/preflight';

/**
 * The message catalogue, read by fixtures and specs so that they assert the application's copy rather than a copied string a copy edit would leave stale.
 */
const MESSAGES_DIR = path.join(TESTS_DIR, '../..', MESSAGES_RELATIVE_PATH);

/** The namespaces already read, by `<locale>/<file>`. */
const namespaces = new Map<string, Record<string, unknown>>();

/**
 * The messages of one catalogue file, under its single top-level key.
 *
 * @param file - The file's name under `apps/frontend/messages/<locale>`, without `.json`; it is also the namespace the file holds.
 * @param locale - The locale whose folder holds the file.
 */
export function messagesOf(file: string, locale = 'en'): Record<string, unknown> {
  const cacheKey = `${locale}/${file}`;
  const cached = namespaces.get(cacheKey);
  if (cached) return cached;
  const source = JSON.parse(fs.readFileSync(path.join(MESSAGES_DIR, locale, `${file}.json`), 'utf8')) as Record<
    string,
    unknown
  >;
  const namespace = source[file];
  if (!isRecord(namespace)) throw new Error(`${cacheKey}.json holds no namespace ${file}`);
  namespaces.set(cacheKey, namespace);
  return namespace;
}

/**
 * One message of a catalogue file.
 *
 * @param file - The file's name under `apps/frontend/messages/<locale>`, without `.json`.
 * @param key - The message's key inside the file's namespace; dots walk into nested groups, as in `usageData.title`.
 * @param locale - The locale whose folder holds the file.
 */
export function messageOf(file: string, key: string, locale = 'en'): string {
  let value: unknown = messagesOf(file, locale);
  for (const part of key.split('.')) value = isRecord(value) ? value[part] : undefined;
  if (typeof value !== 'string') throw new Error(`${locale}/${file}.json holds no message ${key}`);
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
