import fs from 'node:fs';
import path from 'node:path';
import { collectStrings, flattenMessageNodes, getHtmlTags, getPlaceholders, readLocaleCatalog } from './messageCatalog';

/**
 * Lays a deployment's `instance/messages/<locale>.json` files over the frontend's compiled message catalogues. Only node built-ins and relative imports are used, because `paraglide.options.ts` loads this module through Vite's config loader and `tsx`.
 */

/** The base inlang project, relative to the frontend directory. */
const BASE_PROJECT = './project.inlang';

/** The generated inlang project, relative to the frontend directory. */
const INSTANCE_PROJECT = './.instance/project.inlang';

/** The directory of the instance message files, relative to the repository root. */
const INSTANCE_MESSAGES_DIR = 'instance/messages';

/**
 * Where the frontend and the instance overlay live.
 */
export interface InstanceMessagesOptions {
  /** The absolute path of `apps/frontend`, which holds `project.inlang/`. */
  frontendDir: string;
  /** The absolute path of the repository root, which holds `instance/`. */
  repoRoot: string;
}

/** The fields of `project.inlang/settings.json` read here; the rest is copied unchanged. */
interface InlangSettings {
  baseLocale: string;
  locales: Array<string>;
  'plugin.inlang.messageFormat': { pathPattern: Array<string> };
  [key: string]: unknown;
}

/**
 * Validates every `instance/messages/*.json` file against the base catalogue. A file name must be a locale of `project.inlang` `locales`, its content a JSON object whose top-level keys are namespaces, and every message it holds must override a message of the base locale with the same `{placeholder}` set and HTML tag set.
 * @param options - See {@link InstanceMessagesOptions}.
 * @returns The locales that have an instance file, empty when there is none.
 * @throws If a file or directory is a symbolic link, or a file breaks one of the rules above; the error names the file and the key.
 */
export function validateInstanceMessages({ frontendDir, repoRoot }: InstanceMessagesOptions): Array<string> {
  const files = listInstanceMessageFiles(repoRoot);
  if (files.length === 0) return [];
  const settings = readBaseSettings(frontendDir);
  const baseCatalog = readLocaleCatalog({
    frontendDir,
    locale: settings.baseLocale,
    pathPatterns: settings['plugin.inlang.messageFormat'].pathPattern
  });
  return files.map((filename) => {
    const label = `${INSTANCE_MESSAGES_DIR}/${filename}`;
    const locale = filename.replace(/\.json$/, '');
    if (!settings.locales.includes(locale))
      throw new Error(
        `${label}: '${locale}' is not a compiled locale. Name the file after one of: ${settings.locales.join(', ')}.`
      );
    const content = parseObject(path.join(repoRoot, INSTANCE_MESSAGES_DIR, filename), label);
    for (const [key, override] of Object.entries(flattenMessageNodes(content))) {
      if (!Object.hasOwn(baseCatalog, key))
        throw new Error(`${label}: '${key}' is not a message of the base catalogue, so it cannot be overridden.`);
      const base = describeSignature(baseCatalog[key]);
      const instance = describeSignature(override);
      if (base.placeholders !== instance.placeholders)
        throw new Error(
          `${label}: '${key}' must use the placeholders of the base message, ${base.placeholders}, but uses ${instance.placeholders}.`
        );
      if (base.tags !== instance.tags)
        throw new Error(
          `${label}: '${key}' must use the HTML tags of the base message, ${base.tags}, but uses ${instance.tags}.`
        );
    }
    return locale;
  });
}

/**
 * Chooses the inlang project the Paraglide compiler reads. With instance message files, writes `.instance/project.inlang/settings.json` under the frontend directory: the base settings with each `pathPattern` entry rebased to the generated folder and `instance/messages/{locale}.json` appended last, so an instance message overrides the base message of the same key.
 * @param options - See {@link InstanceMessagesOptions}.
 * @returns `'./project.inlang'` without instance messages, otherwise `'./.instance/project.inlang'`; both relative to the frontend directory.
 * @throws As {@link validateInstanceMessages}.
 */
export function instanceMessagesProject({ frontendDir, repoRoot }: InstanceMessagesOptions): string {
  if (validateInstanceMessages({ frontendDir, repoRoot }).length === 0) return BASE_PROJECT;
  const generatedDir = path.join(frontendDir, INSTANCE_PROJECT);
  // inlang resolves pattern entries against the parent of the `.inlang` folder.
  const patternRoot = path.dirname(generatedDir);
  const settings = structuredClone(readBaseSettings(frontendDir));
  const format = settings['plugin.inlang.messageFormat'];
  format.pathPattern = [
    ...format.pathPattern.map((pattern) => relativePattern(patternRoot, path.resolve(frontendDir, pattern))),
    relativePattern(patternRoot, path.join(repoRoot, INSTANCE_MESSAGES_DIR, '{locale}.json'))
  ];
  fs.mkdirSync(generatedDir, { recursive: true });
  fs.writeFileSync(path.join(generatedDir, 'settings.json'), `${JSON.stringify(settings, null, 2)}\n`);
  return INSTANCE_PROJECT;
}

