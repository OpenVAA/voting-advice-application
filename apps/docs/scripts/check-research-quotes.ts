#!/usr/bin/env tsx
/**
 * Check that the research interludes of the docs pages are byte-identical to a base revision.
 *
 * - The file set is every file under `src/routes` holding `<ResearchQuote` at the base revision. An empty set fails, because a gate that compares nothing proves nothing.
 * - Base spans come from `git show <base>:<path>` and current spans from the working tree. A span runs from `<ResearchQuote` to the next `</ResearchQuote>`, opening tag included, and spans are compared as exact strings in order.
 * - Per file, the counts of `<ResearchQuote`, of `</ResearchQuote>` and of spans must agree on both sides, and the working-tree file must still contain `import ResearchQuote from`.
 * - A `<ResearchQuote` in any other file under `src/routes` fails (an added block).
 * - `ResearchQuote.svelte`, `ReferenceList.svelte` and `Author.svelte` must not differ from the component base, which is `--component-base` when given and `--base` otherwise. The spans are always compared against `--base`.
 *
 * Usage: check-research-quotes --base <rev> [--component-base <rev>] [--extract-dir <dir>]
 *
 * With `--extract-dir`, the spans are written to `rq-base.json` and `rq-head.json` in that directory as arrays of `{ path, ordinal, span }`.
 *
 * Exit codes: 0 identical, 1 differences, 2 usage error.
 */
import { execFileSync, spawnSync } from 'child_process';
import * as fs from 'fs/promises';
import { glob } from 'glob';
import * as path from 'path';
import { fileURLToPath } from 'url';

const DOCS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO_ROOT = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: DOCS_DIR, encoding: 'utf-8' }).trim();
const ROUTES_PATH = path.relative(REPO_ROOT, path.join(DOCS_DIR, 'src', 'routes'));
const COMPONENT_PATHS = ['ResearchQuote.svelte', 'ReferenceList.svelte', 'Author.svelte'].map((name) =>
  path.relative(REPO_ROOT, path.join(DOCS_DIR, 'src', 'lib', 'components', name))
);
const SPAN = /<ResearchQuote\b[\s\S]*?<\/ResearchQuote>/g;
const OPENING = /<ResearchQuote\b/g;
const CLOSING = /<\/ResearchQuote>/g;
const IMPORT = 'import ResearchQuote from';

interface Span {
  path: string;
  ordinal: number;
  span: string;
}

class UsageError extends Error {}

/**
 * Main function
 */
async function main() {
  let base: string;
  let componentBase: string;
  let extractDir: string | undefined;
  try {
    ({ base, componentBase, extractDir } = parseArgs(process.argv.slice(2)));
  } catch (error) {
    if (!(error instanceof UsageError)) throw error;
    console.error(`Usage error: ${error.message}`);
    console.error('Usage: check-research-quotes --base <rev> [--component-base <rev>] [--extract-dir <dir>]');
    process.exitCode = 2;
    return;
  }

  const failures = new Array<string>();
  const files = baseFileSet(base);
  if (files.length === 0) {
    console.error(`No <ResearchQuote> block under ${ROUTES_PATH} at base ${base}: nothing to compare, failing closed.`);
    process.exitCode = 1;
    return;
  }

  const baseSpans = new Array<Span>();
  const headSpans = new Array<Span>();
  for (const file of files) {
    const baseSource = execFileSync('git', ['show', `${base}:${file}`], { cwd: REPO_ROOT, encoding: 'utf-8' });
    let headSource: string | undefined;
    try {
      headSource = await fs.readFile(path.join(REPO_ROOT, file), 'utf-8');
    } catch {
      failures.push(`${file}: missing from the working tree`);
    }

    const baseList = extractSpans(file, baseSource);
    baseSpans.push(...baseList);
    checkCounts(file, 'base', baseSource, baseList, failures);
    if (headSource === undefined) continue;

    const headList = extractSpans(file, headSource);
    headSpans.push(...headList);
    checkCounts(file, 'working tree', headSource, headList, failures);
    if (!headSource.includes(IMPORT)) failures.push(`${file}: the working tree has no \`${IMPORT}\` line`);
    compareSpans(file, baseList, headList, failures);
  }

  for (const file of await addedBlockFiles(files)) {
    const source = await fs.readFile(path.join(REPO_ROOT, file), 'utf-8');
    headSpans.push(...extractSpans(file, source));
    failures.push(`${file}: holds a <ResearchQuote> block but held none at base`);
  }

  const diff = spawnSync('git', ['diff', '--quiet', componentBase, '--', ...COMPONENT_PATHS], { cwd: REPO_ROOT });
  if (diff.status === 1) {
    const changed = execFileSync('git', ['diff', '--name-only', componentBase, '--', ...COMPONENT_PATHS], {
      cwd: REPO_ROOT,
      encoding: 'utf-8'
    });
    for (const file of changed.split('\n').filter(Boolean)) failures.push(`${file}: changed since component base`);
  } else if (diff.status !== 0) failures.push(`git diff failed with status ${diff.status}`);

  if (extractDir) {
    await fs.mkdir(extractDir, { recursive: true });
    await fs.writeFile(path.join(extractDir, 'rq-base.json'), JSON.stringify(baseSpans, null, 2) + '\n', 'utf-8');
    await fs.writeFile(path.join(extractDir, 'rq-head.json'), JSON.stringify(headSpans, null, 2) + '\n', 'utf-8');
    console.info(`Extracts written to ${extractDir}`);
  }

  console.info(`Base:            ${base}`);
  console.info(`Component base:  ${componentBase}`);
  console.info(`Files:           ${files.length}`);
  console.info(`Spans at base:   ${baseSpans.length}`);
  console.info(`Spans now:       ${headSpans.length}`);
  console.info(`Frozen components: ${COMPONENT_PATHS.join(', ')}`);

  if (failures.length > 0) {
    console.info(`\nDIFFERENCES (${failures.length}):`);
    for (const failure of failures) console.info(`  ${failure}`);
    process.exitCode = 1;
    return;
  }
  console.info(
    '\nAll <ResearchQuote> spans are identical to the base and the frozen components to the component base.'
  );
}

