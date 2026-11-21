/**
 * The scaffolding the line-oriented text guards share: listing the tracked files, reading them line by line, reading a
 * fixture that carries `@as <path>` directives, and comparing a self-test's findings with its committed expected file.
 *
 * Every path taken or returned is relative to the repository root, which is read from this module's own location, so a
 * guard copied into another repository together with this module scans that repository.
 *
 * Node built-ins only, no build step: the guards that import it run before anything is built.
 */

import { execFileSync } from 'node:child_process';
import { lstatSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/**
 * The files `git ls-files` lists under the given trees, minus those `skip` rejects. A git failure is thrown.
 *
 * @param options - `trees`, the pathspecs to list (all of the repository when omitted), and `skip`, which returns true for a file to leave out.
 * @returns The tracked files, repository-relative, in git's order.
 */
export function trackedFiles({ trees = [], skip = () => false } = {}) {
  return execFileSync('git', ['ls-files', '-z', '--', ...trees], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    maxBuffer: 1 << 28
  })
    .split('\0')
    .filter((file) => file !== '' && !skip(file));
}

/** Whether nothing, not even a broken symbolic link, is at `file` in the working tree. */
function absent(file) {
  try {
    lstatSync(path.join(REPO_ROOT, file));
    return false;
  } catch {
    return true;
  }
}

/**
 * Read each file and hand every line to `onLine`. A file holding a NUL byte is binary and its lines are not handed on.
 *
 * A file that cannot be read is named on stderr with its error code and counted as unreadable: its contents were never
 * seen, so a guard must not pass it. Two entries hold no contents and are neither reported nor counted: a tracked
 * symbolic link to a directory (`EISDIR`), and a tracked path deleted from the working tree, which `git ls-files` lists
 * until the deletion is staged. A broken symbolic link is still in the tree, so it is unreadable.
 *
 * @param files - Repository-relative paths.
 * @param onLine - Called as `onLine(file, line, lineNumber)`, the line number counting from 1.
 * @param options - `label`, the prefix of the stderr line naming an unreadable file (the guard's own path).
 * @returns `scanned`, the number of files read, and `unreadable`, the number that could not be.
 */
export function scanLines(files, onLine, { label = 'text-guard' } = {}) {
  let scanned = 0;
  let unreadable = 0;
  for (const file of files) {
    let text;
    try {
      text = readFileSync(path.join(REPO_ROOT, file), 'utf8');
    } catch (error) {
      if (error?.code !== 'EISDIR' && !(error?.code === 'ENOENT' && absent(file))) {
        console.error(`${label}: cannot read ${file}: ${error?.code ?? 'unknown error'}`);
        unreadable += 1;
      }
      continue;
    }
    scanned += 1;
    if (text.includes('\u0000')) continue;
    text.split('\n').forEach((line, i) => onLine(file, line, i + 1));
  }
  return { scanned, unreadable };
}

/**
 * The lines of a fixture, each with the path the guard is to treat it as sitting in. A line matching `directive` is not
 * yielded: it sets that path, its first capture group, for the lines after it. Before the first directive the path is
 * the fixture's own.
 *
 * @param file - The fixture, repository-relative.
 * @param directive - The directive's expression, the path as group 1, e.g. `/^\/\/ @as (\S+)\s*$/`.
 * @returns A generator of `{ line, lineNumber, asPath }`.
 */
export function* fixtureLines(file, directive) {
  const lines = readFileSync(path.join(REPO_ROOT, file), 'utf8').split('\n');
  let asPath = file;
  for (let i = 0; i < lines.length; i += 1) {
    const match = directive.exec(lines[i]);
    if (match) asPath = match[1];
    else yield { line: lines[i], lineNumber: i + 1, asPath };
  }
}

/**
 * Compare a self-test's findings with the committed expected file, whose blank lines and `#` lines are ignored. Each
 * difference is printed on stdout, then any `extraLines`; the closing summary goes to stderr.
 *
 * @param guardName - The guard's name as its summary lines spell it.
 * @param observed - The findings the guard reported on its fixture.
 * @param expectedFile - The expected file, repository-relative.
 * @param options - `where`, how the summary names the fixture (`'on the fixture'`); `extraLines`, further failure lines to print; `extraOk`, a further condition of passing; `suffix`, text appended to the summary before its full stop.
 * @returns Whether the findings match the expected file exactly and `extraOk` holds.
 */
export function compareWithExpected(
  guardName,
  observed,
  expectedFile,
  { where = 'on the fixture', extraLines = [], extraOk = true, suffix = '' } = {}
) {
  let expected;
  try {
    expected = readFileSync(path.join(REPO_ROOT, expectedFile), 'utf8')
      .split('\n')
      .filter((l) => l.trim() !== '' && !l.startsWith('#'));
  } catch {
    console.error(`${guardName} — self-test FAILED: cannot read ${expectedFile}.`);
    return false;
  }
  const missing = expected.filter((l) => !observed.includes(l));
  const unexpected = observed.filter((l) => !expected.includes(l));
  for (const l of missing) process.stdout.write(`self-test: expected but not reported: ${l}\n`);
  for (const l of unexpected) process.stdout.write(`self-test: reported but not expected: ${l}\n`);
  for (const l of extraLines) process.stdout.write(`${l}\n`);
  const ok = missing.length === 0 && unexpected.length === 0 && observed.length === expected.length && extraOk === true;
  console.error(
    `${guardName} — self-test ${ok ? 'passed' : 'FAILED'}: ${observed.length} finding(s) ${where}, ${expected.length} expected${suffix}.`
  );
  return ok;
}
