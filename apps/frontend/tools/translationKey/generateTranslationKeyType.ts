/**
 * Generates the `TranslationKey` union from the base-locale Paraglide messages catalog.
 *
 * The base locale and the list of message files are read from `project.inlang/settings.json`, so
 * the union covers exactly the files Paraglide compiles. Each file holds a single top-level key equal
 * to its namespace (the filename without `.json`), and every key path inside it is prefixed with that
 * namespace. Plain strings, inlang variant arrays and bare variant objects are leaves.
 *
 * Run with `yarn workspace @openvaa/frontend generate:translation-key-type`.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

console.info('Generating TranslationKey type...');

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const settingsPath = path.join(frontendRoot, 'project.inlang', 'settings.json');
const outputPath = path.join(frontendRoot, 'src', 'lib', 'types', 'generated', 'translationKey.ts');

type InlangSettings = {
  baseLocale?: unknown;
  'plugin.inlang.messageFormat'?: { pathPattern?: unknown };
};

type MessageTree = { [key: string]: unknown };

const settings: InlangSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
const baseLocale = settings.baseLocale;
if (typeof baseLocale !== 'string' || !baseLocale) throw new Error(`No baseLocale in ${settingsPath}`);

const rawPatterns = settings['plugin.inlang.messageFormat']?.pathPattern;
const pathPatterns = typeof rawPatterns === 'string' ? [rawPatterns] : rawPatterns;
if (!Array.isArray(pathPatterns) || pathPatterns.length === 0 || pathPatterns.some((p) => typeof p !== 'string'))
  throw new Error(`No plugin.inlang.messageFormat.pathPattern list in ${settingsPath}`);

const translationKeys = new Array<string>();
const seen = new Set<string>();

for (const pattern of pathPatterns as Array<string>) {
  const filePath = path.resolve(frontendRoot, pattern.split('{locale}').join(baseLocale));
  if (!fs.existsSync(filePath)) throw new Error(`Message file listed in ${settingsPath} does not exist: ${filePath}`);
  for (const key of getMessageKeys(filePath)) {
    if (seen.has(key)) throw new Error(`Duplicate translation key '${key}' in ${filePath}`);
    seen.add(key);
    translationKeys.push(key);
  }
}

if (translationKeys.length === 0) throw new Error(`No translation keys found for base locale '${baseLocale}'`);

translationKeys.sort();

const comment =
  '/** Auto-generated from the base-locale messages by `apps/frontend/tools/translationKey/generateTranslationKeyType.ts` */';
const output = `${comment}\nexport type TranslationKey = ${translationKeys.map((s) => `'${s}'`).join(' | ')}`;

fs.writeFileSync(outputPath, output);

/**
 * Returns the flattened keys of one message file, prefixed with its namespace.
 * @param filePath - Absolute path to a `messages/{locale}/<namespace>.json` file.
 * @throws If the file does not hold exactly one top-level key equal to its namespace.
 */
function getMessageKeys(filePath: string): Array<string> {
  const namespace = path.basename(filePath, '.json');
  const content: unknown = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  if (!isPlainObject(content))
    throw new Error(`Message file ${filePath} must hold a JSON object wrapped in '${namespace}'`);
  const topKeys = Object.keys(content);
  if (topKeys.length !== 1 || topKeys[0] !== namespace)
    throw new Error(
      `Message file ${filePath} must have exactly one top-level key '${namespace}', found: ${topKeys.join(', ')}`
    );
  const wrapped = content[namespace];
  if (!isPlainObject(wrapped) || isVariantObject(wrapped))
    throw new Error(`The '${namespace}' value in ${filePath} must be an object of messages`);
  return flattenKeys(wrapped, namespace);
}

/**
 * Flattens a message tree into dot-separated key paths. For example `{a: 'abc', b: {c: 'def'}}` with
 * prefix `p` yields `['p.a', 'p.b.c']`.
 */
function flattenKeys(tree: MessageTree, prefix: string): Array<string> {
  const keys = new Array<string>();
  for (const [key, value] of Object.entries(tree)) {
    const fullKey = `${prefix}.${key}`;
    if (isPlainObject(value) && !isVariantObject(value)) keys.push(...flattenKeys(value, fullKey));
    else keys.push(fullKey);
  }
  return keys;
}

function isPlainObject(value: unknown): value is MessageTree {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * A bare inlang variant object is a single message, not a namespace to recurse into.
 */
function isVariantObject(value: MessageTree): boolean {
  return 'declarations' in value || 'selectors' in value || 'match' in value;
}
