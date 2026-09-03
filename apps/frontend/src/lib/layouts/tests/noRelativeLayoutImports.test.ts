/**
 * NO-RELATIVE-IMPORT-OF-A-RELOCATED-LAYOUT GUARD (phase 159, requirement REVIEW-CMP-06).
 *
 * The defect this file exists for: `Layout`, `Header`, `Banner`, `MainContent`, `MaintenancePage` and `SingleCardContent` used to live in `src/routes/`, the file-based router's own namespace, where non-route files acquire accidental routing meaning. Forty-six files reached them through ascending relative paths of five different depths — `../MainContent.svelte` through `../../../../../MainContent.svelte` — so every move of an importer, and every move of the target, rewrote a string whose only job was to say "the same component". They now live under `src/lib/layouts/main/` behind a barrel and are reached through the `$layouts` alias, which is depth-independent.
 *
 * If this test fails, it means a file outside the barrel directory reached one of those modules through a relative path again. The fix is not to adjust the number of `../` segments — it is to import from `$layouts/main`, which resolves identically from any depth and in all three resolvers (`svelte.config.js` for the app, the generated `.svelte-kit/tsconfig.json` for the type checker, and `vitest.config.ts` for the unit suite).
 *
 * The scan is deliberately NARROW: it matches an import specifier that BOTH starts with a relative segment AND ends in one of the six relocated basenames with a `.svelte` or `.type` suffix. The basename must sit immediately after a path separator, so it is the WHOLE final segment and not a suffix of a longer name. That boundary is load-bearing and was found by running this guard before the rewrite: without it, `./SurveyBanner.svelte` in `lib/dynamic-components/survey/banner/` matched on `Banner`, and a guard that reddens on correct code gets disabled, which is worse than no guard.
 *
 * Sibling imports INSIDE the barrel directory are legitimate and excluded by path, not by pattern: `Header.svelte` imports `./Banner.svelte`, `Layout.svelte` imports `./Header.svelte`, and three components import their own `./X.type` module. Those are peers in one directory and the alias would be circular indirection there. The exclusion is asserted below so it cannot silently widen.
 *
 * Two properties keep it from passing vacuously. It THROWS rather than returning an empty collection when it cannot find its scan root or finds implausibly few files, because a silent empty set would make the assertion pass while checking nothing. And it EXCLUDES ITS OWN FILE from the scanned set, because this file names all six modules in its own pattern and in this very paragraph. The self-exclusion is itself asserted below, so it cannot quietly become a no-op if the file moves.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const SELF_PATH = fileURLToPath(import.meta.url);

// apps/frontend/src/lib/layouts/tests/ -> the frontend source root is three levels up.
const SRC_ROOT = join(dirname(SELF_PATH), '..', '..', '..');

/** The barrel directory itself. Its own members import each other as siblings, which is correct and must not trip the guard. */
const BARREL_DIR = join(SRC_ROOT, 'lib', 'layouts', 'main') + sep;

/** Extensions that can carry an import statement. Everything else in the tree is data, styling or assets. */
const SCANNED_EXTENSIONS = ['.svelte', '.ts', '.js'];

/** A floor on the scanned file count. The frontend source tree holds hundreds of these; a handful means the walk broke rather than that the tree shrank. */
const MINIMUM_PLAUSIBLE_FILE_COUNT = 200;

/**
 * The forbidden shape: an import specifier that starts with a relative segment and ends in one of the six relocated basenames.
 * Anchoring the basename between a path separator and the END of the specifier is what keeps an unrelated component whose name merely ENDS in one of the words — `SurveyBanner.svelte` — out of the match.
 */
const RELATIVE_LAYOUT_IMPORT =
  /from\s+'\.{1,2}\/(?:[^']*\/)?(?:Banner|Header|Layout|MainContent|MaintenancePage|SingleCardContent)(?:\.svelte|\.type)'/;

/** Line prefixes that start a comment in the scanned file types. A doc comment describing the forbidden shape must not trip the guard that forbids it. */
const COMMENT_PREFIXES = ['//', '*', '/*', '<!--'];

/**
 * Every scannable file under `root`, recursively.
 * Throws rather than returning `[]` when the root is missing: a silent empty list would make every assertion below pass without reading a single line.
 */
function collectSourceFiles(root: string): Array<string> {
  let entries: Array<string>;
  try {
    entries = readdirSync(root);
  } catch (cause) {
    throw new Error(
      `noRelativeLayoutImports.test.ts could not read the scan root '${root}'. The frontend source layout moved; ` +
        'update SRC_ROOT in this file. Returning an empty file list instead would make this guard pass vacuously. ' +
        `Underlying error: ${String(cause)}`
    );
  }
  const files: Array<string> = [];
  for (const entry of entries) {
    const absolute = join(root, entry);
    if (statSync(absolute).isDirectory()) {
      files.push(...collectSourceFiles(absolute));
      continue;
    }
    if (SCANNED_EXTENSIONS.some((extension) => entry.endsWith(extension))) files.push(absolute);
  }
  return files;
}

/** True when the line carries nothing but a comment, so prose about the forbidden shape is not mistaken for the shape. */
function isCommentLine(line: string): boolean {
  const trimmed = line.trim();
  return COMMENT_PREFIXES.some((prefix) => trimmed.startsWith(prefix));
}

const ALL_FILES = collectSourceFiles(SRC_ROOT);
const SCANNED_FILES = ALL_FILES.filter((file) => file !== SELF_PATH && !file.startsWith(BARREL_DIR));

describe('no relative import of a relocated layout component (REVIEW-CMP-06)', () => {
  it('scans a plausible slice of the frontend source tree', () => {
    expect(ALL_FILES.length).toBeGreaterThan(MINIMUM_PLAUSIBLE_FILE_COUNT);
    // The self-exclusion must actually exclude this file. If it ever moves out of SRC_ROOT the exclusion becomes a no-op, and the next author to write the forbidden shape into a doc comment here would see a green guard flag nothing.
    expect(
      ALL_FILES.filter((file) => file === SELF_PATH),
      'this guard no longer excludes itself from its own scan root — see the header'
    ).toHaveLength(1);
    expect(SCANNED_FILES).not.toContain(SELF_PATH);
  });

  it('excludes the barrel directory, whose members are legitimate siblings', () => {
    const barrelFiles = ALL_FILES.filter((file) => file.startsWith(BARREL_DIR));
    // If the barrel is empty the path exclusion is checking nothing, and a later author could move a component back out without this guard noticing the exclusion had gone hollow.
    expect(
      barrelFiles.length,
      `the barrel directory '${BARREL_DIR}' holds no scannable files — the relocated components moved again, so the sibling exclusion below is now excluding nothing`
    ).toBeGreaterThan(0);
    expect(SCANNED_FILES.filter((file) => file.startsWith(BARREL_DIR))).toEqual([]);
  });

  it('finds no relative import of a relocated layout component outside the barrel', () => {
    const offenders: Array<string> = [];
    for (const file of SCANNED_FILES) {
      const lines = readFileSync(file, 'utf8').split('\n');
      lines.forEach((line, index) => {
        if (isCommentLine(line)) return;
        if (RELATIVE_LAYOUT_IMPORT.test(line)) offenders.push(`${relative(SRC_ROOT, file)}:${index + 1}`);
      });
    }

    expect(
      offenders,
      `A relocated layout component is imported through a relative path at: ${offenders.join(', ')}. Those components live under $layouts/main and are reached through the alias, which resolves identically from any depth and in all three resolvers. Do not adjust the ../ depth — import from '$layouts/main' instead.`
    ).toEqual([]);
  });
});
