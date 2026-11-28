/**
 * The file lister the source-scanning guards under `scripts/` share.
 *
 * Node built-ins only, no build step, no dependency: the guards that import this run before anything
 * is built.
 */

import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..', '..');

/**
 * Every file under `rootRel` that `include` keeps, as repo-relative paths with `/` separators,
 * sorted so two runs over an unchanged tree report in the same order.
 *
 * Symlinks are not followed: `readdirSync` reports a link as neither a file nor a directory. A
 * directory whose name or repo-relative path is in `prune` is not entered.
 * @param {string} rootRel - The directory to walk, relative to the repository root.
 * @param {{ include: (relPath: string) => boolean, prune?: string[] }} options
 * @returns {string[]}
 * @throws {Error} naming the directory when one cannot be read, including a root that is missing
 *   or is not a directory, so a guard never reads an unreadable tree as a clean one.
 */
export function listFiles(rootRel, { include, prune = [] }) {
  const pruned = new Set(prune);
  const found = [];
  const walk = (relDir) => {
    let entries;
    try {
      entries = readdirSync(path.resolve(REPO_ROOT, relDir), { withFileTypes: true });
    } catch (error) {
      throw new Error(`could not read directory '${relDir}' (${error.message})`, { cause: error });
    }
    for (const entry of entries) {
      const relPath = `${relDir}/${entry.name}`;
      if (entry.isDirectory()) {
        if (!pruned.has(entry.name) && !pruned.has(relPath)) walk(relPath);
      } else if (entry.isFile() && include(relPath)) {
        found.push(relPath);
      }
    }
  };
  walk(rootRel.split(path.sep).join('/').replace(/\/+$/, ''));
  return found.sort();
}