/**
 * Options for {@link assertSupportedLocalesCompiled}.
 */
export interface SupportedLocalesOptions {
  /** The locales a deployment offers, `staticSettings.supportedLocales`. */
  supportedLocales: ReadonlyArray<{ code: string }>;
  /** The locales with a compiled catalogue, `project.inlang` `locales`. */
  compiledLocales: ReadonlyArray<string>;
}

/**
 * Asserts that every locale a deployment offers has a compiled message catalogue.
 * @param options - See {@link SupportedLocalesOptions}.
 * @throws Naming each offered locale that has no compiled catalogue.
 */
export function assertSupportedLocalesCompiled({ supportedLocales, compiledLocales }: SupportedLocalesOptions): void {
  const missing = supportedLocales.map(({ code }) => code).filter((code) => !compiledLocales.includes(code));
  if (missing.length === 0) return;
  throw new Error(
    `staticSettings.supportedLocales offers ${missing.map((code) => `'${code}'`).join(', ')}, which has no compiled message catalogue (compiled: ${compiledLocales.join(', ')}). A locale needs a full catalogue under apps/frontend/messages/ and an entry in apps/frontend/project.inlang/settings.json locales before an instance can offer it.`
  );
}

/**
 * Lists the `.json` file names of `instance/messages`, refusing symbolic links.
 */
function listInstanceMessageFiles(repoRoot: string): Array<string> {
  const dir = path.join(repoRoot, INSTANCE_MESSAGES_DIR);
  if (isSymbolicLink(dir)) throw new Error(`${INSTANCE_MESSAGES_DIR} is a symbolic link; it must be a directory.`);
  if (!fs.existsSync(dir)) return [];
  if (!fs.lstatSync(dir).isDirectory()) throw new Error(`${INSTANCE_MESSAGES_DIR} must be a directory.`);
  const files = fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .sort();
  for (const name of files) {
    const stats = fs.lstatSync(path.join(dir, name));
    if (stats.isSymbolicLink())
      throw new Error(
        `${INSTANCE_MESSAGES_DIR}/${name} is a symbolic link; symbolic links are not allowed in ${INSTANCE_MESSAGES_DIR}.`
      );
    if (!stats.isFile()) throw new Error(`${INSTANCE_MESSAGES_DIR}/${name} must be a regular file.`);
  }
  return files;
}

function isSymbolicLink(file: string): boolean {
  try {
    return fs.lstatSync(file).isSymbolicLink();
  } catch {
    return false;
  }
}

function readBaseSettings(frontendDir: string): InlangSettings {
  return JSON.parse(fs.readFileSync(path.join(frontendDir, BASE_PROJECT, 'settings.json'), 'utf8'));
}

/**
 * Reads a JSON file that must hold an object at its top level.
 */
function parseObject(file: string, label: string): Record<string, unknown> {
  let content: unknown;
  try {
    content = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`, {
      cause: error
    });
  }
  if (typeof content !== 'object' || content === null || Array.isArray(content))
    throw new Error(`${label} must hold a JSON object whose keys are message namespaces.`);
  return content as Record<string, unknown>;
}

/**
 * The placeholder set and HTML tag set of every string of a message, each written as one comparable string.
 */
function describeSignature(message: unknown): { placeholders: string; tags: string } {
  const strings: Array<[string, string]> = [];
  collectStrings(message, '', strings);
  const texts = strings.map(([, text]) => text);
  const placeholders = [...new Set(texts.flatMap(getPlaceholders))].sort();
  const tags = [...new Set(texts.flatMap(getHtmlTags))].sort();
  return {
    placeholders: `{${placeholders.join('}, {')}}`.replace(/^\{\}$/, 'none'),
    tags: tags.length ? tags.map((tag) => `<${tag}>`).join(', ') : 'none'
  };
}

/**
 * A pattern path relative to `from`, with posix separators and a leading `./` or `../`.
 */
function relativePattern(from: string, to: string): string {
  const relative = path.relative(from, to).split(path.sep).join('/');
  return relative === '..' || relative.startsWith('../') ? relative : `./${relative}`;
}