/**
 * Parse the command line arguments.
 * @throws UsageError on a missing base, a revision that is not a commit, or an unknown argument
 */
function parseArgs(args: Array<string>): { base: string; componentBase: string; extractDir?: string } {
  let base: string | undefined;
  let componentBase: string | undefined;
  let extractDir: string | undefined;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--base' || arg === '--component-base' || arg === '--extract-dir') {
      const value = args[++i];
      if (!value || value.startsWith('--')) throw new UsageError(`${arg} needs a value`);
      if (arg === '--base') base = value;
      else if (arg === '--component-base') componentBase = value;
      else extractDir = path.resolve(value);
    } else {
      throw new UsageError(`unknown argument ${arg}`);
    }
  }
  if (!base) throw new UsageError('--base <rev> is required');
  componentBase ??= base;
  for (const rev of new Set([base, componentBase])) {
    const verify = spawnSync('git', ['rev-parse', '--verify', '--quiet', `${rev}^{commit}`], { cwd: REPO_ROOT });
    if (verify.status !== 0) throw new UsageError(`${rev} is not a commit`);
  }
  return { base, componentBase, extractDir };
}

/**
 * The repository paths under `src/routes` that hold `<ResearchQuote` at the base revision.
 */
function baseFileSet(base: string): Array<string> {
  const grep = spawnSync('git', ['grep', '-l', '-F', '<ResearchQuote', base, '--', ROUTES_PATH], {
    cwd: REPO_ROOT,
    encoding: 'utf-8'
  });
  if (grep.status === 1) return [];
  if (grep.status !== 0) throw new Error(`git grep failed with status ${grep.status}: ${grep.stderr}`);
  return grep.stdout
    .split('\n')
    .filter(Boolean)
    .map((line) => line.slice(base.length + 1))
    .sort();
}

/**
 * Working-tree files under `src/routes`, outside the base set, that hold `<ResearchQuote`.
 */
async function addedBlockFiles(baseFiles: Array<string>): Promise<Array<string>> {
  const known = new Set(baseFiles);
  const files = await glob('**/*.{md,svelte,svx}', { cwd: path.join(REPO_ROOT, ROUTES_PATH) });
  const added = new Array<string>();
  for (const file of files.sort()) {
    const repoPath = path.join(ROUTES_PATH, file);
    if (known.has(repoPath)) continue;
    const source = await fs.readFile(path.join(REPO_ROOT, repoPath), 'utf-8');
    if (OPENING.test(source)) added.push(repoPath);
    OPENING.lastIndex = 0;
  }
  return added;
}

function extractSpans(file: string, source: string): Array<Span> {
  return [...source.matchAll(SPAN)].map((match, index) => ({ path: file, ordinal: index + 1, span: match[0] }));
}

function countMatches(source: string, pattern: RegExp): number {
  return [...source.matchAll(pattern)].length;
}

/**
 * Opening tags, closing tags and extracted spans must agree; a mismatch means a nested, truncated or unclosed block.
 */
function checkCounts(file: string, side: string, source: string, spans: Array<Span>, failures: Array<string>): void {
  const opening = countMatches(source, OPENING);
  const closing = countMatches(source, CLOSING);
  if (opening !== closing || opening !== spans.length)
    failures.push(`${file} (${side}): ${opening} opening tags, ${closing} closing tags, ${spans.length} spans`);
}

/**
 * Compare the ordered span lists of one file, naming the ordinal and the first differing character offset.
 */
function compareSpans(file: string, baseList: Array<Span>, headList: Array<Span>, failures: Array<string>): void {
  if (baseList.length !== headList.length)
    failures.push(`${file}: ${baseList.length} blocks at base, ${headList.length} now`);
  for (let i = 0; i < Math.min(baseList.length, headList.length); i++) {
    const before = baseList[i].span;
    const after = headList[i].span;
    if (before === after) continue;
    let offset = 0;
    while (offset < before.length && offset < after.length && before[offset] === after[offset]) offset++;
    failures.push(
      `${file}: block ${i + 1} differs at character ${offset} (base ${JSON.stringify(before.slice(offset, offset + 20))}, now ${JSON.stringify(after.slice(offset, offset + 20))})`
    );
  }
}

main().catch((error) => {
  console.error('Error checking ResearchQuote blocks:', error);
  process.exit(1);
});
