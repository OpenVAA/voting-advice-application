import fs from 'node:fs';
import path from 'node:path';

/**
 * Reads the Paraglide message catalogue files in `apps/frontend/messages/`. Only node built-ins and relative imports are used, because `paraglide.options.ts` reaches this module through Vite's config loader and `tsx`, neither of which resolves the SvelteKit path aliases.
 */

/**
 * Flattens a message tree into dot-separated key paths. Inlang variant arrays and bare variant objects (carrying `declarations`, `selectors` or `match`) are single leaves, as in the `TranslationKey` generator.
 * @param tree - The message tree, or a single message.
 * @param prefix - The key path of `tree`.
 * @returns The key paths of every message in `tree`.
 */
export function flattenMessageKeys(tree: unknown, prefix: string): Array<string> {
  if (!isMessageBranch(tree)) return [prefix];
  return Object.entries(tree).flatMap(([key, value]) => flattenMessageKeys(value, `${prefix}.${key}`));
}

/**
 * Whether a node of a message tree is a branch rather than a message: an object that is neither a variant array nor a bare variant object.
 */
function isMessageBranch(tree: unknown): tree is Record<string, unknown> {
  return (
    typeof tree === 'object' &&
    tree !== null &&
    !Array.isArray(tree) &&
    !('declarations' in tree || 'selectors' in tree || 'match' in tree)
  );
}

/**
 * @param value - A message string.
 * @returns The distinct `{placeholder}` names `value` uses, sorted.
 */
export function getPlaceholders(value: string): Array<string> {
  return [...new Set([...value.matchAll(/\{([^{}]*)\}/g)].map((match) => match[1]))].sort();
}

/**
 * @param value - A message string.
 * @returns The distinct HTML tag names `value` opens or closes, lower-cased and sorted.
 */
export function getHtmlTags(value: string): Array<string> {
  return [...new Set([...value.matchAll(/<\/?([a-zA-Z][\w-]*)/g)].map((match) => match[1].toLowerCase()))].sort();
}

/**
 * Whether a node is a variant message, by its shape: an object, not an array, holding `match` together with `declarations` or `selectors`.
 * @param node - Any node of a message tree.
 * @returns True if `node` is a variant message.
 */
export function isVariantMessage(node: unknown): node is { match?: Record<string, unknown> } {
  return (
    typeof node === 'object' &&
    node !== null &&
    !Array.isArray(node) &&
    'match' in node &&
    ('declarations' in node || 'selectors' in node)
  );
}

/**
 * Collect the texts of a variant's `match`, each keyed by the variant's key and its match key.
 * @param variant - A variant message.
 * @param key - The key of the variant, including its index.
 * @param out - The list the `[key, text]` pairs are appended to.
 */
export function collectVariantTexts(
  variant: { match?: Record<string, unknown> },
  key: string,
  out: Array<[string, string]>
): void {
  for (const [matchKey, text] of Object.entries(variant.match ?? {})) collectStrings(text, `${key}/${matchKey}`, out);
}

/**
 * Collect every string of a node. A plain message is keyed by its key path (`common.info`). A variant message contributes each text of its `match`, keyed by its key path, the variant's index and the match key (`questions.category.numQuestions#0/numQuestions=1`); its `declarations` and `selectors` are not collected.
 * @param node - Any node of a message tree.
 * @param key - The key path of `node`, or `''` for a whole file.
 * @param out - The list the `[key, text]` pairs are appended to.
 */
export function collectStrings(node: unknown, key: string, out: Array<[string, string]>): void {
  if (typeof node === 'string') {
    out.push([key, node]);
  } else if (Array.isArray(node)) {
    node.forEach((item, index) =>
      isVariantMessage(item)
        ? collectVariantTexts(item, `${key}#${index}`, out)
        : collectStrings(item, `${key}#${index}`, out)
    );
  } else if (isVariantMessage(node)) {
    collectVariantTexts(node, `${key}#0`, out);
  } else if (typeof node === 'object' && node !== null) {
    for (const [child, value] of Object.entries(node)) collectStrings(value, key ? `${key}.${child}` : child, out);
  }
}

/**
 * Options for {@link readLocaleCatalog}.
 */
export interface ReadLocaleCatalogOptions {
  /** The directory the `pathPatterns` resolve against, the parent of the `.inlang` project folder. */
  frontendDir: string;
  /** The locale whose files are read. */
  locale: string;
  /** The `plugin.inlang.messageFormat` `pathPattern` entries, each holding `{locale}`. */
  pathPatterns: ReadonlyArray<string>;
}

/**
 * Reads every catalogue file of one locale. Each file's single top-level key is its namespace, which starts every key of the file.
 * @param options - See {@link ReadLocaleCatalogOptions}.
 * @returns A map from each full translation key to its message node; a variant message is one entry.
 * @throws If a listed file does not exist or does not parse.
 */
export function readLocaleCatalog({
  frontendDir,
  locale,
  pathPatterns
}: ReadLocaleCatalogOptions): Record<string, unknown> {
  const catalog: Record<string, unknown> = {};
  for (const pattern of pathPatterns) {
    const file = path.resolve(frontendDir, pattern.split('{locale}').join(locale));
    if (!fs.existsSync(file)) throw new Error(`The message catalogue file ${file} does not exist.`);
    Object.assign(catalog, flattenMessageNodes(JSON.parse(fs.readFileSync(file, 'utf8'))));
  }
  return catalog;
}

/**
 * Flattens a whole message file, whose top-level keys are namespaces, into its messages.
 * @param content - The parsed file.
 * @returns A map from each full translation key to its message node; a variant message is one entry.
 */
export function flattenMessageNodes(content: Record<string, unknown>): Record<string, unknown> {
  const messages: Record<string, unknown> = {};
  for (const [namespace, tree] of Object.entries(content)) collectMessageNodes(tree, namespace, messages);
  return messages;
}

/**
 * Adds every message of a tree to `catalog` under its key path, splitting branches exactly as {@link flattenMessageKeys} does.
 */
function collectMessageNodes(tree: unknown, prefix: string, catalog: Record<string, unknown>): void {
  if (!isMessageBranch(tree)) {
    catalog[prefix] = tree;
    return;
  }
  for (const [key, value] of Object.entries(tree)) collectMessageNodes(value, `${prefix}.${key}`, catalog);
}
